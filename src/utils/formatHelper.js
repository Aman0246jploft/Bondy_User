/**
 * Capitalizes the first letter of each word in a string (Title Case).
 * Handles hyphenated words, ampersands, abbreviations (UX, UI, IT, AI),
 * and Unicode/Cyrillic characters.
 *
 * Examples:
 *  "finance" -> "Finance"
 *  "design & ux" -> "Design & UX"
 *  "coding & software" -> "Coding & Software"
 *  "personal development" -> "Personal Development"
 */
export function capitalizeWords(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .split(" ")
    .map((word) => {
      if (!word) return "";
      return word
        .split("-")
        .map((part) => {
          if (!part) return "";
          const lower = part.toLowerCase();
          if (lower === "ux") return "UX";
          if (lower === "ui") return "UI";
          if (lower === "it") return "IT";
          if (lower === "ai") return "AI";
          if (part === "&") return "&";
          return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join("-");
    })
    .join(" ");
}

/**
 * Returns formatted localized category name with Title Case.
 */
export function formatCategoryName(category, lang = "en") {
  if (!category) return "";
  if (typeof category === "string") return capitalizeWords(category);
  const localized =
    lang === "mn" && (category.name_thi || category.categoryName_mn)
      ? category.name_thi || category.categoryName_mn
      : category.name || category.categoryName || "";
  return capitalizeWords(localized);
}
