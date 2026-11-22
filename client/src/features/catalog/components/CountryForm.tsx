import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AutocompleteField from "../../../shared/forms/fields/AutocompleteField";
import FormField from "../../../shared/forms/fields/FormField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { CountryFormValues, countryFormSchema } from "../schemas/catalogSchemas";
import { CATALOG_RULES } from "../schemas/catalogRules";
import { useLanguages, useSaveCatalogEntry } from "../hooks/useCatalog";
import type { Country } from "../catalogTypes";
import CatalogFormModal from "./CatalogFormModal";

type Props = {
    entry: Country | null;
    onClose: () => void;
};

const FIELDS = ["name", "language_id"] as const;

export default function CountryForm({ entry, onClose }: Props) {
    const { t } = useTranslation("front/catalog");
    const formId = useId();
    const languages = useLanguages().data ?? [];
    const save = useSaveCatalogEntry<Country>("countries");
    const { register, handleSubmit, control, setError, formState: { errors, isSubmitting, isDirty } } = useForm<CountryFormValues>({
        resolver: zodResolver(countryFormSchema),
        mode: "onTouched",
        defaultValues: { name: entry?.name ?? "", language_id: entry?.language_id ?? null },
    });
    const fieldStatus = useFieldStatus(countryFormSchema, control);

    const submit = async (values: CountryFormValues) => {
        try {
            await save.mutateAsync({ id: entry?.id ?? null, data: values });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS);
        }
    };

    return (
        <CatalogFormModal kind="countries" formId={formId} editing={entry !== null} isSubmitting={isSubmitting} isDirty={isDirty} onClose={onClose}>
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <FormField
                    label={t("form.fields.name")}
                    required
                    autoComplete="off"
                    maxLength={CATALOG_RULES.countryNameMaxLength}
                    helperText={t("form.helpers.countriesName")}
                    error={errors.name}
                    status={fieldStatus("name")}
                    {...register("name")}
                />
                <Controller
                    name="language_id"
                    control={control}
                    render={({ field }) => (
                        <AutocompleteField
                            label={t("form.fields.officialLanguage")}
                            options={languages}
                            placeholder={t("form.placeholders.language")}
                            helperText={t("form.helpers.officialLanguage")}
                            error={errors.language_id}
                            status={fieldStatus("language_id")}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                        />
                    )}
                />
                <RequiredFieldsNote />
            </form>
        </CatalogFormModal>
    );
}
