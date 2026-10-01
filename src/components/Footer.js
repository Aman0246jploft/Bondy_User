"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import globalSettingApi from "../api/globalSettingApi";
import stayUpdatedApi from "../api/stayUpdatedApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function BondyFooter() {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    facebook: "#",
    instagram: "#",
    youtube: "#",
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const response = await globalSettingApi.getSocialLinks();
        if (response?.status && response?.data?.value) {
          const links = response.data.value;
          setSocialLinks({
            facebook: links.facebook || "#",
            instagram: links.instagram || "#",
            youtube: links.youtube || "#",
          });
        }
      } catch (error) {
        console.error("Error fetching social links:", error);
      }
    };
    fetchSocialLinks();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(t("pleaseEnterEmail") || "Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("pleaseEnterValidEmail") || "Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const response = await stayUpdatedApi.signup({ email });
      if (response?.status === true) {
        setEmail("");
        toast.success(t("thanksForSigningUp") || "Thanks for subscribing!");
      }
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bd-footer">
      <div className="bd-footer-inner">
        <div className="bd-footer-grid">
          {/* Brand Info */}
          <div className="bd-footer-brand">
            <Link href="/" aria-label="Bondy">
              <img src="/img/bondy-logo.svg" alt="Bondy" style={{ height: "30px", width: "auto" }} />
            </Link>
            <p className="bd-footer-tag">
              {language === "en"
                ? "Unified platform for tickets, registration, courses and community events."
                : "Тасалбар, бүртгэл, сургалтын нэгдсэн систем."}
            </p>
            <div className="bd-footer-social">
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
                </svg>
              </a>
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14.5 8.5V6.9c0-.8.2-1.2 1.4-1.2h1.5V3h-2.5c-2.6 0-3.6 1.5-3.6 3.6v1.9H9.2V11h2.1v10h3.2V11h2.3l.4-2.5h-2.7Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2.6" y="5.4" width="18.8" height="13.2" rx="4" stroke="currentColor" strokeWidth="1.7" />
                  <path
                    d="M10.4 9.4l4.8 2.6-4.8 2.6V9.4Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 1: Explore */}
          <div className="bd-footer-col">
            <h4 className="bd-footer-h4">{language === "en" ? "Explore" : "Судлах"}</h4>
            <nav className="bd-footer-links">
              <Link href="/Explore">{t("events") || "Events"}</Link>
              <Link href="/Programs-Listing">{t("courses") || "Courses"}</Link>
              <Link href="/Organizers">{t("organizers") || "Organizers"}</Link>
            </nav>
          </div>

          {/* Col 2: Organizer */}
          <div className="bd-footer-col">
            <h4 className="bd-footer-h4">{language === "en" ? "Organizer" : "Зохион байгуулагч"}</h4>
            <nav className="bd-footer-links">
              <Link href="/register?role=organizer">{t("becomeAnOrganizer") || "Become an organizer"}</Link>
              <Link href="/Dashboard">{t("organizerSection") || "Dashboard"}</Link>
            </nav>
          </div>

          {/* Col 3: Help */}
          <div className="bd-footer-col">
            <h4 className="bd-footer-h4">{language === "en" ? "Help" : "Тусламж"}</h4>
            <nav className="bd-footer-links">
              <Link href="/help">{t("helpCenter") || "Help Center"}</Link>
              <Link href="/privacy-policy">{t("privacyPolicy") || "Privacy Policy"}</Link>
              <Link href="/terms">{t("termsConditions") || "Terms of Service"}</Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bd-footer-bar">
          <div>© {new Date().getFullYear()} Bondy LLC. {t("allRightsReserved") || "All rights reserved."}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setLanguage("mn")}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontWeight: language === "mn" ? "700" : "500",
                color: language === "mn" ? "var(--bd-teal-400)" : "var(--bd-gray-600)",
                fontSize: "13px",
              }}
            >
              Монгол
            </button>
            <span style={{ color: "var(--bd-border)" }}>·</span>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontWeight: language === "en" ? "700" : "500",
                color: language === "en" ? "var(--bd-teal-400)" : "var(--bd-gray-600)",
                fontSize: "13px",
              }}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
