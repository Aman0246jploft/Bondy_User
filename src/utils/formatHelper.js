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
 * Checks if a string looks like a raw MongoDB ObjectId (24 hex characters).
 */
export function isMongoId(val) {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(val.trim());
}

/**
 * Returns formatted localized category name with Title Case.
 * Guaranteed never to return a raw MongoDB ObjectId.
 */
export function formatCategoryName(category, lang = "en") {
  if (!category) return "";
  if (typeof category === "string") {
    if (isMongoId(category)) return "";
    return capitalizeWords(category);
  }
  const localized =
    lang === "mn" && (category.name_thi || category.categoryName_mn || category.nameMn)
      ? category.name_thi || category.categoryName_mn || category.nameMn
      : category.name || category.categoryName || category.name_thi || "";
  if (isMongoId(localized)) return "";
  return capitalizeWords(localized);
}

/**
 * Ensures any identifier shown to the user is safe and not a raw Mongo ID.
 * If given a Mongo ID, formats it as a short human-readable reference, e.g. REQ-XXXXXX.
 */
export function formatDisplayId(id, prefix = "ID") {
  if (!id) return "—";
  const str = String(id).trim();
  if (isMongoId(str)) {
    return `${prefix}-${str.slice(-6).toUpperCase()}`;
  }
  return str;
}
