import { describe, expect, it } from "vitest";
import {
  coerceManualEntryText,
  filterManualEntryUsersBySearch,
  manualEntrySearchKey,
  mapPermissionsUserToManualEntry,
  matchesManualEntryUserSearch,
  normalizeManualEntryUserList,
} from "./manual-entry";

describe("coerceManualEntryText", () => {
  it("coerces primitives, arrays, and objects without throwing", () => {
    expect(coerceManualEntryText("Alice")).toBe("Alice");
    expect(coerceManualEntryText({ name: "Bob" })).toBe("Bob");
    expect(coerceManualEntryText([{ name: "A" }, { email: "b@x.com" }])).toBe("A b@x.com");
    expect(coerceManualEntryText(null)).toBe("");
  });
});

describe("manualEntrySearchKey", () => {
  it("lowercases safely for any query shape", () => {
    expect(manualEntrySearchKey("  ALICE  ")).toBe("alice");
    expect(() => manualEntrySearchKey({ name: "X" })).not.toThrow();
  });
});

describe("matchesManualEntryUserSearch", () => {
  const user = { id: "1", name: "Alice", email: "a@x.com", role: "Manager" };

  it("matches case-insensitively", () => {
    expect(matchesManualEntryUserSearch(user, "ali")).toBe(true);
    expect(matchesManualEntryUserSearch(user, "MAN")).toBe(true);
    expect(matchesManualEntryUserSearch(user, "zzz")).toBe(false);
  });

  it("does not throw on odd API user shapes", () => {
    const mapped = mapPermissionsUserToManualEntry({
      id: "x",
      name: { name: "Test User" },
      email: 42,
      role: { name: "Lead" },
      isActive: true,
    });
    expect(mapped).not.toBeNull();
    expect(() => matchesManualEntryUserSearch(mapped, "TEST")).not.toThrow();
    expect(matchesManualEntryUserSearch(mapped, "lead")).toBe(true);
  });
});

describe("filterManualEntryUsersBySearch", () => {
  const users = normalizeManualEntryUserList([
    { id: "1", name: "Alice", email: "a@x.com" },
    { id: "2", name: "Bob", email: "b@x.com", role: "Manager" },
  ]);

  it("filters without throwing", () => {
    expect(filterManualEntryUsersBySearch(users, "").length).toBe(2);
    expect(filterManualEntryUsersBySearch(users, "bob").length).toBe(1);
    expect(() => filterManualEntryUsersBySearch(users, { q: "x" })).not.toThrow();
  });
});
