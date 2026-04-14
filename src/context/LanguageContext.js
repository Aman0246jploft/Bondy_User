"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { translations } from "./translations";
import userSettingApi from "@/api/userSettingApi";
import toast from "react-hot-toast";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const isInitialSyncDone = useRef(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      let activeLang = "en";

      // 1. Local storage fallback (instant)
      const savedLang = localStorage.getItem("app_lang");
      if (savedLang) {
        activeLang = savedLang;
        setLanguage(savedLang);
      }

      // 2. Sync from backend if logged in
      const token = localStorage.getItem("token");
      if (token && !isInitialSyncDone.current) {
        try {
          const res = await userSettingApi.getUserSetting();
          if (res.status && res.data && res.data.language) {
            const dbLang = res.data.language === "Mongolian" ? "mn" : "en";
            // Only update if it's different from current state (which might have been toggled by user while loading)
            setLanguage((prev) => {
              if (prev !== dbLang && !localStorage.getItem("manual_lang_switch")) {
                localStorage.setItem("app_lang", dbLang);
                return dbLang;
              }
              return prev;
            });
          }
        } catch (error) {
          console.error("Failed to sync language context:", error);
        } finally {
          isInitialSyncDone.current = true;
          localStorage.removeItem("manual_lang_switch");
        }
      }
    };

    initializeLanguage();
  }, []);

  const changeLanguage = useCallback(async (lang) => {
    setLanguage(lang);
    localStorage.setItem("app_lang", lang);
    localStorage.setItem("manual_lang_switch", "true"); // Flag to prevent override by initial sync if it's still pending

    // Sync to backend
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = {
          language: lang === "mn" ? "Mongolian" : "English"
        };
        const res = await userSettingApi.updateUserSetting(payload);
        if (res.status) {
          // toast.success(translations[lang]?.languageUpdated || "Language preference saved");
        }
      } catch (error) {
        console.error("Failed to save language preference to backend:", error);
      }
    }
  }, []);

  const t = useCallback((key, params = {}) => {
    let text = translations[language]?.[key] || translations["en"]?.[key] || key;
    // Interpolate {variableName} placeholders with provided params
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
    });
    return text;
  }, [language]);

  const value = useMemo(() => ({
    language,
    changeLanguage,
    t
  }), [language, changeLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
