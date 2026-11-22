export const USERNAME_RULES = {
  minLength: 3,
  maxLength: 30,
  pattern: /^[A-Za-z0-9_.-]+$/,
} as const;

export const PASSWORD_RULES = {
  minLength: 8,
  maxBytes: 72,
  loginMaxLength: 128,
} as const;

export type PasswordRequirementId = "length" | "uppercase" | "lowercase" | "number" | "special";

export type PasswordRequirement = {
  id: PasswordRequirementId;
  test: (value: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: "length", test: (value) => value.length >= PASSWORD_RULES.minLength },
  { id: "uppercase", test: (value) => /[A-Z]/.test(value) },
  { id: "lowercase", test: (value) => /[a-z]/.test(value) },
  { id: "number", test: (value) => /[0-9]/.test(value) },
  { id: "special", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export const byteLength = (value: string) => new TextEncoder().encode(value).length;

export const AVATAR_RULES = {
  maxMb: 2,
  sizePx: 512,
  types: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const BAN_RULES = {
  reasonMaxLength: 500,
  durationDaysMax: 3650,
  durations: [1, 3, 7, 30, 90, 365],
} as const;
