from pydantic import BaseModel


class ToggleReviewLikeRequest(BaseModel):
    review_id: int

class ToggleCommentLikeRequest(BaseModel):
    comment_id: int