import { useEffect, useState } from "react";
import { useThemeStore } from "../../../state_management/useThemeStore";

export default function Description() {
    const [photoSrc, setPhotoSrc] = useState<string>("/home-page-photo.webp")
    const { theme } = useThemeStore()

    useEffect(() => {
        if(theme === "light"){
            setPhotoSrc("/home-page-photo.webp")
        } else{
            setPhotoSrc("/home-page-photo-dark.jpg")
        }
    }, [theme])
    return (
        <div className="relative w-full h-[500px] md:h-[600px] z-40">
            <img
                src={photoSrc}
                alt="light-homepage-backround"
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover brightness-50"
            />
            <div className="relative z-10 flex items-center justify-center h-full px-4 text-center animate-fade-in">
                <p className="font-libre text-fontSecondaryLight dark:text-fontSecondaryDark text-lg md:text-2xl leading-relaxed max-w-3xl">
                    When technology meets the arts.{' '}
                    <span className="font-explora text-3xl md:text-4xl text-fontSecondaryLight dark:text-fontSecondaryDark ">Lexaria</span>{' '}
                    is that corner of the Internet where you can fall in love with reading more than ever before.
                </p>
            </div>
        </div>
    );
}
