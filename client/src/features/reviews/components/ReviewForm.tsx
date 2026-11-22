import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOff, PencilLine, Star, Trash2 } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import RatingField from "../../../shared/forms/fields/RatingField";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import CheckboxField from "../../../shared/forms/fields/CheckboxField";
import DateRangeField from "../../../shared/forms/fields/DateRangeField";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { ReviewFormValues, reviewFormSchema } from "../schemas/reviewSchemas";
import { REVIEW_RULES, today } from "../schemas/reviewRules";
import { useReviewsStore } from "../stores/useReviewsStore";
import { useMyReview } from "../hooks/useBookReviews";
import { useDeleteReview, useSaveReview } from "../hooks/useReviewMutations";
import type { ReviewOut, ReviewPayload } from "../reviewTypes";

const EMPTY_VALUES: ReviewFormValues = { rating: null, content: "", has_spoilers: false, dates: { from: "", to: "" } };
const SPOILER_MARK = "||";

const toFormValues = (review: ReviewOut | null | undefined): ReviewFormValues =>
    review
        ? {
            rating: review.rating,
            content: review.content ?? "",
            has_spoilers: review.has_spoilers,
            dates: { from: review.start_date ?? "", to: review.end_date ?? "" },
        }
        : EMPTY_VALUES;

const toPayload = (values: ReviewFormValues): ReviewPayload => ({
    rating: values.rating,
    content: values.content || null,
    has_spoilers: Boolean(values.content) && values.has_spoilers,
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

    const contentRef = useRef<HTMLTextAreaElement | null>(null);
    const { handleSubmit, control, reset, setError, setValue, getValues, formState: { errors, isSubmitting } } = useForm<ReviewFormValues>({
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

    const hideSelection = () => {
        const textarea = contentRef.current;
        if (!textarea) return;
        const content = getValues("content");
        const { selectionStart: start, selectionEnd: end } = textarea;
        const next = `${content.slice(0, start)}${SPOILER_MARK}${content.slice(start, end)}${SPOILER_MARK}${content.slice(end)}`;
        setValue("content", next, { shouldDirty: true, shouldValidate: true });
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start + SPOILER_MARK.length, end + SPOILER_MARK.length);
        });
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
                                    ref={(element) => {
                                        field.ref(element);
                                        contentRef.current = element;
                                    }}
                                />
                            )}
                        />
                        <div className="-mt-2 flex flex-col gap-1">
                            <Button variant="ghost" size="sm" leftIcon={EyeOff} onClick={hideSelection} className="min-h-10 self-start">
                                {t("form.hideSelection")}
                            </Button>
                            <Controller
                                name="has_spoilers"
                                control={control}
                                render={({ field }) => (
                                    <CheckboxField
                                        label={t("form.hasSpoilers")}
                                        helperText={t("form.hasSpoilersHelper")}
                                        checked={field.value}
                                        onChange={(event) => field.onChange(event.target.checked)}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                    />
                                )}
                            />
                        </div>
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
