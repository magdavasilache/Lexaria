import { CountryCreate, FormCountry } from "../types/country/countryTypes"
import { authorizedAxios } from "./authorizedAxios"

const URL_BASE = 'country'

const CREATE_COUNTRY = `${URL_BASE}/create-country`
const GET_FORM_COUNTRIES = `${URL_BASE}/all-countries`

export const createCountryMutation = async (data: CountryCreate) => {
    const response = await authorizedAxios(CREATE_COUNTRY).post("", data)
    return response
}

export const getFormCountriesQuery = async (): Promise<FormCountry[]> => {
    const response = await authorizedAxios("").get(`${GET_FORM_COUNTRIES}`)
    if(response.status === 200){
        return response.data.data
    }
    return []
}