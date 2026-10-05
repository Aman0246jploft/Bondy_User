"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import staffApi from "@/api/staffApi";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$&*~%^()_+=\[\]{};:<>|./?,-]).{8,}$/;

function ResetPasswordContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resetRole, setResetRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: OTP, 2: Password Reset, 3: Success
  const { t } = useLanguage();

  // OTP State
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputRefs = useRef([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Password State
  const [resetToken, setResetToken] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (!storedEmail) {
      toast.error(t("pleaseStartFromForgotPassword") || "Please start from the forgot password page");
      router.push("/forgot-password");
      return;
    }
    setEmail(storedEmail);
    setResetRole(localStorage.getItem("resetRole"));
  }, [router, t]);

  useEffect(() => {
    document.title = `${t("resetPassword") || "Reset Password"} - Bondy`;
  }, [t]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0 && step === 1) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  // Focus first input on mount
  useEffect(() => {
    if (step === 1) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  // OTP Handlers
  const handleOtpChange = (element, index) => {
    const val = element.value.replace(/\D/g, "");
    if (!val && element.value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = val ? val.slice(-1) : "";
    setOtp(newOtp);

    if (val && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (!pasted) return;
    const newOtp = ["", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIdx = Math.min(pasted.length, 4);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length < 5) {
      toast.error(t("pleaseEnterCompleteOtp") || "Please enter complete OTP");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (resetRole === "staff") {
        response = await staffApi.forgotPasswordVerify({
          email,
          otp: otpValue,
        });
      } else {
        response = await authApi.verifyForgotPasswordOtp({
          email,
          otp: otpValue,
        });
      }

      if (response?.status) {
        setResetToken(response?.data?.token);
        setStep(2);
        toast.success(t("otpVerifiedNowSetNewPassword") || "OTP verified! Now set your new password");
      }
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    if (!canResend) return;

    try {
      let response;
      if (resetRole === "staff") {
        response = await staffApi.forgotPasswordResend({ email });
      } else {
        response = await authApi.resendUniversalOtp({
          email,
          type: "FORGOT_PASSWORD",
        });
      }

      if (response?.status) {
        toast.success(t("otpResentSuccessfully") || "OTP resent successfully");
        setResendTimer(60);
        setCanResend(false);
        setOtp(["", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      // Error handled by interceptor
    }
  };

  // Password handlers
  const validateNewPassword = (password) => {
    if (!password) return t("passwordRequired") || "Password is required";
    if (!STRONG_PASSWORD_REGEX.test(password))
      return t("passwordComplexity") || "Must contain uppercase, lowercase, number & special character (min 8 chars)";
    return "";
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      const nextErrors = { ...passwordErrors };

      if (name === "newPassword") {
        nextErrors.newPassword = validateNewPassword(value);
        if (next.confirmPassword) {
          nextErrors.confirmPassword =
            value === next.confirmPassword ? "" : t("passwordsNotMatch") || "Passwords do not match";
        }
      }

      if (name === "confirmPassword") {
        nextErrors.confirmPassword = value
          ? value === next.newPassword
            ? ""
            : t("passwordsNotMatch") || "Passwords do not match"
          : t("confirmPasswordRequired") || "Please confirm your password";
      }

      setPasswordErrors(nextErrors);
      return next;
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const errors = {};
    const newPasswordError = validateNewPassword(formData.newPassword);
    if (newPasswordError) errors.newPassword = newPasswordError;

    if (!formData.confirmPassword) {
      errors.confirmPassword = t("confirmPasswordRequired") || "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = t("passwordsNotMatch") || "Passwords do not match";
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      let response;
      if (resetRole === "staff") {
        response = await staffApi.resetPassword({
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
          resetToken: resetToken,
        });
      } else {
        response = await authApi.resetPassword({
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
          resetToken: resetToken,
        });
      }

      if (response?.status) {
        setStep(3);
        toast.success(t("passwordResetSuccessful") || "Password reset successful!");

        localStorage.removeItem("resetEmail");
        localStorage.removeItem("resetRole");

        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const otpFilled = otp.join("").length === 5;
  const mm = String(Math.floor(resendTimer / 60)).padStart(2, "0");
  const ss = String(resendTimer % 60).padStart(2, "0");

  return (
    <GuestRoute>
      <Header />
      <main className="lg-shell">
        <section className="lg-panel">

          {/* ── STEP 1: OTP VERIFICATION ── */}
          {step === 1 && (
            <>
              <span
                className="lg-otp-mark"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "999px",
                  background: "rgba(35,173,164,.14)",
                  color: "var(--acc-bright)",
                  fontSize: 26,
                  marginBottom: 18,
                }}
              >
                ✉
              </span>

              <h1 className="lg-h1">{t("enterVerificationCode")}</h1>
              <p className="lg-sub" style={{ marginBottom: 0 }}>
                {t("weSentCode")}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--acc-bright)",
                  wordBreak: "break-all",
                }}
              >
                {email}
              </p>

              <form onSubmit={handleVerifyOtp}>
                <div className="lg-otp" onPaste={handlePaste}>
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      placeholder={focusedIndex === index ? "" : "—"}
                      ref={(el) => (inputRefs.current[index] = el)}
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      className="lg-otp-input"
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="lg-resend-row">
                  <span>{t("didntReceiveCode")}</span>
                  {resendTimer > 0 ? (
                    <span className="lg-resend-timer">
                      {t("resend")} ({mm}:{ss})
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="lg-resend-btn"
                      onClick={handleResendOtp}
                    >
                      {t("resend")}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="lg-submit"
                  disabled={loading || !otpFilled}
                >
                  {loading && <span className="lg-spin" />}
                  {loading ? t("verifying") : t("verifyAndContinue")}
                </button>
              </form>

              <div className="lg-switch" style={{ marginTop: 20 }}>
                <span>{t("wrongEmail") || "Wrong email?"}</span>
                <Link href="/forgot-password" className="lg-switch-link">
                  {t("goBack") || "Go back"}
                </Link>
              </div>
            </>
          )}

          {/* ── STEP 2: SET NEW PASSWORD ── */}
          {step === 2 && (
            <>
              <span
                className="lg-otp-mark"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "999px",
                  background: "rgba(35,173,164,.14)",
                  color: "var(--acc-bright)",
                  fontSize: 26,
                  marginBottom: 18,
                }}
              >
                🔒
              </span>

              <h1 className="lg-h1">{t("setNewPassword") || "Set New Password"}</h1>
              <p className="lg-sub" style={{ marginBottom: 20 }}>
                {t("createStrongPassword") || "Create a strong password to secure your account"}
              </p>

              <form onSubmit={handleResetPassword} noValidate>
                <div className="lg-fields">
                  {/* New Password */}
                  <label>
                    <div className="lg-pw">
                      <input
                        type={show ? "text" : "password"}
                        name="newPassword"
                        className="lg-in"
                        placeholder={t("newPassword") || "New Password"}
                        value={formData.newPassword}
                        onChange={handlePasswordChange}
                        aria-invalid={!!passwordErrors.newPassword}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="lg-eye-btn"
                        aria-label="Toggle password visibility"
                      >
                        <img src={show ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle password" />
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <span className="lg-err">{passwordErrors.newPassword}</span>
                    )}
                  </label>

                  {/* Confirm Password */}
                  <label>
                    <div className="lg-pw">
                      <input
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        className="lg-in"
                        placeholder={t("confirmNewPassword") || "Confirm New Password"}
                        value={formData.confirmPassword}
                        onChange={handlePasswordChange}
                        aria-invalid={!!passwordErrors.confirmPassword}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="lg-eye-btn"
                        aria-label="Toggle confirm password visibility"
                      >
                        <img src={showConfirm ? "/img/lock.svg" : "/img/unlock.svg"} alt="toggle password" />
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <span className="lg-err">{passwordErrors.confirmPassword}</span>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  className="lg-submit"
                  disabled={loading}
                  style={{ marginTop: 22 }}
                >
                  {loading && <span className="lg-spin" />}
                  {loading ? t("sending") || "Updating..." : t("resetPassword") || "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 3: SUCCESS ── */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10B981",
                  marginBottom: 20,
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h1 className="lg-h1">{t("passwordResetSuccessful") || "Password Reset Successful!"}</h1>
              <p className="lg-sub" style={{ marginBottom: 24 }}>
                {t("passwordResetSuccessDesc") || "Your password has been reset successfully. Redirecting you to login..."}
              </p>

              <Link href="/login" className="lg-submit" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                {t("backToLogin") || "Back to Login"}
              </Link>
            </div>
          )}
        </section>
      </main>
    </GuestRoute>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="lg-shell">
          <div className="lg-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="lg-spin" />
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
