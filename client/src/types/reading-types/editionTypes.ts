import type { Schema } from "../../api/apiTypes";

export type EditionFormat = Schema<"EditionFormat">;
export const EDITION_FORMATS = ["hardcover", "paperback", "ebook", "audiobook"] as const satisfies readonly EditionFormat[];
export const PERCENT_FORMATS: readonly EditionFormat[] = ["ebook", "audiobook"];

export type Edition = Schema<"EditionOut">;
export type EditionAdmin = Schema<"EditionAdminOut">;
export type EditionPayload = Schema<"EditionCreate">;
export type EditionUpdatePayload = Schema<"EditionUpdate">;
