"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrganizerSidebar from "./Components/OrganizerSidebar";
import { EventProvider } from "@/context/EventContext";
import authApi from "@/api/authApi";
import { useLanguage } from "@/context/LanguageContext";
import "./organizer-admin.css";

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [authorized, setAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Bondy - Organizer Dashboard";
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
        if (response?.status) {
          if (response?.data?.user?.role !== "ORGANIZER" && response?.data?.user?.roleId !== 2) {
            router.push("/");
          } else {
            setAuthorized(true);
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname.includes("/OrganizerPersonalInfo")) return t("personalInfo") || "Organizer Profile";
    if (pathname.includes("/Dashboard")) return t("dashboard") || "Dashboard";
    if (pathname.includes("/EventsManagement")) return t("eventsManagement") || "Events Management";
    if (pathname.includes("/CoursesManagement")) return t("coursesManagement") || "Courses Management";
    if (pathname.includes("/Analytics") || pathname.includes("/Analytic")) return t("analytics") || "Analytics";
    if (pathname.includes("/Earnings")) return t("earnings") || "Earnings & Payout";
    if (pathname.includes("/MyTicketsOrganiser")) return t("tickets") || "Ticket Sales";
    if (pathname.includes("/Message")) return t("messages") || "Messages";
    if (pathname.includes("/MyFavorite")) return t("myFavorite") || "Saved & Favorites";
    if (pathname.includes("/Promotions")) return t("promotions") || "Promotions";
    if (pathname.includes("/Staff")) return t("staff") || "Team Staff";
    if (pathname.includes("/SubscriptionBilling")) return t("subscription") || "Billing & Plan";
    if (pathname.includes("/SupportTickets")) return t("supportTickets") || "Help & Support";
    if (pathname.includes("/Notifications")) return t("notification") || "Notifications";
    if (pathname.includes("/Settings")) return t("settings") || "Settings";
    // if (pathname.includes("/OrganizerChangePassword")) return t("changePassword") || "Change Password";
    if (pathname.includes("/TicketDetailsOrganiser")) return t("ticketDetails") || "Ticket Details";
    return t("organizerDashboard") || "Organizer Dashboard";
  };

  if (!authorized) return null;

  return (
    <div className="bd-account-shell">
      {/* Website Consumer Header */}
      <Header />

      {/* Main Centered Account Body */}
      <main id="top" className="bd-acct-container" data-screen-label="Organizer Account">
        {/* Breadcrumbs */}
        <nav className="bd-crumb" aria-label="Breadcrumb">
          <Link href="/" className="bd-crumb-link">
            {t("home") || "Home"}
          </Link>
          <span className="bd-crumb-sep">/</span>
          <span className="bd-crumb-current">{getPageTitle()}</span>
        </nav>

        {/* Mobile Accordion Menu Trigger */}
        <button
          type="button"
          className="bd-acct-trig"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
        >
          <span className="bd-acct-trig-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </span>
          <span className="bd-acct-trig-text">{getPageTitle()}</span>
          <span className={`bd-acct-trig-arrow ${mobileMenuOpen ? "open" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {/* 2-Column Account Grid */}
        <div className="bd-acct">
          <EventProvider>
            <OrganizerSidebar
              mobileOpen={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
            <div className="bd-acct-content">
              {children}
            </div>
          </EventProvider>
        </div>
      </main>

      {/* Website Consumer Footer */}
      <Footer />
    </div>
  );
}
