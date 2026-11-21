import { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError, hintOf, messageOf } from "../api/apiTypes";
import { encodeMessage } from "../i18n/message";
import { useSnackbarStore } from "../api-handling/context/snackbar/useSnackbarStore";

export const applyFieldErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[]
) => {
  if (!(error instanceof ApiError) || !error.hasOnlyFieldErrors) return;

  let focused = false;
  const unmatched = error.fieldErrors.filter((item) => {
    const field = item.field && (fields.includes(item.field as Path<T>) ? item.field : item.field.split(".")[0]);
    if (field && fields.includes(field as Path<T>)) {
      setError(field as Path<T>, { type: "server", message: encodeMessage(messageOf(item)) }, { shouldFocus: !focused });
      focused = true;
      return false;
    }
    return true;
  });

  if (unmatched.length > 0) {
    useSnackbarStore.getState().showSnackBar(messageOf(unmatched[0]), "error", 5000, hintOf(unmatched[0]));
  }
};
