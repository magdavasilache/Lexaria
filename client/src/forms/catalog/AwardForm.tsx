import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "../components/FormField";
import NumberField from "../components/NumberField";
import RequiredFieldsNote from "../components/RequiredFieldsNote";
import TextAreaField from "../components/TextAreaField";
import { applyFieldErrors } from "../applyFieldErrors";
import { useFieldStatus } from "../useFieldStatus";
import { AwardFormValues, awardFormSchema } from "../../schemas/catalogSchemas";
import { CATALOG_RULES } from "../../schemas/catalogRules";
import { useSaveCatalogEntry } from "../../api-handling/rtk-hooks/catalog/useCatalog";
import type { Award } from "../../types/catalog-types/catalogTypes";
import CatalogFormModal from "./CatalogFormModal";

type Props = {
    entry: Award | null;
    onClose: () => void;
};

const FIELDS = ["name", "year", "description"] as const;

export default function AwardForm({ entry, onClose }: Props) {
    const { t } = useTranslation("front/catalog");
    const formId = useId();
    const save = useSaveCatalogEntry<Award>("awards");
    const { register, handleSubmit, control, setError, formState: { errors, isSubmitting, isDirty } } = useForm<AwardFormValues>({
        resolver: zodResolver(awardFormSchema),
        mode: "onTouched",
        defaultValues: { name: entry?.name ?? "", year: entry?.year ?? null, description: entry?.description ?? "" },
    });
    const fieldStatus = useFieldStatus(awardFormSchema, control);

    const submit = async (values: AwardFormValues) => {
        try {
            await save.mutateAsync({ id: entry?.id ?? null, data: { ...values, description: values.description || null } });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS);
        }
    };

    return (
        <CatalogFormModal kind="awards" formId={formId} editing={entry !== null} isSubmitting={isSubmitting} isDirty={isDirty} onClose={onClose}>
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
                    <FormField
                        label={t("form.fields.name")}
                        required
                        autoComplete="off"
                        maxLength={CATALOG_RULES.awardNameMaxLength}
                        helperText={t("form.helpers.awardsName")}
                        error={errors.name}
                        status={fieldStatus("name")}
                        {...register("name")}
                    />
                    <Controller
                        name="year"
                        control={control}
                        render={({ field }) => (
                            <NumberField
                                label={t("form.fields.year")}
                                min={CATALOG_RULES.awardYearMin}
                                max={new Date().getFullYear()}
                                showStepper={false}
                                helperText={t("form.helpers.year")}
                                error={errors.year}
                                status={fieldStatus("year")}
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
                    label={t("form.fields.description")}
                    rows={4}
                    showCount
                    maxLength={CATALOG_RULES.awardDescriptionMaxLength}
                    helperText={t("form.helpers.description")}
                    error={errors.description}
                    status={fieldStatus("description")}
                    {...register("description")}
                />
                <RequiredFieldsNote />
            </form>
        </CatalogFormModal>
    );
}
