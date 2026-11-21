import i18n from "./index";

export type MessageParam = string | number | string[];
export type MessageParams = Record<string, MessageParam>;

export type Message = {
  key: string;
  params?: MessageParams;
};

export type DisplayText = Message | string;

const PARAMS_SEPARATOR = "|";

export const serverKey = (key: string) => {
  const [module, ...rest] = key.split(".");
  return `back/${module}:${rest.join(".")}`;
};

export const serverParams = (params: MessageParams | undefined): MessageParams =>
  Object.fromEntries(
    Object.entries(params ?? {}).map(([name, value]) => [name, Array.isArray(value) ? value.map(serverKey) : value])
  );

const resolveParams = (params: MessageParams | undefined) =>
  Object.fromEntries(
    Object.entries(params ?? {}).map(([name, value]) => [
      name,
      Array.isArray(value)
        ? new Intl.ListFormat(i18n.resolvedLanguage, { type: "conjunction" }).format(value.map((item) => translateKey(item)))
        : value,
    ])
  );

const translateKey = (key: string, params?: MessageParams): string => String(i18n.t(key as never, resolveParams(params) as never));

export const translate = (text: DisplayText): string => (typeof text === "string" ? text : translateKey(text.key, text.params));

export const encodeMessage = ({ key, params }: Message) =>
  params && Object.keys(params).length > 0 ? `${key}${PARAMS_SEPARATOR}${JSON.stringify(params)}` : key;

export const decodeMessage = (encoded: string): Message => {
  const separator = encoded.indexOf(PARAMS_SEPARATOR);
  if (separator === -1) return { key: encoded };
  return { key: encoded.slice(0, separator), params: JSON.parse(encoded.slice(separator + 1)) as MessageParams };
};
