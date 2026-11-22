import { useEffect, useId, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Control, Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, RotateCcw, Trash2, UserRound } from "lucide-react";
import Button from "../../../shared/components/Button";
import AutocompleteField from "../../../shared/forms/fields/AutocompleteField";
import DateField from "../../../shared/forms/fields/DateField";
import FormField from "../../../shared/forms/fields/FormField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { AuthorFormValues, authorFormSchema } from "../schemas/catalogSchemas";
import { CATALOG_RULES, todayIso } from "../schemas/catalogRules";
import { useCountries, useSaveCatalogEntry } from "../hooks/useCatalog";
import type { Author } from "../catalogTypes";
import { decodeMessage, translate } from "../../../i18n/message";
import { serverAssetUrl } from "../../../shared/utils/assets";
import CatalogFormModal from "./CatalogFormModal";

type Props = {
    entry: Author | null;
    onClose: () => void;
};

const FIELDS = ["first_name", "last_name", "birthdate", "country_id", "about", "image"] as const;

const toValues = (author: Author | null): AuthorFormValues => ({
    first_name: author?.first_name ?? "",
    last_name: author?.last_name ?? "",
    birthdate: author?.birthdate ?? "",
    country_id: author?.country_id ?? null,
    about: author?.about ?? "",
    image: null,
    remove_image: false,
});

const toFormData = (values: AuthorFormValues, editing: boolean) => {
    const data = new FormData();
    data.append("first_name", values.first_name);
    if (values.last_name) data.append("last_name", values.last_name);
    if (values.birthdate) data.append("birthdate", values.birthdate);
    if (values.country_id !== null) data.append("country_id", String(values.country_id));
    if (values.about) data.append("about", values.about);
    if (values.image) data.append("image", values.image);
    if (editing && values.remove_image) data.append("remove_image", "true");
    return data;
};

export default function AuthorForm({ entry, onClose }: Props) {
    const { t } = useTranslation("front/catalog");
    const formId = useId();
    const editing = entry !== null;
    const countries = useCountries().data ?? [];
    const save = useSaveCatalogEntry<Author>("authors");
    const { register, handleSubmit, control, setError, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<AuthorFormValues>({
        resolver: zodResolver(authorFormSchema),
        mode: "onTouched",
        defaultValues: toValues(entry),
    });
    const fieldStatus = useFieldStatus(authorFormSchema, control);

    const submit = async (values: AuthorFormValues) => {
        try {
            await save.mutateAsync({ id: entry?.id ?? null, data: toFormData(values, editing) });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS);
        }
    };

    return (
        <CatalogFormModal kind="authors" formId={formId} editing={editing} isSubmitting={isSubmitting} isDirty={isDirty} onClose={onClose} size="lg">
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        label={t("form.fields.firstName")}
                        required
                        autoComplete="off"
                        maxLength={CATALOG_RULES.authorNameMaxLength}
                        helperText={t("form.helpers.firstName")}
                        error={errors.first_name}
                        status={fieldStatus("first_name")}
                        {...register("first_name")}
                    />
                    <FormField
                        label={t("form.fields.lastName")}
                        autoComplete="off"
                        maxLength={CATALOG_RULES.authorNameMaxLength}
                        helperText={t("form.helpers.lastName")}
                        error={errors.last_name}
                        status={fieldStatus("last_name")}
                        {...register("last_name")}
                    />
                    <DateField
                        label={t("form.fields.birthdate")}
                        max={todayIso()}
                        helperText={t("form.helpers.birthdate")}
                        error={errors.birthdate}
                        status={fieldStatus("birthdate")}
                        {...register("birthdate")}
                    />
                    <Controller
                        name="country_id"
                        control={control}
                        render={({ field }) => (
                            <AutocompleteField
                                label={t("form.fields.country")}
                                options={countries}
                                placeholder={t("form.placeholders.country")}
                                helperText={t("form.helpers.country")}
                                error={errors.country_id}
                                status={fieldStatus("country_id")}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                            />
                        )}
                    />
                </div>
                <TextAreaField
                    label={t("form.fields.about")}
                    rows={4}
                    showCount
                    maxLength={CATALOG_RULES.authorAboutMaxLength}
                    helperText={t("form.helpers.about")}
                    error={errors.about}
                    status={fieldStatus("about")}
                    {...register("about")}
                />
                <PortraitField
                    control={control}
                    currentUrl={entry?.image_url ?? null}
                    name={entry?.full_name ?? ""}
                    error={errors.image?.message}
                    onPick={(file) => {
                        setValue("image", file, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                        setValue("remove_image", false, { shouldDirty: true });
                    }}
                    onRemove={(remove) => {
                        setValue("image", null, { shouldValidate: true, shouldDirty: true });
                        setValue("remove_image", remove, { shouldDirty: true });
                    }}
                />
                <RequiredFieldsNote />
            </form>
        </CatalogFormModal>
    );
}

type PortraitFieldProps = {
    control: Control<AuthorFormValues>;
    currentUrl: string | null;
    name: string;
    error: string | undefined;
    onPick: (file: File) => void;
    onRemove: (remove: boolean) => void;
};

function PortraitField({ control, currentUrl, name, error, onPick, onRemove }: PortraitFieldProps) {
    const { t } = useTranslation("front/catalog");
    const inputRef = useRef<HTMLInputElement>(null);
    const labelId = useId();
    const helperId = useId();
    const errorId = useId();
    const file = useWatch({ control, name: "image" });
    const removed = useWatch({ control, name: "remove_image" });
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const shown = preview ?? (removed ? null : serverAssetUrl(currentUrl));

    return (
        <div role="group" aria-labelledby={labelId} aria-describedby={`${helperId}${error ? ` ${errorId}` : ""}`} className="flex flex-col gap-2">
            <span id={labelId} className="text-sm font-libre text-fontPrimaryLight dark:text-fontPrimaryDark">{t("form.fields.image")}</span>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-control border border-panelBorderLight bg-panelLight dark:border-panelBorderDark dark:bg-panelDark">
                    {shown ? (
                        <img src={shown} alt={t("form.image.alt", { name: name || t("form.image.newAuthor") })} className="h-full w-full object-cover" />
                    ) : (
                        <UserRound className="h-6 w-6 text-fontMutedLight dark:text-fontMutedDark" aria-hidden="true" />
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" leftIcon={ImagePlus} onClick={() => inputRef.current?.click()} className="min-h-10">
                        {t(shown ? "form.image.replace" : "form.image.choose")}
                    </Button>
                    {(file || (currentUrl && !removed)) && (
                        <Button variant="ghost" size="sm" leftIcon={Trash2} onClick={() => onRemove(!file)} className="min-h-10">
                            {t("form.image.remove")}
                        </Button>
                    )}
                    {removed && !file && (
                        <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={() => onRemove(false)} className="min-h-10">
                            {t("form.image.keep")}
                        </Button>
                    )}
                </div>
            </div>
            <input
                ref={inputRef}
                type="file"
                hidden
                accept={CATALOG_RULES.imageTypes.join(",")}
                onChange={(event) => {
                    const picked = event.target.files?.[0];
                    if (picked) onPick(picked);
                    event.target.value = "";
                }}
            />
            <p id={helperId} className="text-xs text-fontMutedLight dark:text-fontMutedDark">
                {t(removed && !file ? "form.image.removedNote" : "form.helpers.image")}
            </p>
            {error && (
                <p id={errorId} role="alert" className="text-xs font-medium text-errorLight dark:text-errorDark">{translate(decodeMessage(error))}</p>
            )}
        </div>
    );
}
