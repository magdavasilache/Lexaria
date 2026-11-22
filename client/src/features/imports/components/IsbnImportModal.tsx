import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Barcode, BookCopy, BookPlus, CircleAlert, ExternalLink, Info, Search } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import CheckboxField from "../../../shared/forms/fields/CheckboxField";
import FormField from "../../../shared/forms/fields/FormField";
import NumberField from "../../../shared/forms/fields/NumberField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import SelectField from "../../../shared/forms/fields/SelectField";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { EDITION_RULES } from "../../reading/schemas/readingRules";
import { EDITION_FORMATS, PERCENT_FORMATS, type EditionFormat } from "../../reading/types/editionTypes";
import { useIsbnImport, useIsbnPreview } from "../hooks/useIsbnImport";
import { isbnImportSchema, isbnLookupSchema, type IsbnImportValues, type IsbnLookupValues } from "../schemas/isbnImportSchemas";
import type { IsbnPreview } from "../types/importTypes";

type Props = { onClose: () => void };

const SYNOPSIS_PREVIEW_LENGTH = 600;

export default function IsbnImportModal({ onClose }: Props) {
    const { t } = useTranslation(["front/imports", "front/reading", "front/common"]);
    const navigate = useNavigate();
    const lookupFormId = useId();
    const importFormId = useId();
    const [preview, setPreview] = useState<IsbnPreview | null>(null);
    const lookup = useIsbnPreview();
    const importIsbn = useIsbnImport();

    const lookupForm = useForm<IsbnLookupValues>({
        resolver: zodResolver(isbnLookupSchema),
        mode: "onTouched",
        defaultValues: { isbn: "" },
    });
    const lookupStatus = useFieldStatus(isbnLookupSchema, lookupForm.control);

    const importForm = useForm<IsbnImportValues>({
        resolver: zodResolver(isbnImportSchema),
        mode: "onTouched",
        defaultValues: { format: null, pages: null, include_cover: false },
    });
    const importStatus = useFieldStatus(isbnImportSchema, importForm.control);
    const format = useWatch({ control: importForm.control, name: "format" });
    const pagesRequired = format !== null && !PERCENT_FORMATS.includes(format);

    const isSubmitting = lookupForm.formState.isSubmitting || importForm.formState.isSubmitting;

    const runLookup = async ({ isbn }: IsbnLookupValues) => {
        try {
            const found = await lookup.mutateAsync(isbn);
            importForm.reset({ format: found.edition_format ?? null, pages: found.pages ?? null, include_cover: false });
            setPreview(found);
        } catch (error) {
            applyFieldErrors(error, lookupForm.setError, ["isbn"]);
        }
    };

    const runImport = async (values: IsbnImportValues) => {
        if (!preview) return;
        try {
            await importIsbn.mutateAsync({
                isbn: preview.isbn,
                format: values.format as EditionFormat,
                pages: values.pages,
                include_cover: values.include_cover,
            });
            onClose();
        } catch (error) {
            applyFieldErrors(error, importForm.setError, ["format", "pages", "include_cover"]);
        }
    };

    const footer = preview === null ? (
        <>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="min-h-10">
                {t("front/common:actions.cancel")}
            </Button>
            <Button type="submit" form={lookupFormId} size="sm" leftIcon={Search} loading={lookupForm.formState.isSubmitting} loadingText={t("isbn.lookingUp")} className="min-h-10">
                {t("isbn.lookUp")}
            </Button>
        </>
    ) : (
        <>
            <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onClick={() => setPreview(null)} disabled={isSubmitting} className="min-h-10">
                {t("isbn.back")}
            </Button>
            {preview.existing_book_id !== null ? (
                <Button size="sm" leftIcon={ExternalLink} onClick={() => navigate(`/book/${preview.existing_book_id}`)} className="min-h-10">
                    {t("isbn.openBook")}
                </Button>
            ) : (
                <Button type="submit" form={importFormId} size="sm" leftIcon={preview.matched_book_id ? BookCopy : BookPlus} loading={importForm.formState.isSubmitting} loadingText={t("isbn.submitting")} className="min-h-10">
                    {t(preview.matched_book_id ? "isbn.submitAsEdition" : "isbn.submit")}
                </Button>
            )}
        </>
    );

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            icon={Barcode}
            title={t("isbn.title")}
            description={t("isbn.description")}
            dismissible={!isSubmitting}
            unsavedChanges={lookupForm.formState.isDirty || importForm.formState.isDirty}
            footer={footer}
        >
            {preview === null ? (
                <form id={lookupFormId} noValidate onSubmit={lookupForm.handleSubmit(runLookup)} className="flex flex-col gap-4">
                    <RequiredFieldsNote />
                    <Controller
                        name="isbn"
                        control={lookupForm.control}
                        render={({ field }) => (
                            <FormField
                                label={t("isbn.isbnLabel")}
                                required
                                autoComplete="off"
                                inputMode="numeric"
                                leftIcon={Barcode}
                                maxLength={EDITION_RULES.isbnInputMaxLength}
                                helperText={t("isbn.isbnHelper")}
                                error={lookupForm.formState.errors.isbn}
                                status={lookupStatus("isbn")}
                                {...field}
                            />
                        )}
                    />
                    <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("isbn.source")}</p>
                </form>
            ) : (
                <div className="flex flex-col gap-4">
                    <PreviewCard preview={preview} />
                    <PreviewNotice preview={preview} />
                    {preview.existing_book_id === null && (
                        <form id={importFormId} noValidate onSubmit={importForm.handleSubmit(runImport)} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <h3 className="font-libre text-sm font-semibold">{t("isbn.editionHeading")}</h3>
                                <RequiredFieldsNote />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Controller
                                    name="format"
                                    control={importForm.control}
                                    render={({ field }) => (
                                        <SelectField
                                            label={t("isbn.format")}
                                            required
                                            options={EDITION_FORMATS.map((value) => ({ value, label: t(`front/reading:formats.${value}`) }))}
                                            placeholder={t("isbn.formatPlaceholder")}
                                            helperText={t("isbn.formatHelper")}
                                            error={importForm.formState.errors.format}
                                            status={importStatus("format")}
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            ref={field.ref}
                                        />
                                    )}
                                />
                                <Controller
                                    name="pages"
                                    control={importForm.control}
                                    render={({ field }) => (
                                        <NumberField
                                            label={t("isbn.pages")}
                                            required={pagesRequired}
                                            min={1}
                                            max={EDITION_RULES.pagesMax}
                                            showStepper={false}
                                            helperText={t(pagesRequired ? "isbn.pagesHelper" : "isbn.pagesOptionalHelper")}
                                            error={importForm.formState.errors.pages}
                                            status={importStatus("pages")}
                                            value={field.value}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            ref={field.ref}
                                        />
                                    )}
                                />
                            </div>
                            {preview.has_cover ? (
                                <Controller
                                    name="include_cover"
                                    control={importForm.control}
                                    render={({ field }) => (
                                        <CheckboxField
                                            label={t("isbn.includeCover")}
                                            helperText={t("isbn.coverHelper")}
                                            error={importForm.formState.errors.include_cover}
                                            checked={field.value}
                                            onChange={(event) => field.onChange(event.target.checked)}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                        />
                                    )}
                                />
                            ) : (
                                <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("isbn.noCover")}</p>
                            )}
                        </form>
                    )}
                </div>
            )}
        </Modal>
    );
}

function PreviewCard({ preview }: { preview: IsbnPreview }) {
    const { t, i18n } = useTranslation("front/imports");
    const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeZone: "UTC" });
    const numberFormat = new Intl.NumberFormat(i18n.resolvedLanguage);
    const synopsis = preview.synopsis && preview.synopsis.length > SYNOPSIS_PREVIEW_LENGTH
        ? `${preview.synopsis.slice(0, SYNOPSIS_PREVIEW_LENGTH).trimEnd()}…`
        : preview.synopsis;
    const details: { label: string; value: string | null }[] = [
        { label: t("isbn.fields.isbn"), value: preview.isbn },
        { label: t("isbn.fields.publisher"), value: preview.publisher },
        { label: t("isbn.fields.publishedAt"), value: preview.published_at ? dateFormat.format(new Date(preview.published_at)) : null },
        { label: t("isbn.fields.language"), value: preview.language_name },
        { label: t("isbn.fields.pages"), value: preview.pages ? numberFormat.format(preview.pages) : null },
    ];

    return (
        <section className="flex flex-col gap-3 rounded-panel border border-panelBorderLight bg-panelLight p-3 sm:p-4 dark:border-panelBorderDark dark:bg-panelDark">
            <div className="flex flex-col gap-1 min-w-0">
                <h3 className="font-libre text-base sm:text-lg font-semibold break-words">{preview.title}</h3>
                <p className="flex flex-wrap items-center gap-2 text-sm text-fontMutedLight dark:text-fontMutedDark">
                    <span className="break-words">{preview.author_name ? t("isbn.by", { author: preview.author_name }) : t("isbn.unknownAuthor")}</span>
                    {preview.author_name && (
                        <span className="rounded-control border border-panelBorderLight px-2 text-xs dark:border-panelBorderDark">
                            {t(preview.author_id ? "isbn.authorInCatalog" : "isbn.authorNew")}
                        </span>
                    )}
                </p>
            </div>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm min-[400px]:grid-cols-2 sm:grid-cols-3">
                {details.map(({ label, value }) => (
                    <div key={label} className="min-w-0">
                        <dt className="text-xs text-fontMutedLight dark:text-fontMutedDark">{label}</dt>
                        <dd className="break-words">{value ?? t("isbn.notListed")}</dd>
                    </div>
                ))}
            </dl>
            {preview.genres.length > 0 && (
                <div className="flex flex-col gap-1">
                    <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("isbn.genres")}</p>
                    <ul className="flex flex-wrap gap-1">
                        {preview.genres.map((genre) => (
                            <li key={genre.id} className="rounded-control bg-panelSelectedLight px-2 text-xs dark:bg-panelSelectedDark">{genre.name}</li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="flex flex-col gap-1">
                <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("isbn.synopsis")}</p>
                <p className="text-sm whitespace-pre-line break-words">{synopsis ?? t("isbn.noSynopsis")}</p>
            </div>
        </section>
    );
}

function PreviewNotice({ preview }: { preview: IsbnPreview }) {
    const { t } = useTranslation("front/imports");
    const exists = preview.existing_book_id !== null;
    const Icon = exists ? CircleAlert : Info;
    const text = exists
        ? t("isbn.exists")
        : preview.matched_book_title
            ? t("isbn.matched", { title: preview.matched_book_title })
            : t("isbn.newBook");

    return (
        <p role={exists ? "alert" : "status"} className="flex items-start gap-2 rounded-control bg-panelSelectedLight p-3 text-sm dark:bg-panelSelectedDark">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
            <span className="break-words">{text}</span>
        </p>
    );
}
