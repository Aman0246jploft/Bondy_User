"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import "./legal.css";

function prepareLegalHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/&nbsp;/g, " ")
    .replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>/i, "")
    .replace(/^\s*<p\b[^>]*>\s*(last\s*updated|сүүлийн\s*шинэчлэлт)\b[\s\S]*?<\/p>/i, "")
    .trim();
}

export default function LegalDocument({ title, content, loading, updatedAt }) {
  const { t, language } = useLanguage();
  const body = useMemo(() => prepareLegalHtml(content), [content]);
  const [helpHref] = useState(() => {
    if (typeof window === "undefined") return "/SupportTicketsC";
    try {
      const cached = localStorage.getItem("userProfile");
      if (cached) {
        const user = JSON.parse(cached);
        const isOrganizer = user?.role === "ORGANIZER" || user?.roleId === 2 || user?.organizerVerificationStatus;
        return isOrganizer ? "/SupportTickets" : "/SupportTicketsC";
      }
    } catch (e) { }
    return "/SupportTicketsC";
  });

  const updated = updatedAt
    ? new Date(updatedAt).toLocaleDateString(language === "mn" ? "mn-MN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div style={{ width: "100%", background: "var(--bd-ink-900, #0b0b0b)", minHeight: "100vh" }}>
      <Header />
      <main className="lg-page">
        <div>
          <Link href={helpHref} className="lg-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t("hcTitle")}
          </Link>
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
