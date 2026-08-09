import { MockTelephonyProvider } from "./mockProvider";
import type { TelephonyProvider } from "./provider";

function createTelephonyProvider(): TelephonyProvider {
  // No real telephony provider is configured; calls stay self-reported (see call.service.ts).
  return new MockTelephonyProvider();
}

export const telephonyProvider = createTelephonyProvider();
export type { TelephonyCallRecord, TelephonyProvider } from "./provider";
