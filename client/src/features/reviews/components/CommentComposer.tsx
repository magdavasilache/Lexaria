import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import Button from "../../../shared/components/Button";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { CommentFormValues, commentFormSchema } from "../schemas/reviewSchemas";
import { REVIEW_RULES } from "../schemas/reviewRules";
import { useSaveComment } from "../hooks/useReviewMutations";

interface Props {
    bookId: number;
    reviewId: number;
    label: string;
    commentId?: number | null;
    initialContent?: string;
    onDone: () => void;
}

export default function CommentComposer({ bookId, reviewId, label, commentId = null, initialContent = "", onDone }: Props) {
    const { t } = useTranslation(["front/reviews", "front/common"]);
    const saveComment = useSaveComment(bookId);
    const { register, handleSubmit, control, setError, setFocus, formState: { errors, isSubmitting } } = useForm<CommentFormValues>({
        resolver: zodResolver(commentFormSchema),
        mode: "onTouched",
        defaultValues: { content: initialContent },
    });
    const fieldStatus = useFieldStatus(commentFormSchema, control);

    useEffect(() => setFocus("content"), [setFocus]);

    const submit = async ({ content }: CommentFormValues) => {
        try {
            await saveComment.mutateAsync({ reviewId, commentId, content });
            onDone();
        } catch (error) {
            applyFieldErrors(error, setError, ["content"]);
        }
    };

    return (
        <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-2">
            <TextAreaField
                label={label}
                hideLabel
                rows={3}
                placeholder={t("comments.placeholder")}
                maxLength={REVIEW_RULES.commentMaxLength}
                helperText={t("comments.helper")}
                error={errors.content}
                status={fieldStatus("content")}
                {...register("content")}
            />
            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onDone} disabled={isSubmitting} className="min-h-10">
                    {t("front/common:actions.cancel")}
                </Button>
                <Button type="submit" size="sm" leftIcon={Send} loading={isSubmitting} loadingText={t("comments.submitting")} className="min-h-10">
                    {t(commentId === null ? "comments.submit" : "comments.save")}
                </Button>
            </div>
        </form>
    );
}
