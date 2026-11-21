import { useQuery } from "@tanstack/react-query";
import { getBookQuery } from "../../../api/booksAPI";
import { bookKeys } from "./bookKeys";

export const useBook = (bookId: number | null) =>
  useQuery({
    queryKey: bookKeys.detail(bookId ?? 0),
    queryFn: () => getBookQuery(bookId as number),
    enabled: bookId !== null,
  });
