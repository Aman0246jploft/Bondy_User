"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

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

  // Single global token check — runs once on mount
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  /**
   * checkAuth(callback?)
   * If logged in → runs callback (if provided).
   * If NOT logged in → opens the "Account Required" modal.
   *
   * Usage:
   *   const { checkAuth } = useAuthGuard();
   *   <button onClick={() => checkAuth(handleBook)}>Book Tickets</button>
   */
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
