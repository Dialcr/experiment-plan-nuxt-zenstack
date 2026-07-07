import { ORMError, ORMErrorReason } from "@zenstackhq/orm";
import { createError } from "h3";

export function handleOrmError(
  error: unknown,
  fallbackMessage = "An unexpected error occurred",
  notFoundMessage?: string,
): never {
  if (error && typeof error === "object" && "statusCode" in error) {
    throw error;
  }
  if (error instanceof ORMError) {
    if (error.reason === ORMErrorReason.REJECTED_BY_POLICY) {
      throw createError({
        statusCode: 403,
        statusMessage: error.rejectedByPolicyReason ?? "Access denied",
      });
    }
    if (error.reason === ORMErrorReason.NOT_FOUND) {
      throw createError({
        statusCode: 404,
        statusMessage: notFoundMessage ?? "Resource not found",
      });
    }
    if (error.reason === ORMErrorReason.INVALID_INPUT) {
      throw createError({
        statusCode: 400,
        statusMessage: error.dbErrorMessage ?? "Invalid input",
      });
    }
  }
  throw createError({ statusCode: 500, statusMessage: fallbackMessage });
}
