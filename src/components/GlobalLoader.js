"use client";

import React from "react";

export default function GlobalLoader({ fullScreen = true, message = "" }) {
  const containerStyle = fullScreen
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bd-ink-900, #0c0c0e)",
        color: "#ffffff",
      }
    : {
        width: "100%",
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        color: "#ffffff",
        padding: "40px 20px",
      };

  return (
    <div style={containerStyle} aria-live="polite" aria-busy="true">
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/img/bondy-logo.svg"
          alt="Bondy"
          style={{
            height: 48,
            width: "auto",
            animation: "bondyPulse 1.8s ease-in-out infinite",
            filter: "drop-shadow(0 0 16px rgba(35, 173, 164, 0.45))",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 26,
          width: 140,
          height: 3,
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: 999,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "45%",
            height: "100%",
            background: "linear-gradient(90deg, #14b8a6, #2ad1c6)",
            borderRadius: 999,
            animation: "bondyLoaderBar 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
      </div>

      {message && (
        <p
          style={{
            marginTop: 16,
            fontSize: 14,
            color: "var(--bd-gray-400, #9ca3af)",
            fontWeight: 500,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
