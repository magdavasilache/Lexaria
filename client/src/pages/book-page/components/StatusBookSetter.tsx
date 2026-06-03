import { ChevronDown } from 'lucide-react';
import { ChevronUp } from 'lucide-react';
import React from 'react';
import { useUserBookStatus } from '../../../api-handling/rtk-hooks/useUserBookStatus';
import { useCurrentBookStore } from '../../../state_management/current-book/useCurrentBookStore';
import { useUserBookStatusStore } from '../../../api-handling/context/user_book_status/useUserBookStatusStore';

const statuses = [
    { label: 'Want to Read', value: 'want_to_read' },
    { label: 'Reading', value: 'currently_reading' },
    { label: 'Read', value: 'read' },
    { label: 'Did Not Finish', value: 'did_not_finish' },
];

const statusTextMap = {
    want_to_read:       'bg-statusWantToReadLight       text-statusWantToReadTextLight       dark:bg-statusWantToReadDark       dark:text-statusWantToReadTextDark',
    currently_reading:  'bg-statusCurrentlyReadingLight text-statusCurrentlyReadingTextLight dark:bg-statusCurrentlyReadingDark dark:text-statusCurrentlyReadingTextDark',
    read:               'bg-statusReadLight             text-statusReadTextLight             dark:bg-statusReadDark             dark:text-statusReadTextDark',
    did_not_finish:     'bg-statusDidNotFinishLight     text-statusDidNotFinishTextLight     dark:bg-statusDidNotFinishDark     dark:text-statusDidNotFinishTextDark',
};

export default function StatusBookSetter() {
    const [showSetStatus, setShowSetStatus] = React.useState(false);
    const createUserStatus = useUserBookStatus();
    const userBookStatus = useUserBookStatusStore(state => state.userBookStatsus);
    const currentBook = useCurrentBookStore(state => state.currentBook);

    const handleCreateStatus = (status: keyof typeof statusTextMap) => {
        if (!currentBook) return;
        createUserStatus.mutate({ book_id: currentBook.id, status });
        setShowSetStatus(false);
    };

    if (!currentBook) return null;

    const activeColors = userBookStatus
        ? statusTextMap[userBookStatus.status as keyof typeof statusTextMap]
        : '';

    return (
        <div className="w-[70%] mt-20">

            {/* Trigger row */}
            <div className="flex items-stretch h-10 border border-primaryLight dark:border-primaryDark rounded-md overflow-hidden shadow-cardShadowLight dark:shadow-cardShadowDark">

                {userBookStatus ? (
                    <span className={`flex-1 flex items-center px-3 text-sm font-medium ${activeColors}`}>
                        {statuses.find(s => s.value === userBookStatus.status)?.label}
                    </span>
                ) : (
                    <span className="flex-1 flex items-center px-3 text-sm text-fontPrimaryLight/50 dark:text-fontSecondaryDark/40">
                        Add to collection
                    </span>
                )}

                <button
                    onClick={() => setShowSetStatus(prev => !prev)}
                    aria-label="Toggle status menu"
                    className="w-10 flex items-center justify-center flex-shrink-0 border-l border-primaryLight dark:border-primaryDark bg-secondaryLight dark:bg-paperDark hover:brightness-95 dark:hover:brightness-110 transition-[filter] duration-150"
                >
                    {showSetStatus
                        ? <ChevronUp  className="w-4 h-4 text-primaryLight dark:text-primaryDark" />
                        : <ChevronDown className="w-4 h-4 text-primaryLight dark:text-primaryDark" />}
                </button>
            </div>

            {/* Dropdown */}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${
                showSetStatus ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <ul className="mt-0.5 flex flex-col border border-primaryLight dark:border-primaryDark rounded-md overflow-hidden shadow-cardShadowLight dark:shadow-cardShadowDark">
                    {statuses.map((status) => {
                        const isActive = userBookStatus?.status === status.value;
                        const colors = statusTextMap[status.value as keyof typeof statusTextMap];
                        return (
                            <li
                                key={status.value}
                                onClick={() => handleCreateStatus(status.value as keyof typeof statusTextMap)}
                                className={`
                                    flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer
                                    border-t border-primaryLight/10 dark:border-primaryDark/10 first:border-t-0
                                    transition-[filter] duration-100 hover:brightness-95 dark:hover:brightness-110
                                    ${isActive
                                        ? `${colors} font-medium`
                                        : 'bg-paperLight dark:bg-paperDark text-fontPrimaryLight dark:text-fontSecondaryDark'}
                                `}
                            >
                                {status.label}
                                {isActive && <span className="text-xs opacity-60">✓</span>}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}