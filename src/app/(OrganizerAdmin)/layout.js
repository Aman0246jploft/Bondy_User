"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import OrganizerSidebar from "./Components/OrganizerSidebar";
import { EventProvider } from "@/context/EventContext";
import authApi from "@/api/authApi";
import { useLanguage } from "@/context/LanguageContext";
import { useSocket } from "@/context/SocketContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import GlobalLoader from "@/components/GlobalLoader";
import "./organizer-admin.css";

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [editorQuery, setEditorQuery] = useState("");
  const { language, changeLanguage, t } = useLanguage();
  const { unreadNotificationCount } = useSocket();
  const isMn = language === "mn";

  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("userProfile");
        if (u) return JSON.parse(u);
      } catch (e) { }
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    setUserMenuOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    const handleClose = (e) => {
      if (!e.target.closest("[data-profile-menuwrap]")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClose);
    return () => document.removeEventListener("click", handleClose);
  }, []);

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
            } catch (e) { }
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
          } catch (e) { }
        }
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    if (pathname.includes("/BasicInfo")) {
      setEditorQuery(window.location.search || "");
    }
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname.includes("/OrganizerProfile") || pathname.includes("/OrganizerPersonalInfo")) {
      return isMn ? "Профайл" : "Profile";
    }
    if (pathname.includes("/Dashboard")) {
      return isMn ? "Хянах самбар" : "Dashboard";
    }
    if (pathname.includes("/EventsManagement")) {
      return isMn ? "Эвентийн удирдлага" : "Event management";
    }
    if (pathname.includes("/EventDetailOrganiser")) {
      return isMn ? "Эвент" : "Events";
    }
    if (pathname.includes("/BasicInfo")) {
      const q = new URLSearchParams(editorQuery);
      if (q.get("mode") === "draft") return isMn ? "Эвентийн ноорог" : "Event draft";
      if (q.get("eventId")) return isMn ? "Эвент засах" : "Edit event";
      return isMn ? "Эвент үүсгэх" : "Create event";
    }
    if (pathname.includes("/CoursesManagement")) {
      return t("learningManagement");
    }
    if (pathname.includes("/CourseDetailOrganiser")) {
      return t("learningManagement");
    }
    if (pathname.includes("/Staff")) {
      return t("stTitle");
    }
    if (pathname.includes("/OrganizerCustomerBookings") || pathname.includes("/OrganizerBookingDetail")) {
      return t("obNav");
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
      return t("hcTitle");
    }
    return isMn ? "Зохион байгуулагч" : "Organizer Portal";
  };

  const title = getPageTitle();
  const displayName =
    (profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "") ||
    profile?.name ||
    profile?.businessName ||
    profile?.email ||
    (isMn ? "Зохион байгуулагч" : "Organizer");
  const orgName =
    profile?.businessName ||
    displayName;
  const avatarUrl = profile?.profileImage
    ? getFullImageUrl(profile.profileImage)
    : "/assets/logo/bondy-mark.svg";

  if (!authorized) {
    return <GlobalLoader fullScreen />;
  }

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
            background: "rgba(11, 11, 11, 0.86)",
            backdropFilter: "blur(22px) saturate(150%)",
            borderBottom: "1px solid var(--bd-border-soft)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
              padding: "15px clamp(18px, 2.4vw, 34px)",
            }}
          >
            {/* Title & Subtitle */}
            <div style={{ minWidth: 0 }}>
              <h1
                className="og-h1"
                style={{
                  margin: 0,
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "22px",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  letterSpacing: "-0.018em",
                  color: "var(--bd-white)",
                }}
              >
                {title}
              </h1>
              {!pathname.includes("/Notifications") && !pathname.includes("/SupportTickets") && !pathname.includes("/Settings") && (
                <p style={{ margin: "5px 0 0", fontSize: "13px", color: "var(--bd-gray-500)" }}>
                  {pathname.includes("/Staff")
                    ? t("stPageSub")
                    : pathname.includes("/Earnings")
                      ? t("pyPageSub")
                      : pathname.includes("/Analytics")
                        ? t("anPageSub")
                        : pathname.includes("/Verifiedprofile")
                          ? t("vfPageSub")
                          : pathname.includes("/MyTicketsOrganiser") || pathname.includes("/TicketDetailsOrganiser")
                            ? t("moPageSub")
                            : orgName}
                </p>
              )}
            </div>

            {/* Right Header Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "11px", flexShrink: 0 }}>
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
                    fontWeight: 600,
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
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  EN
                </button>
              </div>

              {/* Bell Icon Notification Button */}
              <Link
                href="/Notifications"
                data-nav="notifications"
                role="button"
                tabIndex={0}
                aria-label="Мэдэгдэл"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "38px",
                  height: "38px",
                  borderRadius: "999px",
                  background: "var(--bd-ink-850)",
                  border: "1px solid var(--bd-border)",
                  color: "var(--bd-gray-400)",
                  position: "relative",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                title={isMn ? "Мэдэгдэл" : "Notifications"}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 16V11a6 6 0 0 0-12 0v5l-1.5 2.2h15Z" />
                  <path d="M10 19.5a2.2 2.2 0 0 0 4 0" />
                </svg>
                {Boolean(unreadNotificationCount && unreadNotificationCount > 0) && (
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "9px",
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "var(--acc-bright)",
                      boxShadow: "0 0 0 2px var(--bd-ink-850)",
                    }}
                  />
                )}
              </Link>

              {/* Organizer Profile Pill with Dropdown Menu */}
              <div style={{ position: "relative" }} data-profile-menuwrap>
                <button
                  type="button"
                  className="og-org"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen((prev) => !prev);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "5px 12px 5px 5px",
                    borderRadius: "999px",
                    background: "var(--bd-ink-850)",
                    border: "1px solid var(--bd-border)",
                    cursor: "pointer",
                    color: "inherit",
                    textAlign: "left",
                  }}
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                  title={displayName}
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "999px",
                      objectFit: profile?.profileImage ? "cover" : "contain",
                      display: "block",
                      background: "var(--bd-ink-800, #1b1b1b)",
                      padding: profile?.profileImage ? "0" : "3px",
                      boxSizing: "border-box",
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/assets/logo/bondy-mark.svg";
                      e.currentTarget.style.objectFit = "contain";
                      e.currentTarget.style.padding = "3px";
                    }}
                  />
                  <span className="og-org-txt" style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--bd-white)", whiteSpace: "nowrap" }}>
                      {displayName}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--acc-bright)" }}>
                      {profile?.organizerVerificationStatus === "APPROVED" || profile?.isVerified
                        ? (isMn ? "Баталгаажсан" : "Verified")
                        : (isMn ? "Зохион байгуулагч" : "Organizer")}
                    </span>
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: "var(--bd-gray-500)",
                      marginLeft: "2px",
                      transform: userMenuOpen ? "rotate(180deg)" : "none",
                      transition: "transform 180ms ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown Menu Matching Prototype Image 1 */}
                {userMenuOpen && (
                  <div
                    className="ogn-menu"
                    data-open="1"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      minWidth: "200px",
                      boxSizing: "border-box",
                      padding: "6px",
                      border: "1px solid var(--bd-border, #303030)",
                      borderRadius: "16px",
                      background: "var(--bd-ink-850, #161616)",
                      boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      zIndex: 130,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href="/OrganizerProfile"
                      className="ogn-mi"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        boxSizing: "border-box",
                        minHeight: "40px",
                        padding: "0 12px",
                        borderRadius: "10px",
                        color: "var(--bd-gray-200, #e6e6e6)",
                        fontFamily: "var(--bd-font-ui)",
                        fontSize: "14px",
                        fontWeight: 500,
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                    >
                      {isMn ? "Профайл" : "Profile"}
                    </Link>
                    <Link
                      href="/Settings"
                      className="ogn-mi"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        boxSizing: "border-box",
                        minHeight: "40px",
                        padding: "0 12px",
                        borderRadius: "10px",
                        color: "var(--bd-gray-200, #e6e6e6)",
                        fontFamily: "var(--bd-font-ui)",
                        fontSize: "14px",
                        fontWeight: 500,
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                    >
                      {isMn ? "Тохиргоо" : "Settings"}
                    </Link>
                    <span
                      style={{
                        height: "1px",
                        flexShrink: 0,
                        margin: "4px 8px",
                        background: "var(--bd-border-soft, rgba(255,255,255,0.08))",
                      }}
                    />
                    <button
                      type="button"
                      className="ogn-mi ogn-mi-danger"
                      onClick={handleLogout}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        boxSizing: "border-box",
                        minHeight: "40px",
                        padding: "0 12px",
                        border: "none",
                        borderRadius: "10px",
                        background: "transparent",
                        color: "#FF5A5A",
                        fontFamily: "var(--bd-font-ui)",
                        fontSize: "14px",
                        fontWeight: 500,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      {isMn ? "Гарах" : "Log out"}
                    </button>
                  </div>
                )}
              </div>
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
              { id: "bookings", label: t("obNav"), href: "/OrganizerCustomerBookings" },
              { id: "staff", label: isMn ? "Ажилтнууд" : "Staff", href: "/Staff" },
              { id: "messages", label: isMn ? "Зурвас" : "Messages", href: "/Message" },
              { id: "payouts", label: isMn ? "Орлого ба татан авалт" : "Earnings & payouts", href: "/Earnings" },
              { id: "analytics", label: isMn ? "Аналитик" : "Analytics", href: "/Analytics" },
              { id: "verify", label: isMn ? "Баталгаажуулалт" : "Verification", href: "/Verifiedprofile" },
              { id: "myorders", label: isMn ? "Миний захиалга" : "My bookings", href: "/MyTicketsOrganiser" },
              { id: "profile", label: isMn ? "Профайл" : "Profile", href: "/OrganizerProfile" },
              { id: "notifications", label: isMn ? "Мэдэгдэл" : "Notifications", href: "/Notifications" },
            ].map((tab) => {
              const active = tab.id === "bookings"
                ? pathname.startsWith("/OrganizerCustomerBookings") || pathname.startsWith("/OrganizerBookingDetail")
                : pathname === tab.href || pathname.startsWith(tab.href);
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

        {/* Main Content Area */}
        <main
          data-screen-label={title}
          style={{
            flex: 1,
            padding: "clamp(20px, 2.4vw, 30px) clamp(18px, 2.4vw, 34px) clamp(48px, 4vw, 64px)",
            background: "radial-gradient(900px 320px at 12% -6%, rgba(35, 173, 164, 0.06), transparent 68%)",
            minWidth: 0,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Mobile Back Bar */}
          <div className="dh-mobbar">
            <button
              type="button"
              className="dh-mobback"
              onClick={() => router.back()}
              aria-label={isMn ? "Буцах" : "Back"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="dh-mobbarT">{title}</span>
            <span className="dh-mobbar-sp" />
          </div>

          <EventProvider>{children}</EventProvider>
        </main>
      </div>
    </div>
  );
}
