import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const ExpandableText = ({ text, limit = 250, className = "section-text" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > limit;
  const displayedText = isExpanded ? text : text.slice(0, limit);

  const { t } = useLanguage();

  return (
    <div className={className}>
      <p
        style={{
          marginBottom: "5px",
          color: "inherit",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word"
        }}
      >
        {displayedText}
        {!isExpanded && shouldTruncate && "..."}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "none",
            border: "none",
            color: "var(--primary-teal, #23ada4)",
            fontWeight: "600",
            padding: "0",
            fontSize: "0.9rem",
            cursor: "pointer",
            marginTop: "2px"
          }}
        >
          {isExpanded ? t("viewLess") : t("viewMore")}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
