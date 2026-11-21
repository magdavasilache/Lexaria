export default function LoadingComponent() {
    return (
        <div aria-hidden="true" className="bg-panelLight dark:bg-panelDark border border-panelBorderLight dark:border-panelBorderDark rounded-panel w-full animate-pulse shadow-soft-sm dark:shadow-deep-sm p-2">
            <div className="aspect-[2/3] bg-panelSelectedLight dark:bg-panelSelectedDark rounded-control"></div>
            <div className="pt-3 pb-1 space-y-2">
                <div className="h-3 bg-panelSelectedLight dark:bg-panelSelectedDark rounded-control"></div>
                <div className="h-3 bg-panelSelectedLight dark:bg-panelSelectedDark rounded-control w-3/4"></div>
            </div>
        </div>
    );
}
