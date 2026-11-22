import { useId } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import type { BookListItem } from "../types/bookTypes";
import { serverAssetUrl, useCoverPlaceholder } from "../../../shared/utils/assets";

export type StripItem = { book: BookListItem; note?: string };

type Props = {
    title: string;
    icon: LucideIcon;
    items: StripItem[];
    loading?: boolean;
    loadingLabel: string;
    className?: string;
};

const SKELETONS = 6;

export default function BookStrip({ title, icon: Icon, items, loading = false, loadingLabel, className = "" }: Props) {
    const placeholder = useCoverPlaceholder();
    const titleId = useId();
    if (!loading && items.length === 0) return null;

    return (
        <section aria-labelledby={titleId} aria-busy={loading || undefined} className={`flex min-w-0 flex-col gap-3 ${className}`}>
            <h2 id={titleId} className="flex items-center gap-2 font-libre text-base font-semibold sm:text-lg">
                <Icon className="h-5 w-5 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                {title}
            </h2>
            {loading && <p className="sr-only" role="status">{loadingLabel}</p>}
            <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
                {loading
                    ? Array.from({ length: SKELETONS }, (_, index) => (
                          <li key={index} aria-hidden="true" className="w-28 shrink-0 sm:w-32">
                              <div className="aspect-[2/3] w-full animate-pulse rounded-control bg-skeletonLight dark:bg-skeletonDark" />
                          </li>
                      ))
                    : items.map(({ book, note }) => (
                          <li key={book.id} className="w-28 shrink-0 snap-start sm:w-32">
                              <Link
                                  to={`/book/${book.id}`}
                                  className="group flex flex-col gap-1.5 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
                              >
                                  <span className="block aspect-[2/3] w-full overflow-hidden rounded-control bg-panelSelectedLight shadow-book dark:bg-panelSelectedDark dark:shadow-bookDark">
                                      <img
                                          src={serverAssetUrl(book.cover_url) ?? placeholder}
                                          alt=""
                                          loading="lazy"
                                          className="h-full w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-105"
                                      />
                                  </span>
                                  <span className="line-clamp-2 text-sm font-semibold leading-snug break-words group-hover:text-primaryLight dark:group-hover:text-primaryDark">
                                      {book.title}
                                  </span>
                                  {book.author_name && (
                                      <span className="line-clamp-1 text-xs italic text-fontMutedLight dark:text-fontMutedDark break-words">{book.author_name}</span>
                                  )}
                                  {note && <span className="line-clamp-2 text-xs text-fontMutedLight dark:text-fontMutedDark break-words">{note}</span>}
                              </Link>
                          </li>
                      ))}
            </ul>
        </section>
    );
}
