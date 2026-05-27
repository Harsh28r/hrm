export type ApiErrorBody = {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: unknown;

  constructor(
    message: string,
    status: number,
    options?: { code?: string; body?: unknown; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.body = options?.body;
  }

  static notConfigured(): ApiError {
    return new ApiError(
      "HR API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL.",
      0,
      { code: "API_NOT_CONFIGURED" },
    );
  }
}

export async function parseErrorResponse(res: Response): Promise<ApiError> {
  const status = res.status;
  let message = res.statusText || "Request failed";
  let code: string | undefined;
  let body: unknown;

  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      body = await res.json();
      const b = body as ApiErrorBody;
      if (typeof b?.message === "string") message = b.message;
      if (typeof b?.code === "string") code = b.code;
    } else {
      const text = await res.text();
      if (text) message = text.slice(0, 500);
    }
  } catch {
    // ignore parse failures
  }

  if (
    status === 404 &&
    (message.includes("Cannot GET") || message.includes("Cannot POST"))
  ) {
    message =
      "HRM API route not found (404). Point NEXT_PUBLIC_API_BASE_URL to local deltadb (http://localhost:5000) or deploy latest deltadb to production.";
  }

  return new ApiError(message, status, { code, body });
}
