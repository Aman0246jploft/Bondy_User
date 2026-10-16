"use client";

import React from "react";
import { Toaster, ToastBar, toast } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--bd-ink-850, #1c1c1e)",
          color: "var(--bd-white, #ffffff)",
          border: "1px solid var(--bd-border, rgba(255, 255, 255, 0.12))",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: "14px",
          maxWidth: "420px",
        },
        success: {
          iconTheme: {
            primary: "var(--acc-bright, #10B981)",
            secondary: "#1c1c1e",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#1c1c1e",
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t} style={{ ...t.style, display: "flex", alignItems: "center" }}>
          {({ icon, message }) => (
            <>
              {icon}
              <div style={{ flex: "1 1 auto", margin: "0 6px", wordBreak: "break-word" }}>
                {message}
              </div>
              {t.type !== "loading" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    cursor: "pointer",
                    padding: "4px",
                    marginLeft: "6px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "inherit",
                    opacity: 0.65,
                    transition: "opacity 150ms ease, background-color 150ms ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.65";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  aria-label="Close notification"
                  title="Close"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
