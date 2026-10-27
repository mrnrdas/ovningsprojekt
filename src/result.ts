// Tjänstelagret returnerar Result i stället för att kasta fel (se docs/standard.md).
export type ErrorCode = "not_found" | "invalid_input" | "forbidden" | "conflict";

export type AppError = { code: ErrorCode; message: string };

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const err = <T = never>(code: ErrorCode, message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});
