"use client";
import { useState } from "react";
import CustomerHeader from "./Components/CustomerHeader";
import Sidebar from "./Components/Sidebar";
import "./customer-admin.css";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <html lang="en">
      <body>
        <div
          className={`app-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        >
          <Sidebar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <div className="content-area">
            <CustomerHeader />
            <main className="main-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
