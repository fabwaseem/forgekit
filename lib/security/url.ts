import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);

function ipv4ToInt(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return (((parts[0]! << 24) >>> 0) + ((parts[1]! << 16) >>> 0) + ((parts[2]! << 8) >>> 0) + parts[3]!) >>> 0;
}

export function isBlockedIp(ip: string) {
  const version = isIP(ip);
  if (version === 4) {
    const value = ipv4ToInt(ip);
    if (value === null) return true;
    const inRange = (cidrBase: string, bits: number) => {
      const base = ipv4ToInt(cidrBase);
      if (base === null) return false;
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (value & mask) === (base & mask);
    };
    return (
      inRange("0.0.0.0", 8) ||
      inRange("10.0.0.0", 8) ||
      inRange("127.0.0.0", 8) ||
      inRange("169.254.0.0", 16) ||
      inRange("172.16.0.0", 12) ||
      inRange("192.168.0.0", 16) ||
      inRange("100.64.0.0", 10) ||
      inRange("255.255.255.255", 32)
    );
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80") ||
      normalized.startsWith("::ffff:127.") ||
      normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:192.168.") ||
      normalized.startsWith("::ffff:169.254.")
    );
  }
  return true;
}

export function isBlockedHostname(hostname: string) {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host || BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) return true;
  if (isIP(host)) return isBlockedIp(host);
  return false;
}

export async function assertPublicHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL is not valid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }
  if (url.username || url.password) throw new Error("URLs with credentials are not allowed");
  if (isBlockedHostname(url.hostname)) throw new Error("That host is not allowed");
  if (isIP(url.hostname)) return url;

  const records = await lookup(url.hostname, { all: true, verbatim: true });
  if (records.length === 0) throw new Error("Host did not resolve");
  if (records.some((record) => isBlockedIp(record.address))) {
    throw new Error("That host is not allowed");
  }
  return url;
}

export function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
