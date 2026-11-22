import { useEffect, useId, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, RotateCcw, Trash2, UserRound } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { decodeMessage, translate } from "../../../i18n/message";
import { DEFAULT_AVATAR, serverAssetUrl } from "../../../shared/utils/assets";
import { avatarFileSchema } from "../schemas/avatarSchema";
import { AVATAR_RULES } from "../schemas/userRules";
import { toSquareImage } from "../utils/squareImage";
import { useRemoveAvatar, useUploadAvatar } from "../hooks/useAvatar";
import type { UserType } from "../userTypes";

const avatarFormSchema = z.object({
    image: avatarFileSchema.nullable(),
    remove: z.boolean(),
});

type AvatarFormValues = z.infer<typeof avatarFormSchema>;

const FIELDS = ["image"] as const;
const PICK_TYPES: readonly string[] = AVATAR_RULES.types;

export default function AvatarForm({ user, onClose }: { user: UserType; onClose: () => void }) {
    const { t } = useTranslation(["front/users", "front/common"]);
    const formId = useId();
    const helperId = useId();
    const errorId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const upload = useUploadAvatar();
    const remove = useRemoveAvatar();
    const { handleSubmit, control, setValue, setError, clearErrors, formState: { errors, isSubmitting, isDirty } } = useForm<AvatarFormValues>({
        resolver: zodResolver(avatarFormSchema),
        mode: "onTouched",
        defaultValues: { image: null, remove: false },
    });
    const image = useWatch({ control, name: "image" });
    const removing = useWatch({ control, name: "remove" });
    const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const currentUrl = serverAssetUrl(user.avatar_url);
    const shown = preview ?? (removing ? null : currentUrl);
    const error = errors.image?.message;

    const pick = async (file: File) => {
        clearErrors("image");
        if (!PICK_TYPES.includes(file.type)) {
            setError("image", { type: "validate", message: "front/users:avatar.validation.type" }, { shouldFocus: true });
            return;
        }
        try {
            const square = await toSquareImage(file, AVATAR_RULES.sizePx);
            setValue("image", square, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            setValue("remove", false, { shouldDirty: true });
        } catch {
            setError("image", { type: "validate", message: "front/users:avatar.validation.unreadable" }, { shouldFocus: true });
        }
    };

    const submit = async (values: AvatarFormValues) => {
        try {
            if (values.image) await upload.mutateAsync(values.image);
            else if (values.remove) await remove.mutateAsync();
            onClose();
        } catch (failure) {
            applyFieldErrors(failure, setError, FIELDS);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="sm"
            icon={UserRound}
            title={t("avatar.title")}
            description={t("avatar.description")}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="min-h-10">{t("front/common:actions.cancel")}</Button>
                    <Button type="submit" form={formId} size="sm" disabled={!image && !removing} loading={isSubmitting} loadingText={t("avatar.saving")} className="min-h-10">
                        {t("avatar.save")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <img
                    src={shown ?? DEFAULT_AVATAR}
                    alt={t("avatar.alt", { name: user.display_name ?? user.username })}
                    className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-panelBorderLight dark:ring-panelBorderDark bg-dividerLight dark:bg-dividerDark"
                />
                <div
                    role="group"
                    aria-label={t("avatar.picture")}
                    aria-describedby={`${helperId}${error ? ` ${errorId}` : ""}`}
                    className="flex min-w-0 flex-1 flex-col gap-2"
                >
                    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={ImagePlus}
                            onClick={() => inputRef.current?.click()}
                            aria-invalid={Boolean(error)}
                            className="min-h-10"
                        >
                            {t(shown ? "avatar.replace" : "avatar.choose")}
                        </Button>
                        {(image || (currentUrl && !removing)) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={Trash2}
                                onClick={() => {
                                    clearErrors("image");
                                    setValue("image", null, { shouldDirty: true });
                                    setValue("remove", !image && Boolean(currentUrl), { shouldDirty: true });
                                }}
                                className="min-h-10"
                            >
                                {t("avatar.remove")}
                            </Button>
                        )}
                        {removing && !image && (
                            <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={() => setValue("remove", false, { shouldDirty: true })} className="min-h-10">
                                {t("avatar.keep")}
                            </Button>
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        hidden
                        accept={AVATAR_RULES.types.join(",")}
                        onChange={(event) => {
                            const picked = event.target.files?.[0];
                            if (picked) void pick(picked);
                            event.target.value = "";
                        }}
                    />
                    <p id={helperId} className="text-xs text-fontMutedLight dark:text-fontMutedDark">
                        {t(removing && !image ? "avatar.removedNote" : "avatar.helper")}
                    </p>
                    {error && (
                        <p id={errorId} role="alert" className="text-xs font-medium text-errorLight dark:text-errorDark">{translate(decodeMessage(error))}</p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
