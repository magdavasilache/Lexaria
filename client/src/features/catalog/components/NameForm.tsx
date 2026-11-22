import { useId } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "../../../shared/forms/fields/FormField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { NameFormValues, nameFormSchema } from "../schemas/catalogSchemas";
import { NAME_MAX_LENGTH } from "../schemas/catalogRules";
import { useSaveCatalogEntry } from "../hooks/useCatalog";
import type { Genre, Language, NamedKind } from "../catalogTypes";
import CatalogFormModal from "./CatalogFormModal";

type Props = {
    kind: NamedKind;
    entry: Language | Genre | null;
    onClose: () => void;
};

const FIELDS = ["name"] as const;

export default function NameForm({ kind, entry, onClose }: Props) {
    const { t } = useTranslation("front/catalog");
    const formId = useId();
    const schema = nameFormSchema(kind);
    const save = useSaveCatalogEntry<Language | Genre>(kind);
    const { register, handleSubmit, control, setError, formState: { errors, isSubmitting, isDirty } } = useForm<NameFormValues>({
        resolver: zodResolver(schema),
        mode: "onTouched",
        defaultValues: { name: entry?.name ?? "" },
    });
    const fieldStatus = useFieldStatus(schema, control);

    const submit = async (values: NameFormValues) => {
        try {
            await save.mutateAsync({ id: entry?.id ?? null, data: values });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS);
        }
    };

    return (
        <CatalogFormModal kind={kind} formId={formId} editing={entry !== null} isSubmitting={isSubmitting} isDirty={isDirty} onClose={onClose} size="sm">
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <FormField
                    label={t("form.fields.name")}
                    required
                    autoComplete="off"
                    maxLength={NAME_MAX_LENGTH[kind]}
                    helperText={t(`form.helpers.${kind}Name`)}
                    error={errors.name}
                    status={fieldStatus("name")}
                    {...register("name")}
                />
                <RequiredFieldsNote />
            </form>
        </CatalogFormModal>
    );
}
