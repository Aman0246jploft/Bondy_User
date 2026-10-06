"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import OrganizerSidebar from "./Components/OrganizerSidebar";
import { EventProvider } from "@/context/EventContext";
import authApi from "@/api/authApi";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import "./organizer-admin.css";

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, changeLanguage, t } = useLanguage();
  const isMn = language === "mn";

  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("userProfile");
        if (u) return JSON.parse(u);
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    document.title = "Bondy - Organizer Portal";
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const response = await authApi.getSelfProfile();
        if (response?.status && response?.data?.user) {
          const user = response.data.user;
          const isOrg =
            user.role === "ORGANIZER" ||
            user.roleId === 2 ||
            !!user.organizerVerificationStatus;

          if (!isOrg) {
            router.push("/");
          } else {
            setProfile(user);
            try {
              localStorage.setItem("userProfile", JSON.stringify(user));
            } catch (e) {}
            setAuthorized(true);
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        // If already cached in localStorage with organizer role, allow smooth view
        const cached = typeof window !== "undefined" ? localStorage.getItem("userProfile") : null;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.role === "ORGANIZER" || parsed.roleId === 2 || parsed.organizerVerificationStatus) {
              setProfile(parsed);
              setAuthorized(true);
              return;
            }
          } catch (e) {}
        }
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname.includes("/OrganizerProfile") || pathname.includes("/OrganizerPersonalInfo")) {
      return isMn ? "Профайл" : "Profile";
    }
    if (pathname.includes("/Dashboard")) {
      return isMn ? "Хянах самбар" : "Dashboard";
    }
    if (pathname.includes("/EventsManagement") || pathname.includes("/EventDetailOrganiser")) {
      return isMn ? "Эвент" : "Events";
    }
    if (pathname.includes("/CoursesManagement") || pathname.includes("/CourseDetailOrganiser")) {
      return isMn ? "Сургалт" : "Course";
    }
    if (pathname.includes("/Staff")) {
      return isMn ? "Ажилтнууд" : "Staff";
    }
    if (pathname.includes("/Message")) {
      return isMn ? "Зурвас" : "Messages";
    }
    if (pathname.includes("/Earnings")) {
      return isMn ? "Орлого ба татан авалт" : "Earnings & payouts";
    }
    if (pathname.includes("/Analytics") || pathname.includes("/Analytic")) {
      return isMn ? "Аналитик" : "Analytics";
    }
    if (pathname.includes("/Verifiedprofile")) {
      return isMn ? "Баталгаажуулалт" : "Verification";
    }
    if (pathname.includes("/MyTicketsOrganiser") || pathname.includes("/TicketDetailsOrganiser")) {
      return isMn ? "Миний захиалга" : "My bookings";
    }
    if (pathname.includes("/Notifications")) {
      return isMn ? "Мэдэгдэл" : "Notifications";
    }
    if (pathname.includes("/Settings") || pathname.includes("/OrganizerChangePassword")) {
      return isMn ? "Тохиргоо" : "Settings";
    }
    if (pathname.includes("/SupportTickets")) {
      return isMn ? "Тусламж" : "Help";
    }
    return isMn ? "Зохион байгуулагч" : "Organizer Portal";
  };

  const title = getPageTitle();
  const orgName =
    profile?.businessName ||
    (profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "") ||
    profile?.email ||
    (isMn ? "Зохион байгуулагч" : "Organizer");
  const avatarUrl = profile?.profileImage
    ? getFullImageUrl(profile.profileImage)
    : "/img/default-user.png";

  if (!authorized) return null;

  return (
    <div className="og-shell">
      {/* 1. Left Rail / Sidebar */}
      <OrganizerSidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", flex: 1, width: "100%" }}>
        {/* Top Sticky Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "rgba(11, 11, 11, 0.92)",
            backdropFilter: "blur(20px) saturate(140%)",
            borderBottom: "1px solid var(--bd-border-soft)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              padding: "16px clamp(20px, 2.5vw, 36px)",
            }}
          >
            {/* Title */}
            <div style={{ minWidth: 0 }}>
              <h1
                className="og-h1"
                style={{
                  margin: 0,
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "22px",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: "-0.018em",
                  color: "var(--bd-white)",
                }}
              >
                {title}
              </h1>
            </div>

            {/* Right Header Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              {/* Mobile Burger Toggle */}
              <button
                type="button"
                className="og-burger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Цэс"
                aria-expanded={mobileMenuOpen}
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
                  <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>

              {/* Bell Icon Notification Button */}
              <Link
                href="/Notifications"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "1px solid var(--bd-border)",
                  background: "var(--bd-ink-850)",
                  color: "var(--bd-gray-300)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                title={isMn ? "Мэдэгдэл" : "Notifications"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </Link>

              {/* Language Switcher Pill */}
              <div
                data-lang-switch
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  padding: "3px",
                  borderRadius: "999px",
                  background: "var(--bd-ink-850)",
                  border: "1px solid var(--bd-border)",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  data-lang="mn"
                  onClick={() => changeLanguage("mn")}
                  style={{
                    height: "26px",
                    padding: "0 10px",
                    border: "none",
                    borderRadius: "999px",
                    background: isMn ? "var(--acc)" : "transparent",
                    color: isMn ? "var(--bd-white)" : "var(--bd-gray-400)",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  MN
                </button>
                <button
                  type="button"
                  data-lang="en"
                  onClick={() => changeLanguage("en")}
                  style={{
                    height: "26px",
                    padding: "0 10px",
                    border: "none",
                    borderRadius: "999px",
                    background: !isMn ? "var(--acc)" : "transparent",
                    color: !isMn ? "var(--bd-white)" : "var(--bd-gray-400)",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  EN
                </button>
              </div>

              {/* Organizer Profile Pill */}
              <Link
                href="/OrganizerProfile"
                className="og-org"
                style={{ textDecoration: "none" }}
                title={orgName}
              >
                <img
                  src={avatarUrl}
                  alt={orgName}
                  className="og-org-avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/assets/img/b5e94e90c3d8df6c.jpg";
                  }}
                />
                <span className="og-org-txt" style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--bd-white)", whiteSpace: "nowrap" }}>
                    {orgName}
                  </span>
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--bd-gray-500)", marginLeft: "2px" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Mobile Horizontal Navigation Strip */}
          <div
            className="og-mob bd-scroll"
            data-rail
            style={{
              alignItems: "center",
              gap: "8px",
              padding: "0 clamp(18px, 2.4vw, 34px) 13px",
              overflowX: "auto",
            }}
          >
            {[
              { id: "dash", label: isMn ? "Хянах самбар" : "Dashboard", href: "/Dashboard" },
              { id: "events", label: isMn ? "Эвент" : "Event", href: "/EventsManagement" },
              { id: "learning", label: isMn ? "Сургалт" : "Course", href: "/CoursesManagement" },
              { id: "staff", label: isMn ? "Ажилтнууд" : "Staff", href: "/Staff" },
              { id: "messages", label: isMn ? "Зурвас" : "Messages", href: "/Message" },
              { id: "payouts", label: isMn ? "Орлого" : "Earnings & payouts", href: "/Earnings" },
              { id: "analytics", label: isMn ? "Аналитик" : "Analytics", href: "/Analytics" },
              { id: "verify", label: isMn ? "Баталгаажуулалт" : "Verification", href: "/Verifiedprofile" },
              { id: "myorders", label: isMn ? "Захиалга" : "My bookings", href: "/MyTicketsOrganiser" },
              { id: "profile", label: isMn ? "Профайл" : "Profile", href: "/OrganizerProfile" },
              { id: "notifications", label: isMn ? "Мэдэгдэл" : "Notifications", href: "/Notifications" },
            ].map((tab) => {
              const active = pathname === tab.href || pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    height: "36px",
                    padding: "0 14px",
                    borderRadius: "999px",
                    border: active ? "1px solid var(--acc)" : "1px solid var(--bd-border)",
                    background: active ? "var(--bd-brand-soft)" : "transparent",
                    color: active ? "var(--bd-teal-300)" : "var(--bd-gray-400)",
                    fontFamily: "var(--bd-font-ui)",
                    fontSize: "13px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    textDecoration: "none",
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </header>

        {/* Main Content Area: spans full available width, no centered narrow margin */}
        <main
          data-screen-label={title}
          style={{
            flex: 1,
            padding: "20px clamp(20px, 2.5vw, 36px) 60px",
            minWidth: 0,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <EventProvider>{children}</EventProvider>
        </main>
      </div>
    </div>
  );
}
