import { useQuery } from "@tanstack/react-query";
import { getBookReviews } from "../../../api/reviewsAPI";

export const useBookReviews = (bookId: number) => {
    return useQuery({
      queryKey: ["reviews", bookId],
      queryFn: () => getBookReviews(bookId),
      enabled: !!bookId
    });
  };