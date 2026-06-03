import { useQuery } from "@tanstack/react-query";
import { getLanguagesQuery } from "../../../api/languageAPI";

export const useGetLanguages = () =>
    useQuery({
        queryKey: ["language"],
        queryFn: getLanguagesQuery,
    });
  