import { X, CheckCheck, TriangleAlert, Info, Ban } from 'lucide-react';
import { useSnackbarStore } from '../../api-handling/context/snackbar/useSnackbarStore';
import { useEffect, useState } from 'react';

export default function Snackbar() {
    const open = useSnackbarStore((state) => state.open);
    const message = useSnackbarStore((state) => state.message);
    const hint = useSnackbarStore((state) => state.hint);
    const type = useSnackbarStore((state) => state.type);
    const duration = useSnackbarStore((state) => state.duration);
    const close = useSnackbarStore((state) => state.closeSnackBar);

    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (open) {
            setVisible(true);
            setAnimating(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => handleClose(), duration);
        return () => clearTimeout(timer);
    }, [open, duration]);

    const handleClose = () => {
        setAnimating(true);
        setTimeout(() => {
            setVisible(false);
            setAnimating(false);
            close();
        }, 4000); 
    };

    if (!visible) return null;

    const config = {
        error: { icon: <Ban size={18} />, bg: 'bg-errorLight   dark:bg-errorDark', label: 'Error' },
        info: { icon: <Info size={18} />, bg: 'bg-infoLight    dark:bg-infoDark', label: 'Info' },
        warning: { icon: <TriangleAlert size={18} />, bg: 'bg-warningLight dark:bg-warningDark', label: 'Warning' },
        success: { icon: <CheckCheck size={18} />, bg: 'bg-successLight dark:bg-successDark', label: 'Success' },
    } as const;

    const { icon, bg, label } = config[type];

    return (
        <div className={`
            fixed top-6 left-1/2 -translate-x-1/2 z-[80]
            ${animating ? 'animate-slide-out' : 'animate-slide-in'}
        `}>
            <div className="
                flex items-stretch
                min-w-[300px] max-w-[480px]
                rounded-xs overflow-hidden
                bg-paperLight dark:bg-paperDark
                shadow-cardShadowLight dark:shadow-cardShadowDark
                border border-dividerLight dark:border-dividerDark
            ">
                {/* Colored type strip */}
                <div className={`flex items-center justify-center px-4 ${bg}`}>
                    <span className="text-white dark:text-white">
                        {icon}
                    </span>
                </div>

                {/* Text */}
                <div className="flex flex-col justify-center flex-1 px-4 py-3 leading-snug">
                    <span className="font-libre font-bold text-sm text-fontPrimaryLight dark:text-fontSecondaryDark">
                        {label}
                    </span>
                    <span className="font-libre text-sm mt-0.5 text-fontPrimaryLight dark:text-fontSecondaryDark">
                        {message}
                    </span>
                    {hint && (
                        <span className="font-libre text-xs mt-1 italic text-fontPrimaryLight/60 dark:text-fontSecondaryDark/60">
                            {hint}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleClose}
                    aria-label="Dismiss"
                    className="flex items-center justify-center px-3 text-fontPrimaryLight/40 dark:text-fontSecondaryDark/40 hover:text-fontPrimaryLight dark:hover:text-fontSecondaryDark transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}