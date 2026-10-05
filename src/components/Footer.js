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
  const [socialLinks, setSocialLinks] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("bondy_social_links");
        if (cached) return JSON.parse(cached);
      } catch (e) { }
    }
    return { facebook: "", instagram: "", youtube: "", linkedin: "" };
  });

  const [footerLinks, setFooterLinks] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("bondy_footer_links");
        if (cached) return JSON.parse(cached);
      } catch (e) { }
    }
    return null;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [socialRes, footerRes] = await Promise.allSettled([
          globalSettingApi.getSocialLinks(),
          globalSettingApi.getFooterLinks(),
        ]);

        if (socialRes.status === "fulfilled" && socialRes.value?.status && socialRes.value?.data?.value) {
          const links = socialRes.value.data.value;
          const newSocial = {
            facebook: links.facebook || "",
            instagram: links.instagram || "",
            youtube: links.youtube || "",
            linkedin: links.linkedin || "",
          };
          setSocialLinks(newSocial);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("bondy_social_links", JSON.stringify(newSocial));
            } catch (e) { }
          }
        }

        if (footerRes.status === "fulfilled" && footerRes.value?.status) {
          const val = footerRes.value?.data?.value || footerRes.value?.data;
          if (val) {
            setFooterLinks(val);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("bondy_footer_links", JSON.stringify(val));
              } catch (e) { }
            }
          }
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
  const isValidLink = (url) => url && typeof url === "string" && url.trim() !== "" && url.trim() !== "#";

  // Unified click handler for footer navigation
  const handleLinkClick = (e, href) => {
    console.log("duffer", href, e)
    if (!href || href === "#") {
      e.preventDefault();
      return;
    }

    // External links open normally
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return;
    }

    // Smooth scroll for #partner
    if (href === "/#partner" || href === "#partner") {
      e.preventDefault();
      if (typeof window !== "undefined") {
        if (window.location.pathname === "/") {
          const el = document.getElementById("partner");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            return;
          }
        }
        router.push("/#partner");
      }
      return;
    }

    // Auth-aware Dashboard navigation
    if (href === "/Dashboard") {
      e.preventDefault();
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast.error(
          language === "en"
            ? "Please log in to access the dashboard"
            : "Хяналтын самбарт хандахын тулд нэвтэрнэ үү"
        );
        router.push("/login");
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }
      router.push("/Dashboard");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    // Internal navigation with immediate scroll-to-top
    e.preventDefault();
    router.push(href);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const getLabel = (link) => {
    if (!link) return "";
    if (language === "mn") {
      return link.labelMn || link.name_mn || link.name_thi || link.label || link.labelEn || link.name || "";
    }
    return link.labelEn || link.label || link.name || "";
  };

  const getHref = (link) => {
    if (!link) return "#";
    return link.href || link.url || link.link || "#";
  };

  return (
    <footer className="bd-footer">
      <div className="bd-footer-inner">
        <div className="bd-footer-grid">
          {/* Brand Info */}
          <div className="bd-footer-brand">
            <Link
              href="/"
              aria-label="Bondy"
              onClick={(e) => handleLinkClick(e, "/")}
              className="cursor-pointer"
              style={{ display: "inline-block", cursor: "pointer" }}
            >
              <img src="/img/bondy-logo.svg" alt="Bondy" style={{ height: "30px", width: "auto" }} />

            </Link>
            <p className="bd-footer-tag">
              {language === "en"
                ? "Unified platform for tickets, registration, courses and community events."
                : "Тасалбар, бүртгэл, сургалтын нэгдсэн систем."}
            </p>
            <div className="bd-footer-social">
              {isValidLink(socialLinks.instagram) && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="bd-footer-social-link cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
                  </svg>
                </a>
              )}
              {isValidLink(socialLinks.facebook) && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="bd-footer-social-link cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M14.5 8.5V6.9c0-.8.2-1.2 1.4-1.2h1.5V3h-2.5c-2.6 0-3.6 1.5-3.6 3.6v1.9H9.2V11h2.1v10h3.2V11h2.3l.4-2.5h-2.7Z"
                      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
              {isValidLink(socialLinks.youtube) && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="bd-footer-social-link cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="2.6" y="5.4" width="18.8" height="13.2" rx="4" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M10.4 9.4l4.8 2.6-4.8 2.6V9.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
              {isValidLink(socialLinks.linkedin) && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="bd-footer-social-link cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"
                      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </a>
              )}
              {!isValidLink(socialLinks.instagram) &&
                !isValidLink(socialLinks.facebook) &&
                !isValidLink(socialLinks.youtube) &&
                !isValidLink(socialLinks.linkedin) && (
                  <span style={{ fontSize: 12, color: "var(--bd-gray-600)" }}>
                    {language === "en" ? "Social links coming soon" : "Удахгүй нэмэгдэнэ"}
                  </span>
                )}
            </div>
          </div>
          {/* Dynamic Footer Nav Columns */}
          {[
            { key: "explore", titleEn: "Explore", titleMn: "Судлах", defaultRoute: "/Explore" },
            { key: "organizer", titleEn: "Organizer", titleMn: "Зохион байгуулагч", defaultRoute: "/register?role=organizer" },
            { key: "help", titleEn: "Help", titleMn: "Тусламж", defaultRoute: "/contact-us" },
          ].map(({ key, titleEn, titleMn, defaultRoute }) => {
            const cols = footerLinks || {};
            const links = cols[key] || [];
            const colTitle = language === "en"
              ? (footerLinks?.titles?.[key]?.en || titleEn)
              : (footerLinks?.titles?.[key]?.mn || titleMn);

            return (
              <div key={key} className="bd-footer-col">
                <h4 className="bd-footer-h4">
                  <a
                    href={defaultRoute}
                    onClick={(e) => handleLinkClick(e, defaultRoute)}
                    className="cursor-pointer"
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      pointerEvents: "auto",
                    }}
                  >
                    {colTitle}
                  </a>
                </h4>
                <nav className="bd-footer-links" style={{ cursor: "pointer" }}>
                  {links.length === 0 && !footerLinks && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
                      <span style={{ height: 16, width: 85, background: "rgba(255,255,255,0.08)", borderRadius: 4, display: "inline-block" }} />
                      <span style={{ height: 16, width: 105, background: "rgba(255,255,255,0.08)", borderRadius: 4, display: "inline-block" }} />
                      <span style={{ height: 16, width: 95, background: "rgba(255,255,255,0.08)", borderRadius: 4, display: "inline-block" }} />
                    </div>
                  )}
                  {links.map((link, idx) => {
                    const href = getHref(link);
                    const label = getLabel(link);
                    const isExternal = href.startsWith("http://") || href.startsWith("https://");

                    return (
                      <a
                        key={idx}
                        href={href}
                        onClick={(e) => handleLinkClick(e, href)}
                        className="bd-footer-link cursor-pointer"
                        style={{ cursor: "pointer", pointerEvents: "auto", display: "inline-flex", alignItems: "center" }}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                      >
                        <span style={{ cursor: "pointer", pointerEvents: "none" }}>{label}</span>
                      </a>
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
