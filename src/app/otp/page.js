"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import authApi from "@/api/authApi";
import toast from "react-hot-toast";
import GuestRoute from "@/components/GuestRoute";
import Header from "@/components/Header";
import { useLanguage } from "@/context/LanguageContext";
import VerificationModl from "@/components/Modal/VerificationModl";

function OTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");
  const inputRefs = useRef([]);
  const [timer, setTimer] = useState(60);
  const [focusedIndex, setFocusedIndex] = useState(null);

  /* ── Timer countdown ── */
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    document.title = `${t("verifyAndContinue")} - Bondy`;
  }, [t]);

  useEffect(() => {
    const flow = searchParams.get("flow");
    const storedEmail =
      flow === "login"
        ? localStorage.getItem("loginEmail")
        : localStorage.getItem("registerEmail");
    if (storedEmail) setEmail(storedEmail);
  }, [searchParams]);

  /* ── OTP input handling ── */
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.value !== "" && index < 4) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  /* ── Paste support ── */
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (!text) return;
    const newOtp = [...otp];
    text.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const nextIndex = Math.min(text.length, 4);
    inputRefs.current[nextIndex]?.focus();
  };

  /* ── Verify ── */
  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 5) {
      toast.error(t("pleaseEnterFullOtp"));
      return;
    }

    const flow = searchParams.get("flow");
    const type = flow === "login" ? "LOGIN" : localStorage.getItem("registerType");

    setLoading(true);
    try {
      const response = await authApi.verifyUniversalOtp({
        email,
        otp: otpValue,
        type: type || "CUSTOMER",
      });

      if (response?.status) {
        if (flow === "login") {
          localStorage.removeItem("loginEmail");
          localStorage.removeItem("loginType");
        } else {
          localStorage.removeItem("registerEmail");
          localStorage.removeItem("registerType");
        }

        const profile = response?.data?.user;
        let isApproved = false;
        let userRole = "CUSTOMER";
        let hasBusinessDetails = false;

        if (profile) {
          isApproved = profile?.hasBeenApproved === true || profile?.isVerified === true;
          if (profile?.roleId === 2 || profile?.organizerVerificationStatus) userRole = "ORGANIZER";
          hasBusinessDetails = !!(
            profile?.businessName ||
            profile?.businessCategory ||
            profile?.shortDesc ||
            profile?.socialMediaLink
          );
        }

        const isUnverifiedOrganizerWithBusiness = userRole === "ORGANIZER" && !isApproved && hasBusinessDetails;

        if (!isUnverifiedOrganizerWithBusiness) {
          if (response?.data?.token) localStorage.setItem("token", response?.data?.token);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("userProfile");
        }

        let shouldShowModal = false;
        let nextPath = "/";
        try {
          const fullProfileRes = await authApi.getSelfProfile();
          const fullProfile = fullProfileRes?.data?.user || profile;
          if (fullProfile) localStorage.setItem("userProfile", JSON.stringify(fullProfile));

          if (fullProfile) {
            if (userRole === "ORGANIZER") {
              if (!hasBusinessDetails) {
                nextPath = "/completeprofile";
              } else {
                nextPath = "/";
                if (!isApproved) shouldShowModal = true;
              }
            } else {
              if (!fullProfile?.firstName || !fullProfile?.lastName) {
                nextPath = "/completeprofile";
              } else if (!fullProfile?.categories || fullProfile?.categories.length === 0) {
                nextPath = "/insterest";
              } else {
                nextPath = "/";
              }
            }
          } else {
            nextPath = "/completeprofile";
          }
        } catch (err) {
          console.error("Profile check failed:", err);
          nextPath = profile?.firstName && profile?.lastName ? "/" : "/completeprofile";
        }

        if (shouldShowModal) {
          setRedirectPath("/");
          setModalShow(true);
        } else {
          router.push(nextPath);
        }
      }
    } catch (error) {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend ── */
  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) { toast.error(t("emailNotFound")); return; }
    const flow = searchParams.get("flow");
    const type = flow === "login" ? "LOGIN" : localStorage.getItem("registerType");
    try {
      const response = await authApi.resendUniversalOtp({ email, type: type || "CUSTOMER" });
      if (response.status) {
        toast.success(t("otpResentSuccessfully"));
        setTimer(60);
      }
    } catch (error) {
      // handled by apiClient
    }
  };

  /* ── OTP filled? ── */
  const otpFilled = otp.join("").length === 5;

  /* ── Timer display ── */
  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

  return (
    <GuestRoute>
      <Header />
      <main className="lg-shell">
        <section className="lg-panel">

          {/* ── Icon mark ── */}
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

          {/* ── Title ── */}
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
            {email || t("email")}
          </p>

          {/* ── OTP grid ── */}
          <form onSubmit={handleVerify}>
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
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  className="lg-otp-input"
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            {/* ── Resend row ── */}
            <div className="lg-resend-row">
              <span>{t("didntReceiveCode")}</span>
              {timer > 0 ? (
                <span className="lg-resend-timer">
                  {t("resend")} ({mm}:{ss})
                </span>
              ) : (
                <button
                  type="button"
                  className="lg-resend-btn"
                  onClick={handleResend}
                >
                  {t("resend")}
                </button>
              )}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              className="lg-submit"
              disabled={loading || !otpFilled}
            >
              {loading && <span className="lg-spin" />}
              {loading ? t("verifying") : t("verifyAndContinue")}
            </button>
          </form>

          {/* ── Back link ── */}
          <div className="lg-switch" style={{ marginTop: 20 }}>
            <span>{t("wrongEmail") || "Wrong email?"}</span>
            <button
              type="button"
              className="lg-switch-link"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              onClick={() => router.back()}
            >
              {t("goBack") || "Go back"}
            </button>
          </div>
        </section>

        <VerificationModl
          show={modalShow}
          onHide={() => {
            setModalShow(false);
            localStorage.removeItem("token");
            router.push("/");
          }}
          redirectPath="/"
          onGoBack={() => { localStorage.removeItem("token"); }}
        />
      </main>
    </GuestRoute>
  );
}

export default function OTPPage() {
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
      <OTPContent />
    </Suspense>
  );
}
