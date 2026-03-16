import type { WebSocketServer } from "ws";

export function broadcastSignal(wss: WebSocketServer, payload: unknown) {
  const message = JSON.stringify({ type: "signal:update", payload });
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}
