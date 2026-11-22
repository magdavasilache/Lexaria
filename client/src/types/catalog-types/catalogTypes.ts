import type { Schema } from "../../api/apiTypes";

export type Language = Schema<"LanguageOut">;
export type LanguagePayload = Schema<"LanguageIn">;
export type Country = Schema<"CountryOut">;
export type CountryPayload = Schema<"CountryIn">;
export type Genre = Schema<"GenreOut">;
export type GenrePayload = Schema<"GenreIn">;
export type Award = Schema<"AwardOut">;
export type AwardPayload = Schema<"AwardIn">;
export type Author = Schema<"AuthorOut">;

export const NAMED_KINDS = ["languages", "genres"] as const;
export type NamedKind = (typeof NAMED_KINDS)[number];
export type CatalogKind = NamedKind | "countries" | "awards" | "authors";
