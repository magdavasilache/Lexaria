export default function Badge({ success }: { success: boolean }) {
    return (
        <span className={`text-xs px-2 py-0.5 rounded-xs font-medium ${success
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
            {success ? "Success" : "Failed"}
        </span>
    );
}