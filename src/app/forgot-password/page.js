"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import authApi from "@/api/authApi";
import staffApi from "@/api/staffApi";
import GuestRoute from "@/components/GuestRoute";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const isMn = language === "mn";

  const role = searchParams.get("role");

  // Flow step: 'forgot' | 'otp' | 'newpw' | 'pwdone'
  const [step, setStep] = useState("forgot");

  // Form fields
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Validation & error states
  const [errEmail, setErrEmail] = useState("");
  const [errPw, setErrPw] = useState("");
  const [errPw2, setErrPw2] = useState("");
  const [topError, setTopError] = useState("");
  const [otpTone, setOtpTone] = useState("idle"); // 'idle' | 'err' | 'warn'
  const [otpLeft, setOtpLeft] = useState(3);

  // UI helpers
  const [busy, setBusy] = useState(false);
  const [eye1, setEye1] = useState(false);
  const [eye2, setEye2] = useState(false);

  // 60-second resend timer
  const [timer, setTimer] = useState(60);
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  // Title update
  useEffect(() => {
    const titles = {
      forgot: t("forgotTitle") || "Forgot password",
      otp: t("otpTitle") || "Verify code",
      newpw: t("newPwTitle") || "New password",
      pwdone: t("pwDoneTitle") || "Password changed",
    };
    document.title = `${titles[step] || "Forgot password"} - Bondy`;
  }, [step, t]);

  // Timer interval
  useEffect(() => {
    if (step === "otp") {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  // Focus first OTP box on entering OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const startTimer = (seconds = 60) => {
    clearInterval(timerRef.current);
    setTimer(seconds);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: Send Code ──
  const handleSendCode = async (e) => {
    e.preventDefault();
    setTopError("");
    setErrEmail("");

    const trimmed = email.trim();
    if (!trimmed) {
      setErrEmail(isMn ? "Имэйл хаягаа оруулна уу." : "Please enter your email.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setErrEmail(isMn ? "Имэйл хаяг буруу байна." : "Invalid email address.");
      return;
    }

    setBusy(true);
    try {
      let res;
      if (role === "staff") {
        res = await staffApi.forgotPasswordInit({ email: trimmed });
      } else {
        res = await authApi.forgotPasswordInit({ email: trimmed });
      }

      if (res?.status) {
        localStorage.setItem("resetEmail", trimmed);
        if (role === "staff") {
          localStorage.setItem("resetRole", "staff");
        } else {
          localStorage.removeItem("resetRole");
        }
        setOtp(["", "", "", "", ""]);
        setOtpLeft(3);
        setOtpTone("idle");
        setTopError("");
        startTimer(60);
        setStep("otp");
      } else {
        setTopError(res?.message || (isMn ? "Имэйл олдсонгүй." : "User not found."));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || (isMn ? "Хүсэлт амжилтгүй боллоо." : "Failed to send code.");
      setTopError(msg);
    } finally {
      setBusy(false);
    }
  };

  // ── Step 2: OTP Input Handling ──
  const handleOtpInput = (val, idx) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[idx] = digit;
    setOtp(nextOtp);
    setOtpTone("idle");
    setTopError("");

    if (digit && idx < 4) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!otp[idx] && idx > 0) {
        const nextOtp = [...otp];
        nextOtp[idx - 1] = "";
        setOtp(nextOtp);
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (!pasted) return;

    const nextOtp = ["", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      nextOtp[i] = pasted[i];
    }
    setOtp(nextOtp);
    setOtpTone("idle");
    setTopError("");

    const targetIdx = Math.min(pasted.length, 4);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 5) return;

    setBusy(true);
    setTopError("");
    try {
      let res;
      if (role === "staff") {
        res = await staffApi.forgotPasswordVerify({
          email: email.trim(),
          otp: code,
        });
      } else {
        res = await authApi.verifyForgotPasswordOtp({
          email: email.trim(),
          otp: code,
        });
      }

      if (res?.status) {
        setResetToken(res?.data?.token || "");
        setTopError("");
        setStep("newpw");
      } else {
        const left = Math.max(otpLeft - 1, 0);
        setOtpLeft(left);
        setOtpTone("err");
        setTopError(
          left > 0
            ? (isMn
                ? `Код буруу байна. Дахин оролдоно уу. Үлдсэн оролдлого: ${left}`
                : `The code is wrong. Try again. Attempts left: ${left}`)
            : (isMn
                ? "Кодын оролдлого дууссан. Шинэ код авна уу."
                : "No attempts left. Please request a new code.")
        );
      }
    } catch (err) {
      const left = Math.max(otpLeft - 1, 0);
      setOtpLeft(left);
      setOtpTone("err");
      const msg = err?.response?.data?.message || (
        left > 0
          ? (isMn
              ? `Код буруу байна. Дахин оролдоно уу. Үлдсэн оролдлого: ${left}`
              : `The code is wrong. Try again. Attempts left: ${left}`)
          : (isMn
              ? "Кодын хугацаа дууссан. Шинэ код авна уу."
              : "This code has expired. Request a new one.")
      );
      setTopError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    setTopError("");
    setBusy(true);
    try {
      let res;
      if (role === "staff") {
        res = await staffApi.forgotPasswordResend({ email: email.trim() });
      } else {
        res = await authApi.resendUniversalOtp({
          email: email.trim(),
          type: "FORGOT_PASSWORD",
        });
      }

      if (res?.status) {
        toast.success(isMn ? "Код дахин илгээгдлээ." : "Verification code resent.");
        setOtp(["", "", "", "", ""]);
        setOtpLeft(3);
        setOtpTone("idle");
        startTimer(60);
        inputRefs.current[0]?.focus();
      } else {
        setTopError(res?.message || (isMn ? "Код дахин илгээж чадсангүй." : "Could not resend code."));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || (isMn ? "Код дахин илгээж чадсангүй." : "Could not resend code.");
      setTopError(msg);
    } finally {
      setBusy(false);
    }
  };

  // ── Step 3: Save New Password ──
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setTopError("");
    setErrPw("");
    setErrPw2("");

    let hasError = false;

    // Minimum 8 chars and at least one number
    if (!(pw1.length >= 8 && /\d/.test(pw1))) {
      setErrPw(
        t("pwRuleHint") ||
          (isMn
            ? "Хамгийн багадаа 8 тэмдэгт, нэг тоо орсон байх."
            : "At least 8 characters, must include at least one number.")
      );
      hasError = true;
    }

    if (!pw2) {
      setErrPw2(isMn ? "Нууц үгээ баталгаажуулна уу." : "Please confirm your password.");
      hasError = true;
    } else if (pw1 !== pw2) {
      setErrPw2(isMn ? "Хоёр нууц үг таарахгүй байна." : "Passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    setBusy(true);
    try {
      let res;
      if (role === "staff") {
        res = await staffApi.resetPassword({
          newPassword: pw1,
          confirmPassword: pw2,
          resetToken,
        });
      } else {
        res = await authApi.resetPassword({
          newPassword: pw1,
          confirmPassword: pw2,
          resetToken,
        });
      }

      if (res?.status) {
        localStorage.removeItem("resetEmail");
        localStorage.removeItem("resetRole");
        setStep("pwdone");
      } else {
        setTopError(res?.message || (isMn ? "Нууц үг шинэчилж чадсангүй." : "Failed to reset password."));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || (isMn ? "Нууц үг шинэчилж чадсангүй." : "Failed to reset password.");
      setTopError(msg);
    } finally {
      setBusy(false);
    }
  };

  // ── Back Button Handler ──
  const handleBack = () => {
    if (step === "forgot") {
      router.push("/login");
    } else if (step === "otp") {
      setTopError("");
      setStep("forgot");
    } else if (step === "newpw") {
      setTopError("");
      setStep("otp");
    } else if (step === "pwdone") {
      router.push("/login");
    }
  };

  // Timer formatting: MM:SS (e.g. 00:38)
  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");
  const formattedTimer = `${mm}:${ss}`;

  // Eyebrow label
  const eyebrowText =
    {
      forgot: t("forgotEyebrow") || (isMn ? "НУУЦ ҮГ СЭРГЭЭХ" : "RESET PASSWORD"),
      otp: t("otpEyebrow") || (isMn ? "НУУЦ ҮГ СЭРГЭЭХ" : "RESET PASSWORD"),
      newpw: t("newPwEyebrow") || (isMn ? "НУУЦ ҮГ СЭРГЭЭХ" : "RESET PASSWORD"),
      pwdone: t("pwDoneEyebrow") || (isMn ? "НУУЦ ҮГ СЭРГЭЭХ" : "RESET PASSWORD"),
    }[step] || (isMn ? "НУУЦ ҮГ СЭРГЭЭХ" : "RESET PASSWORD");

  // Step 3 progress indicators: 1 = forgot, 2 = otp, 3 = newpw
  const stepIdx = { forgot: 1, otp: 2, newpw: 3, pwdone: 0 }[step] || 0;
  const isCentered = step === "pwdone";

  return (
    <GuestRoute>
      <Header />
      <main className="lg-shell">
        <section className="lg-panel">

          {/* ── Top Bar: Back Button & Uppercase Eyebrow ── */}
          {step !== "pwdone" && (
            <div className="lg-top">
              <button
                type="button"
                className="lg-back"
                onClick={handleBack}
                aria-label={t("otpBack") || "Back"}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <span className="lg-eyebrow">{eyebrowText}</span>
            </div>
          )}

          {/* ── Success Checkmark Icon (pwdone step) ── */}
          {step === "pwdone" && (
            <span
              className="lg-mark"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 76,
                height: 76,
                margin: "0 auto 22px",
                borderRadius: "999px",
                background: "rgba(35,173,164,.14)",
                color: "var(--acc-bright)",
              }}
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="16 9 10 15 7 12" />
              </svg>
            </span>
          )}

          {/* ── Title & Subtitle ── */}
          <h1
            className="lg-h1"
            style={{ textAlign: isCentered ? "center" : "left" }}
          >
            {step === "forgot" && (t("forgotTitle") || "Forgot password")}
            {step === "otp" && (t("otpTitle") || "Verify code")}
            {step === "newpw" && (t("newPwTitle") || "New password")}
            {step === "pwdone" && (t("pwDoneTitle") || "Password changed")}
          </h1>

          <p
            className="lg-sub"
            style={{
              textAlign: isCentered ? "center" : "left",
              marginLeft: isCentered ? "auto" : undefined,
              marginRight: isCentered ? "auto" : undefined,
            }}
          >
            {step === "forgot" && (t("forgotSub") || "Enter your registered email and we will send a 5-digit code.")}
            {step === "otp" && (t("otpSub") || "Enter the 5-digit code we sent.")}
            {step === "newpw" && (t("newPwSub") || "Create a new password for your account.")}
            {step === "pwdone" && (t("pwDoneSub") || "Log in with your new password.")}
          </p>

          {/* ── 3-Step Progress Bar ── */}
          {stepIdx > 0 && (
            <div className="lg-steps">
              <span data-on={stepIdx >= 1 ? "1" : "0"} />
              <span data-on={stepIdx >= 2 ? "1" : "0"} />
              <span data-on={stepIdx >= 3 ? "1" : "0"} />
            </div>
          )}

          {/* ── Global Alert Error ── */}
          {topError && (
            <div className="lg-alert" data-tone={otpTone === "warn" ? "warn" : "err"}>
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <span>{topError}</span>
            </div>
          )}

          {/* ══════════════ STEP 1: FORGOT PASSWORD ══════════════ */}
          {step === "forgot" && (
            <form onSubmit={handleSendCode} noValidate>
              <div className="lg-fields">
                <label>
                  <input
                    type="email"
                    className="lg-in"
                    placeholder={t("forgotEmailPlaceholder") || (isMn ? "Имэйл" : "Email")}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errEmail) setErrEmail("");
                      if (topError) setTopError("");
                    }}
                    aria-invalid={!!errEmail}
                    autoComplete="email"
                    autoFocus
                  />
                  {errEmail && <span className="lg-err">{errEmail}</span>}
                </label>
              </div>

              <button
                type="submit"
                className="lg-submit"
                disabled={busy || !email.trim()}
              >
                {busy && <span className="lg-spin" />}
                {t("forgotSendCode") || (isMn ? "Код илгээх" : "Send code")}
              </button>

              <button
                type="button"
                className="lg-ghost"
                onClick={() => router.push("/login")}
              >
                {t("forgotBackToLogin") || (isMn ? "Нэвтрэх хуудас руу" : "Back to log in")}
              </button>
            </form>
          )}

          {/* ══════════════ STEP 2: VERIFY CODE (OTP) ══════════════ */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} noValidate>
              <div
                className="lg-otp"
                data-tone={otpTone}
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    data-otp={idx}
                    aria-label={`Digit ${idx + 1}`}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    value={digit}
                    onChange={(e) => handleOtpInput(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="lg-submit"
                disabled={busy || otp.join("").length < 5}
              >
                {busy && <span className="lg-spin" />}
                {t("otpVerify") || (isMn ? "Баталгаажуулах" : "Verify")}
              </button>

              {/* ── 60-Second Countdown Timer & Resend Link ── */}
              <div className="lg-resend">
                {timer > 0 ? (
                  <span>
                    {isMn
                      ? `Дахин илгээх хүртэл ${formattedTimer}`
                      : `Resend in ${formattedTimer}`}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="lg-link"
                    style={{ textDecoration: "underline" }}
                  >
                    {t("otpResend") || (isMn ? "Кодыг дахин илгээх" : "Resend code")}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ══════════════ STEP 3: SET NEW PASSWORD ══════════════ */}
          {step === "newpw" && (
            <form onSubmit={handleSavePassword} noValidate>
              <div className="lg-fields">
                <label className="lg-pw">
                  <input
                    type={eye1 ? "text" : "password"}
                    className="lg-in"
                    placeholder={t("newPwPlaceholder") || (isMn ? "Шинэ нууц үг" : "New password")}
                    value={pw1}
                    onChange={(e) => {
                      setPw1(e.target.value);
                      if (errPw) setErrPw("");
                    }}
                    aria-invalid={!!errPw}
                    autoComplete="new-password"
                    style={{ paddingRight: 56 }}
                  />
                  <button
                    type="button"
                    onClick={() => setEye1(!eye1)}
                    aria-label="Toggle password visibility"
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 40,
                      height: 40,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      border: "none",
                      borderRadius: "999px",
                      background: "transparent",
                      cursor: "pointer",
                      color: eye1 ? "var(--acc-bright)" : "var(--bd-gray-500)",
                      opacity: eye1 ? 1 : 0.65,
                    }}
                  >
                    {eye1 ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    )}
                  </button>
                  {errPw && <span className="lg-err">{errPw}</span>}
                </label>

                <label className="lg-pw">
                  <input
                    type={eye2 ? "text" : "password"}
                    className="lg-in"
                    placeholder={t("confirmNewPwPlaceholder") || (isMn ? "Шинэ нууц үг баталгаажуулах" : "Confirm new password")}
                    value={pw2}
                    onChange={(e) => {
                      setPw2(e.target.value);
                      if (errPw2) setErrPw2("");
                    }}
                    aria-invalid={!!errPw2}
                    autoComplete="new-password"
                    style={{ paddingRight: 56 }}
                  />
                  <button
                    type="button"
                    onClick={() => setEye2(!eye2)}
                    aria-label="Toggle confirm password visibility"
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 40,
                      height: 40,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      border: "none",
                      borderRadius: "999px",
                      background: "transparent",
                      cursor: "pointer",
                      color: eye2 ? "var(--acc-bright)" : "var(--bd-gray-500)",
                      opacity: eye2 ? 1 : 0.65,
                    }}
                  >
                    {eye2 ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    )}
                  </button>
                  {errPw2 && <span className="lg-err">{errPw2}</span>}
                </label>
              </div>

              <p
                style={{
                  margin: "14px 0 0",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "var(--bd-gray-500)",
                }}
              >
                {t("pwRuleHint") ||
                  (isMn
                    ? "Хамгийн багадаа 8 тэмдэгт, нэг тоо орсон байх."
                    : "At least 8 characters, must include at least one number.")}
              </p>

              <button
                type="submit"
                className="lg-submit"
                disabled={busy || !pw1 || !pw2}
              >
                {busy && <span className="lg-spin" />}
                {t("savePassword") || (isMn ? "Нууц үг хадгалах" : "Save password")}
              </button>
            </form>
          )}

          {/* ══════════════ STEP 4: PASSWORD RESET SUCCESS ══════════════ */}
          {step === "pwdone" && (
            <div>
              <button
                type="button"
                className="lg-submit"
                onClick={() => router.push("/login")}
              >
                {t("pwDoneLoginBtn") || (isMn ? "Нэвтрэх" : "Log in")}
              </button>
            </div>
          )}

        </section>
      </main>
    </GuestRoute>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="lg-shell">
          <div
            className="lg-panel"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <span className="lg-spin" />
          </div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
