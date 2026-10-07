import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";
import { httpError } from "../utils/errors.js";

const blockedNames = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);
const metadataNames = new Set(["metadata", "instance-data"]);

function isPublicIp(address: string): boolean {
  try {
    const parsed = ipaddr.parse(address);
    if (parsed.kind() === "ipv6" && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) {
      return isPublicIp((parsed as ipaddr.IPv6).toIPv4Address().toString());
    }
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw httpError(400, "A valid URL is required"); }
  if (!["http:", "https:"].includes(url.protocol)) throw httpError(400, "Only HTTP and HTTPS URLs are allowed");
  if (url.username || url.password) throw httpError(400, "URLs must not include credentials");
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (blockedNames.has(hostname) || metadataNames.has(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw httpError(400, "This hostname cannot be monitored");
  }
  if (hostname === "169.254.169.254" || hostname === "100.100.100.200") throw httpError(400, "Cloud metadata destinations are blocked");
  const directIp = isIP(hostname);
  if (directIp) {
    if (!isPublicIp(hostname)) throw httpError(400, "Private or internal network destinations are blocked");
  } else {
    let addresses: Awaited<ReturnType<typeof lookup>>[];
    try { addresses = await lookup(hostname, { all: true, verbatim: true }) as unknown as Awaited<ReturnType<typeof lookup>>[]; }
    catch { throw httpError(400, "The hostname could not be resolved"); }
    if (addresses.length === 0 || addresses.some((entry) => !isPublicIp(entry.address))) {
      throw httpError(400, "Private or internal network destinations are blocked");
    }
  }
  return url;
}
