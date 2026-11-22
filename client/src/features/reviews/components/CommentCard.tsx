import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
import Button from "../../../shared/components/Button";
import SpoilerText from "../../../shared/components/SpoilerText";
import type { CommentOut } from "../reviewTypes";
import { useDeleteComment, useSetLike } from "../hooks/useReviewMutations";
import CommentComposer from "./CommentComposer";
import ConfirmDelete from "./ConfirmDelete";
import LikeButton from "./LikeButton";
import { avatarOf, useDateFormat, wasEdited } from "./reviewFormat";

interface Props {
    bookId: number;
    comment: CommentOut;
}

export default function CommentCard({ bookId, comment }: Props) {
    const { t } = useTranslation("front/reviews");
    const formatDate = useDateFormat();
    const [editing, setEditing] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const setLike = useSetLike(bookId);
    const deleteComment = useDeleteComment(bookId);
    const username = comment.author.username;

    const remove = async () => {
        try {
            await deleteComment.mutateAsync({ commentId: comment.id });
            setConfirming(false);
        } catch {
            return;
        }
    };

    return (
        <li className="flex gap-2 sm:gap-3">
            <img src={avatarOf(comment.author)} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-panel bg-panelSelectedLight px-3 py-2 dark:bg-panelSelectedDark">
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="font-semibold text-sm">{username}</span>
                    <time dateTime={comment.created_at} className="text-fontMutedLight dark:text-fontMutedDark">{formatDate(comment.created_at)}</time>
                    {wasEdited(comment.created_at, comment.updated_at) && <span className="text-fontMutedLight dark:text-fontMutedDark">· {t("card.edited")}</span>}
                </p>

                {editing ? (
                    <CommentComposer
                        bookId={bookId}
                        reviewId={comment.review_id}
                        commentId={comment.id}
                        label={t("comments.editLabel")}
                        initialContent={comment.content}
                        onDone={() => setEditing(false)}
                    />
                ) : (
                    <SpoilerText text={comment.content} className="text-sm leading-relaxed" />
                )}

                {!editing && (
                    <div className="-ml-2 flex flex-wrap items-center gap-1">
                        <LikeButton
                            liked={comment.liked_by_me}
                            count={comment.likes_count}
                            label={t(comment.liked_by_me ? "comments.unlike" : "comments.like", { username })}
                            onToggle={() => setLike.mutate({ target: "comments", id: comment.id, liked: !comment.liked_by_me })}
                        />
                        {comment.can_edit && (
                            <Button variant="ghost" size="sm" icon={Pencil} aria-label={t("comments.edit")} onClick={() => setEditing(true)} className="min-h-10 min-w-10 justify-center" />
                        )}
                        {comment.can_delete && (
                            <Button variant="menuDanger" size="sm" icon={Trash2} aria-label={t("comments.delete")} onClick={() => setConfirming(true)} className="min-h-10 min-w-10 justify-center rounded-control" />
                        )}
                    </div>
                )}
            </div>

            <ConfirmDelete
                open={confirming}
                title={t("comments.deleteTitle")}
                message={t("comments.deleteConfirm")}
                pending={deleteComment.isPending}
                onCancel={() => setConfirming(false)}
                onConfirm={remove}
            />
        </li>
    );
}
