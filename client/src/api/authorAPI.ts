import { AuthorSearchResult } from "../types/author-types/authorTypes";
import { FormAuthor } from "../types/language/languageTypes";
import { authorizedAxios } from "./authorizedAxios";
import { publicAxios } from "./publicAxios";

const URL_BASE = "author";
const SEARCH_AUTHORS_URL = `${URL_BASE}/search_authors`;
const CREATE_AUTHOR = `${URL_BASE}/create`;
const GET_FORM_AUTHORS = `${URL_BASE}/form_authors`;

export const authorAPI = {
    searchAuthors: async (params: {
        searchTerm: string;
    }): Promise<AuthorSearchResult[]> => {
        const { data } = await publicAxios(`${SEARCH_AUTHORS_URL}`).get('', {
            params: {
                ...params,
                search_term: params.searchTerm,
            },
        });
        return data;
    }
}

export const createAuthorMutation = async (data: FormData) => {
    const response = await authorizedAxios(`${CREATE_AUTHOR}`).post("", data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return response;
};


export const getFormAuthorsQuery = async (): Promise<FormAuthor[]> => {
    const response = await authorizedAxios("").get(`${GET_FORM_AUTHORS}`)
    if(response.status === 200){
        return response.data
    }
    return []
}