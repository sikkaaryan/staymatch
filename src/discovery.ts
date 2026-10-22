import type { Candidate, Requirement, Evidence } from "./types.js";

export interface SearchResult {
  title?: string;
  url?: string;
  description?: string;
}

export interface SearchProvider {
  search(query: string, count?: number): Promise<SearchResult[]>;
}

export interface DiscoveryInput {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  maxTotalPrice?: number;
  requirements: Requirement[];
}

export interface DiscoveryReport {
  candidates: Candidate[];
  queries: string[];
  excluded: Array<{ url?: string; reason: string }>;
  note: string;
}

const AIRBNB_HOSTS = new Set(["airbnb.com", "www.airbnb.com", "airbnb.co.in", "www.airbnb.co.in"]);

export function isAirbnbListingUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    const isAllowedHost = AIRBNB_HOSTS.has(host) ||
      (host.endsWith(".airbnb.com") && host !== "notairbnb.com");
    return url.protocol === "https:" && isAllowedHost &&
      (/\/rooms\/\d+/.test(url.pathname) || /\/rooms\//.test(url.pathname));
  } catch {
    return false;
  }
}

export function buildSearchQueries(input: DiscoveryInput): string[] {
  const requirementTerms = input.requirements
    .filter((r) => r.mandatory)
    .map((r) => r.description)
    .slice(0, 4);
  const core = `site:airbnb.co.in/rooms OR site:airbnb.com/rooms "${input.location}"`;
  const dates = `${input.checkIn} ${input.checkOut} ${input.guests} guests`;
  const budget = input.maxTotalPrice === undefined ? "" : `under ₹${input.maxTotalPrice}`;
  const queries = [
    `${core} ${dates} ${budget} ${requirementTerms.join(" ")}`.trim(),
    `${core} ${dates} ${budget}`.trim(),
    `${core} ${requirementTerms.join(" ")}`.trim(),
  ];
  return [...new Set(queries)];
}

/**
 * Searches only through a configured third-party web-search API.
 * It does NOT fetch, crawl, or parse Airbnb pages. Search snippets are discovery hints,
 * never proof of amenities, prices, dates, or availability.
 */
export async function discoverAirbnbCandidates(
  provider: SearchProvider,
  input: DiscoveryInput,
  now = new Date(),
): Promise<DiscoveryReport> {
  const queries = buildSearchQueries(input);
  const excluded: DiscoveryReport["excluded"] = [];
  const deduped = new Map<string, SearchResult>();

  for (const query of queries) {
    const results = await provider.search(query, 20);
    for (const result of results) {
      if (!result.url) {
        excluded.push({ reason: "Search result had no URL." });
        continue;
      }
      if (!isAirbnbListingUrl(result.url)) {
        excluded.push({ url: result.url, reason: "Not a recognized Airbnb listing URL." });
        continue;
      }
      const normalized = new URL(result.url);
      normalized.hash = "";
      normalized.search = "";
      deduped.set(normalized.toString(), result);
    }
  }

  const candidates: Candidate[] = [...deduped.entries()].map(([url, result], index) => {
    const evidence: Evidence[] = input.requirements.map((requirement) => ({
      requirementId: requirement.id,
      status: "unknown",
      summary: "Search results do not verify this requirement. Listing-level evidence is not yet available.",
      sourceUrl: url,
      sourceType: "other",
      checkedAt: now.toISOString(),
    }));

    return {
      id: `airbnb-search-${index + 1}`,
      title: result.title?.trim() || "Airbnb listing (title not available in search result)",
      listingUrl: url,
      platform: "airbnb",
      availability: "unknown",
      evidence,
      discoverySource: "Configured web-search provider; snippet is discovery-only",
      discoveredAt: now.toISOString(),
    };
  });

  return {
    candidates,
    queries,
    excluded,
    note: "Candidates are discovered, not verified. This adapter does not access Airbnb pages. Every candidate remains unconfirmed until requirements and availability are verified from an authorized, reliable source.",
  };
}

/** Brave Search API adapter. Requires a user-created key; no paid calls are made by this code. */
export class BraveSearchProvider implements SearchProvider {
  constructor(private readonly apiKey: string) {
    if (!apiKey.trim()) throw new Error("BRAVE_SEARCH_API_KEY is required.");
  }

  async search(query: string, count = 20): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query, count: String(Math.min(Math.max(count, 1), 20)) });
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": this.apiKey,
      },
    });
    if (!response.ok) {
      throw new Error(`Brave Search API failed (${response.status}). Check API key and free-credit limits.`);
    }
    const payload = await response.json() as {
      web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
    };
    return (payload.web?.results ?? []).map((item) => ({
      title: item.title,
      url: item.url,
      description: item.description,
    }));
  }
}
