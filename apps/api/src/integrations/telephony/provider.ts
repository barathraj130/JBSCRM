export interface TelephonyCallRecord {
  providerCallId: string;
  from: string;
  to: string;
  direction: "INCOMING" | "OUTGOING";
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  status: string;
  recordingUrl?: string;
}

/**
 * Interface for a real business telephony/calling integration (e.g. Exotel, Knowlarity,
 * Twilio). No such integration is configured today, so Call records are always created
 * as employee-entered, self-reported evidence (see services/call.service.ts) — never
 * presented as system-verified. Once a real provider is available, it would implement
 * this interface and call events would create VERIFIED evidence the same way WhatsApp
 * sends already do.
 */
export interface TelephonyProvider {
  fetchCallRecord(providerCallId: string): Promise<TelephonyCallRecord | null>;
}
