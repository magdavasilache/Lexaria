import { create } from 'zustand'

type Theme = 'light' | 'dark'

type ThemeStoreState = {
    theme: Theme
}

type ThemeStoreAction = {
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeStoreState & ThemeStoreAction>()((set) => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'light'
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')

    return {
        theme: savedTheme,
        toggleTheme: () =>
            set((state) => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light'
                localStorage.setItem('theme', newTheme)
                document.documentElement.classList.toggle('dark', newTheme === 'dark')
                return { theme: newTheme }
            }),
        setTheme: (theme: Theme) => {
            localStorage.setItem('theme', theme)
            document.documentElement.classList.toggle('dark', theme === 'dark')
            set({ theme })
        },
    }
})
