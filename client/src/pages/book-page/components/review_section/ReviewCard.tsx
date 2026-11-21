import { useState } from "react";
import { ReviewOut } from "../../../../types/reviews/reviewTypes";
import CommentCard from "./CommentCard";
import CommentForm from "../../../../forms/CommentForm";
import { Heart, Reply, Star } from 'lucide-react';
import { useToggleReviewLike } from "../../../../api-handling/rtk-hooks/likes/useToggleReviewLike";
import { DEFAULT_AVATAR } from "../../../../utils/assets";
import Button from "../../../../global-components/buttons/Button";

interface Props {
  review: ReviewOut
}

export default function ReviewCard({ review }: Props) {
  const avatar = review.user.profile_picture ?? DEFAULT_AVATAR;
  const [showCommentForm, setShowCommentForm] = useState<boolean>(false)
  const [userLiked, setUserLiked] = useState<boolean>(review.user_liked)
  const [likesCount, setLikesCount] = useState<number>(review.likes_count)

  const toggleReviewLike = useToggleReviewLike()

  const handleLikeReview = async () => {
    const res = await toggleReviewLike.mutateAsync(review.id)
    const oldUserLiked = userLiked
    if (res.data.success) {
      setUserLiked(prev => !prev)
      setLikesCount(prev => {
        if (oldUserLiked) {
          return prev - 1
        } else {
          return prev + 1
        }
      })
    }
  }

  return (
    <div
      className="
          flex flex-col gap-4
          p-4
          bg-paperLight dark:bg-paperDark
          border border-dividerLight dark:border-dividerDark
          rounded-sm
          shadow-cardShadowLight dark:shadow-cardShadowDark
          text-fontPrimaryLight dark:text-fontPrimaryDark
        "
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={avatar}
            className="w-10 h-10 rounded-full object-cover border border-dividerLight dark:border-dividerDark"
          />

          <span className="font-semibold">{review.user.username}</span>
        </div>

        {review.rating && (
          <span className="px-4 py-1 text-md flex gap-1 items-center rounded-sm dark:text-primaryDarkDarkTone bg-inputLight dark:bg-inputDark">
            <Star className="w-4 h-4 text-ratingLight dark:text-ratingDark fill-current" /> {review.rating}
          </span>
        )}
      </div>

      {review.review_content && (
        <p className="leading-relaxed">{review.review_content}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs opacity-70">
          {new Date(review.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2">

          <Button
            variant="secondary"
            size="sm"
            icon={Reply}
            aria-label="Reply to review"
            aria-expanded={showCommentForm}
            onClick={() => setShowCommentForm(prev => !prev)}
          />
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={userLiked}
            aria-label={`${userLiked ? "Unlike" : "Like"} (${likesCount} likes)`}
            leftIcon={<Heart className={`w-5 h-5 ${userLiked ? "fill-current text-errorLight dark:text-errorDark" : ""}`} />}
            onClick={handleLikeReview}
          >
            ({likesCount})
          </Button>
        </div>
      </div>

      {showCommentForm && <CommentForm onClose={() => setShowCommentForm(false)} review_id={review.id} />}

      {review.comments && review.comments.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-dividerLight dark:border-dividerDark pt-3">
          {review.comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}