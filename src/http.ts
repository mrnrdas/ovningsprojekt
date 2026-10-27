import { Response } from "express";
import { AppError, Result } from "./result";

const STATUS: Record<AppError["code"], number> = {
  invalid_input: 400,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
};

// Alla felsvar har formen { error: { code, message } }.
export function sendError(res: Response, error: AppError): void {
  res.status(STATUS[error.code]).json({ error });
}

export function sendResult<T>(res: Response, result: Result<T>, okStatus = 200): void {
  if (result.ok) {
    res.status(okStatus).json(result.value);
  } else {
    sendError(res, result.error);
  }
}
