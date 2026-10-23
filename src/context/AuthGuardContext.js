"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import authApi from "@/api/authApi";

export const AuthGuardContext = createContext(null);

export function AuthGuardProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  // Redirect staff members to /StaffHome if they try to access other routes
  useEffect(() => {
    const token = localStorage.getItem("token");
    const profileStr = localStorage.getItem("userProfile");
    if (token && profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        if (profile.roleId === 5 || profile.userRole === "STAFF") {
          if (!pathname.startsWith("/StaffHome") && pathname !== "/login") {
            router.push("/StaffHome");
          }
        }
      } catch (err) {
        // ignore
      }
    }
  }, [pathname, router]);

  // Single global token check — runs on mount and pathname changes
  useEffect(() => {
    // Skip guard checks on auth transition pages (OTP flow is mid-login)
    const authTransitionPages = ["/otp", "/otpSinup", "/login", "/register"];
    if (authTransitionPages.some((p) => pathname.startsWith(p))) return;

    const checkTokenAndStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);

      // Fast synchronous check
      const profileStr = localStorage.getItem("userProfile");
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          const isApproved = profile?.hasBeenApproved === true || profile?.isVerified === true;
          const isOrganizer = profile?.roleId === 2 || profile?.organizerVerificationStatus;
          const hasBusinessDetails = !!(
            profile?.businessName ||
            profile?.businessCategory ||
            profile?.shortDesc ||
            profile?.socialMediaLink
          );

          const organizerRestrictedRoutes = ["/create-event", "/create-course", "/OrganizerDashboard", "/OrganizerProfile", "/dashboard"];
          const isRestrictedRoute = organizerRestrictedRoutes.some((r) => pathname.startsWith(r));

          if (isOrganizer && !isApproved) {
            if (!hasBusinessDetails) {
              if (pathname !== "/completeprofile") {
                router.replace("/completeprofile");
                return;
              }
            } else if (isRestrictedRoute) {
              router.replace("/completeprofile");
              return;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // Async verification check
      try {
        const response = await authApi.getSelfProfile();
        if (response?.status) {
          const profile = response?.data?.user;
          localStorage.setItem("userProfile", JSON.stringify(profile));

          // Update timezone on backend
          try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            await authApi.updateTimezone({ timeZone });
          } catch (tzErr) {
            console.error("Failed to update timezone:", tzErr);
          }

          const isApproved = profile?.hasBeenApproved === true || profile?.isVerified === true;
          const isOrganizer = profile?.roleId === 2 || profile?.organizerVerificationStatus;
          const hasBusinessDetails = !!(
            profile?.businessName ||
            profile?.businessCategory ||
            profile?.shortDesc ||
            profile?.socialMediaLink
          );

          const organizerRestrictedRoutes = ["/create-event", "/create-course", "/OrganizerDashboard", "/OrganizerProfile", "/dashboard"];
          const isRestrictedRoute = organizerRestrictedRoutes.some((r) => pathname.startsWith(r));

          if (isOrganizer && !isApproved) {
            if (!hasBusinessDetails) {
              if (pathname !== "/completeprofile") {
                router.replace("/completeprofile");
              }
            } else if (isRestrictedRoute) {
              router.replace("/completeprofile");
            }
          }
        } else if (response?.status === false && (
          response?.message === "This account has been deactivated." ||
          response?.message === "Your account has been disabled. Please contact support." ||
          response?.message?.includes("идэвхгүй болсон") ||
          response?.message?.includes("deactivated") ||
          response?.message?.includes("disabled") ||
          response?.data?.user?.isDisable
        )) {
          localStorage.removeItem("token");
          localStorage.removeItem("userProfile");
          localStorage.removeItem("registerEmail");
          setIsLoggedIn(false);
          router.replace("/");
          return;
        }
      } catch (err) {
        const errMsg = err?.response?.data?.message || err?.message || "";
        if (
          err?.response?.status === 403 ||
          err?.response?.data?.code === "ACCOUNT_DISABLED" ||
          errMsg.includes("deactivated") ||
          errMsg.includes("disabled") ||
          errMsg.includes("идэвхгүй болсон")
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("userProfile");
          localStorage.removeItem("registerEmail");
          setIsLoggedIn(false);
          router.replace("/");
        }
      }
    };

    checkTokenAndStatus();
  }, [pathname, router]);

  const checkAuth = useCallback((callback) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (callback) callback();
    } else {
      setPendingAction(() => callback || null);
      setModalOpen(true);
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setPendingAction(null);
  }, []);

  return (
    <AuthGuardContext.Provider value={{ isLoggedIn, checkAuth, modalOpen, closeModal }}>
      {children}
    </AuthGuardContext.Provider>
  );
}

export function useAuthGuard() {
  const ctx = useContext(AuthGuardContext);
  if (!ctx) throw new Error("useAuthGuard must be used inside <AuthGuardProvider>");
  return ctx;
}
