"use client";

import React, { useEffect, useState } from "react";
import globalSettingApi from "@/api/globalSettingApi";
import { useLanguage } from "@/context/LanguageContext";
import LegalDocument from "@/components/Legal/LegalDocument";

export default function PrivacyPolicy() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      try {
        const primary = language === "mn"
          ? await globalSettingApi.getPrivacyPolicyMn().catch(() => null)
          : await globalSettingApi.getPrivacyPolicy();
        const chosen = primary?.status && primary?.data?.value
          ? primary
          : await globalSettingApi.getPrivacyPolicy();
        if (chosen?.status && chosen?.data?.value) {
          setContent(String(chosen.data.value).replace(/&nbsp;/g, " "));
          setUpdatedAt(chosen.data.updatedAt || "");
        } else {
          setContent("");
          setUpdatedAt("");
        }
      } catch (error) {
        console.error("Error fetching privacy policy:", error);
        setContent("");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
    document.title = `${t("privacyPolicy")} | Bondy`;
  }, [language, t]);

  return (
    <LegalDocument
      type="privacy"
      title={t("privacyPolicy")}
      content={content}
      loading={loading}
      updatedAt={updatedAt}
    />
  );
}
