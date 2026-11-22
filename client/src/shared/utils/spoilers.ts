const SPOILER = /\|\|([\s\S]+?)\|\|/g;

type Segment = { text: string; hidden: boolean };

export const splitSpoilers = (text: string): Segment[] => {
    const segments: Segment[] = [];
    let last = 0;
    for (const match of text.matchAll(SPOILER)) {
        if (match.index > last) segments.push({ text: text.slice(last, match.index), hidden: false });
        segments.push({ text: match[1], hidden: true });
        last = match.index + match[0].length;
    }
    if (last < text.length) segments.push({ text: text.slice(last), hidden: false });
    return segments;
};
