export default function LoadingComponent() {
    return (
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 w-full animate-pulse shadow-sm">
            <div className="h-3/4 bg-gray-300 dark:bg-gray-600 rounded-t-lg"></div>
            <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
        </div>
    );
}