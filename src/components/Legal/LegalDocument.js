"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import "./legal.css";

function prepareLegalHtml(html) {
  if (!html) return "";
  let clean = String(html)
    .replace(/&nbsp;/g, " ")
    .replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>/i, "")
    .replace(/^\s*<p\b[^>]*>\s*(last\s*updated|сүүлийн\s*шинэчлэлт)\b[\s\S]*?<\/p>/i, "")
    // Parse numbered headers like <h2>1Data controller</h2> or <h2>1. Data controller</h2>
    .replace(/<h2([^>]*)>\s*(\d+|INTRO)\.?\s*([A-Za-zА-Яа-яЁё][^<]*)<\/h2>/gi, '<h2$1><span class="lg-eyebrow">$2</span>$3</h2>')
    // Ensure space after eyebrow if adjacent
    .replace(/<span class="lg-eyebrow">([^<]+)<\/span>([^\s<])/gi, '<span class="lg-eyebrow">$1</span> $2')
    .trim();
  return clean;
}

export default function LegalDocument({ type = "legal", title, content, loading, updatedAt }) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const body = useMemo(() => prepareLegalHtml(content), [content]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    try {
      const cached = localStorage.getItem("userProfile");
      if (cached) {
        const user = JSON.parse(cached);
        if (user?.role === "ORGANIZER" || user?.roleId === 2) {
          router.push("/Settings");
          return;
        }
      }
    } catch (e) {}
    router.push("/");
  };

  const updated = updatedAt
    ? new Date(updatedAt).toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const isPrivacy = type === "privacy";

  return (
    <div style={{ width: "100%", background: "var(--bd-ink-900, #0b0b0b)", minHeight: "100vh" }}>
      <Header />
      <main className="lg-page">
        <div>
          <div className="legal-header-nav">
            <button
              type="button"
              onClick={handleBack}
              className="legal-back-btn"
              aria-label={language === "mn" ? "Буцах" : "Back"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{language === "mn" ? "Буцах" : "Back"}</span>
            </button>

            <div className="legal-quick-links">
              <Link
                href={isPrivacy ? "/terms" : "/privacy-policy"}
                className="legal-switch-pill"
              >
                {isPrivacy
                  ? (language === "mn" ? "Үйлчилгээний нөхцөл" : "Terms & Conditions")
                  : (language === "mn" ? "Нууцлалын бодлого" : "Privacy Policy")}
              </Link>
            </div>
          </div>

          <h1 className="lg-h1">{title}</h1>
          {updated && <p className="lg-updated">{t("legalUpdated", { date: updated })}</p>}
        </div>

        <section className="lg-card">
          {loading ? (
            <p className="lg-empty">{t("hcLoading")}</p>
          ) : body ? (
            <div className="lg-body" dangerouslySetInnerHTML={{ __html: body }} />
          ) : (
            <p className="lg-empty">{t("legalEmpty")}</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
