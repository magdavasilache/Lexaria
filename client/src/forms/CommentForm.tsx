import { X } from "lucide-react";
import { useState } from "react";
import { useCreateComments } from "../api-handling/rtk-hooks/comments/useCreateComments";

interface Props {
  review_id: number
  onClose: () => void
}

export default function CommentForm({ review_id, onClose }: Props) {
  const [content, setContent] = useState<string>("")

  const createComment = useCreateComments()

  const onSave = () => {
      if(content.trim() === "") return
      const commentForm = {
        review_id: review_id,
        comment_content: content
      }
      createComment.mutate(commentForm)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="
          w-full max-w-md rounded-sm p-6 shadow-cardShadowLight
          dark:shadow-cardShadowDark
          bg-paperLight dark:bg-paperDark
          text-fontPrimaryLight dark:text-fontSecondaryDark
          border border-dividerLight dark:border-dividerDark
        "
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Write a comment</h2>

          <button
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-dividerLight dark:hover:bg-dividerDark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={content ?? ""}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your comment..."
          className="
              w-full min-h-[120px] rounded-sm p-3 text-sm
              bg-inputLight dark:bg-inputDark
              border border-dividerLight dark:border-dividerDark
              text-fontPrimaryLight dark:text-fontPrimaryDark
              focus:outline-none focus:ring-2
              focus:ring-primaryLight dark:focus:ring-primaryDark
            "
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="
                px-4 py-2 text-sm rounded-sm border
                border-dividerLight dark:border-dividerDark
                bg-backgroundLight dark:bg-backgroundDark
                hover:bg-dividerLight dark:hover:bg-dividerDark
              "
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={!content.trim()}
            className="
                px-4 py-2 text-sm rounded-sm
                bg-primaryLight dark:bg-primaryDark
                text-fontSecondaryLight dark:text-fontPrimaryDark
                hover:bg-primaryHoverLight dark:hover:bg-primaryHoverDark
                active:bg-primaryActiveLight dark:active:bg-primaryActiveDark
                disabled:bg-primaryDisabledLight dark:disabled:bg-primaryDisabledDark
                disabled:cursor-not-allowed
                shadow-buttonShadow dark:shadow-buttonShadowDark
              "
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
