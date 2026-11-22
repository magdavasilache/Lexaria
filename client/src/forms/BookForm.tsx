import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BookPlus, ImagePlus, PencilLine, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Controller, FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { decodeMessage, translate } from "../i18n/message";
import Button from "../global-components/buttons/Button";
import Modal from "../global-components/modal/Modal";
import AutocompleteField from "./components/AutocompleteField";
import CheckboxField from "./components/CheckboxField";
import DateField from "./components/DateField";
import FormField from "./components/FormField";
import NumberField from "./components/NumberField";
import RequiredFieldsNote from "./components/RequiredFieldsNote";
import SelectField from "./components/SelectField";
import TextAreaField from "./components/TextAreaField";
import { applyFieldErrors } from "./applyFieldErrors";
import { useFieldStatus } from "./useFieldStatus";
import { BookFormValues, bookFormSchema } from "../schemas/bookSchemas";
import { BOOK_RULES, DESCRIPTION_LANGUAGES, latestPublishedDate, splitList } from "../schemas/bookRules";
import { useBook } from "../api-handling/rtk-hooks/books/useBook";
import { useCreateBook, useUpdateBook } from "../api-handling/rtk-hooks/books/useBookMutations";
import { authorOptions, awardOptions, useAuthors, useAwards, useCountries, useGenres, useLanguages } from "../api-handling/rtk-hooks/catalog/useCatalog";
import type { BookDetail } from "../types/book-types/bookTypes";
import { serverAssetUrl } from "../utils/assets";
import { languageName } from "../utils/descriptions";

const EMPTY_VALUES: BookFormValues = {
    title: "",
    author_id: null,
    language_id: null,
    country_id: null,
    pages: null,
    published_at: "",
    descriptions: {},
    is_series: false,
    settings: "",
    characters: "",
    genre_ids: [],
    award_ids: [],
    kept_images: [],
    images: [],
};

const SERVER_FIELDS = [
    "title", "author_id", "language_id", "country_id", "pages", "published_at", "descriptions",
    "is_series", "settings", "characters", "genre_ids", "award_ids", "kept_images", "images",
] as const;

const toFormValues = (book: BookDetail): BookFormValues => ({
    title: book.title,
    author_id: book.author_id,
    language_id: book.language_id,
    country_id: book.country_id,
    pages: book.pages,
    published_at: book.published_at ?? "",
    descriptions: Object.fromEntries(book.descriptions.map((item) => [item.language, item.synopsis])),
    is_series: book.is_series,
    settings: book.settings.join(", "),
    characters: book.characters.join(", "),
    genre_ids: book.genres.map((genre) => genre.id),
    award_ids: book.awards.map((award) => award.id),
    kept_images: book.images,
    images: [],
});

const toFormData = (values: BookFormValues, editing: boolean) => {
    const data = new FormData();
    data.append("title", values.title);
    for (const key of ["author_id", "language_id", "country_id", "pages"] as const) {
        const value = values[key];
        if (value !== null) data.append(key, String(value));
    }
    if (values.published_at) data.append("published_at", values.published_at);
    Object.entries(values.descriptions)
        .filter(([, synopsis]) => synopsis)
        .forEach(([language, synopsis]) => data.append("descriptions", JSON.stringify({ language, synopsis })));
    data.append("is_series", String(values.is_series));
    splitList(values.settings).forEach((item) => data.append("settings", item));
    splitList(values.characters).forEach((item) => data.append("characters", item));
    values.genre_ids.forEach((id) => data.append("genre_ids", String(id)));
    values.award_ids.forEach((id) => data.append("award_ids", String(id)));
    if (editing) values.kept_images.forEach((name) => data.append("kept_images", name));
    values.images.forEach((file) => data.append("images", file));
    return data;
};

interface Props {
    open: boolean;
    onClose: () => void;
    bookId?: number | null;
}

export default function BookForm({ open, onClose, bookId = null }: Props) {
    const { t, i18n } = useTranslation(["front/books", "front/common"]);
    const formId = useId();
    const editing = bookId !== null;
    const { data: book, isLoading: bookLoading, isError: bookError } = useBook(open ? bookId : null);
    const authors = authorOptions(useAuthors(open).data);
    const languages = useLanguages(open).data ?? [];
    const countries = useCountries(open).data ?? [];
    const genres = useGenres(open).data ?? [];
    const awards = awardOptions(useAwards(open).data);
    const createBook = useCreateBook();
    const updateBook = useUpdateBook();

    const { register, handleSubmit, control, reset, setError, setValue, watch, formState: { errors, isSubmitting, isDirty } } = useForm<BookFormValues>({
        resolver: zodResolver(bookFormSchema),
        mode: "onTouched",
        defaultValues: EMPTY_VALUES,
    });
    const fieldStatus = useFieldStatus(bookFormSchema, control);
    const [descriptionLanguage, setDescriptionLanguage] = useState("en");

    useEffect(() => {
        if (open) reset(book && editing ? toFormValues(book) : EMPTY_VALUES);
    }, [open, book, editing, reset]);

    useEffect(() => {
        if (open) setDescriptionLanguage(i18n.resolvedLanguage ?? "en");
    }, [open, i18n.resolvedLanguage]);

    const close = () => {
        reset(EMPTY_VALUES);
        onClose();
    };

    const showFirstInvalidDescription = (formErrors: FieldErrors<BookFormValues>) => {
        const invalid = Object.keys(formErrors.descriptions ?? {}).find((key) => descriptionOptions.some((option) => option.value === key));
        if (invalid) setDescriptionLanguage(invalid);
    };

    const submit = async (values: BookFormValues) => {
        try {
            const data = toFormData(values, editing);
            if (editing) await updateBook.mutateAsync({ bookId, data });
            else await createBook.mutateAsync(data);
            close();
        } catch (error) {
            applyFieldErrors(error, setError, SERVER_FIELDS);
        }
    };

    const waiting = editing && (bookLoading || !book);
    const descriptionsError = (errors.descriptions as { message?: string } | undefined)?.message;
    const uiLanguage = i18n.resolvedLanguage ?? "en";
    const descriptions = watch("descriptions");
    const descriptionOptions = Array.from(
        new Set<string>([...DESCRIPTION_LANGUAGES, ...(book && editing ? book.descriptions.map((item) => item.language) : [])])
    )
        .map((code) => ({ value: code, label: languageName(code, uiLanguage) }))
        .sort((a, b) => a.label.localeCompare(b.label, uiLanguage));
    const writtenIn = descriptionOptions.filter((option) => descriptions?.[option.value]?.trim()).map((option) => option.label);

    return (
        <Modal
            open={open}
            onClose={close}
            size="xl"
            icon={editing ? PencilLine : BookPlus}
            title={t(editing ? "form.editTitle" : "form.addTitle")}
            description={t(editing ? "form.editDescription" : "form.addDescription")}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={close} disabled={isSubmitting}>{t("front/common:actions.cancel")}</Button>
                    <Button type="submit" form={formId} size="sm" disabled={waiting} loading={isSubmitting} loadingText={t("form.submitting")}>
                        {t(editing ? "form.submitEdit" : "form.submitAdd")}
                    </Button>
                </>
            }
        >
            {editing && bookError ? (
                <p role="alert" className="py-6 text-center text-sm text-errorLight dark:text-errorDark">{t("form.loadError")}</p>
            ) : waiting ? (
                <p role="status" className="py-6 text-center text-sm text-fontMutedLight dark:text-fontMutedDark">{t("form.loading")}</p>
            ) : (
                <form id={formId} noValidate onSubmit={handleSubmit(submit, showFirstInvalidDescription)} className="flex flex-col gap-4">
                    <FormField
                        label={t("form.fields.title")}
                        required
                        maxLength={BOOK_RULES.titleMaxLength}
                        helperText={t("form.helpers.title")}
                        error={errors.title}
                        status={fieldStatus("title")}
                        {...register("title")}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Controller
                            name="author_id"
                            control={control}
                            render={({ field }) => (
                                <AutocompleteField
                                    label={t("form.fields.author")}
                                    options={authors}
                                    placeholder={t("form.placeholders.author")}
                                    error={errors.author_id}
                                    status={fieldStatus("author_id")}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                        <Controller
                            name="language_id"
                            control={control}
                            render={({ field }) => (
                                <AutocompleteField
                                    label={t("form.fields.language")}
                                    options={languages}
                                    placeholder={t("form.placeholders.language")}
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
                            name="country_id"
                            control={control}
                            render={({ field }) => (
                                <AutocompleteField
                                    label={t("form.fields.country")}
                                    options={countries}
                                    placeholder={t("form.placeholders.country")}
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
                        <Controller
                            name="pages"
                            control={control}
                            render={({ field }) => (
                                <NumberField
                                    label={t("form.fields.pages")}
                                    min={1}
                                    max={BOOK_RULES.pagesMax}
                                    helperText={t("form.helpers.pages")}
                                    error={errors.pages}
                                    status={fieldStatus("pages")}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                        <DateField
                            label={t("form.fields.publishedAt")}
                            max={latestPublishedDate()}
                            helperText={t("form.helpers.publishedAt")}
                            error={errors.published_at}
                            status={fieldStatus("published_at")}
                            {...register("published_at")}
                        />
                        <div className="flex items-end">
                            <CheckboxField label={t("form.fields.isSeries")} {...register("is_series")} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Controller
                            name="genre_ids"
                            control={control}
                            render={({ field }) => (
                                <AutocompleteField
                                    multiple
                                    label={t("form.fields.genres")}
                                    options={genres}
                                    placeholder={t("form.placeholders.genres")}
                                    helperText={t("form.helpers.genres")}
                                    error={errors.genre_ids}
                                    status={fieldStatus("genre_ids")}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                        <Controller
                            name="award_ids"
                            control={control}
                            render={({ field }) => (
                                <AutocompleteField
                                    multiple
                                    label={t("form.fields.awards")}
                                    options={awards}
                                    placeholder={t("form.placeholders.awards")}
                                    helperText={t("form.helpers.awards")}
                                    error={errors.award_ids}
                                    status={fieldStatus("award_ids")}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </div>

                    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
                        <legend className="mb-1 text-sm font-libre text-fontPrimaryLight dark:text-fontPrimaryDark">{t("form.fields.synopsis")}</legend>
                        <div className="w-full sm:max-w-xs">
                            <SelectField
                                label={t("form.fields.synopsisLanguage")}
                                options={descriptionOptions}
                                value={descriptionLanguage}
                                onChange={setDescriptionLanguage}
                                helperText={writtenIn.length > 0
                                    ? t("form.helpers.writtenIn", { languages: new Intl.ListFormat(uiLanguage, { type: "conjunction" }).format(writtenIn) })
                                    : t("form.helpers.notWrittenYet")}
                            />
                        </div>
                        <TextAreaField
                            key={descriptionLanguage}
                            lang={descriptionLanguage}
                            label={t("form.fields.synopsisIn", { language: languageName(descriptionLanguage, uiLanguage) })}
                            rows={5}
                            maxLength={BOOK_RULES.synopsisMaxLength}
                            helperText={t("form.helpers.descriptions")}
                            error={errors.descriptions?.[descriptionLanguage]}
                            status={fieldStatus(`descriptions.${descriptionLanguage}`)}
                            {...register(`descriptions.${descriptionLanguage}`)}
                        />
                        {descriptionsError && (
                            <p role="alert" className="text-xs font-medium text-errorLight dark:text-errorDark">{translate(decodeMessage(descriptionsError))}</p>
                        )}
                    </fieldset>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                            label={t("form.fields.settings")}
                            placeholder={t("form.placeholders.settings")}
                            helperText={t("form.helpers.list")}
                            error={errors.settings}
                            status={fieldStatus("settings")}
                            {...register("settings")}
                        />
                        <FormField
                            label={t("form.fields.characters")}
                            placeholder={t("form.placeholders.characters")}
                            helperText={t("form.helpers.list")}
                            error={errors.characters}
                            status={fieldStatus("characters")}
                            {...register("characters")}
                        />
                    </div>

                    <ImagesField
                        keptImages={watch("kept_images")}
                        newImages={watch("images")}
                        existingUrls={book && editing ? Object.fromEntries(book.images.map((name, index) => [name, book.image_urls[index]])) : {}}
                        error={errors.images?.message ?? errors.kept_images?.message}
                        onKeptChange={(names) => setValue("kept_images", names, { shouldValidate: true })}
                        onNewChange={(files) => setValue("images", files, { shouldValidate: true, shouldTouch: true })}
                    />

                    <RequiredFieldsNote />
                </form>
            )}
        </Modal>
    );
}

interface ImagesFieldProps {
    keptImages: string[];
    newImages: File[];
    existingUrls: Record<string, string>;
    error: string | undefined;
    onKeptChange: (names: string[]) => void;
    onNewChange: (files: File[]) => void;
}

function ImagesField({ keptImages, newImages, existingUrls, error, onKeptChange, onNewChange }: ImagesFieldProps) {
    const { t } = useTranslation("front/books");
    const inputRef = useRef<HTMLInputElement>(null);
    const labelId = useId();
    const errorId = useId();
    const helperId = useId();
    const total = keptImages.length + newImages.length;
    const previews = useObjectUrls(newImages);

    const tiles = [
        ...keptImages.map((name) => ({ key: name, src: serverAssetUrl(existingUrls[name]) ?? "", remove: () => onKeptChange(keptImages.filter((item) => item !== name)) })),
        ...newImages.map((_, index) => ({ key: previews[index], src: previews[index], remove: () => onNewChange(newImages.filter((_, i) => i !== index)) })),
    ];

    return (
        <div role="group" aria-labelledby={labelId} aria-describedby={`${helperId}${error ? ` ${errorId}` : ""}`} className="flex flex-col gap-2">
            <span id={labelId} className="text-sm font-libre text-fontPrimaryLight dark:text-fontPrimaryDark">{t("form.fields.images")}</span>
            <ul className="grid grid-cols-3 gap-2 sm:gap-3">
                {tiles.map((tile, index) => (
                    <li key={tile.key} className="relative aspect-[2/3] overflow-hidden rounded-control border border-panelBorderLight dark:border-panelBorderDark bg-panelLight dark:bg-panelDark">
                        <img src={tile.src} alt={t("form.images.alt", { index: index + 1 })} className="h-full w-full object-cover" />
                        {index === 0 && (
                            <span className="absolute bottom-1 left-1 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">{t("form.images.cover")}</span>
                        )}
                        <Button
                            variant="inverse"
                            rounded
                            icon={X}
                            aria-label={t("form.images.remove", { index: index + 1 })}
                            onClick={tile.remove}
                            className="absolute right-1 top-1 min-h-10 min-w-10 justify-center bg-black/55 text-white"
                        />
                    </li>
                ))}
            </ul>
            <input
                ref={inputRef}
                type="file"
                multiple
                hidden
                accept={BOOK_RULES.imageTypes.join(",")}
                onChange={(event) => {
                    onNewChange([...newImages, ...Array.from(event.target.files ?? [])]);
                    event.target.value = "";
                }}
            />
            <Button
                variant="outline"
                size="sm"
                leftIcon={ImagePlus}
                disabled={total >= BOOK_RULES.imagesMax}
                onClick={() => inputRef.current?.click()}
                className="min-h-10 self-start"
            >
                {t("form.images.add")}
            </Button>
            <p id={helperId} className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("form.helpers.images")}</p>
            {error && (
                <p id={errorId} role="alert" className="text-xs font-medium text-errorLight dark:text-errorDark">{translate(decodeMessage(error))}</p>
            )}
        </div>
    );
}

function useObjectUrls(files: File[]) {
    const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
    useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);
    return urls;
}
