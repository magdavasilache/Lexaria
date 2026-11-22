import { Control, FieldValues, Path, get, useWatch } from "react-hook-form";
import { ZodType, ZodTypeDef } from "zod";

export type FieldStatus = "invalid" | "valid" | "neutral";

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0);

export const useFieldStatus = <T extends FieldValues>(schema: ZodType<T, ZodTypeDef, unknown>, control: Control<T>) => {
  const values = useWatch({ control });

  const result = schema.safeParse(values);
  const invalidFields = new Set(result.success ? [] : result.error.issues.map((issue) => issue.path.join(".")));

  return (field: Path<T>): FieldStatus => {
    if (invalidFields.has(field)) return "invalid";
    return isEmpty(get(values, field)) ? "neutral" : "valid";
  };
};
