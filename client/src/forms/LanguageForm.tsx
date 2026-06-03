import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCreateLanguage } from "../api-handling/rtk-hooks/language/useCreateLanguage";
import { useEditLanguage } from "../api-handling/rtk-hooks/language/useEditLanguage";

interface Language {
    id?: number;
    name: string;
}

interface Props {
    initialData?: Language | null;
    onSuccess?: () => void;
}

export default function LanguageForm({ initialData, onSuccess }: Props) {
    const isEditing = !!initialData?.id;

    const { register, handleSubmit, reset } = useForm({
        defaultValues: { name: initialData?.name ?? "" },
    });

    useEffect(() => {
        reset({ name: initialData?.name ?? "" });
    }, [initialData, reset]);

    const createLanguage = useCreateLanguage();
    const editLanguage = useEditLanguage();

    const onSubmit = async (values: { name: string }) => {
        if (isEditing) {
            const id = initialData?.id;
            if(!id) return
            const language = { name: values.name };
            await editLanguage.mutateAsync({id, language});
        } else {
            await createLanguage.mutateAsync({ name: values.name });
        }
        reset();
        onSuccess?.();
    };

    const isPending = createLanguage.isPending || editLanguage.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 h-full">
            <input
                {...register("name", { required: true })}
                placeholder="Language name"
                className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border dark:text-fontPrimaryLight border-dividerLight dark:border-dividerDark outline-none"
            />
            <button
                type="submit"
                disabled={isPending}
                className="mt-auto px-4 py-2 rounded-xs bg-primaryLight dark:bg-primaryDark text-fontSecondaryLight dark:text-fontPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:scale-105 transition disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
                {isPending ? "Saving..." : isEditing ? "Update" : "Save"}
            </button>
        </form>
    );
}