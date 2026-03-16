"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations";

import userSettingApi from "@/api/userSettingApi";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const initializeLanguage = async () => {
      let activeLang = "en"; // Default

      // Local storage fallback
      const savedLang = localStorage.getItem("app_lang");
      if (savedLang) activeLang = savedLang;

      // Try fetching from UserSetting API if token is present
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await userSettingApi.getUserSetting();
          if (res.status && res.data && res.data.language) {
            // Map DB value ("English", "Mongolian") to codes ("en", "mn")
            activeLang = res.data.language === "Mongolian" ? "mn" : "en";
            localStorage.setItem("app_lang", activeLang);
          }
        } catch (error) {
          console.error("Failed to sync language context from user settings:", error);
        }
      }

      setLanguage(activeLang);
    };

    initializeLanguage();
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("app_lang", lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
