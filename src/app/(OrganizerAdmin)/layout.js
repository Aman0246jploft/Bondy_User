"use client";
import { useState, useEffect } from "react";
import { EventProvider } from "@/context/EventContext";
import OrganizerHeader from "./Components/OrganizerHeader";
import OrganizerSidebar from "./Components/OrganizerSidebar";
import "./organizer-admin.css";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const response = await authApi.getSelfProfile();
        if (response.status) {
          // Supporting both spellings just in case, but backend uses ORGANIZER
          if (response.data.user.role !== "ORGANIZER" && response.data.user.role !== "ORGANIZER") {
            router.push("/");
          } else {
            setAuthorized(true);
          }
        }
      } catch (error) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  if (!authorized) return null;

  return (
    <html lang="en">
      <body>
        <div
          className={`app-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        >
          <EventProvider>
            <OrganizerSidebar
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            <div className="content-area">
              <OrganizerHeader />

              <main className="main-content">{children}</main>
            </div>
          </EventProvider>
        </div>
      </body>
    </html>
  );
}
