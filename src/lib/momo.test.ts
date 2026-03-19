import { describe, expect, it } from "vitest";
import {
  getRwandaNetwork,
  isValidMtnRwandaMsisdn,
  isValidRwandaMsisdn,
  mapMomoCollectionStatus,
  normalizeRwandaMsisdn,
} from "./momo";

describe("momo helpers", () => {
  it("normalizes Rwanda phone numbers", () => {
    expect(normalizeRwandaMsisdn("0780 123 456")).toBe("250780123456");
    expect(normalizeRwandaMsisdn("+250 790 000 111")).toBe("250790000111");
    expect(normalizeRwandaMsisdn("790000111")).toBe("250790000111");
  });

  it("detects supported Rwanda networks", () => {
    expect(getRwandaNetwork("0780123456")).toBe("mtn");
    expect(getRwandaNetwork("0721234567")).toBe("airtel");
    expect(getRwandaNetwork("0711234567")).toBe("unknown");
  });

  it("validates MTN and general Rwanda msisdn values", () => {
    expect(isValidRwandaMsisdn("0790123456")).toBe(true);
    expect(isValidMtnRwandaMsisdn("0790123456")).toBe(true);
    expect(isValidMtnRwandaMsisdn("0721234567")).toBe(false);
  });

  it("maps provider status values to app statuses", () => {
    expect(mapMomoCollectionStatus("SUCCESSFUL")).toBe("successful");
    expect(mapMomoCollectionStatus("FAILED")).toBe("failed");
    expect(mapMomoCollectionStatus("PENDING")).toBe("processing");
    expect(mapMomoCollectionStatus("")).toBe("pending");
  });
});
