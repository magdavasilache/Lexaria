import { useGetFormCountries } from "../../api-handling/rtk-hooks/country/useGetFormCountries";

export default function CountrieSelect({ value, onChange, error }: {
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  error?: string;
}) {
    const countires = useGetFormCountries().data;
  return (
      <div className="flex flex-col gap-1">
          <select
              value={value ?? ""}
              onChange={(e) => {
                  const val = e.target.value;
                  onChange(val === "" ? undefined : Number(val));
              }}
              className="px-3 py-4 rounded-xs bg-inputLight dark:bg-inputDark border border-dividerLight dark:border-dividerDark outline-none focus:ring-1 focus:ring-primaryLight dark:focus:ring-primaryDark transition-shadow text-fontPrimaryLight dark:text-fontPrimaryDark"
          >
              <option value="">Select a country</option>
              {countires && countires.map((c) => (
                  <option key={c.id} value={c.id}>
                      {c.name}
                  </option>
              ))}
          </select>
          {error && (
              <p className="text-errorLight dark:text-errorDark text-sm">{error}</p>
          )}
      </div>
  );
}