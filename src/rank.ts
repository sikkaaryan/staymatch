import type { Candidate, Requirement, VerificationResult } from "./types.js";
import { verifyCandidate } from "./verify.js";

/** Only confirmed matches are ranked; no weak matches are added to pad the list. */
export function rankConfirmedMatches(
  candidates: Candidate[],
  requirements: Requirement[],
): Array<{ candidate: Candidate; verification: VerificationResult }> {
  return candidates
    .map((candidate) => ({
      candidate,
      verification: verifyCandidate(candidate, requirements),
    }))
    .filter((item) => item.verification.status === "confirmed_match")
    .sort((a, b) => {
      // Prefer lower total price when both are known; unknown prices never become zero.
      const ap = a.candidate.priceTotal;
      const bp = b.candidate.priceTotal;
      if (ap !== undefined && bp !== undefined) return ap - bp;
      if (ap !== undefined) return -1;
      if (bp !== undefined) return 1;
      return a.candidate.title.localeCompare(b.candidate.title);
    });
}
