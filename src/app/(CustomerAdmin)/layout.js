"use client";
import { useState, useEffect } from "react";
import CustomerHeader from "./Components/CustomerHeader";
import Sidebar from "./Components/Sidebar";
import "./customer-admin.css";
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
          if (response.data.user.role !== "CUSTOMER") {
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
    <div
      className={`app-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
    >
      <Sidebar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="content-area">
        <CustomerHeader />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
