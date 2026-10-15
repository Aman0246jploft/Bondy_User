"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import "./otp-verify.css";

const START_SECONDS = 45;
const START_ATTEMPTS = 3;

export default function OtpVerifyCard({ open, field = "phone", busy = false, onClose, onVerify, onResend }) {
  const { t } = useLanguage();
  const [digits, setDigits] = useState(["", "", "", "", ""]);
  const [seconds, setSeconds] = useState(START_SECONDS);
  const [attempts, setAttempts] = useState(START_ATTEMPTS);
  const [tone, setTone] = useState("idle");
  const inputs = useRef([]);

  useEffect(() => {
    if (!open) return undefined;
    setDigits(["", "", "", "", ""]);
    setSeconds(START_SECONDS);
    setAttempts(START_ATTEMPTS);
    setTone("idle");
    const focusTimer = setTimeout(() => inputs.current[0]?.focus(), 40);
    return () => clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open || seconds <= 0) return undefined;
    const id = setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [open, seconds]);

  if (!open) return null;

  const code = digits.join("");
  const expired = tone === "expired";
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const writeDigits = (next, focusAt) => {
    setDigits(next);
    if (tone === "wrong") setTone("idle");
    if (focusAt != null) inputs.current[focusAt]?.focus();
  };

  const onChange = (index, value) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    writeDigits(next, char && index < 4 ? index + 1 : null);
  };

  const onKeyDown = (event, index) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onPaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (!text) return;
    const next = ["", "", "", "", ""];
    text.split("").forEach((char, index) => {
      next[index] = char;
    });
    writeDigits(next, Math.min(text.length, 4));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy || expired || code.length < 5) return;
    const ok = await onVerify(code);
    if (ok) return;
    const left = attempts - 1;
    setAttempts(Math.max(left, 0));
    setTone(left <= 0 ? "expired" : "wrong");
  };

  const resend = async () => {
    if (busy || seconds > 0) return;
    const ok = await onResend();
    if (!ok) return;
    setDigits(["", "", "", "", ""]);
    setAttempts(START_ATTEMPTS);
    setTone("idle");
    setSeconds(START_SECONDS);
    inputs.current[0]?.focus();
  };

  return (
    <div className="otp-scrim" onClick={onClose}>
      <section className="lg-panel otp-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="otp-title">
        <div className="otp-top">
          <button type="button" className="otp-back" onClick={onClose} aria-label={t("otpBack")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="otp-eyebrow">{field === "email" ? t("scEmail") : t("scPhone")}</span>
        </div>

        <h1 id="otp-title" className="lg-h1">{t("otpTitle")}</h1>
        <p className="lg-sub">{t("otpSub")}</p>

        <div className="otp-steps" aria-hidden="true">
          <span className="on" />
          <span className="on" />
          <span />
        </div>

        <form onSubmit={submit}>
          <div className="lg-otp" data-tone={tone === "idle" ? undefined : tone} onPaste={onPaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(node) => { inputs.current[index] = node; }}
                className="lg-otp-input"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                aria-label={String(index + 1)}
                onChange={(event) => onChange(index, event.target.value)}
                onKeyDown={(event) => onKeyDown(event, index)}
              />
            ))}
          </div>

          {tone === "wrong" && (
            <div className="otp-alert" data-tone="err">
              <span>{t("otpWrong", { left: attempts })}</span>
            </div>
          )}
          {tone === "expired" && (
            <div className="otp-alert" data-tone="warn">
              <span>{t("otpExpired")}</span>
            </div>
          )}

          <button type="submit" className="lg-submit" disabled={busy || expired || code.length < 5}>
            {busy && <span className="lg-spin" />}
            {t("otpVerify")}
          </button>
        </form>

        <div className="otp-resend">
          {seconds > 0 ? (
            <span>{t("otpResendIn", { time: clock })}</span>
          ) : (
            <button type="button" className="otp-resend-link" onClick={resend} disabled={busy}>
              {t("otpResend")}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
