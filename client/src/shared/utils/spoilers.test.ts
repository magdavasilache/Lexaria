import { describe, expect, it } from "vitest";
import { splitSpoilers } from "./spoilers";

describe("splitSpoilers", () => {
  it("hides text between pairs of bars", () => {
    expect(splitSpoilers("The butler ||did it|| in the end.")).toEqual([
      { text: "The butler ", hidden: false },
      { text: "did it", hidden: true },
      { text: " in the end.", hidden: false },
    ]);
  });

  it("handles several spoilers and line breaks", () => {
    expect(splitSpoilers("||a\nb|| and ||c||")).toEqual([
      { text: "a\nb", hidden: true },
      { text: " and ", hidden: false },
      { text: "c", hidden: true },
    ]);
  });

  it("leaves unmatched or empty markers as plain text", () => {
    expect(splitSpoilers("a || b")).toEqual([{ text: "a || b", hidden: false }]);
    expect(splitSpoilers("||||")).toEqual([{ text: "||||", hidden: false }]);
  });
});
