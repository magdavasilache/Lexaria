import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCatalogMutation, deleteCatalogMutation, listCatalogQuery, updateCatalogMutation } from "../../../api/catalogAPI";
import type { AutocompleteOption } from "../../../forms/components/AutocompleteField";
import type { Author, Award, CatalogKind, Country, Genre, Language } from "../../../types/catalog-types/catalogTypes";
import { useSnackbarStore } from "../../context/snackbar/useSnackbarStore";
import { bookKeys } from "../books/bookKeys";
import { readingKeys } from "../reading/readingKeys";
import { catalogKeys } from "./catalogKeys";

const useCatalogList = <T>(kind: CatalogKind, enabled: boolean) =>
  useQuery({
    queryKey: catalogKeys.list(kind),
    queryFn: () => listCatalogQuery<T>(kind),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

export const useLanguages = (enabled = true) => useCatalogList<Language>("languages", enabled);
export const useCountries = (enabled = true) => useCatalogList<Country>("countries", enabled);
export const useGenres = (enabled = true) => useCatalogList<Genre>("genres", enabled);
export const useAwards = (enabled = true) => useCatalogList<Award>("awards", enabled);
export const useAuthors = (enabled = true) => useCatalogList<Author>("authors", enabled);

export const authorOptions = (authors: Author[] | undefined): AutocompleteOption[] =>
  (authors ?? []).map((author) => ({ id: author.id, name: author.full_name }));

export const awardLabel = (award: Pick<Award, "name" | "year">) => (award.year ? `${award.name} (${award.year})` : award.name);

export const awardOptions = (awards: Award[] | undefined): AutocompleteOption[] =>
  (awards ?? []).map((award) => ({ id: award.id, name: awardLabel(award) }));

type Named = { name: string } | { full_name: string };

export const entryName = (entry: Named) => ("full_name" in entry ? entry.full_name : entry.name);

const useRefreshCatalog = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    queryClient.invalidateQueries({ queryKey: bookKeys.all });
    queryClient.invalidateQueries({ queryKey: readingKeys.all });
  };
};

export const useSaveCatalogEntry = <T extends Named>(kind: CatalogKind) => {
  const refresh = useRefreshCatalog();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: object | FormData }) =>
      id === null ? createCatalogMutation<T>(kind, data) : updateCatalogMutation<T>(kind, id, data),
    onSuccess: (entry, { id }) => {
      refresh();
      showSnackBar({ key: `front/catalog:snackbar.${id === null ? "created" : "updated"}.${kind}`, params: { name: entryName(entry) } }, "success");
    },
  });
};

export const useDeleteCatalogEntry = (kind: CatalogKind) => {
  const refresh = useRefreshCatalog();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: ({ id }: { id: number; name: string }) => deleteCatalogMutation(kind, id),
    onSuccess: (_, { name }) => {
      refresh();
      showSnackBar({ key: `front/catalog:snackbar.deleted.${kind}`, params: { name } }, "success");
    },
  });
};
