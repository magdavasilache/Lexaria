import { useQuery } from "@tanstack/react-query";
import { getFormCountriesQuery } from "../../../api/countryAPI";

export const useGetFormCountries = () =>
    useQuery({
        queryKey: ["country"],
        queryFn: getFormCountriesQuery,
    });