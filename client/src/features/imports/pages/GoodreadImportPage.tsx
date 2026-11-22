import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, FileJson, Upload } from "lucide-react";
import Button from "../../../shared/components/Button";
import FormField from "../../../shared/forms/fields/FormField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { GoodreadsImportValues, goodreadsImportSchema } from "../../books/schemas/bookSchemas";
import { IMPORT_RULES } from "../../books/schemas/bookRules";
import { useGoodreadsImport } from "../hooks/useGoodreadsImport";
import { messageOf } from "../../../shared/api/apiTypes";
import { translate } from "../../../i18n/message";
import type { GoodreadsImportSummary } from "../types/importTypes";
import { useDocumentTitle } from "../../../shared/utils/useDocumentTitle";

const SUMMARY_ROWS: { key: keyof GoodreadsImportSummary; label: "booksCreated" | "genresAdded" | "statusesSaved" | "ratingsAdded" | "rowsSkipped" }[] = [
    { key: "books_created", label: "booksCreated" },
    { key: "genres_added", label: "genresAdded" },
    { key: "statuses_saved", label: "statusesSaved" },
    { key: "ratings_added", label: "ratingsAdded" },
    { key: "rows_skipped", label: "rowsSkipped" },
];

const ACCEPT = `${IMPORT_RULES.fileExtension},application/json`;

export default function GoodreadsImportPage() {
    const { t, i18n } = useTranslation("front/imports");
    useDocumentTitle(t("pageTitle.goodreadsImport", { ns: "front/common" }));
    const importGoodreads = useGoodreadsImport();
    const numberFormat = new Intl.NumberFormat(i18n.resolvedLanguage);

    const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<GoodreadsImportValues>({
        resolver: zodResolver(goodreadsImportSchema),
        mode: "onTouched",
    });
    const fieldStatus = useFieldStatus(goodreadsImportSchema, control);

    const submit = async (values: GoodreadsImportValues) => {
        const data = new FormData();
        data.append("favorite_genres", values.favorite_genres[0]);
        data.append("reviews", values.reviews[0]);
        try {
            await importGoodreads.mutateAsync(data);
        } catch (error) {
            applyFieldErrors(error, setError, ["favorite_genres", "reviews"]);
        }
    };

    const result = importGoodreads.data;

    return (
        <div className="w-full min-h-[calc(100dvh-60px)] flex justify-center px-4 py-6 sm:px-6 sm:py-10 bg-backgroundLight dark:bg-backgroundDark text-fontPrimaryLight dark:text-fontPrimaryDark">
            <div className="flex w-full max-w-2xl flex-col gap-6">
                <form
                    noValidate
                    onSubmit={handleSubmit(submit)}
                    className="flex flex-col gap-5 rounded-panel border border-panelBorderLight bg-panelLight p-4 shadow-soft-md dark:border-panelBorderDark dark:bg-panelDark dark:shadow-deep-md sm:p-6 lg:p-8"
                >
                    <header className="flex flex-col gap-2">
                        <h1 className="font-libre text-2xl font-bold sm:text-3xl">{t("title")}</h1>
                        <p className="text-sm leading-relaxed sm:text-base">{t("intro")}</p>
                    </header>

                    <FormField
                        type="file"
                        accept={ACCEPT}
                        label={t("fields.favoriteGenres")}
                        leftIcon={FileJson}
                        required
                        helperText={t("helper")}
                        error={errors.favorite_genres}
                        status={fieldStatus("favorite_genres")}
                        className="file:mr-3 file:border-0 file:bg-transparent file:font-semibold file:text-primaryLight dark:file:text-primaryDark"
                        {...register("favorite_genres")}
                    />
                    <FormField
                        type="file"
                        accept={ACCEPT}
                        label={t("fields.reviews")}
                        leftIcon={FileJson}
                        required
                        helperText={t("helper")}
                        error={errors.reviews}
                        status={fieldStatus("reviews")}
                        className="file:mr-3 file:border-0 file:bg-transparent file:font-semibold file:text-primaryLight dark:file:text-primaryDark"
                        {...register("reviews")}
                    />

                    <RequiredFieldsNote />

                    <Button type="submit" leftIcon={Upload} loading={isSubmitting} loadingText={t("submitting")} className="min-h-10 self-stretch justify-center sm:self-end">
                        {t("submit")}
                    </Button>
                </form>

                {result && (
                    <section
                        aria-live="polite"
                        className="flex flex-col gap-4 rounded-panel border border-panelBorderLight bg-panelLight p-4 dark:border-panelBorderDark dark:bg-panelDark sm:p-6"
                    >
                        <h2 className="flex items-center gap-2 font-libre text-lg font-semibold sm:text-xl">
                            <CircleCheck className="h-5 w-5 text-successLight dark:text-successSolidLight" aria-hidden="true" />
                            {t("result.title")}
                        </h2>
                        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {SUMMARY_ROWS.map(({ key, label }) => (
                                <div key={key} className="flex items-baseline justify-between gap-3 rounded-control bg-panelSelectedLight px-3 py-2 dark:bg-panelSelectedDark">
                                    <dt className="text-sm">{t(`result.${label}`)}</dt>
                                    <dd className="text-lg font-semibold tabular-nums">{numberFormat.format(result.summary[key])}</dd>
                                </div>
                            ))}
                        </dl>

                        {result.warnings.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold">{t("result.skippedTitle")}</h3>
                                <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto text-sm">
                                    {result.warnings.map((warning, index) => (
                                        <li key={index} className="flex items-start gap-2 rounded-control bg-warningLightTone/50 px-3 py-2 dark:bg-warningDarkTone/40">
                                            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warningLight dark:text-warningDark" aria-hidden="true" />
                                            <span className="break-words">{translate(messageOf(warning))}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
