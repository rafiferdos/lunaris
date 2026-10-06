export const SESSION_CHANNEL = "lunaris-session"
export type SessionMessage = "signed-out" | "changed"
export function announceSession(message: SessionMessage) {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(SESSION_CHANNEL)
    channel.postMessage(message)
    channel.close()
  }
  // Storage events also reach browsers without BroadcastChannel. No credentials.
  try {
    localStorage.setItem(
      SESSION_CHANNEL,
      JSON.stringify({ message, nonce: crypto.randomUUID() })
    )
  } catch {}
}
