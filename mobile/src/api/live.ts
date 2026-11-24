import { useQueryClient } from "@tanstack/react-query";
import { fetch } from "expo/fetch";
import { useIsFocused } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { useConnection } from "@/connection/connection-provider";
import { authorization } from "@/connection/server";
import { readChanges } from "./sse";

const retryMs = 5_000;
const minimumGapMs = 2_000;
const finalStatuses = new Set([204, 401, 403, 404]);

export function useLiveChanges(carId: number, key: readonly unknown[]): void {
  const connection = useConnection();
  const client = useQueryClient();
  const focused = useIsFocused();
  const queryKey = JSON.stringify([connection.url, ...key]);

  useEffect(() => {
    if (!focused) return;
    let controller: AbortController | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let pending: ReturnType<typeof setTimeout> | undefined;
    let last = 0;
    let stopped = false;

    const refetch = () => {
      pending = undefined;
      last = Date.now();
      void client.invalidateQueries({ queryKey: JSON.parse(queryKey) });
    };

    const listen = async (signal: AbortSignal) => {
      const response = await fetch(`${connection.url}/api/cars/${carId}/live`, {
        headers: { Accept: "text/event-stream", ...authorization(connection) },
        signal,
      });
      if (finalStatuses.has(response.status)) return false;
      if (!response.ok || !response.body) return true;
      if (
        !response.headers.get("content-type")?.includes("text/event-stream")
      ) {
        return false;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) return true;
        const read = readChanges(
          buffer + decoder.decode(value, { stream: true }),
        );
        buffer = read.rest;
        if (read.changes > 0 && !pending) {
          pending = setTimeout(
            refetch,
            Math.max(0, last + minimumGapMs - Date.now()),
          );
        }
      }
    };

    const open = () => {
      if (stopped || controller) return;
      const current = new AbortController();
      controller = current;
      listen(current.signal)
        .catch(() => !current.signal.aborted)
        .then((again) => {
          if (controller === current) controller = null;
          if (again && !stopped && AppState.currentState === "active") {
            retry = setTimeout(open, retryMs);
          }
        });
    };

    const close = () => {
      clearTimeout(retry);
      controller?.abort();
      controller = null;
    };

    const subscription = AppState.addEventListener("change", (status) =>
      status === "active" ? open() : close(),
    );
    if (AppState.currentState === "active") open();
    return () => {
      stopped = true;
      subscription.remove();
      clearTimeout(pending);
      close();
    };
  }, [carId, client, connection, focused, queryKey]);
}
