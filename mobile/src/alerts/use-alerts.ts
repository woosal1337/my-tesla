import type { PushEvent } from "@contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";
import { request } from "@/api/client";
import { pushCatalog } from "@/api/responses";
import type { Connection } from "@/connection/server";
import { useCar } from "@/car/car-provider";
import { useConnection } from "@/connection/connection-provider";
import { createChannels, pushToken, PushSetupError } from "./push-token";

const storageKey = "alert-events";
const choicesKey = ["alert-events"];

async function readChoices(): Promise<string[]> {
  try {
    const stored: unknown = JSON.parse(
      (await SecureStore.getItemAsync(storageKey)) ?? "[]",
    );
    return Array.isArray(stored)
      ? stored.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

async function registerDevice(
  connection: Connection,
  events: readonly PushEvent[],
  chosen: string[],
  ask: boolean,
): Promise<void> {
  const asking = ask && chosen.length > 0;
  const token = await pushToken(asking);
  if (!token) {
    if (!asking) return;
    throw new PushSetupError(
      "Allow notifications for My Tesla in the phone settings.",
    );
  }
  if (!chosen.length) {
    await request(connection, "/api/push", {
      method: "DELETE",
      body: { token },
    });
    return;
  }
  await createChannels(events.filter((event) => chosen.includes(event.id)));
  await request(connection, "/api/push", {
    method: "PUT",
    body: { token, events: chosen },
  });
}

export function useAlertChoices(events: readonly PushEvent[]) {
  const connection = useConnection();
  const queryClient = useQueryClient();
  const choices = useQuery({ queryKey: choicesKey, queryFn: readChoices });
  const update = useMutation({
    mutationFn: async (chosen: string[]) => {
      await registerDevice(connection, events, chosen, true);
      await SecureStore.setItemAsync(storageKey, JSON.stringify(chosen));
      return chosen;
    },
    onSuccess: (chosen) => queryClient.setQueryData(choicesKey, chosen),
  });
  const test = useMutation({
    mutationFn: async () => {
      const token = await pushToken(false);
      if (!token) throw new PushSetupError("Turn on an alert first.");
      await request(connection, "/api/push", {
        method: "POST",
        body: { token },
      });
    },
  });
  return { chosen: choices.data ?? [], update, test };
}

export async function forgetAlerts(connection: Connection): Promise<void> {
  const token = await pushToken(false).catch(() => null);
  if (token) {
    await request(connection, "/api/push", {
      method: "DELETE",
      body: { token },
    }).catch(() => null);
  }
  await SecureStore.deleteItemAsync(storageKey);
}

export function useAlertRefresh(): void {
  const connection = useConnection();
  useEffect(() => {
    readChoices()
      .then(async (chosen) => {
        if (!chosen.length) return;
        const catalog = pushCatalog(await request(connection, "/api/push"));
        if (!catalog?.enabled) return;
        const known = chosen.filter((id) =>
          catalog.events.some((event) => event.id === id),
        );
        await registerDevice(connection, catalog.events, known, false);
      })
      .catch(() => null);
  }, [connection]);
}

const alertRoutes = { "/": "/", "/charging": "/charging" } as const;

function alertRoute(url: unknown) {
  return typeof url === "string" && Object.hasOwn(alertRoutes, url)
    ? alertRoutes[url as keyof typeof alertRoutes]
    : null;
}

export function useAlertRouting(): void {
  const router = useRouter();
  const { choose } = useCar();
  const handled = useRef<string | null>(null);
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const request = response?.notification.request;
    if (!request || handled.current === request.identifier) return;
    handled.current = request.identifier;
    Notifications.clearLastNotificationResponse();
    const { carId, url } = request.content.data ?? {};
    if (typeof carId === "number") choose(carId);
    const route = alertRoute(url);
    if (route) router.navigate(route);
  }, [response, router, choose]);
}
