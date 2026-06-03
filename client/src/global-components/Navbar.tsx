import { useCallback, useEffect, useRef, useState } from "react";
import RegisterForm from "../forms/RegisterForm";
import LoginForm from "../forms/LoginForm";
import { useThemeStore } from "../state_management/useThemeStore";
import { useAuthStore } from "../api-handling/context/authentication/useAuthStore";
import UserBar from "./UserBar";
import IconButton from "./buttons/IconButton";
import { EllipsisVertical } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useBooksStore } from "../state_management/useBooksStore";

export default function Navbar() {
    const resetBookStore = useBooksStore(state => state.resetBookStore)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const user = useAuthStore(state => state.user)
    const logout = useAuthStore(state => state.logout)
    const theme = useThemeStore(state => state.theme)
    const [showUserBar, setShowUserBar] = useState<boolean>(false)
    const userBarRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    const handleLogout = useCallback(() => {
        resetBookStore()
        logout()
        setShowUserBar(false)
        navigate("/")
    },[logout, navigate, resetBookStore]);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (userBarRef.current && !userBarRef.current.contains(e.target as Node)) {
          setShowUserBar(false);
        }
      }, []);

    const svgPath = theme === "light" ? "/svg-light-theme.svg" : "/svg-dark-theme.svg";

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []);
    
    return (
        <>
            <nav className="bg-backgroundLight dark:bg-backgroundDark shadow-sm p-2 h-[60px] w-full sticky top-0 z-[50]">
                <div className="container max-w-screen-xl mx-auto flex justify-between items-center w-full px-4">
                    <div className="font-libre text-2xl flex items-center gap-2 text-fontPrimaryLight dark:text-fontSecondaryDark">
                        <img src={svgPath} alt="bookish-app-logo" className="h-[30px] bg-paperLight dark:bg-paperDark rounded-full p-1" />
                        <a href="/homepage" className="hover:opacity-90 transition mt-1">Lexaria</a>
                    </div>

                    <div>{/* Search bar will go here */}</div>

                    {!isAuthenticated ? (
                        <div className="flex gap-2">
                            <LoginForm />
                            <RegisterForm />
                        </div>
                    ) : (
                        <div className="relative" ref={userBarRef}>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-libre text-fontPrimaryLight dark:text-fontSecondaryDark">Welcome back, {user ? user.username : 'N/A'}</span>
                                <IconButton
                                    className="z-50 transition" icon={EllipsisVertical} onClick={() => setShowUserBar(prev => !prev)} iconClassName="
         text-fontPrimaryLight dark:text-fontSecondaryDark"/>
                            </div>
                            {showUserBar && (
                                <div className="absolute right-0 mt-2 z-[70] bg-paperLight dark:bg-paperDark shadow-md p-4 rounded-sm">
                                    <UserBar logout={handleLogout} />
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </nav>
        </>
    );
}