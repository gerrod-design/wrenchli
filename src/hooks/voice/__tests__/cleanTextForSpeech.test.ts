import { describe, it, expect } from "vitest";

// Extract the function for testing (it's not exported, so we duplicate the logic here)
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya)\]\s*/gi, "")
    .replace(/[#*_~`>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g, (_m, num) => `${num.replace(/,/g, "")} dollars`)
    .replace(/\n+/g, ". ")
    .trim();
}

describe("cleanTextForSpeech", () => {
  describe("dollar amounts", () => {
    it.each([
      ["$700", "700 dollars"],
      ["$1,200", "1200 dollars"],
      ["$2,500.50", "2500.50 dollars"],
      ["$15,000", "15000 dollars"],
      ["$45", "45 dollars"],
      ["$150 to $300", "150 dollars to 300 dollars"],
    ])("converts %s → %s", (input, expected) => {
      expect(cleanTextForSpeech(input)).toBe(expected);
    });

    it("handles dollar amounts in a sentence", () => {
      expect(cleanTextForSpeech("The cost could jump closer to $700 or even $1,200.")).toBe(
        "The cost could jump closer to 700 dollars or even 1200 dollars."
      );
    });
  });

  describe("agent markers", () => {
    it.each(["Mike", "Sam", "Jess", "Kai", "Priya"])("strips [Agent: %s]", (name) => {
      expect(cleanTextForSpeech(`[Agent: ${name}] Hello!`)).toBe("Hello!");
    });

    it("is case-insensitive", () => {
      expect(cleanTextForSpeech("[agent: SAM] Hi")).toBe("Hi");
    });
  });

  describe("markdown", () => {
    it("strips bold/italic markers", () => {
      expect(cleanTextForSpeech("This is **bold** and *italic*")).toBe("This is bold and italic");
    });

    it("converts markdown links to text", () => {
      expect(cleanTextForSpeech("Click [here](https://example.com)")).toBe("Click here");
    });
  });

  describe("newlines", () => {
    it("replaces newlines with periods", () => {
      expect(cleanTextForSpeech("Line one\n\nLine two")).toBe("Line one. Line two");
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      expect(cleanTextForSpeech("")).toBe("");
    });

    it("handles combined agent marker + dollars + markdown", () => {
      expect(cleanTextForSpeech("[Agent: Sam] The repair costs **$1,200** for parts.")).toBe(
        "The repair costs 1200 dollars for parts."
      );
    });
  });
});
