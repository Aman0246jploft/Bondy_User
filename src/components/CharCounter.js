"use client";

import React from "react";

export default function CharCounter({
  current = "",
  max = 250,
  lowThreshold = 10,
  language = "en",
}) {
  const length = typeof current === "string" ? current.length : Number(current) || 0;
  const remaining = Math.max(0, max - length);
  const isLow = remaining <= lowThreshold && remaining > 0;
  const isZero = remaining === 0;

  let text = "";
  if (isZero) {
    text = language === "en" ? "0 characters left" : "0 тэмдэгт үлдсэн";
  } else if (isLow) {
    text =
      language === "en"
        ? `Few characters left (${remaining} left)`
        : `Цөөхөн тэмдэгт үлдлээ (${remaining})`;
  } else {
    text =
      language === "en"
        ? `${remaining} characters left`
        : `${remaining} тэмдэгт үлдсэн`;
  }

  const color = isZero
    ? "#ef4444"
    : isLow
    ? "#f59e0b"
    : "var(--bd-gray-500, #9ca3af)";

  return (
    <span
      className="bd-char-count"
      style={{
        display: "block",
        textAlign: "right",
        fontSize: 12,
        fontWeight: isLow || isZero ? 600 : 400,
        color: color,
        marginTop: 4,
        lineHeight: 1.3,
        transition: "color 150ms ease",
      }}
    >
      {text}
    </span>
  );
}
