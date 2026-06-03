import { useState } from "react";
import { useBookImages } from "../../../api-handling/rtk-hooks/books/useBookImages";

interface Props {
    images: string[] | null | undefined;
}

export default function ImageCarousel({ images }: Props) {
    const [index, setIndex] = useState(0);
    const { data: imageMap, isLoading } = useBookImages(images);

    const prev = () => setIndex((i) => (i === 0 ? (images?.length ?? 1) - 1 : i - 1));
    const next = () => setIndex((i) => (i === (images?.length ?? 1) - 1 ? 0 : i + 1));

    const currentFilename = images?.[index];
    const currentSrc = currentFilename
        ? (imageMap?.[currentFilename] ?? null)
        : null;

    const showControls = (images?.length ?? 0) > 1;

    return (
        <div className="inline-block max-h-[450px] w-[70%] text-fontPrimaryLight dark:text-fontSecondaryDark">

            <div className="relative w-full h-[450px] bg-paperLight dark:bg-paperDark rounded-xs overflow-hidden">
                {isLoading ? (
                    <div className="w-full h-full animate-pulse bg-dividerLight dark:bg-dividerDark" />
                ) : (
                    <img
                        key={currentFilename} 
                        src={currentSrc ?? "/default-cover.jpg"}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-contain animate-fade-in"
                    />
                )}

                {showControls && (
                    <span className="
                        absolute bottom-2 left-1/2 -translate-x-1/2
                        text-xs px-2 py-0.5 rounded-full
                        bg-black/30 text-white backdrop-blur-sm
                    ">
                        {index + 1} / {images?.length}
                    </span>
                )}
            </div>

            {showControls && (
                <div className="flex w-full bg-paperLight dark:bg-paperDark rounded-xs mt-0.5">
                    <button
                        onClick={prev}
                        className="w-1/2 p-3 flex justify-center opacity-70 hover:opacity-100 transition-opacity"
                        aria-label="Previous image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                            className="size-6"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
                        </svg>
                    </button>
                    <button
                        onClick={next}
                        className="w-1/2 p-3 flex justify-center opacity-70 hover:opacity-100 transition-opacity"
                        aria-label="Next image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                            className="size-6"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}