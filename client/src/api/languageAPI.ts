import { Language, LanguageCreate } from "../types/language/languageTypes"
import { authorizedAxios } from "./authorizedAxios"

const URL_BASE = 'language'

export const createLanguageMutation = async (data: LanguageCreate) => {
    const response = await authorizedAxios(`${URL_BASE}`).post('', data)
    return response
}

export const getLanguagesQuery = async (): Promise<Language[]> => {
    const response = await authorizedAxios("").get(`${URL_BASE}`)
    if(response.status === 200){
        return response.data.data
    }
    return []
}

export const deleteLanguageMutation = async (id: number) => {
    const response = await authorizedAxios(`${URL_BASE}/${id}`).delete('')
    return response
}

export const editLanguageMutation = async (id: number, data: LanguageCreate) => {
    const response = await authorizedAxios(`${URL_BASE}/${id}`).put('', data)
    return response
}