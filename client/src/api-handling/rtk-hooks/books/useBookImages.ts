import { useQuery } from "@tanstack/react-query";
import { booksAPI } from "../../../api/booksAPI";

export function useBookImages(filenames: string[] | null | undefined) {
    return useQuery({
        queryKey: ['book-images', filenames],
        queryFn: () => booksAPI.getBookImages(filenames!),
        enabled: !!filenames?.length,
        staleTime: 10 * 60 * 1000, 
        gcTime: 15 * 60 * 1000,
    });
}