import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
    icon: LucideIcon;
    code?: string;
    title: string;
    description: string;
    actions?: ReactNode;
    details?: string | null;
};

export default function StatusPanel({ icon: Icon, code, title, description, actions, details }: Props) {
    return (
        <section className="flex w-full justify-center bg-backgroundLight px-4 py-10 dark:bg-backgroundDark sm:px-6 sm:py-16">
            <div
                role="alert"
                className="flex h-auto w-full max-w-lg flex-col gap-4 rounded-panel border border-panelBorderLight bg-panelLight p-5 text-fontPrimaryLight shadow-soft-sm dark:border-panelBorderDark dark:bg-panelDark dark:text-fontPrimaryDark dark:shadow-deep-sm sm:p-6"
            >
                <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-panelSelectedLight dark:bg-panelSelectedDark">
                        <Icon className="h-5 w-5" />
                    </span>
                    {code && <span className="font-libre text-sm tabular-nums tracking-wide text-fontMutedLight dark:text-fontMutedDark">{code}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <h1 className="font-libre text-xl sm:text-2xl">{title}</h1>
                    <p className="text-sm text-fontMutedLight dark:text-fontMutedDark sm:text-base">{description}</p>
                </div>
                {details && (
                    <p className="break-words rounded-control bg-panelHoverLight px-3 py-2 font-mono text-xs text-fontMutedLight dark:bg-panelHoverDark dark:text-fontMutedDark">{details}</p>
                )}
                {actions && <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">{actions}</div>}
            </div>
        </section>
    );
}
