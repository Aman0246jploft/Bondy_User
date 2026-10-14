"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import "./ShareSheet.css";

export default function ShareSheet({ open, onClose, url }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const encoded = encodeURIComponent(url || "");

  const copyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url || "");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url || "";
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success(t("linkCopied"));
      onClose();
    } catch {
      toast.error(t("linkCopyFailed"));
    }
  };

  return (
    <div className="ba-sheet" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="ba-sheet-card" role="dialog" aria-modal="true" aria-label={t("share")}>
        <div className="ba-sh-head">
          <h3>{t("share")}</h3>
          <button type="button" className="ba-sh-x" onClick={onClose} aria-label={t("close")}>
            ×
          </button>
        </div>
        <div className="ba-sh-list">
          <button type="button" className="ba-sh-b" onClick={copyLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" />
              <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5" />
            </svg>
            {t("shareCopyLink")}
          </button>
          <a className="ba-sh-b" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13.5 21v-7.2h2.5l.4-2.9h-2.9V9.1c0-.8.2-1.4 1.4-1.4h1.6V5.1c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.1H8v2.9h2.4V21h3.1Z" />
            </svg>
            {t("shareFacebook")}
          </a>
          <a className="ba-sh-b" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/dialog/send?link=${encoded}&redirect_uri=${encoded}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3.6c-4.7 0-8.4 3.4-8.4 7.8 0 2.4 1.1 4.5 3 5.9v3.1l2.9-1.5c.8.2 1.6.3 2.5.3 4.7 0 8.4-3.4 8.4-7.8S16.7 3.6 12 3.6Z" />
              <path d="M7.6 13.4l2.6-2.7 2 1.7 2.3-2.4" />
            </svg>
            {t("shareMessenger")}
          </a>
        </div>
        <p className="ba-sh-url">{url}</p>
      </div>
    </div>
  );
}
