import { useMutation } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Device from "expo-device";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ApiError, request } from "@/api/client";
import { carList, pairClaim, pairStatus } from "@/api/responses";
import { rememberCar } from "@/car/car-provider";
import { Button } from "@/components/button";
import { launchFrame, launchMarkSize } from "@/components/launch-frame";
import { Panel } from "@/components/panel";
import { StatusBarStrip, screenPadding } from "@/components/screen";
import { TeslaMark } from "@/components/tesla-mark";
import { Text } from "@/components/text";
import { useConnectionState } from "@/connection/connection-provider";
import { pairingOf, pairingOfLink, type Pairing } from "@/connection/server";
import { space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

const demoUrl = "https://mytesla.chele.bi";
const pollMs = 2_000;

type Waiting = {
  url: string;
  token: string;
  check: string;
  carId: number | null;
  account: string;
};

function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

function WaitingPanel({
  waiting,
  onCancel,
}: {
  waiting: Waiting;
  onCancel: () => void;
}) {
  return (
    <Panel title="Allow this phone on the web">
      <View style={styles.waiting}>
        <TeslaMark size={36} kind="breathe" />
        <Text
          variant="display"
          accessibilityLabel={`Check number ${waiting.check.split("").join(" ")}`}
          style={styles.check}
        >
          {waiting.check}
        </Text>
      </View>
      <Text>
        The page with the code now asks whether to allow this phone. Press Allow
        there only if it shows {waiting.check}, to sign in as {waiting.account}.
      </Text>
      <Text variant="caption">{hostOf(waiting.url)}</Text>
      <Button label="Cancel" kind="secondary" onPress={onCancel} />
    </Panel>
  );
}

function LinkPanel({
  pairing,
  busy,
  onConnect,
  onCancel,
}: {
  pairing: Pairing;
  busy: boolean;
  onConnect: () => void;
  onCancel: () => void;
}) {
  return (
    <Panel title="Sign in from the code">
      <Text>
        The camera opened a My Tesla code for {hostOf(pairing.url)}. Connect
        only if you scanned it on your own screen. The page then asks you to
        allow this phone.
      </Text>
      <Button label="Connect" busy={busy} disabled={busy} onPress={onConnect} />
      <Button
        label="Cancel"
        kind="secondary"
        disabled={busy}
        onPress={onCancel}
      />
    </Panel>
  );
}

export default function ConnectScreen() {
  const { save } = useConnectionState();
  const fromLink = pairingOfLink(useLocalSearchParams());
  const [doneCode, setDoneCode] = useState<string | null>(null);
  const linked = fromLink && fromLink.code !== doneCode ? fromLink : null;
  const [problem, setProblem] = useState<string | null>(null);
  const [waiting, setWaiting] = useState<Waiting | null>(null);
  const [, requestCamera] = useCameraPermissions();
  const scanning = useRef(false);

  const claim = useMutation({
    mutationFn: async (pairing: Pairing): Promise<Waiting> => {
      const answer = pairClaim(
        await request({ url: pairing.url, token: null }, "/api/app/pair", {
          method: "POST",
          body: {
            code: pairing.code,
            name: Device.deviceName ?? Device.modelName ?? "Phone",
            platform: Platform.OS,
          },
        }),
      );
      if (!answer) throw new ApiError("The server is not a My Tesla server.");
      return {
        url: pairing.url,
        token: answer.token,
        check: answer.check,
        carId: pairing.carId,
        account: answer.user.name,
      };
    },
    onSuccess: (next, pairing) => {
      setDoneCode(pairing.code);
      setWaiting(next);
    },
    onError: (error) => setProblem(error.message),
  });
  const { mutate: claimCode } = claim;

  const demo = useMutation({
    mutationFn: async () => {
      const connection = { url: demoUrl, token: null };
      if (!carList(await request(connection, "/api/cars.json"))) {
        throw new ApiError("The demo did not answer.");
      }
      await save(connection);
    },
    onError: (error) => setProblem(error.message),
  });

  useEffect(() => {
    const subscription = CameraView.onModernBarcodeScanned(({ data }) => {
      if (!scanning.current) return;
      scanning.current = false;
      if (Platform.OS === "ios") CameraView.dismissScanner().catch(() => null);
      const pairing = pairingOf(data);
      if (!pairing) {
        setProblem(
          "This code is not from My Tesla. On the web, open Settings, then Mobile app, and press Pair a phone.",
        );
        return;
      }
      claimCode(pairing);
    });
    return () => subscription.remove();
  }, [claimCode]);

  useEffect(() => {
    if (!waiting) return;
    let stopped = false;
    const check = async () => {
      try {
        const status = pairStatus(
          await request(
            { url: waiting.url, token: waiting.token },
            "/api/app/pair/status",
          ),
        );
        if (stopped || status?.status !== "active") return;
        stopped = true;
        if (waiting.carId !== null) await rememberCar(waiting.carId);
        await save({ url: waiting.url, token: waiting.token });
      } catch (error) {
        if (stopped) return;
        stopped = true;
        setWaiting(null);
        setProblem(
          error instanceof Error ? error.message : "The pairing ended.",
        );
      }
    };
    check();
    const timer = setInterval(check, pollMs);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [waiting, save]);

  const scan = async () => {
    setProblem(null);
    if (Platform.OS === "ios" && !(await requestCamera()).granted) {
      setProblem("Allow the camera for My Tesla in the phone settings.");
      return;
    }
    scanning.current = true;
    try {
      await CameraView.launchScanner({ barcodeTypes: ["qr"] });
    } catch {
      scanning.current = false;
      setProblem("This phone cannot scan codes.");
    }
  };

  const busy = claim.isPending || demo.isPending;
  const start = !waiting && !linked;
  const palette = usePalette();
  const { top, bottom } = useSafeAreaInsets();
  const { height } = useSafeAreaFrame();
  const frame = launchFrame(height, space.lg);
  const problemText = problem ? (
    <Text variant="label" tone="destructive" style={styles.centered}>
      {problem}
    </Text>
  ) : null;
  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.content,
          start ? styles.start : styles.panelState,
          {
            paddingTop: start ? frame.contentTop : top + space.xl,
            paddingBottom: bottom + space.lg,
          },
        ]}
      >
        {start ? (
          <>
            <View
              pointerEvents="none"
              style={[styles.mark, { top: frame.markTop }]}
            >
              <TeslaMark size={launchMarkSize} kind="still" />
            </View>
            <View style={[styles.column, styles.heading]}>
              <Text
                variant="title"
                accessibilityRole="header"
                style={styles.centered}
              >
                My Tesla
              </Text>
              <Text variant="label" style={styles.centered}>
                Sign in to the My Tesla server that reads your TeslaMate data.
              </Text>
            </View>
            <View style={[styles.column, styles.actions]}>
              {problemText}
              <Button
                label="Scan the code"
                busy={claim.isPending}
                disabled={busy}
                onPress={scan}
              />
              <Button
                label="Open the demo"
                kind="secondary"
                busy={demo.isPending}
                disabled={busy}
                onPress={() => {
                  setProblem(null);
                  demo.mutate();
                }}
              />
              <Text variant="caption" style={styles.centered}>
                To get the code, open Settings on the web, then Mobile app, and
                press Pair a phone.
              </Text>
            </View>
          </>
        ) : (
          <View style={[styles.column, styles.actions]}>
            {waiting ? (
              <WaitingPanel
                waiting={waiting}
                onCancel={() => setWaiting(null)}
              />
            ) : linked ? (
              <LinkPanel
                pairing={linked}
                busy={claim.isPending}
                onConnect={() => {
                  setProblem(null);
                  claimCode(linked);
                }}
                onCancel={() => setDoneCode(linked.code)}
              />
            ) : null}
            {problemText}
          </View>
        )}
      </ScrollView>
      <StatusBarStrip />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    gap: space.xl,
  },
  start: { justifyContent: "space-between" },
  panelState: { justifyContent: "center" },
  mark: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  column: { width: "100%", maxWidth: 480, alignSelf: "center" },
  heading: { gap: space.sm },
  actions: { gap: space.md },
  centered: { textAlign: "center" },
  waiting: { alignItems: "center", gap: space.md, paddingVertical: space.md },
  check: { fontVariant: ["tabular-nums"], letterSpacing: 4 },
});
