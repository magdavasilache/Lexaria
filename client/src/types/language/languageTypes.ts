type LanguageBase = {
    name: string
}

export type LanguageCreate = LanguageBase

export type Language = LanguageBase & { id: number }

export type LanguageUpdate = LanguageCreate

export type FormAuthor = {
    id: number;
    name: string
}