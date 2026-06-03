import { useForm, Controller } from "react-hook-form";
import SearchableSelect from "./components/SearchableSelect";
import { useCreateCountry } from "../api-handling/rtk-hooks/country/useCreateCountry";
import { useGetLanguages } from "../api-handling/rtk-hooks/language/useGetLanguages";
import { Language } from "../types/language/languageTypes";

export default function CountryForm() {
    const { register, handleSubmit, reset, control, setValue } = useForm({
        defaultValues: {
            name: "",
            language_id: 0,
        },
    });

    const createCountry = useCreateCountry();
    const { data: languages = [] } = useGetLanguages();

    const onSubmit = (values: any) => {
        console.log(values)
        createCountry.mutateAsync(values);
        reset();
    };

    const handleChooseLanguage = (language: Language) => {
        if (language) {
            setValue('language_id', language.id)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 h-full">
            <input
                {...register("name", { required: true })}
                placeholder="Country name"
                className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border dark:text-fontPrimaryLight border-dividerLight dark:border-dividerDark outline-none"
            />

            <Controller
                control={control}
                name="language_id"
                render={({ field }) => (
                    <SearchableSelect
                        options={languages}
                        value={field.value}
                        onChange={handleChooseLanguage}
                        isForFiltering={false}
                        placeholder="Select language"
                    />
                )}
            />

            <button
                type="submit"
                className="mt-auto px-4 py-2 rounded-xs bg-primaryLight dark:bg-primaryDark text-fontSecondaryLight dark:text-fontPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:scale-105 transition"
            >
                Save
            </button>
        </form>
    );
}