import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { authorFormSchema, AuthorFormValues } from "../schemas/authorSchema";
import { useCreateAuthor } from "../api-handling/rtk-hooks/author/useAuthorCreate";
import AutocompleteField from "./components/AutocompleteField";
import Button from "../global-components/buttons/Button";
import { useGetFormCountries } from "../api-handling/rtk-hooks/country/useGetFormCountries";

export default function AuthorForm() {
    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
        reset,
    } = useForm<AuthorFormValues>({
        resolver: zodResolver(authorFormSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            birthdate: "",
            country_id: undefined,
            about: "",
            image: null,
        },
    });
    const countires = useGetFormCountries().data;

    const createAuthor = useCreateAuthor(reset);

    const onSubmit = (values: AuthorFormValues) => {
        const data = new FormData();
        data.append("first_name", values.first_name);
        if (values.last_name) data.append("last_name", values.last_name);
        if (values.birthdate) data.append("birthdate", values.birthdate);
        if (values.country_id !== undefined) data.append("country_id", String(values.country_id));
        if (values.about) data.append("about", values.about);
        if (values.image) data.append("image", values.image);
        createAuthor.mutate(data);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 h-full text-fontPrimaryLight dark:text-fontPrimaryDark"
        >
            <div className="flex flex-col gap-1">
                <input
                    {...register("first_name")}
                    placeholder="First name"
                    className="w-full px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark outline-none focus:ring-1 focus:ring-primaryLight dark:focus:ring-primaryDark transition-shadow"
                />
                {errors.first_name && (
                    <p className="text-errorLight dark:text-errorDark text-sm">{errors.first_name.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    {...register("last_name")}
                    placeholder="Last name"
                    className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark outline-none focus:ring-1 focus:ring-primaryLight dark:focus:ring-primaryDark transition-shadow"
                />
                {errors.last_name && (
                    <p className="text-errorLight dark:text-errorDark text-sm">{errors.last_name.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    type="date"
                    {...register("birthdate")}
                    className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark outline-none focus:ring-1 focus:ring-primaryLight dark:focus:ring-primaryDark transition-shadow"
                />
                {errors.birthdate && (
                    <p className="text-errorLight dark:text-errorDark text-sm">{errors.birthdate.message}</p>
                )}
            </div>

            <Controller
                name="country_id"
                control={control}
                render={({ field }) => (
                    <AutocompleteField
                        label="Country"
                        options={countires || []}
                        value={field.value}
                        onChange={(id) => field.onChange(id ?? undefined)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        placeholder="Select country"
                    />
                )}
            />

            <div className="flex flex-col gap-1">
                <textarea
                    {...register("about")}
                    placeholder="About"
                    rows={4}
                    className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark outline-none resize-none focus:ring-1 focus:ring-primaryLight dark:focus:ring-primaryDark transition-shadow"
                />
                {errors.about && (
                    <p className="text-errorLight dark:text-errorDark text-sm">{errors.about.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setValue("image", e.target.files?.[0] || null)}
                    className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark"
                />
                {errors.image && (
                    <p className="text-errorLight dark:text-errorDark text-sm">{errors.image.message}</p>
                )}
            </div>

            <Button type="submit" loading={createAuthor.isPending} loadingText="Saving..." className="mt-auto">
                Save
            </Button>
        </form>
    );
}