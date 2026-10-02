"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import globalSettingApi from "../api/globalSettingApi";
import stayUpdatedApi from "../api/stayUpdatedApi";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function BondyFooter() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    instagram: "",
    youtube: "",
  });

  const DEFAULT_FOOTER_LINKS = {
    explore: [
      { label: language === "en" ? "Events" : "Арга хэмжээ", href: "/Explore" },
      { label: language === "en" ? "Courses" : "Сургалт", href: "/Programs-Listing" },
      { label: language === "en" ? "Organizers" : "Зохион байгуулагчид", href: "/Organizers" },
    ],
    organizer: [
      { label: language === "en" ? "Become an organizer" : "Зохион байгуулагч болох", href: "/register?role=organizer" },
      { label: language === "en" ? "Partner with us" : "Хамтрагч болох", href: "/#partner" },
      { label: language === "en" ? "Dashboard" : "Хяналтын самбар", href: "/Dashboard" },
    ],
    help: [
      { label: language === "en" ? "Contact Us" : "Холбоо барих", href: "/contact-us" },
      { label: language === "en" ? "Privacy Policy" : "Нууцлалын бодлого", href: "/privacy-policy" },
      { label: language === "en" ? "Terms of Service" : "Үйлчилгээний нөхцөл", href: "/terms" },
    ],
  };

  const [footerLinks, setFooterLinks] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [socialRes, footerRes] = await Promise.allSettled([
          globalSettingApi.getSocialLinks(),
          globalSettingApi.getFooterLinks(),
        ]);

        if (socialRes.status === "fulfilled" && socialRes.value?.status && socialRes.value?.data?.value) {
          const links = socialRes.value.data.value;
          setSocialLinks({
            facebook: links.facebook || "",
            instagram: links.instagram || "",
            youtube: links.youtube || "",
          });
        }

        if (footerRes.status === "fulfilled" && footerRes.value?.status && footerRes.value?.data?.value) {
          setFooterLinks(footerRes.value.data.value);
        }
      } catch (error) {
        console.error("Footer fetch error:", error);
      }
    };
    fetchData();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(t("pleaseEnterEmail") || "Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error(t("pleaseEnterValidEmail") || "Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const response = await stayUpdatedApi.signup({ email: email.trim() });
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

  // Only render social icon if the link is actually configured
  const isValidLink = (url) => url && url.trim() !== "" && url.trim() !== "#";

  // Auth-aware dashboard navigation
  const handleDashboardClick = (e) => {
    e.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error(
        language === "en"
          ? "Please log in to access the dashboard"
          : "Хяналтын самбарт хандахын тулд нэвтэрнэ үү"
      );
      router.push("/login");
      return;
    }
    router.push("/Dashboard");
  };

  // Smooth scroll to #partner on homepage, navigate from other pages
  const handlePartnerClick = (e) => {
    e.preventDefault();
    if (window.location.pathname === "/") {
      const el = document.getElementById("partner");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#partner");
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
              {isValidLink(socialLinks.instagram) && (
                <a href={socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
                  </svg>
                </a>
              )}
              {isValidLink(socialLinks.facebook) && (
                <a href={socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M14.5 8.5V6.9c0-.8.2-1.2 1.4-1.2h1.5V3h-2.5c-2.6 0-3.6 1.5-3.6 3.6v1.9H9.2V11h2.1v10h3.2V11h2.3l.4-2.5h-2.7Z"
                      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
              {isValidLink(socialLinks.youtube) && (
                <a href={socialLinks.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="2.6" y="5.4" width="18.8" height="13.2" rx="4" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M10.4 9.4l4.8 2.6-4.8 2.6V9.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
              {!isValidLink(socialLinks.instagram) && !isValidLink(socialLinks.facebook) && !isValidLink(socialLinks.youtube) && (
                <span style={{ fontSize: 12, color: "var(--bd-gray-600)" }}>
                  {language === "en" ? "Social links coming soon" : "Удахгүй нэмэгдэнэ"}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Footer Nav Columns */}
          {[
            { key: "explore", titleEn: "Explore", titleMn: "Судлах" },
            { key: "organizer", titleEn: "Organizer", titleMn: "Зохион байгуулагч" },
            { key: "help", titleEn: "Help", titleMn: "Тусламж" },
          ].map(({ key, titleEn, titleMn }) => {
            const cols = footerLinks || DEFAULT_FOOTER_LINKS;
            const links = cols[key] || [];
            return (
              <div key={key} className="bd-footer-col">
                <h4 className="bd-footer-h4">{language === "en" ? titleEn : titleMn}</h4>
                <nav className="bd-footer-links">
                  {links.map((link, idx) => {
                    const isExternal = link.href?.startsWith("http");
                    const isDashboard = link.href === "/Dashboard";
                    const isPartner = link.href === "/#partner";

                    if (isDashboard) {
                      return (
                        <a key={idx} href="/Dashboard" onClick={handleDashboardClick} style={{ cursor: "pointer" }}>
                          {link.label}
                        </a>
                      );
                    }
                    if (isPartner) {
                      return (
                        <a key={idx} href="/#partner" onClick={handlePartnerClick} style={{ cursor: "pointer" }}>
                          {link.label}
                        </a>
                      );
                    }
                    if (isExternal) {
                      return (
                        <a key={idx} href={link.href} target="_blank" rel="noreferrer">
                          {link.label}
                        </a>
                      );
                    }
                    return (
                      <Link key={idx} href={link.href}>
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
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
