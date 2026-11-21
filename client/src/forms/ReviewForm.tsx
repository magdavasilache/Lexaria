import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, Star, Trash2 } from "lucide-react";
import Button from "../global-components/buttons/Button";
import Modal from "../global-components/modal/Modal";
import RatingField from "./components/RatingField";
import TextAreaField from "./components/TextAreaField";
import DateRangeField from "./components/DateRangeField";
import { applyFieldErrors } from "./applyFieldErrors";
import { useFieldStatus } from "./useFieldStatus";
import { ReviewFormValues, reviewFormSchema } from "../schemas/reviewSchemas";
import { REVIEW_RULES, today } from "../schemas/reviewRules";
import { useReviewsStore } from "../api-handling/context/reviews/useReviewsStore";
import { useMyReview } from "../api-handling/rtk-hooks/reviews/useBookReviews";
import { useDeleteReview, useSaveReview } from "../api-handling/rtk-hooks/reviews/useReviewMutations";
import type { ReviewOut, ReviewPayload } from "../types/reviews/reviewTypes";

const EMPTY_VALUES: ReviewFormValues = { rating: null, content: "", dates: { from: "", to: "" } };

const toFormValues = (review: ReviewOut | null | undefined): ReviewFormValues =>
    review
        ? {
            rating: review.rating,
            content: review.content ?? "",
            dates: { from: review.start_date ?? "", to: review.end_date ?? "" },
        }
        : EMPTY_VALUES;

const toPayload = (values: ReviewFormValues): ReviewPayload => ({
    rating: values.rating,
    content: values.content || null,
    start_date: values.dates.from || null,
    end_date: values.dates.to || null,
});

export default function ReviewForm({ bookId }: { bookId: number }) {
    const { t } = useTranslation(["front/reviews", "front/common"]);
    const formId = useId();
    const open = useReviewsStore((state) => state.openReviewForm);
    const setOpen = useReviewsStore((state) => state.setOpenReviewForm);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const { data: myReview, isLoading } = useMyReview(bookId);
    const saveReview = useSaveReview(bookId);
    const deleteReview = useDeleteReview(bookId);
    const editing = Boolean(myReview);

    const { handleSubmit, control, reset, setError, formState: { errors, isSubmitting } } = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewFormSchema),
        mode: "onTouched",
        defaultValues: EMPTY_VALUES,
    });
    const fieldStatus = useFieldStatus(reviewFormSchema, control);
    const busy = isSubmitting || deleteReview.isPending;

    useEffect(() => {
        if (open) reset(toFormValues(myReview));
    }, [open, myReview, reset]);

    useEffect(() => () => setOpen(false), [bookId, setOpen]);

    const close = () => {
        setConfirmingDelete(false);
        setOpen(false);
    };

    const submit = async (values: ReviewFormValues) => {
        try {
            await saveReview.mutateAsync({ reviewId: myReview?.id ?? null, data: toPayload(values) });
            close();
        } catch (error) {
            applyFieldErrors(error, setError, ["rating", "content", "dates"]);
        }
    };

    const remove = async () => {
        if (!myReview) return;
        try {
            await deleteReview.mutateAsync(myReview.id);
            close();
        } catch {
            return;
        }
    };

    const footer = confirmingDelete ? (
        <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={busy}>{t("form.keep")}</Button>
            <Button variant="danger" size="sm" leftIcon={Trash2} onClick={remove} loading={deleteReview.isPending} loadingText={t("form.deleting")}>
                {t("form.delete")}
            </Button>
        </>
    ) : (
        <>
            {editing && (
                <Button variant="menuDanger" size="sm" leftIcon={Trash2} onClick={() => setConfirmingDelete(true)} disabled={busy} className="mr-auto min-h-10 rounded-control">
                    {t("form.delete")}
                </Button>
            )}
            <Button variant="ghost" size="sm" onClick={close} disabled={busy}>{t("front/common:actions.cancel")}</Button>
            <Button type="submit" form={formId} size="sm" disabled={isLoading} loading={isSubmitting} loadingText={t("form.submitting")}>
                {t(editing ? "form.submitEdit" : "form.submitWrite")}
            </Button>
        </>
    );

    return (
        <>
            <Button
                variant={editing ? "outline" : "primary"}
                fullWidth
                leftIcon={editing ? PencilLine : Star}
                onClick={() => setOpen(true)}
                className="mx-auto min-h-10 max-w-xs justify-center lg:mx-0"
            >
                {t(editing ? "form.openEdit" : "form.openWrite")}
            </Button>

            <Modal
                open={open}
                onClose={close}
                size="lg"
                icon={editing ? PencilLine : Star}
                title={t(editing ? "form.editTitle" : "form.writeTitle")}
                description={t("form.description")}
                dismissible={!busy}
                footer={footer}
            >
                {confirmingDelete ? (
                    <p className="text-sm">{t("form.deleteConfirm")}</p>
                ) : isLoading ? (
                    <p role="status" className="py-6 text-center text-sm text-fontMutedLight dark:text-fontMutedDark">{t("form.loading")}</p>
                ) : (
                    <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                        <Controller
                            name="rating"
                            control={control}
                            render={({ field }) => (
                                <RatingField
                                    label={t("form.rating")}
                                    max={REVIEW_RULES.ratingMax}
                                    step={REVIEW_RULES.ratingStep}
                                    helperText={t("form.ratingHelper")}
                                    error={errors.rating}
                                    status={fieldStatus("rating")}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                />
                            )}
                        />
                        <Controller
                            name="content"
                            control={control}
                            render={({ field }) => (
                                <TextAreaField
                                    label={t("form.content")}
                                    rows={6}
                                    placeholder={t("form.contentPlaceholder")}
                                    maxLength={REVIEW_RULES.contentMaxLength}
                                    helperText={t("form.contentHelper")}
                                    error={errors.content}
                                    status={fieldStatus("content")}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="dates"
                            control={control}
                            render={({ field }) => (
                                <DateRangeField
                                    label={t("form.dates")}
                                    max={today()}
                                    helperText={t("form.datesHelper")}
                                    error={errors.dates}
                                    status={fieldStatus("dates")}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </form>
                )}
            </Modal>
        </>
    );
}
