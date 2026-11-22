import { useQuery } from "@tanstack/react-query";
import { getRecommendationsQuery, getSimilarBooksQuery } from "../api/booksAPI";
import { bookKeys } from "./bookKeys";

export const RECOMMENDATIONS_SHOWN = 12;
const SIMILAR_SHOWN = 8;

export const useRecommendations = (enabled = true) =>
  useQuery({
    queryKey: bookKeys.recommendations(RECOMMENDATIONS_SHOWN),
    queryFn: () => getRecommendationsQuery(RECOMMENDATIONS_SHOWN),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

export const useSimilarBooks = (bookId: number) =>
  useQuery({
    queryKey: bookKeys.similar(bookId, SIMILAR_SHOWN),
    queryFn: () => getSimilarBooksQuery(bookId, SIMILAR_SHOWN),
    staleTime: 5 * 60 * 1000,
  });
