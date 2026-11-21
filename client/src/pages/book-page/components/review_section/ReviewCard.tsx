import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, MessageCircle, Pencil, Trash2 } from "lucide-react";
import Button from "../../../../global-components/buttons/Button";
import { StarsDisplay } from "../../../../forms/components/RatingField";
import type { ReviewOut } from "../../../../types/reviews/reviewTypes";
import { useReviewsStore } from "../../../../api-handling/context/reviews/useReviewsStore";
import { useDeleteReview, useSetLike } from "../../../../api-handling/rtk-hooks/reviews/useReviewMutations";
import CommentCard from "./CommentCard";
import CommentComposer from "./CommentComposer";
import ConfirmDelete from "./ConfirmDelete";
import LikeButton from "./LikeButton";
import { avatarOf, useDateFormat, wasEdited } from "./reviewFormat";

interface Props {
    review: ReviewOut;
}

export default function ReviewCard({ review }: Props) {
    const { t, i18n } = useTranslation("front/reviews");
    const formatDate = useDateFormat();
    const [showComments, setShowComments] = useState(review.comments.length > 0 && review.comments.length <= 2);
    const [composing, setComposing] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const openReviewForm = useReviewsStore((state) => state.setOpenReviewForm);
    const setLike = useSetLike(review.book_id);
    const deleteReview = useDeleteReview(review.book_id);
    const username = review.author.username;
    const commentsCount = review.comments.length;

    const readingDates =
        review.start_date && review.end_date && review.start_date === review.end_date
            ? t("card.readOn", { date: formatDate(review.end_date) })
            : review.start_date && review.end_date
            ? t("card.read", { from: formatDate(review.start_date), to: formatDate(review.end_date) })
            : review.start_date
                ? t("card.started", { date: formatDate(review.start_date) })
                : review.end_date
                    ? t("card.finished", { date: formatDate(review.end_date) })
                    : null;

    const remove = async () => {
        try {
            await deleteReview.mutateAsync(review.id);
            setConfirming(false);
        } catch {
            return;
        }
    };

    return (
        <article className="flex flex-col gap-3 rounded-panel border border-panelBorderLight bg-panelLight p-3 text-fontPrimaryLight shadow-soft-sm dark:border-panelBorderDark dark:bg-panelDark dark:text-fontPrimaryDark dark:shadow-deep-sm sm:p-4">
            <header className="flex items-start gap-3">
                <img src={avatarOf(review.author)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold break-words">{username}</span>
                        <time dateTime={review.created_at} className="text-xs text-fontMutedLight dark:text-fontMutedDark">{formatDate(review.created_at)}</time>
                        {wasEdited(review.created_at, review.updated_at) && <span className="text-xs text-fontMutedLight dark:text-fontMutedDark">· {t("card.edited")}</span>}
                    </p>
                    {review.rating !== null && (
                        <p className="flex items-center gap-2">
                            <StarsDisplay value={review.rating} />
                            <span className="sr-only">{t("card.rated", { value: new Intl.NumberFormat(i18n.resolvedLanguage).format(review.rating) })}</span>
                        </p>
                    )}
                    {readingDates && <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{readingDates}</p>}
                </div>
            </header>

            {review.content && <p className="whitespace-pre-line break-words leading-relaxed">{review.content}</p>}

            <div className="-ml-2 flex flex-wrap items-center gap-1">
                <LikeButton
                    liked={review.liked_by_me}
                    count={review.likes_count}
                    label={t(review.liked_by_me ? "card.unlike" : "card.like", { username })}
                    onToggle={() => setLike.mutate({ target: "reviews", id: review.id, liked: !review.liked_by_me })}
                />
                <Button variant="ghost" size="sm" leftIcon={MessageCircle} aria-expanded={composing} onClick={() => setComposing((value) => !value)} className="min-h-10">
                    {t("card.comment")}
                </Button>
                {commentsCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={ChevronDown}
                        iconClassName={`transition-transform duration-200 ${showComments ? "rotate-180" : ""}`}
                        aria-expanded={showComments}
                        onClick={() => setShowComments((value) => !value)}
                        className="min-h-10"
                    >
                        {showComments ? t("card.hideComments") : t("card.showComments", { count: commentsCount })}
                    </Button>
                )}
                <span className="ml-auto flex gap-1">
                    {review.can_edit && (
                        <Button variant="ghost" size="sm" icon={Pencil} aria-label={t("card.edit")} onClick={() => openReviewForm(true)} className="min-h-10 min-w-10 justify-center" />
                    )}
                    {review.can_delete && (
                        <Button variant="menuDanger" size="sm" icon={Trash2} aria-label={t("card.delete")} onClick={() => setConfirming(true)} className="min-h-10 min-w-10 justify-center rounded-control" />
                    )}
                </span>
            </div>

            {composing && (
                <CommentComposer
                    bookId={review.book_id}
                    reviewId={review.id}
                    label={t("comments.label", { username })}
                    onDone={() => {
                        setComposing(false);
                        setShowComments(true);
                    }}
                />
            )}

            {showComments && commentsCount > 0 && (
                <ul className="flex flex-col gap-3 border-t border-dividerLight pt-3 dark:border-dividerDark">
                    {review.comments.map((comment) => (
                        <CommentCard key={comment.id} bookId={review.book_id} comment={comment} />
                    ))}
                </ul>
            )}

            <ConfirmDelete
                open={confirming}
                title={t("card.deleteTitle")}
                message={t("card.deleteConfirm", { username })}
                pending={deleteReview.isPending}
                onCancel={() => setConfirming(false)}
                onConfirm={remove}
            />
        </article>
    );
}
