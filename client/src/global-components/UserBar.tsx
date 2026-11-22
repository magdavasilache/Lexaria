import { KeyboardEvent, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, BookPlus, ChartColumn, LogOut, ShieldCheck, Target, Upload } from "lucide-react";
import Button from "./buttons/Button";
import { UserType, USER_ROLE } from "../types/auth-types/userTypes";
import { DEFAULT_AVATAR } from "../utils/assets";
import { useReadingToday } from "../api-handling/rtk-hooks/reading/useReadingGoal";

interface Props {
    user: UserType
    logout: () => void
    onNavigate: () => void
    onClose: () => void
    onOpenGoal: () => void
}

export default function UserBar({ user, logout, onNavigate, onClose, onOpenGoal }: Props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const menuRef = useRef<HTMLDivElement>(null)
    const isAdmin = user.role === USER_ROLE.ADMIN
    const name = user.display_name ?? user.username
    const { data: today } = useReadingToday()
    const goalMinutes = today?.daily_reading_goal_minutes ?? null

    const items = [
        { path: "/homepage", label: t("navbar.browseBooks"), icon: BookOpen },
        { path: "/stats", label: t("navbar.stats"), icon: ChartColumn },
        { path: "/goodreads-import", label: t("navbar.goodreadsImport"), icon: Upload },
        ...(isAdmin
            ? [
                { path: "/admin-panel?new=book", label: t("navbar.addBook"), icon: BookPlus },
                { path: "/admin-panel", label: t("navbar.adminPanel"), icon: ShieldCheck },
            ]
            : []),
    ]

    const menuItems = () => Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])

    useEffect(() => {
        menuItems()[0]?.focus()
    }, [])

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const all = menuItems()
        const index = all.indexOf(document.activeElement as HTMLButtonElement)
        const moves: Record<string, number> = {
            ArrowDown: (index + 1) % all.length,
            ArrowUp: (index - 1 + all.length) % all.length,
            Home: 0,
            End: all.length - 1,
        }
        if (e.key in moves) {
            e.preventDefault()
            all[moves[e.key]]?.focus()
        } else if (e.key === "Escape" || e.key === "Tab") {
            onClose()
        }
    }

    const goTo = (path: string) => {
        onNavigate()
        navigate(path)
    }

    return (
        <div
            ref={menuRef}
            role="menu"
            aria-label={t("navbar.openUserMenu")}
            onKeyDown={handleKeyDown}
            className="w-64 max-w-[calc(100vw-1.5rem)] font-libre"
        >
            <div className="flex items-center gap-3 px-4 py-3 bg-primaryLight dark:bg-primaryDark text-onPrimaryLight dark:text-onPrimaryDark">
                <img
                    src={user.avatar_url ?? DEFAULT_AVATAR}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-onPrimaryLight/40 dark:ring-onPrimaryDark/30 bg-panelLight dark:bg-panelDark"
                />
                <div className="min-w-0">
                    <p className="font-semibold truncate">{name}</p>
                    <p className="text-xs truncate opacity-80">@{user.username}</p>
                </div>
                {isAdmin && (
                    <span className="ml-auto shrink-0 px-2 py-0.5 rounded-full text-[0.65rem] uppercase tracking-wider bg-onPrimaryLight dark:bg-onPrimaryDark text-primaryLight dark:text-primaryDark">
                        {t("navbar.admin")}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-0.5 p-1.5">
                {items.map(({ path, label, icon }) => (
                    <Button
                        key={path}
                        role="menuitem"
                        variant="menu"
                        fullWidth
                        leftIcon={icon}
                        tabIndex={-1}
                        aria-current={pathname === path ? "page" : undefined}
                        onClick={() => goTo(path)}
                        className="min-h-10 text-sm"
                    >
                        {label}
                    </Button>
                ))}
                <Button
                    role="menuitem"
                    variant="menu"
                    fullWidth
                    leftIcon={Target}
                    tabIndex={-1}
                    onClick={onOpenGoal}
                    className="min-h-10 text-sm [&>span]:min-w-0 [&>span]:flex-1"
                >
                    <span className="flex items-center justify-between gap-2">
                        <span className="truncate">{t("navbar.readingGoal")}</span>
                        {today && (
                            <span className="shrink-0 text-xs tabular-nums text-fontMutedLight dark:text-fontMutedDark">
                                {goalMinutes === null ? t("navbar.readingGoalNotSet") : t("navbar.readingGoalValue", { minutes: goalMinutes })}
                            </span>
                        )}
                    </span>
                </Button>
            </div>

            <div className="p-1.5 border-t border-panelBorderLight dark:border-panelBorderDark">
                <Button
                    role="menuitem"
                    variant="menuDanger"
                    fullWidth
                    leftIcon={LogOut}
                    tabIndex={-1}
                    onClick={logout}
                    className="min-h-10 text-sm"
                >
                    {t("navbar.logout")}
                </Button>
            </div>
        </div>
    )
}
