import { useCallback, useEffect, useRef, useState } from "react";
import RegisterForm from "../forms/RegisterForm";
import LoginForm from "../forms/LoginForm";
import { useThemeStore } from "../state_management/useThemeStore";
import { useAuthStore } from "../api-handling/context/authentication/useAuthStore";
import UserBar from "./UserBar";
import Button from "./buttons/Button";
import { BookOpen, ChevronDown, ShieldCheck, Upload } from 'lucide-react';
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetBooksStore } from "../state_management/useBooksStore";
import { resetAllFilters } from "../state_management/useFiltersStore";
import { PAGE_CONTAINER } from "../utils/layout";
import { BRAND_LOGO, DEFAULT_AVATAR } from "../utils/assets";
import { USER_ROLE } from "../types/auth-types/userTypes";

export default function Navbar() {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const user = useAuthStore(state => state.user)
    const logout = useAuthStore(state => state.logout)
    const theme = useThemeStore(state => state.theme)
    const [showUserBar, setShowUserBar] = useState<boolean>(false)
    const userBarRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { t } = useTranslation()
    const links = [
        { path: "/homepage", label: t("navbar.browseBooks"), icon: BookOpen },
        { path: "/goodreads-import", label: t("navbar.goodreadsImport"), icon: Upload },
        ...(user?.role === USER_ROLE.ADMIN ? [{ path: "/admin-panel", label: t("navbar.adminPanel"), icon: ShieldCheck }] : []),
    ]

    const handleLogout = useCallback(async () => {
        setShowUserBar(false)
        await logout()
        resetBooksStore()
        resetAllFilters()
        navigate("/")
    }, [logout, navigate]);

    const closeUserBar = useCallback(() => {
        setShowUserBar(false)
        triggerRef.current?.focus()
    }, [])

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (userBarRef.current && !userBarRef.current.contains(e.target as Node)) {
            setShowUserBar(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    return (
        <nav className="h-[60px] w-full sticky top-0 z-50 border-t-2 border-b border-t-primaryLight dark:border-t-primaryDark border-b-panelBorderLight dark:border-b-panelBorderDark bg-panelLight/95 dark:bg-panelDark/95 backdrop-blur-md shadow-soft-sm dark:shadow-deep-sm">
            <div className={`${PAGE_CONTAINER} flex h-full items-center justify-between gap-3`}>
                <div className="flex h-full min-w-0 items-center gap-4 lg:gap-6">
                    <Link
                        to={isAuthenticated ? "/homepage" : "/"}
                        aria-label={t("navbar.home")}
                        className="flex items-center h-full hover:opacity-90 transition-opacity rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
                    >
                        <img src={BRAND_LOGO[theme]} alt="Lexaria" className="h-8 sm:h-9 w-auto" />
                    </Link>

                    {isAuthenticated && (
                        <ul aria-label={t("navbar.mainNav")} className="hidden lg:flex items-center gap-1">
                            {links.map(({ path, label, icon }) => (
                                <li key={path}>
                                    <Button
                                        variant="menu"
                                        size="sm"
                                        leftIcon={icon}
                                        aria-current={pathname === path ? "page" : undefined}
                                        onClick={() => navigate(path)}
                                        className="min-h-10"
                                    >
                                        {label}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {!isAuthenticated ? (
                    <div className="flex items-center gap-1 shrink-0 sm:gap-2">
                        <LanguageSwitcher />
                        <LoginForm />
                        <RegisterForm />
                    </div>
                ) : (
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <LanguageSwitcher />
                        <span className="hidden sm:block h-6 w-px bg-panelBorderLight dark:bg-panelBorderDark" aria-hidden="true" />
                        {user && (
                            <div className="relative min-w-0" ref={userBarRef}>
                                <Button
                                    ref={triggerRef}
                                    variant="menu"
                                    size="sm"
                                    rightIcon={ChevronDown}
                                    iconClassName={`transition-transform duration-200 ${showUserBar ? "rotate-180" : ""}`}
                                    aria-label={t("navbar.openUserMenu")}
                                    aria-haspopup="menu"
                                    aria-expanded={showUserBar}
                                    onClick={() => setShowUserBar(prev => !prev)}
                                    className="min-h-10 pl-1 pr-2 max-w-full"
                                >
                                    <span className="flex items-center gap-2 min-w-0">
                                        <img
                                            src={user.avatar_url ?? DEFAULT_AVATAR}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-panelBorderLight dark:ring-panelBorderDark bg-dividerLight dark:bg-dividerDark"
                                        />
                                        <span className="hidden md:block max-w-[10rem] truncate">{user.display_name ?? user.username}</span>
                                    </span>
                                </Button>
                                {showUserBar && (
                                    <div className="absolute right-0 top-full mt-2 z-[70] overflow-hidden bg-panelLight dark:bg-panelDark border border-panelBorderLight dark:border-panelBorderDark shadow-soft-lg dark:shadow-deep-lg rounded-panel origin-top-right animate-scale-in">
                                        <UserBar
                                            user={user}
                                            logout={handleLogout}
                                            onNavigate={() => setShowUserBar(false)}
                                            onClose={closeUserBar}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
