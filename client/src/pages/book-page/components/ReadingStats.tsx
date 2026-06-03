import { useCurrentBookStore } from "../../../state_management/current-book/useCurrentBookStore"

export default function RatingStats() {

    const currentBook = useCurrentBookStore(state => state.currentBook)

    const ratings = [
        { stars: 5, count: currentBook ? currentBook.five_stars : 0 },
        { stars: 4, count: currentBook ? currentBook?.four_stars : 0},
        { stars: 3, count: currentBook ? currentBook.three_stars : 0},
        { stars: 2, count: currentBook ? currentBook.two_stars : 0},
        { stars: 1, count: currentBook ? currentBook.one_star : 0},
        { stars: 0, count: currentBook ? currentBook.zero_stars : 0}
    ]
    const average = currentBook ? currentBook.average_rating : 0
    const total = ratings.reduce((acc, r) => acc + r.count, 0)

    return (
        <div className="
            flex flex-col gap-6
            w-[280px]
            bg-paperLight dark:bg-paperDark
            border border-dividerLight dark:border-dividerDark
            rounded-sm
            p-5
            shadow-cardShadowLight dark:shadow-cardShadowDark
            text-fontPrimaryLight dark:text-fontSecondaryDark
        ">

            <div className="flex flex-col items-center">
                <p className="text-4xl font-bold text-primaryLight dark:text-primaryDark">
                    {average ?? '-'}
                </p>
                <p className="text-sm opacity-70">
                    {total} ratings
                </p>
            </div>

            <div className="flex flex-col gap-2">

                {ratings.map(r => {

                    const percent = total ? (r.count / total) * 100 : 0

                    return (
                        <div key={r.stars} className="flex items-center gap-3">

                            <span className="w-5 text-sm">
                                {r.stars}★
                            </span>

                            <div className="flex-1 h-2 bg-dividerLight dark:bg-dividerDark rounded">

                                <div
                                    className="
                                        h-2
                                        bg-primaryLight dark:bg-primaryDark
                                        rounded
                                        transition-all
                                    "
                                    style={{ width: `${percent}%` }}
                                />

                            </div>

                            <span className="text-xs w-8 text-right">
                                {r.count}
                            </span>

                        </div>
                    )

                })}

            </div>

        </div>
    )
}