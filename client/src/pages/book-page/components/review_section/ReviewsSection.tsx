import { ReviewOut } from "../../../../types/reviews/reviewTypes";
import ReviewCard from "./ReviewCard";

interface Props {
    reviews: ReviewOut[] | null;
    isLoading: boolean;
  };
  
  export default function ReviewsSection({ reviews, isLoading }: Props) {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-4 p-6 max-w-2xl w-full">
          <p className="text-fontPrimaryLight dark:text-fontSecondaryDark">
            Loading reviews...
          </p>
        </div>
      );
    }
  
    if (!reviews?.length) {
      return (
        <div className="flex flex-col gap-4 p-6 max-w-2xl w-full">
          <p className="text-fontPrimaryLight dark:text-fontSecondaryDark">
            No reviews yet.
          </p>
        </div>
      );
    }
  
    return (
      <div className="flex flex-col gap-6 p-6 max-w-full w-full">
        <h2 className="text-xl font-semibold text-primaryLight dark:text-primaryDark">
          Reviews
        </h2>
  
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    );
  }