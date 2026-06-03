import { useState } from "react";
import { ReviewOut } from "../../../../types/reviews/reviewTypes";
import CommentCard from "./CommentCard";
import { Reply } from 'lucide-react';
import CommentForm from "../../../../forms/CommentForm";
import { Heart } from 'lucide-react';
import { Star } from 'lucide-react';
import { useToggleReviewLike } from "../../../../api-handling/rtk-hooks/likes/useToggleReviewLike";

interface Props {
  review: ReviewOut
}

export default function ReviewCard({ review }: Props) {
  const avatar = review.user.profile_picture ?? "/default_avatar.png";
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
          text-fontPrimaryLight dark:text-fontSecondaryDark
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
            <Star className="w-4 h-4 text-yellow-500" /> {review.rating}
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

          <button
            className="flex bg-primaryLightTone text-fontPrimaryLight shadow-buttonShadow px-4 py-1 rounded-sm gap-1 dark:bg-secondaryLightDarkTone"
            onClick={() => setShowCommentForm(prev => !prev)}
          >
            <Reply />
          </button>
          <button className="text-fontPrimaryLight flex items-center px-4 py-1 gap-1" onClick={handleLikeReview}>
            <Heart className={`w-5 h-5 ${userLiked && 'text-red-700'}`} />
            ({likesCount})
          </button>
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