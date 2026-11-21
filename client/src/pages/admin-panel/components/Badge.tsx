import { ReactNode } from "react";

export default function Badge({ success, children }: { success: boolean; children?: ReactNode }) {
    return (
        <span className={`inline-block text-xs px-2 py-0.5 rounded-xs font-medium ${success
                ? "bg-successLightTone text-successTextLight dark:bg-successDarkTone dark:text-successTextDark"
                : "bg-errorLightTone text-errorTextLight dark:bg-errorDarkTone dark:text-errorTextDark"
            }`}>
            {children ?? (success ? "Success" : "Failed")}
        </span>
    );
}
