import { z } from "zod";
import { AVATAR_RULES } from "./userRules";

const MB = 1024 * 1024;
const avatarTypes: readonly string[] = AVATAR_RULES.types;

export const avatarFileSchema = z
    .instanceof(File)
    .refine((file) => avatarTypes.includes(file.type), "front/users:avatar.validation.type")
    .refine((file) => file.size <= AVATAR_RULES.maxMb * MB, "front/users:avatar.validation.size");
