"use client";

import React, { useEffect, useState } from "react";
import globalSettingApi from "@/api/globalSettingApi";
import { useLanguage } from "@/context/LanguageContext";
import LegalDocument from "@/components/Legal/LegalDocument";

export default function TermsConditions() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      setLoading(true);
      try {
        const primary = language === "mn"
          ? await globalSettingApi.getTermsConditionsMn().catch(() => null)
          : await globalSettingApi.getTermsConditions();
        const chosen = primary?.status && primary?.data?.value
          ? primary
          : await globalSettingApi.getTermsConditions();
        if (chosen?.status && chosen?.data?.value) {
          setContent(String(chosen.data.value).replace(/&nbsp;/g, " "));
          setUpdatedAt(chosen.data.updatedAt || "");
        } else {
          setContent("");
          setUpdatedAt("");
        }
      } catch (error) {
        console.error("Error fetching terms & conditions:", error);
        setContent("");
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
    document.title = `${t("termsConditions")} | Bondy`;
  }, [language, t]);

  return (
    <LegalDocument
      title={t("termsConditions")}
      content={content}
      loading={loading}
      updatedAt={updatedAt}
    />
  );
}
