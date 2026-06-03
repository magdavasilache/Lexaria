import { useQuery } from "@tanstack/react-query";
import { getFormAuthorsQuery } from "../../../api/authorAPI";

export const useGetFormAuthors = () =>
    useQuery({
        queryKey: ["authors"],
        queryFn: getFormAuthorsQuery,
    });