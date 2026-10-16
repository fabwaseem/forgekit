import { describe, expect, it } from "vitest";
import { htmlToText, isBlockedHostname, isBlockedIp } from "../lib/security/url";

describe("public URL guards", () => {
  it("blocks loopback, private, and link-local addresses", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.1.2.3")).toBe(true);
    expect(isBlockedIp("192.168.1.9")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("172.16.0.1")).toBe(true);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("::1")).toBe(true);
  });

  it("blocks local hostnames", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("printer.local")).toBe(true);
    expect(isBlockedHostname("example.com")).toBe(false);
  });

  it("strips markup from fetched pages", () => {
    expect(htmlToText("<style>a{}</style><p>Hello &amp; welcome</p>")).toBe("Hello & welcome");
  });
});
