import { useEffect, useMemo, useState } from "react";

type Option = {
    id: number
    name: string
}

interface Props {
    options: Option[]
    value: number
    placeholder: string
    onChange: (option: Option) => void
    selectedIds?: number[];
    isForFiltering: boolean 
}

export default function SearchableSelect({ options, value, placeholder,selectedIds, isForFiltering, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedOption, setSelectedOption] = useState<Option | null>(null);

    const filtered = useMemo(
        () =>
            options.filter((opt: Option) =>
                opt.name.toLowerCase().includes(search.toLowerCase())
            ),
        [options, search]
    );

    const handlePickOption = (option: Option) => {
        onChange(option);
        setSelectedOption(option);
        if(!isForFiltering){
            setOpen(false);
        }
    }

    useEffect(() => {
        setSelectedOption(options.find((o: Option) => o.id === Number(value)) || null);
    }, [options, value]);

    
    return (
        <div className="relative">
            <div
                onClick={() => setOpen((p) => !p)}
                className="px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark cursor-pointer text-fontPrimaryDark"
            >
                {selectedOption ? selectedOption.name : placeholder}
            </div>

            {open && (
                <div className="absolute z-10 mt-1 w-full bg-paperLight dark:bg-paperDark border border-dividerLight dark:border-dividerDark rounded-xs shadow-cardShadowLight dark:shadow-cardShadowDark">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-3 py-2 bg-transparent outline-none border-b border-dividerLight dark:border-dividerDark"
                    />

                    <div className="max-h-40 overflow-y-auto">
                        {filtered.map((opt: Option) => (
                            <div
                                key={opt.id}
                                onClick={() => handlePickOption(opt)}
                                className={`px-3 py-2 hover:bg-inputLight dark:hover:bg-inputDark cursor-pointer hover:text-fontPrimaryLight ${selectedIds?.includes(opt.id) ? "opacity-50" : ""}`}
                            >
                                {opt.name}
                            </div>
                        ))}

                        {filtered.length === 0 && (
                            <div className="px-3 py-2 text-sm opacity-60">
                                No results
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}