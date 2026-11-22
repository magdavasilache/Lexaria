export default function LoadingComponent() {
    return (
        <div aria-hidden="true" className="bg-panelLight dark:bg-panelDark border border-panelBorderLight dark:border-panelBorderDark rounded-panel w-full animate-pulse shadow-soft-sm dark:shadow-deep-sm p-2">
            <div className="aspect-[2/3] bg-panelSelectedLight dark:bg-panelSelectedDark rounded-control"></div>
            <div className="pt-2.5 pb-0.5 px-0.5 space-y-2">
                <div className="h-3.5 bg-panelSelectedLight dark:bg-panelSelectedDark rounded-control w-4/5"></div>
                <div className="h-3 bg-panelSelectedLight dark:bg-panelSelectedDark rounded-control w-1/2"></div>
            </div>
        </div>
    );
}
