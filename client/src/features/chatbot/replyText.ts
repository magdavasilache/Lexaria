import { serverKey, serverParams, translate } from "../../i18n/message";
import type { ReplyLine } from "./chatbotTypes";

export const lineText = (line: ReplyLine) => (line.key ? translate({ key: serverKey(line.key), params: serverParams(line.params) }) : line.text);

export const replyText = (lines: ReplyLine[]) => lines.map(lineText).join(" ");
