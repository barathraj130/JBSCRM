import { MockIndiaMartProvider } from "./mockProvider";
import type { IndiaMartProvider } from "./provider";

function createIndiaMartProvider(): IndiaMartProvider {
  // Only a mock provider exists today (no real IndiaMART credentials configured).
  // Swap in a real provider here once available — the webhook route and lead-import
  // service only depend on the IndiaMartProvider interface.
  return new MockIndiaMartProvider();
}

export const indiaMartProvider = createIndiaMartProvider();
export type { IndiaMartLeadPayload, IndiaMartProvider } from "./provider";
