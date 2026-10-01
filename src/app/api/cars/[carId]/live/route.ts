import { connection } from "next/server";
import { watchLive } from "@/lib/live/live";

const coalesceMs = 1_000;
const heartbeatMs = 25_000;

export async function GET(
  request: Request,
  context: RouteContext<"/api/cars/[carId]/live">,
) {
  await connection();
  const carId = Number((await context.params).carId);
  if (!Number.isInteger(carId) || carId <= 0) {
    return new Response(null, { status: 404 });
  }
  let notify = () => {};
  const unwatch = watchLive(carId, () => notify());
  if (!unwatch) return new Response(null, { status: 204 });

  const encoder = new TextEncoder();
  let stop = unwatch;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let pending: ReturnType<typeof setTimeout> | undefined;
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          stop();
        }
      };
      notify = () => {
        pending ??= setTimeout(() => {
          pending = undefined;
          send(`event: change\ndata: ${Date.now()}\n\n`);
        }, coalesceMs);
      };
      const heartbeat = setInterval(() => send(": alive\n\n"), heartbeatMs);
      stop = () => {
        unwatch();
        clearInterval(heartbeat);
        clearTimeout(pending);
      };
      request.signal.addEventListener("abort", () => {
        stop();
        try {
          controller.close();
        } catch {}
      });
      send("retry: 5000\n\n");
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
