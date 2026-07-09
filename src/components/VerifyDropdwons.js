"use client";
import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const VerifyDropdwons = ({ fullName, variant = "icon" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { t } = useLanguage();
  const displayName = fullName?.trim() || "Bondy";

  return (
    <div className="verified-wrapper p-0 d-inline-block">
      {/* Clickable Icon/Pill */}
      <div 
        className="verified-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        style={variant === "pill" ? {
          background: "rgba(35, 173, 164, 0.1)", 
          border: "1px solid #23ada4", 
          color: "#23ada4", 
          borderRadius: "20px", 
          padding: "4px 12px", 
          fontSize: "12px", 
          fontWeight: "600",
          textTransform: "uppercase",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          verticalAlign: "middle"
        } : undefined}
      >
        <img 
          src="/img/veriy_icon.svg" 
          alt={t("verifiedOrganizer")} 
          style={variant === "pill" ? { width: "14px", height: "14px" } : undefined} 
        />
        {variant === "pill" && (t("verified") || "VERIFIED")}
      </div>

      {isOpen && (
        <div className="verified-dropdown">
          <div className="verified-header">
            <div className="verified-icon-box">
              <img src="/img/shield.svg" alt={t("verifiedOrganizer")} />
            </div>
            <div>
              <h3 className="verified-title-main">{t("verifiedOrganizer")}</h3>
              <p className="verified-name">{displayName}</p>
              <p className="verified-date">{t("verifiedOnDate", { date: "Jan 2024" })}</p>
            </div>
          </div>

          <div className="verified-divider"></div>

          <h4 className="verified-section-title">{t("whatsVerified")}</h4>
          <ul className="verified-list">
            <li className="verified-list-item">
              <svg
                className="verified-check"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t("identityVerifiedDesc")}
            </li>
            <li className="verified-list-item">
              <svg
                className="verified-check"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t("contactVerifiedDesc")}
            </li>
            <li className="verified-list-item">
              <svg
                className="verified-check"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t("payoutVerifiedDesc")}
            </li>
            <li className="verified-list-item">
              <svg
                className="verified-check"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t("businessVerifiedDesc")}
            </li>
          </ul>

          <div className="verified-divider"></div>

          <p className="verified-footer">{t("verifiedDisclaimer")}</p>
        </div>
      )}
    </div>
  );
};

export default VerifyDropdwons;
