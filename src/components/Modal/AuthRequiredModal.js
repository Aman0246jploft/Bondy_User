"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/context/AuthGuardContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AuthRequiredModal() {
  const { modalOpen, closeModal } = useAuthGuard();
  const { t } = useLanguage();
  const router = useRouter();

  if (!modalOpen) return null;

  const handleLogin = () => {
    closeModal();
    router.push("/login");
  };

  const handleRegister = () => {
    closeModal();
    router.push("/register");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeModal}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 1999,
        }}
      />

      {/* Modal box */}
      <div
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2000,
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "14px",
          padding: "2rem 1.75rem",
          width: "100%",
          maxWidth: "360px",
          textAlign: "center",
        }}
      >
        {/* Close */}
        <button
          onClick={closeModal}
          style={{
            position: "absolute", top: 12, right: 16,
            background: "none", border: "none",
            color: "#888", fontSize: "1.2rem", cursor: "pointer",
          }}
        >
          ✕
        </button>

        {/* Icon */}
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(35,173,164,0.12)",
            border: "2px solid rgba(35,173,164,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24"
            stroke="#23ada4" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>

        <h5 style={{ color: "#fff", fontWeight: 700, marginBottom: "0.5rem" }}>
          {t("authRequiredTitle")}
        </h5>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
          {t("authRequiredDesc")}
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          {/* <button
            onClick={handleRegister}
            style={{
              flex: 1, padding: "10px",
              background: "#23ada4", color: "#fff",
              border: "none", borderRadius: "8px",
              fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
            }}
          >
            Create Account
          </button> */}
          <button
            onClick={handleLogin}
            style={{
              flex: 1, padding: "10px",
              background: "transparent", color: "#23ada4",
              border: "1px solid #23ada4", borderRadius: "8px",
              fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
            }}
          >
            {t("authRequiredLogin")}
          </button>
        </div>
      </div>
    </>
  );
}
