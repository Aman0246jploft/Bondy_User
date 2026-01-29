"use client";
import { useState } from "react";
import OrganizerHeader from "./Components/OrganizerHeader";
import OrganizerSidebar from "./Components/OrganizerSidebar";
import "./organizer-admin.css";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <html lang="en">
      <body>
        <div
          className={`app-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        >
          <OrganizerSidebar
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <div className="content-area">
            <OrganizerHeader />

            <main className="main-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
