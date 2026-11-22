export const toLocalInput = (moment: string | number) => {
  const date = new Date(moment);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const fromLocalInput = (value: string) => new Date(value).toISOString();
