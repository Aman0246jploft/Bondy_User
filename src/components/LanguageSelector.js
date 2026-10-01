"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

export default function LanguageSelector({ className = "", style = {} }) {
  const { language, changeLanguage } = useLanguage();

  const handleSelect = (langCode) => {
    if (langCode === language) return;
    changeLanguage(langCode);
    if (langCode === "mn") {
      toast.success("Хэлийг Монгол болгож өөрчиллөө");
    } else {
      toast.success("Language changed to English");
    }
  };

  const isMn = language === "mn";
  const isEn = language === "en" || !language;

  return (
    <div
      className={`bd-lang-switch ${className}`}
      data-lang-switch
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        padding: "3px",
        borderRadius: "999px",
        background: "var(--bd-ink-850, #161616)",
        border: "1px solid var(--bd-border, #303030)",
        flexShrink: 0,
        boxSizing: "border-box",
        ...style,
      }}
    >
      <button
        type="button"
        data-lang="mn"
        aria-label="Mongolian"
        onClick={() => handleSelect("mn")}
        style={{
          height: "26px",
          padding: "0 10px",
          border: "none",
          borderRadius: "999px",
          background: isMn ? "var(--acc, #23ADA4)" : "transparent",
          color: isMn ? "#FFFFFF" : "var(--bd-gray-400, #a3a3a3)",
          fontFamily: "var(--bd-font-ui, system-ui, -apple-system, sans-serif)",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.02em",
          cursor: "pointer",
          transition: "background 200ms cubic-bezier(.2,.8,.2,1), color 200ms cubic-bezier(.2,.8,.2,1)",
          lineHeight: "26px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          outline: "none",
        }}
      >
        MN
      </button>
      <button
        type="button"
        data-lang="en"
        aria-label="English"
        onClick={() => handleSelect("en")}
        style={{
          height: "26px",
          padding: "0 10px",
          border: "none",
          borderRadius: "999px",
          background: isEn ? "var(--acc, #23ADA4)" : "transparent",
          color: isEn ? "#FFFFFF" : "var(--bd-gray-400, #a3a3a3)",
          fontFamily: "var(--bd-font-ui, system-ui, -apple-system, sans-serif)",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.02em",
          cursor: "pointer",
          transition: "background 200ms cubic-bezier(.2,.8,.2,1), color 200ms cubic-bezier(.2,.8,.2,1)",
          lineHeight: "26px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          outline: "none",
        }}
      >
        EN
      </button>
    </div>
  );
}

