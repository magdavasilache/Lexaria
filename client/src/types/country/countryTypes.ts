type CountryBase = {
    name: string;
    language_id: number
}

export type CountryCreate = CountryBase

export type FormCountry = {
    id: number
    name: string
}