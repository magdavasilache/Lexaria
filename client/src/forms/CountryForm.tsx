import { useForm, Controller } from "react-hook-form";
import AutocompleteField from "./components/AutocompleteField";
import Button from "../global-components/buttons/Button";
import { useCreateCountry } from "../api-handling/rtk-hooks/country/useCreateCountry";
import { useGetLanguages } from "../api-handling/rtk-hooks/language/useGetLanguages";

export default function CountryForm() {
    const { register, handleSubmit, reset, control } = useForm({
        defaultValues: {
            name: "",
            language_id: 0,
        },
    });

    const createCountry = useCreateCountry();
    const { data: languages = [] } = useGetLanguages();

    const onSubmit = (values: { name: string; language_id: number }) => {
        console.log(values)
        createCountry.mutateAsync(values);
        reset();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 h-full">
            <input
                {...register("name", { required: true })}
                placeholder="Country name"
                className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border text-onInputLight dark:text-onInputDark border-dividerLight dark:border-dividerDark outline-none"
            />

            <Controller
                control={control}
                name="language_id"
                render={({ field }) => (
                    <AutocompleteField
                        label="Language"
                        options={languages}
                        value={field.value || null}
                        onChange={(id) => field.onChange(id ?? 0)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        placeholder="Select language"
                    />
                )}
            />

            <Button type="submit" className="mt-auto">
                Save
            </Button>
        </form>
    );
}