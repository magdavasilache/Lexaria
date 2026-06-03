import { useState } from "react";
import { CommentOut } from "../../../../types/comments/commentsTypes";
import { Heart } from 'lucide-react';
import { useToggleCommentLike } from "../../../../api-handling/rtk-hooks/likes/useToggleCommentLike";

interface Props {
    comment: CommentOut
}

export default function CommentCard({ comment }: Props) {
  const avatar = comment.user.profile_picture ?? "/default_avatar.png"
  const [userLiked, setUserLiked] = useState<boolean>(comment.user_liked)
  const [likesCount, setLikesCount] = useState<number>(comment.likes_count)

  const toggleCommentLike = useToggleCommentLike()

  const handleLikeComment = async () => {
    const response = await toggleCommentLike.mutateAsync(comment.id)
    const oldUserLiked = userLiked
    if (response.data.success) {
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
        flex flex-col gap-2
        text-sm
        px-3 py-2
        bg-inputLight dark:bg-inputDark
        text-fontPrimaryLight dark:text-fontPrimaryDark
        rounded-sm
        border border-dividerLight dark:border-dividerDark
      "
    >
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          className="w-8 h-8 rounded-full object-cover border border-dividerLight dark:border-dividerDark"
        />

        <span className="font-medium text-fontPrimaryLight dark:text-fontPrimaryDark">
          {comment.user.username}
        </span>

    
      </div>

      <p className="leading-relaxed text-xs text-fontPrimaryLight dark:text-fontPrimaryDark">
        {comment.comment_content}
      </p>

      <div className="flex items-center justify-between text-xs text-fontPrimaryLight/70 dark:text-fontPrimaryDark/80">
        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
        <button className="text-fontPrimaryLight flex items-center px-4 py-1 gap-1" onClick={handleLikeComment}>
            <Heart className={`w-5 h-5 ${userLiked && 'text-red-700'}`} />
            ({likesCount})
          </button>
      </div>
    </div>
  )
}
