"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const languages = [
  {
    code: "en-us",
    label: "Eng",
    name: "English (US)",
    flag: "/img/usflag.svg",
  },
  {
    code: "hi-in",
    label: "Hin",
    name: "Hindi (IN)",
    flag: "/img/india.svg",
  },
  {
    code: "en-uk",
    label: "Eng",
    name: "English (UK)",
    flag: "/img/usflag.svg",
  },
];

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);

  const wrapperRef = useRef(null);

  const handleSelect = (lang) => {
    setSelectedLang(lang);
    setOpen(false);
  };

  // 👇 Outside click close logic
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="lang-wrapper" ref={wrapperRef}>
      <button
        className="lang-selector"
        onClick={() => setOpen(!open)}
      >
        <Image
          src={selectedLang.flag}
          alt={selectedLang.name}
          width={28}
          height={18}
          className="lang-flag"
        />
        <span className="lang-text">{selectedLang.label}</span>

        <svg
          className={`lang-arrow ${open ? "rotate" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="lang-dropdown">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`lang-option ${
                selectedLang.code === lang.code ? "active" : ""
              }`}
              onClick={() => handleSelect(lang)}
            >
              <Image src={lang.flag} alt={lang.name} width={24} height={16} />
              <span>{lang.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
