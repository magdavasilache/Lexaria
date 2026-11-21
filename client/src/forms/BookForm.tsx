import { Controller, useForm } from "react-hook-form"
import { bookFormSchema, BookFormValues } from "../schemas/bookSchemas"
import { zodResolver } from "@hookform/resolvers/zod"
import AutocompleteField from "./components/AutocompleteField";
import Button from "../global-components/buttons/Button";
import { useGetFormCountries } from "../api-handling/rtk-hooks/country/useGetFormCountries";
import { useGetLanguages } from "../api-handling/rtk-hooks/language/useGetLanguages";
import { useGetFormAuthors } from "../api-handling/rtk-hooks/author/useGetFormAuthors";
import { useCreateBook } from "../api-handling/rtk-hooks/books/useCreateBook";

const inputClass =
    "w-full px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark outline-none focus:ring-1 focus:ring-primaryLight dark:focus:ring-primaryDark transition-shadow text-onInputLight dark:text-onInputDark";

const errorClass = "text-errorLight dark:text-errorDark text-sm";

export default function BookForm() {
    const {
        register,
        handleSubmit,
        setValue,
        control,
        watch,
        formState: { errors },
        reset,
    } = useForm<BookFormValues>({
        resolver: zodResolver(bookFormSchema),
        defaultValues: {
            title: "",
            author_id: 0,
            language_id: 0,
            country_id: 0,
            genre_ids: [],
            pages: 0,
            published_at: "",
            synopsis: "",
            settings: "",
            characters: "",
            image_front: null,
            image_back: null,
            image_page: null,
        },
    });

    const title = watch("title");

    const countries = useGetFormCountries().data;
    const authors = useGetFormAuthors().data;
    const languages = useGetLanguages().data;
    // const genres = useGetFormGenres().data;

    const createBook = useCreateBook(reset);

    const onSubmit = (values: BookFormValues) => {
        const slug = values.title.trim() || "book";
        const data = new FormData();

        data.append("title", values.title);
        if (values.author_id !== undefined) data.append("author_id", String(values.author_id));
        if (values.language_id !== undefined) data.append("language_id", String(values.language_id));
        if (values.country_id !== undefined) data.append("country_id", String(values.country_id));
        if (values.pages !== undefined) data.append("pages", String(values.pages));
        if (values.published_at) data.append("published_at", values.published_at);
        if (values.synopsis) data.append("synopsis", values.synopsis);
        if (values.settings) {
            values.settings.split(",").map((s) => s.trim()).filter(Boolean).forEach((s) =>
                data.append("settings[]", s)
            );
        }
        if (values.characters) {
            values.characters.split(",").map((c) => c.trim()).filter(Boolean).forEach((c) =>
                data.append("characters[]", c)
            );
        }
        if (values.genre_ids?.length) {
            values.genre_ids.forEach((id: number) => data.append("genre_ids[]", String(id)));
        }

        if (values.image_front) {
            const ext = values.image_front.name.split(".").pop();
            const renamed = new File([values.image_front], `${slug}-coperta.${ext}`, {
                type: values.image_front.type,
            });
            data.append("images", renamed);
        }
        if (values.image_back) {
            const ext = values.image_back.name.split(".").pop();
            const renamed = new File([values.image_back], `${slug}-spate.${ext}`, {
                type: values.image_back.type,
            });
            data.append("images", renamed);
        }
        if (values.image_page) {
            const ext = values.image_page.name.split(".").pop();
            const renamed = new File([values.image_page], `${slug}-pagina.${ext}`, {
                type: values.image_page.type,
            });
            data.append("images", renamed);
        }

        createBook.mutate(data);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 h-full text-fontPrimaryLight dark:text-fontPrimaryDark"
        >
            <div className="flex flex-col gap-1">
                <input
                    {...register("title")}
                    placeholder="Title"
                    className={inputClass}
                />
                {errors.title && <p className={errorClass}>{errors.title.message}</p>}
            </div>

            <Controller
                name="author_id"
                control={control}
                render={({ field }) => (
                    <AutocompleteField
                        label="Author"
                        options={authors || []}
                        value={field.value || null}
                        onChange={(id) => field.onChange(id ?? undefined)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        placeholder="Select author"
                    />
                )}
            />

            <Controller
                name="language_id"
                control={control}
                render={({ field }) => (
                    <AutocompleteField
                        label="Language"
                        options={languages || []}
                        value={field.value || null}
                        onChange={(id) => field.onChange(id ?? undefined)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        placeholder="Select language"
                    />
                )}
            />

            <Controller
                name="country_id"
                control={control}
                render={({ field }) => (
                    <AutocompleteField
                        label="Country"
                        options={countries || []}
                        value={field.value || null}
                        onChange={(id) => field.onChange(id ?? undefined)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        placeholder="Select country"
                    />
                )}
            />
            
            <div className="flex flex-col gap-1">
                <input
                    type="number"
                    min={0}
                    {...register("pages")}
                    placeholder="Pages"
                    className={inputClass}
                />
                {errors.pages && <p className={errorClass}>{errors.pages.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    type="date"
                    {...register("published_at")}
                    className={inputClass}
                />
                {errors.published_at && <p className={errorClass}>{errors.published_at.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <textarea
                    {...register("synopsis")}
                    placeholder="Synopsis"
                    rows={4}
                    className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark outline-none resize-none focus:ring-1 focus:ring-primaryLight dark:focus:ring-primaryDark transition-shadow text-onInputLight dark:text-onInputDark"
                />
                {errors.synopsis && <p className={errorClass}>{errors.synopsis.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    {...register("settings")}
                    placeholder="Settings (comma-separated)"
                    className={inputClass}
                />
                {errors.settings && <p className={errorClass}>{errors.settings.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    {...register("characters")}
                    placeholder="Characters (comma-separated)"
                    className={inputClass}
                />
                {errors.characters && <p className={errorClass}>{errors.characters.message}</p>}
            </div>

            <div className="flex flex-col gap-3">
                {(
                    [
                        { field: "image_front", label: "Front cover", suffix: "coperta" },
                        { field: "image_back", label: "Back cover", suffix: "spate" },
                        { field: "image_page", label: "Interior page", suffix: "pagina" },
                    ] as const
                ).map(({ field, label, suffix }) => (
                    <div key={field} className="flex flex-col gap-1">
                        <label className="text-sm text-fontPrimaryLight dark:text-fontPrimaryDark">
                            {label}
                            {title && (
                                <span className="ml-1 text-xs opacity-60">
                                    → {title.trim() || "book"} - {suffix}
                                </span>
                            )}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setValue(field, e.target.files?.[0] || null)}
                            className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark text-onInputLight dark:text-onInputDark"
                        />
                        {errors[field] && (
                            <p className={errorClass}>{errors[field]?.message as string}</p>
                        )}
                    </div>
                ))}
            </div>

            <Button type="submit" loading={createBook.isPending} loadingText="Saving..." className="mt-auto">
                Save
            </Button>
        </form>
    );
}

