export const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
