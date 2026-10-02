"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import organizerApi from "@/api/organizerApi";
import { useLanguage } from "@/context/LanguageContext";

function OrganizersContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const [featured, setFeatured] = useState(() => {
    return searchParams.get("featured") === "1" || searchParams.get("featured") === "true";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    document.title = t("organizersPageTitle") || "Зохион байгуулагчид - Bondy";
  }, [t]);

  // Debounce search query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch organizers from API
  const fetchOrganizers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (featured) params.featured = 1;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await organizerApi.getPublicOrganizers(params);
      if (res?.data?.organizers) {
        setOrganizers(res.data.organizers);
      } else if (Array.isArray(res?.data)) {
        setOrganizers(res.data);
      } else {
        setOrganizers([]);
      }
    } catch (err) {
      console.error("Failed to load organizers:", err);
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  }, [featured, debouncedSearch]);

  useEffect(() => {
    fetchOrganizers();
  }, [fetchOrganizers]);

  // Filter client-side for instantaneous feedback while typing
  const filteredOrganizers = organizers.filter((o) => {
    // Only approved/verified organizers
    if (o.isApproved === false && o.verified === false) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const nameMatch = (o.name || "").toLowerCase().includes(q);
    const catMatch = (o.category || "").toLowerCase().includes(q);
    const bioMatch = (o.bio || "").toLowerCase().includes(q) || (o.shortDesc || "").toLowerCase().includes(q);
    return nameMatch || catMatch || bioMatch;
  });

  const isEmpty = !loading && filteredOrganizers.length === 0;

  return (
    <main
      id="top"
      data-screen-label="Organizers"
      style={{
        maxWidth: "1224px",
        margin: "0 auto",
        padding: "clamp(32px, 3.4vw, 48px) clamp(20px, 4vw, 32px) clamp(56px, 5vw, 80px)",
      }}
    >
      {/* Breadcrumb navigation */}
      <nav
        className="bd-crumb"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          color: "var(--bd-gray-600, #979797)",
          marginBottom: "12px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "var(--bd-gray-600, #979797)",
            textDecoration: "none",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bd-white, #FFFFFF)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--bd-gray-600, #979797)")}
        >
          {t("home") || "Нүүр"}
        </Link>
        <span>/</span>
        <span style={{ color: "var(--bd-gray-400, #BCC8C8)" }}>
          {t("organizersTitle") || "Зохион байгуулагчид"}
        </span>
      </nav>

      {/* Main Title & Subtitle */}
      <h1
        className="bd-h1"
        style={{
          margin: 0,
          fontFamily: "var(--bd-font-ui, 'Plus Jakarta Sans', sans-serif)",
          fontSize: "clamp(30px, 3.4vw, 40px)",
          fontWeight: 700,
          lineHeight: 1.06,
          letterSpacing: "-.022em",
          color: "var(--bd-white, #FFFFFF)",
        }}
      >
        {t("organizersTitle") || "Зохион байгуулагчид"}
      </h1>

      <p
        style={{
          margin: "10px 0 0",
          fontSize: "16px",
          lineHeight: 1.5,
          color: "var(--bd-gray-500, #B3B3B3)",
          maxWidth: "52ch",
        }}
      >
        {t("organizersSubtitle") || "Улаанбаатарын студи, клуб, академиуд."}
      </p>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => e.preventDefault()}
        style={{
          display: "flex",
          marginTop: "clamp(22px, 2.4vw, 30px)",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: "1 1 auto",
            maxWidth: "420px",
            minWidth: 0,
            height: "48px",
            padding: "0 18px",
            borderRadius: "999px",
            background: "var(--bd-ink-850, #161616)",
            border: isSearchFocused
              ? "1px solid var(--acc, #23ADA4)"
              : "1px solid var(--bd-border, rgba(255,255,255,.08))",
            boxShadow: isSearchFocused ? "0 0 0 3px rgba(35, 173, 164, 0.15)" : "none",
            cursor: "text",
            transition: "border-color 200ms cubic-bezier(.2,.8,.2,1), box-shadow 200ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {/* Magnifier Search Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              width: "20px",
              height: "20px",
              display: "inline-flex",
              flexShrink: 0,
              color: "var(--bd-gray-600, #979797)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={t("organizersSearchPlaceholder") || "Студи, клуб, академи…"}
            style={{
              flex: 1,
              minWidth: 0,
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--bd-white, #FFFFFF)",
              fontFamily: "var(--bd-font-ui, 'Plus Jakarta Sans', sans-serif)",
              fontSize: "15px",
              padding: 0,
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={t("clearFilter") || "Цэвэрлэх"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                border: "none",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                color: "var(--bd-gray-300, #D9D9D9)",
                fontSize: "12px",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </label>
      </form>

      {/* Featured Filter Chip */}
      {featured && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "16px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "34px",
              padding: "0 6px 0 14px",
              borderRadius: "999px",
              border: "1px solid var(--acc, #23ADA4)",
              background: "rgba(35, 173, 164, 0.1)",
              color: "var(--bd-white, #FFFFFF)",
              fontFamily: "var(--bd-font-ui, 'Plus Jakarta Sans', sans-serif)",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            {t("organizersFeaturedFirst") || "Онцлох нь эхэлж"}
            <button
              type="button"
              onClick={() => setFeatured(false)}
              aria-label={t("organizersClearFilter") || "Шүүлтийг цэвэрлэх"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "22px",
                height: "22px",
                border: "none",
                borderRadius: "999px",
                background: "rgba(255,255,255,.08)",
                color: "var(--bd-gray-300, #D9D9D9)",
                fontSize: "14px",
                lineHeight: 1,
                cursor: "pointer",
                transition: "background 150ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.08)")}
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Organizers Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
          marginTop: "clamp(20px, 2vw, 26px)",
        }}
      >
        {/* Loading Skeletons */}
        {loading && organizers.length === 0 && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={`skel-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "18px",
                  borderRadius: "20px",
                  background: "var(--bd-ink-850, #161616)",
                  border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
                  animation: "pulse 1.5s infinite ease-in-out",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div
                    style={{
                      height: "16px",
                      width: "60%",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.08)",
                    }}
                  />
                  <div
                    style={{
                      height: "12px",
                      width: "40%",
                      borderRadius: "4px",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  />
                </div>
              </div>
            ))}
          </>
        )}

        {/* Real Dynamic Organizer Cards */}
        {filteredOrganizers.map((o) => (
          <Link
            key={o._id}
            href={`/profile?id=${o._id}`}
            className="bd-hov"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "18px",
              borderRadius: "20px",
              background: "var(--bd-ink-850, #161616)",
              border: "1px solid var(--bd-border, rgba(255,255,255,.08))",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            {/* Avatar with fallback */}
            <img
              src={o.avatar || "/img/sidebar-logo.svg"}
              alt={o.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/img/sidebar-logo.svg";
              }}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            {/* Organizer Info */}
            <span
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--bd-white, #FFFFFF)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o.name}
                </span>

                {o.verified && (
                  <span
                    title={t("organizersVerified") || "Баталгаажсан"}
                    style={{
                      display: "inline-flex",
                      flexShrink: 0,
                      color: "var(--acc-bright, #36CEC2)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        width: "16px",
                        height: "16px",
                        display: "inline-flex",
                      }}
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                )}
              </span>

              {o.category && (
                <span
                  style={{
                    fontSize: "12.5px",
                    color: "var(--bd-gray-500, #B3B3B3)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o.category}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            marginTop: "24px",
            padding: "52px 24px",
            borderRadius: "20px",
            border: "1px dashed var(--bd-border-strong, rgba(255,255,255,.18))",
            textAlign: "center",
          }}
        >
          <b
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--bd-white, #FFFFFF)",
            }}
          >
            {t("organizersNoResults") || "Үр дүн олдсонгүй"}
          </b>
          <span
            style={{
              fontSize: "14px",
              color: "var(--bd-gray-500, #B3B3B3)",
            }}
          >
            {t("organizersTryDifferentSearch") || "Өөр нэрээр хайж үзнэ үү."}
          </span>
        </div>
      )}
    </main>
  );
}

export default function OrganizersPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
        <OrganizersContent />
      </Suspense>
      <Footer />
    </>
  );
}
