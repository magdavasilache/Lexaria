import type { ApiWarning } from "../../../shared/api/apiTypes";
import { apiClient } from "../../../shared/api/apiClient";
import type { GoodreadsImportSummary, IsbnImportPayload, IsbnImportResult, IsbnPreview } from "../types/importTypes";

const upload = { handlesFieldErrors: true, timeout: 60_000 };

export type GoodreadsImportResult = {
  summary: GoodreadsImportSummary;
  warnings: ApiWarning[];
};

export const importGoodreadsMutation = async (data: FormData): Promise<GoodreadsImportResult> => {
  const response = await apiClient.envelope<GoodreadsImportSummary>({
    method: "post",
    url: "/imports/goodreads",
    data,
    ...upload,
    handlesWarnings: true,
  });
  return { summary: response.data as GoodreadsImportSummary, warnings: response.warnings };
};

export const previewIsbnQuery = (isbn: string): Promise<IsbnPreview> =>
  apiClient.get<IsbnPreview>("/imports/isbn", { params: { isbn }, handlesFieldErrors: true });

export const importIsbnMutation = (payload: IsbnImportPayload): Promise<IsbnImportResult> =>
  apiClient.post<IsbnImportResult>("/imports/isbn", payload, { handlesFieldErrors: true });
