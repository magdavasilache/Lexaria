import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, BookPlus, PencilLine } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import AutocompleteField from "../../../shared/forms/fields/AutocompleteField";
import DateField from "../../../shared/forms/fields/DateField";
import FormField from "../../../shared/forms/fields/FormField";
import NumberField from "../../../shared/forms/fields/NumberField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import SelectField from "../../../shared/forms/fields/SelectField";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { EditionFormValues, editionFormSchema } from "../schemas/readingSchemas";
import { EDITION_RULES } from "../schemas/readingRules";
import { latestPublishedDate } from "../../books/schemas/bookRules";
import { useLanguages } from "../../catalog/hooks/useCatalog";
import { useCreateEdition, useUpdateEdition } from "../hooks/useEditions";
import { EDITION_FORMATS, PERCENT_FORMATS, type Edition, type EditionFormat } from "../types/editionTypes";

type Props = {
    bookId: number;
    edition?: Edition;
    onClose: () => void;
    onSaved: (edition: Edition) => void;
};

const FIELDS = ["format", "pages", "language_id", "translator", "publisher", "published_at", "isbn"] as const;

const DEFAULTS: EditionFormValues = {
    format: null,
    pages: null,
    language_id: null,
    translator: "",
    publisher: "",
    published_at: "",
    isbn: "",
};

const toValues = (edition: Edition): EditionFormValues => ({
    format: edition.format,
    pages: edition.pages,
    language_id: edition.language_id,
    translator: edition.translator ?? "",
    publisher: edition.publisher ?? "",
    published_at: edition.published_at ?? "",
    isbn: edition.isbn ?? "",
});

export default function EditionForm({ bookId, edition, onClose, onSaved }: Props) {
    const { t } = useTranslation(["front/reading", "front/common"]);
    const formId = useId();
    const languages = useLanguages().data ?? [];
    const createEdition = useCreateEdition(bookId);
    const updateEdition = useUpdateEdition();
    const { handleSubmit, control, setError, formState: { errors, isSubmitting, isDirty } } = useForm<EditionFormValues>({
        resolver: zodResolver(editionFormSchema),
        mode: "onTouched",
        defaultValues: edition ? toValues(edition) : DEFAULTS,
    });
    const fieldStatus = useFieldStatus(editionFormSchema, control);
    const format = useWatch({ control, name: "format" });
    const pagesRequired = format !== null && !PERCENT_FORMATS.includes(format);

    const submit = async (values: EditionFormValues) => {
        try {
            const data = {
                format: values.format as EditionFormat,
                pages: values.pages,
                language_id: values.language_id,
                translator: values.translator || null,
                publisher: values.publisher || null,
                published_at: values.published_at || null,
                isbn: values.isbn || null,
            };
            onSaved(edition ? await updateEdition.mutateAsync({ editionId: edition.id, data }) : await createEdition.mutateAsync({ bookId, data }));
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            icon={edition ? PencilLine : BookPlus}
            title={t(edition ? "editionForm.editTitle" : "editionForm.title")}
            description={t(edition ? "editionForm.editDescription" : "editionForm.description")}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    {edition ? (
                        <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="min-h-10">
                            {t("front/common:actions.cancel")}
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onClick={onClose} disabled={isSubmitting} className="min-h-10">
                            {t("editionForm.back")}
                        </Button>
                    )}
                    <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("editionForm.submitting")} className="min-h-10">
                        {t(edition ? "editionForm.save" : "editionForm.submit")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <RequiredFieldsNote />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Controller
                        name="format"
                        control={control}
                        render={({ field }) => (
                            <SelectField
                                label={t("editionForm.format")}
                                required
                                options={EDITION_FORMATS.map((value) => ({ value, label: t(`formats.${value}`) }))}
                                placeholder={t("editionForm.formatPlaceholder")}
                                helperText={t("editionForm.formatHelper")}
                                error={errors.format}
                                status={fieldStatus("format")}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                            />
                        )}
                    />
                    <Controller
                        name="pages"
                        control={control}
                        render={({ field }) => (
                            <NumberField
                                label={t("editionForm.pages")}
                                required={pagesRequired}
                                min={1}
                                max={EDITION_RULES.pagesMax}
                                showStepper={false}
                                helperText={t(pagesRequired ? "editionForm.pagesHelper" : "editionForm.pagesOptionalHelper")}
                                error={errors.pages}
                                status={fieldStatus("pages")}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                            />
                        )}
                    />
                    <Controller
                        name="language_id"
                        control={control}
                        render={({ field }) => (
                            <AutocompleteField
                                label={t("editionForm.language")}
                                options={languages}
                                placeholder={t("editionForm.languagePlaceholder")}
                                helperText={t("editionForm.languageHelper")}
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
                    <Controller
                        name="translator"
                        control={control}
                        render={({ field }) => (
                            <FormField
                                label={t("editionForm.translator")}
                                maxLength={EDITION_RULES.translatorMaxLength}
                                helperText={t("editionForm.translatorHelper")}
                                error={errors.translator}
                                status={fieldStatus("translator")}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="publisher"
                        control={control}
                        render={({ field }) => (
                            <FormField
                                label={t("editionForm.publisher")}
                                maxLength={EDITION_RULES.publisherMaxLength}
                                helperText={t("editionForm.publisherHelper")}
                                error={errors.publisher}
                                status={fieldStatus("publisher")}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="published_at"
                        control={control}
                        render={({ field }) => (
                            <DateField
                                label={t("editionForm.publishedAt")}
                                max={latestPublishedDate()}
                                helperText={t("editionForm.publishedAtHelper")}
                                error={errors.published_at}
                                status={fieldStatus("published_at")}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="isbn"
                        control={control}
                        render={({ field }) => (
                            <FormField
                                label={t("editionForm.isbn")}
                                autoComplete="off"
                                maxLength={EDITION_RULES.isbnInputMaxLength}
                                helperText={t("editionForm.isbnHelper")}
                                error={errors.isbn}
                                status={fieldStatus("isbn")}
                                {...field}
                            />
                        )}
                    />
                </div>
            </form>
        </Modal>
    );
}
