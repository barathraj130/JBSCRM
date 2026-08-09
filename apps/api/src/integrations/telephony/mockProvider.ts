import type { TelephonyCallRecord, TelephonyProvider } from "./provider";

export class MockTelephonyProvider implements TelephonyProvider {
  async fetchCallRecord(_providerCallId: string): Promise<TelephonyCallRecord | null> {
    return null;
  }
}
