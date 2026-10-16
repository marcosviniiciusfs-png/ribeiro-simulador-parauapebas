/// <reference types="vite/client" />

interface Window {
  fbq?: (
    eventType: "track",
    eventName: "Lead",
    parameters?: Record<string, unknown>,
    options?: { eventID?: string },
  ) => void;
}
