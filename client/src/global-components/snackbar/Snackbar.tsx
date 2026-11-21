import { useEffect, useState } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translate } from '../../i18n/message';
import { useSnackbarStore } from '../../api-handling/context/snackbar/useSnackbarStore';
import Button from '../buttons/Button';

const VARIANTS = {
    error: {
        Icon: CircleAlert,
        card: 'bg-errorLightTone ring-errorBorderLight dark:bg-errorDarkTone dark:ring-errorBorderDark',
        badge: 'bg-errorSolidLight dark:bg-errorSolidDark',
        title: 'text-errorTextLight dark:text-errorTextDark',
    },
    warning: {
        Icon: TriangleAlert,
        card: 'bg-warningLightTone ring-warningBorderLight dark:bg-warningDarkTone dark:ring-warningBorderDark',
        badge: 'bg-warningSolidLight dark:bg-warningSolidDark',
        title: 'text-warningTextLight dark:text-warningTextDark',
    },
    info: {
        Icon: Info,
        card: 'bg-infoLightTone ring-infoBorderLight dark:bg-infoDarkTone dark:ring-infoBorderDark',
        badge: 'bg-infoSolidLight dark:bg-infoSolidDark',
        title: 'text-infoTextLight dark:text-infoTextDark',
    },
    success: {
        Icon: CircleCheck,
        card: 'bg-successLightTone ring-successBorderLight dark:bg-successDarkTone dark:ring-successBorderDark',
        badge: 'bg-successSolidLight dark:bg-successSolidDark',
        title: 'text-successTextLight dark:text-successTextDark',
    },
} as const;

export default function Snackbar() {
    const { t } = useTranslation();
    const open = useSnackbarStore((state) => state.open);
    const message = useSnackbarStore((state) => state.message);
    const hint = useSnackbarStore((state) => state.hint);
    const type = useSnackbarStore((state) => state.type);
    const duration = useSnackbarStore((state) => state.duration);
    const close = useSnackbarStore((state) => state.closeSnackBar);

    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (!open || type === 'error') return;
        const timer = setTimeout(() => setClosing(true), duration);
        return () => clearTimeout(timer);
    }, [open, type, duration, message]);

    const handleAnimationEnd = () => {
        if (!closing) return;
        setClosing(false);
        close();
    };

    if (!open) return null;

    const { Icon, card, badge, title } = VARIANTS[type];

    return (
        <div className="fixed inset-x-3 top-3 z-[80] flex justify-center pointer-events-none sm:inset-x-6 sm:top-6">
            <div
                role={type === 'error' ? 'alert' : 'status'}
                aria-live={type === 'error' ? 'assertive' : 'polite'}
                onAnimationEnd={handleAnimationEnd}
                className={`
                    pointer-events-auto
                    flex w-full items-start gap-3 p-3
                    sm:w-auto sm:min-w-[340px] sm:max-w-[440px] sm:gap-4 sm:p-4
                    rounded-panel ring-1 ${card}
                    shadow-soft-lg dark:shadow-deep-lg
                    ${closing ? 'animate-fade-out' : 'animate-slide-down'}
                `}
            >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${badge}`}>
                    <Icon size={18} strokeWidth={2} aria-hidden="true" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                    <span className={`font-libre text-[0.7rem] font-bold uppercase tracking-[0.12em] ${title}`}>
                        {t(`snackbar.${type}`)}
                    </span>
                    <p className="mt-1 break-words font-libre text-sm leading-relaxed text-fontPrimaryLight dark:text-fontPrimaryDark">
                        {message && translate(message)}
                    </p>
                    {hint && (
                        <p className="mt-1.5 break-words font-libre text-xs italic leading-relaxed text-fontMutedLight dark:text-fontMutedDark">
                            {translate(hint)}
                        </p>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    icon={X}
                    aria-label={t('actions.dismissNotification')}
                    onClick={() => setClosing(true)}
                    className="-mr-1 -mt-1 h-10 w-10 shrink-0 sm:-mr-2 sm:-mt-2"
                />
            </div>
        </div>
    );
}
