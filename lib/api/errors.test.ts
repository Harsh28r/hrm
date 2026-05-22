import { describe, expect, it } from "vitest";
import { ApiError, parseErrorResponse } from "@/lib/api/errors";

describe("ApiError", () => {
  it("creates notConfigured error", () => {
    const e = ApiError.notConfigured();
    expect(e.code).toBe("API_NOT_CONFIGURED");
    expect(e.status).toBe(0);
  });
});

describe("parseErrorResponse", () => {
  it("parses json body", async () => {
    const res = new Response(
      JSON.stringify({ message: "Invalid token", code: "AUTH" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
    const err = await parseErrorResponse(res);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("Invalid token");
    expect(err.status).toBe(401);
    expect(err.code).toBe("AUTH");
  });

  it("falls back to text", async () => {
    const res = new Response("boom", { status: 500 });
    const err = await parseErrorResponse(res);
    expect(err.message).toBe("boom");
    expect(err.status).toBe(500);
  });
});
