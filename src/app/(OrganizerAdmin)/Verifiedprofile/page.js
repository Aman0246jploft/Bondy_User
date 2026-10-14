"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/api/apiClient";
import authApi from "@/api/authApi";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import ProtectedRoute from "@/components/ProtectedRoute";

const OTP_LEN = 5;
const MAX_FILE = 5 * 1024 * 1024;

const TONE = {
  ok: { background: "rgba(52,199,89,.16)", color: "#34C759" },
  brand: { background: "rgba(35,173,164,.16)", color: "#36CEC2" },
  warn: { background: "rgba(255,138,51,.16)", color: "#FFB273" },
  danger: { background: "rgba(255,90,90,.16)", color: "#FF8A8A" },
};
const BOX = {
  ok: { borderColor: "rgba(52,199,89,.5)", background: "rgba(52,199,89,.09)", color: "#34C759" },
  brand: { borderColor: "rgba(35,173,164,.45)", background: "rgba(35,173,164,.08)", color: "#36CEC2" },
  warn: { borderColor: "rgba(255,138,51,.5)", background: "rgba(255,138,51,.09)", color: "#FFB273" },
  danger: { borderColor: "rgba(255,90,90,.5)", background: "rgba(255,90,90,.09)", color: "#FF8A8A" },
};

function media(src) {
  if (!src) return "";
  const s = String(src);
  if (s.startsWith("http") || s.startsWith("blob:") || s.startsWith("data:") || s.startsWith("/")) return s;
  return getFullImageUrl(s);
}

function stamp(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function normIban(raw) {
  return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
}
function formatIban(raw) {
  return normIban(raw).replace(/(.{4})/g, "$1 ").trim();
}
function ibanValid(raw) {
  const s = normIban(raw);
  return s.length === 20 && s.startsWith("MN") && /^\d+$/.test(s.slice(2));
}
function maskAcct(raw) {
  const s = String(raw || "").replace(/\s+/g, "");
  if (s.length < 4) return s ? "••••" : "";
  if (s.toUpperCase().startsWith("MN") && s.length >= 8) return `${s.slice(0, 4)} •••• •••• •••• ${s.slice(-4)}`;
  return `•••• •••• ${s.slice(-4)}`;
}
function mapStatus(status) {
  if (status === "approved" || status === "verified") return "verified";
  if (status === "pending" || status === "review") return "review";
  if (status === "rejected") return "rejected";
  return "none";
}
function errText(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

function Icon({ name, size = 19 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": "true" };
  if (name === "phone") return <svg {...p}><path d="M6.5 3.5h3l1.4 3.4-2 1.2a12 12 0 0 0 6 6l1.2-2 3.4 1.4v3a2 2 0 0 1-2.2 2A16 16 0 0 1 3.5 5.7a2 2 0 0 1 2-2.2Z" /></svg>;
  if (name === "mail") return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  if (name === "shield") return <svg {...p}><path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.5 4.2-1.3 7-4.3 7-8.5V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === "wallet") return <svg {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" /></svg>;
  if (name === "user") return <svg {...p}><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" /></svg>;
  if (name === "pin") return <svg {...p}><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" /><circle cx="12" cy="11" r="2" /></svg>;
  if (name === "clock") return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" /></svg>;
  if (name === "check") return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.4 2.4 4.6-5" /></svg>;
  if (name === "back") return <svg {...p}><path d="M15 6 9 12l6 6" /></svg>;
  if (name === "down") return <svg {...p}><path d="m6 9 6 6 6-6" /></svg>;
  return <svg {...p}><path d="m9 6 6 6-6 6" /></svg>;
}

function VerificationPageContent() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [banks, setBanks] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [ask, setAsk] = useState(null);
  const [step, setStep] = useState("value");
  const [newVal, setNewVal] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [left, setLeft] = useState(0);
  const [resendTick, setResendTick] = useState(0);
  const [contactEditing, setContactEditing] = useState(false);
  const [bankEditing, setBankEditing] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankQuery, setBankQuery] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [idStep, setIdStep] = useState("list");
  const [docType, setDocType] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [frontBusy, setFrontBusy] = useState(false);
  const [backBusy, setBackBusy] = useState(false);
  const [upErr, setUpErr] = useState("");
  const [sheetErr, setSheetErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const flash = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const load = async () => {
    try {
      setLoading(true);
      setFailed(false);
      const [profileRes, bankRes] = await Promise.all([
        apiClient.get("/user/selfProfile"),
        apiClient.get("/verification/banks"),
      ]);
      if (!profileRes?.status || !profileRes.data?.user) {
        setFailed(true);
        return;
      }
      setProfile(profileRes.data.user);
      setBanks(bankRes?.status && Array.isArray(bankRes.data?.banks) ? bankRes.data.banks : []);
    } catch (err) {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = t("organizerVerificationTitle");
    load();
    const item = new URLSearchParams(window.location.search).get("item");
    if (["phone", "email", "identity", "bank", "profile"].includes(item)) setSheet(item);
  }, []);

  useEffect(() => {
    if (step !== "otp") return undefined;
    setLeft(30);
    const id = window.setInterval(() => {
      setLeft((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, resendTick]);

  const u = profile || {};
  const phoneVerified = Boolean(u.verifications?.phone?.isVerified);
  const emailVerified = Boolean(u.verifications?.email?.isVerified);
  const phoneValue = [u.countryCode, u.contactNumber].filter(Boolean).join(" ");
  const emailValue = u.email || "";

  const idDocs = [];
  const nat = u.verifications?.idVerification?.nationalId;
  const lic = u.verifications?.idVerification?.drivingLicence;
  if (nat?.frontImage) idDocs.push({ type: "id", front: nat.frontImage, back: nat.backImage, status: mapStatus(nat.status), reason: nat.rejectionReason, at: nat.verifiedAt });
  if (lic?.frontImage) idDocs.push({ type: "license", front: lic.frontImage, back: lic.backImage, status: mapStatus(lic.status), reason: lic.rejectionReason, at: lic.verifiedAt });
  let idStatus = "none";
  if (idDocs.some((d) => d.status === "rejected")) idStatus = "rejected";
  else if (idDocs.some((d) => d.status === "review")) idStatus = "review";
  else if (idDocs.length && idDocs.every((d) => d.status === "verified")) idStatus = "verified";
  const idDoc = idDocs[idDocs.length - 1] || null;

  const accountList = Array.isArray(u.bankAccounts) ? u.bankAccounts : [];
  const bankRec = [...accountList].reverse().find((b) => b.status === "pending")
    || accountList[accountList.length - 1]
    || u.verifications?.bankVerification
    || null;
  const bankStatus = bankRec?.bankName ? mapStatus(bankRec.status) : "none";

  const profileFields = [
    { key: "vfName", done: Boolean(u.businessName) },
    { key: "vfLogo", done: Boolean(u.profileImage) },
    { key: "vfAbout", done: Boolean(u.shortDesc || u.bio) },
    { key: "vfContact", done: Boolean(u.contactNumber) },
    { key: "vfAddress", done: Boolean(u.address || u.city) },
    { key: "vfSocial", done: Boolean(u.socialMediaLink) },
  ];
  const profileStatus = mapStatus(u.businessVerificationStatus);
  const profileDone = profileFields.filter((f) => f.done).length;

  const items = {
    phone: { status: phoneVerified ? "verified" : "none", value: phoneValue },
    email: { status: emailVerified ? "verified" : "none", value: emailValue },
    identity: { status: idStatus },
    bank: { status: bankStatus },
    profile: { status: profileStatus },
  };
  const statuses = Object.values(items).map((item) => item.status);
  const done = statuses.filter((s) => s === "verified").length;
  let overall = "none";
  if (statuses.includes("rejected")) overall = "rejected";
  else if (statuses.every((s) => s === "verified")) overall = "verified";
  else if (statuses.includes("review")) overall = "review";
  else if (done > 0) overall = "progress";

  const overallCopy = {
    none: ["vfUnverified", "vfUnverifiedNote", "warn"],
    progress: ["vfUnverified", "vfProgressNote", "warn"],
    review: ["vfReview", "vfReviewNote", "warn"],
    verified: ["vfVerified", "vfVerifiedNote", "ok"],
    rejected: ["vfNeedsFix", "vfNeedsFixNote", "danger"],
  }[overall];

  const docLabel = (type) => (type === "license" ? t("vfLicence") : t("vfIdCard"));
  const rowDetail = (key) => {
    const item = items[key];
    if (key === "identity") {
      if (!idDoc) return t("vfDocsTodo");
      const name = docLabel(idDoc.type);
      if (item.status === "review") return `${name} · ${t("vfSentStamp", { when: stamp(idDoc.at) || t("vfSentShort") })}`;
      if (item.status === "rejected") return `${name} · ${t("vfResubmit")}`;
      return name;
    }
    if (item.status === "verified") {
      if (key === "phone" || key === "email") return item.value || t("vfVerified");
      if (key === "bank" && bankRec?.accountNumber) return `${bankRec.bankName} · ${maskAcct(bankRec.accountNumber)}`;
      return t("vfVerified");
    }
    if (item.status === "review") {
      if (key === "bank" && bankRec?.accountNumber) return `${maskAcct(bankRec.accountNumber)} · ${t("vfSentShort")}`;
      if (key === "phone") return t("vfSentPhone");
      if (key === "email") return t("vfSentEmail");
      if (key === "profile") return t("vfSentProfile");
      return t("vfSentShort");
    }
    if (item.status === "rejected") return t("vfResubmit");
    return { phone: t("vfPhoneTodo"), email: t("vfEmailTodo"), identity: t("vfDocsTodo"), bank: t("vfBankTodo"), profile: t("vfProfileTodo") }[key];
  };
  const rowReason = (key) => {
    if (items[key].status !== "rejected") return "";
    if (key === "identity") return idDoc?.reason || "";
    if (key === "bank") return bankRec?.rejectionReason || "";
    if (key === "profile") return u.businessRejectionReason || "";
    return "";
  };

  const rows = [
    { key: "phone", title: t("vfPhone"), icon: "phone" },
    { key: "email", title: t("vfEmail"), icon: "mail" },
    { key: "identity", title: t("vfDocs"), icon: "shield" },
    { key: "bank", title: t("vfBank"), icon: "wallet" },
    { key: "profile", title: t("vfProfile"), icon: "user" },
  ];

  const openSheet = (key) => {
    setSheet(key);
    setAsk(null);
    setStep("value");
    setNewVal("");
    setOtp("");
    setOtpMsg("");
    setSheetErr("");
    setUpErr("");
    setContactEditing(false);
    setBankEditing(false);
    setBankOpen(false);
    setBankQuery("");
    setIdStep("list");
    setDocType("");
    setFront("");
    setBack("");
    setBankName("");
    setBankIban("");
    setBankHolder("");
  };

  const closeSheet = (force) => {
    if (!force && (sheet === "phone" || sheet === "email") && step === "otp") {
      setAsk("otpcancel");
      return;
    }
    if (!force && sheet === "identity" && idStep === "upload" && (front || back)) {
      setAsk("idclose");
      return;
    }
    setSheet(null);
    setAsk(null);
    setStep("value");
  };

  const sendCode = async () => {
    const raw = String(newVal || "").trim();
    if (sheet === "email") {
      if (!raw || raw.length > 120 || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(raw)) { setSheetErr(t("stEmailLen")); return; }
    } else {
      const digits = raw.replace(/\D/g, "");
      if (!digits) { setSheetErr(t("vfPhoneNeed")); return; }
      if (digits.length !== 8) { setSheetErr(t("vfPhoneBad")); return; }
    }
    try {
      setBusy(true);
      setSheetErr("");
      const res = sheet === "email"
        ? await apiClient.post("/verification/email/send-otp", { email: raw })
        : await apiClient.post("/verification/phone/send-otp", { countryCode: "+976", contactNumber: raw.replace(/\D/g, "") });
      if (!res?.status) { setSheetErr(res?.message || t("vfUploadFail")); return; }
      if (sheet === "phone") {
        const digits = raw.replace(/\D/g, "");
        setNewVal(`+976 ${digits.slice(0, 4)} ${digits.slice(4)}`);
      }
      setStep("otp");
      setOtp("");
      setOtpMsg("");
      setResendTick((n) => n + 1);
      flash(t("vfCodeSent"));
    } catch (err) {
      setSheetErr(errText(err, t("vfUploadFail")));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== OTP_LEN) { setOtpMsg(t("vfOtpLen", { count: OTP_LEN })); return; }
    try {
      setBusy(true);
      setOtpMsg("");
      const path = sheet === "email" ? "/verification/email/verify-otp" : "/verification/phone/verify-otp";
      const res = await apiClient.post(path, { otp });
      if (!res?.status) { setOtpMsg(res?.message || t("vfOtpBad")); return; }
      setSheet(null);
      setStep("value");
      flash(t("vfConfirmed"));
      load();
    } catch (err) {
      setOtpMsg(errText(err, t("vfOtpBad")));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (left > 0 || busy) return;
    try {
      setBusy(true);
      const path = sheet === "email" ? "/verification/email/resend-otp" : "/verification/phone/resend-otp";
      const res = await apiClient.post(path, {});
      if (!res?.status) { setOtpMsg(res?.message || t("vfUploadFail")); return; }
      setOtp("");
      setOtpMsg("");
      setResendTick((n) => n + 1);
      flash(t("vfCodeAgain"));
    } catch (err) {
      setOtpMsg(errText(err, t("vfUploadFail")));
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (side, file) => {
    if (!file) return;
    const okType = /image\/(png|jpe?g|webp)|application\/pdf/i.test(file.type) || /\.(png|jpe?g|webp|pdf)$/i.test(file.name);
    if (!okType) { setUpErr(t("vfFileType")); return; }
    if (file.size > MAX_FILE) { setUpErr(t("vfFileBig")); return; }
    const form = new FormData();
    form.append("files", file);
    try {
      if (side === "front") setFrontBusy(true); else setBackBusy(true);
      setUpErr("");
      const res = await authApi.uploadFile(form);
      const url = res?.data?.files?.[0];
      if (!res?.status || !url) { setUpErr(t("vfUploadFail")); return; }
      if (side === "front") setFront(url); else setBack(url);
      flash(t("vfFileAdded"));
    } catch (err) {
      setUpErr(errText(err, t("vfUploadFail")));
    } finally {
      setFrontBusy(false);
      setBackBusy(false);
    }
  };

  const submitDoc = async () => {
    if (!front) { setSheetErr(t("vfIdFrontNeed")); return; }
    if (!back) { setSheetErr(t("vfIdBackNeed")); return; }
    try {
      setBusy(true);
      setSheetErr("");
      const payload = docType === "license"
        ? { drivingLicence: { frontImage: front, backImage: back } }
        : { nationalId: { frontImage: front, backImage: back } };
      const res = await apiClient.post("/verification/submit", payload);
      if (!res?.status) { setSheetErr(res?.message || t("vfUploadFail")); return; }
      setIdStep("list");
      setFront("");
      setBack("");
      setDocType("");
      flash(t("vfSentReview"));
      load();
    } catch (err) {
      setSheetErr(errText(err, t("vfUploadFail")));
    } finally {
      setBusy(false);
    }
  };

  const submitBank = async () => {
    if (!bankName) { setSheetErr(t("vfBankNeed")); return; }
    if (!ibanValid(bankIban)) { setSheetErr(t("vfIbanFull")); return; }
    if (!bankHolder.trim() || bankHolder.trim().length > 80) { setSheetErr(t("vfHolderLen")); return; }
    try {
      setBusy(true);
      setSheetErr("");
      const res = await apiClient.post("/verification/submit", {
        bankVerification: {
          bankName,
          bankHolderName: bankHolder.trim(),
          accountNumber: normIban(bankIban),
        },
      });
      if (!res?.status) { setSheetErr(res?.message || t("vfUploadFail")); return; }
      setSheet(null);
      setBankEditing(false);
      flash(t("vfSentReview"));
      load();
    } catch (err) {
      setSheetErr(errText(err, t("vfUploadFail")));
    } finally {
      setBusy(false);
    }
  };

  const categoryName = (() => {
    const c = u.businessCategory;
    if (!c) return "";
    if (typeof c === "string") return c;
    return language === "mn" ? (c.nameMn || c.name || "") : (c.name || c.nameMn || "");
  })();
  const city = u.address || u.city || "";
  const logo = media(u.profileImage);
  const userId = u._id || u.id || u.userId;

  const contactEditable = sheet === "phone" || sheet === "email";
  const contactVerified = contactEditable && items[sheet]?.status === "verified" && !contactEditing;
  const contactEdit = contactEditable && !contactVerified && step !== "otp";
  const isOtp = contactEditable && step === "otp";
  const digits = String(newVal || "").replace(/\D/g, "");
  const currentDigits = String(phoneValue || "").replace(/\D/g, "").replace(/^976/, "");
  const sendOff = sheet === "email"
    ? String(newVal).trim().length > 120 || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(newVal).trim()) || String(newVal).trim().toLowerCase() === emailValue.toLowerCase()
    : digits.length !== 8 || digits === currentDigits;
  const bankForm = sheet === "bank" && (bankStatus === "none" || bankStatus === "rejected" || bankEditing);
  const bankRead = sheet === "bank" && !bankForm && bankRec?.bankName;
  const ibanMsg = sheet === "bank" ? (() => {
    const s = normIban(bankIban);
    if (!s || s.length < 2) return "";
    if (!s.startsWith("MN")) return t("vfIbanStart");
    if (!/^\d+$/.test(s.slice(2))) return t("vfIbanDigits");
    return "";
  })() : "";
  const bankHits = banks.filter((b) => !bankQuery.trim() || String(b.bankName || "").toLowerCase().includes(bankQuery.trim().toLowerCase()));
  const meta = sheet ? { label: statusMetaLabel(items[sheet]?.status, t), tone: statusTone(items[sheet]?.status) } : null;

  if (loading && !profile) {
    return (
      <div className="vf-page">
        <div className="vf-skel" />
        <div className="vf-skel" />
        <div className="vf-skel" style={{ height: 280 }} />
      </div>
    );
  }
  if (failed && !profile) {
    return (
      <div className="vf-page">
        <div className="vf-empty">
          <b>{t("vfLoadFail")}</b>
          <button type="button" className="vf-go" onClick={load}>{t("pyRetry")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="vf-page">
      <section className="vf-band" style={BOX[overallCopy[2]]}>
        <span className="vf-bandI" style={TONE[overallCopy[2]]}><Icon name="shield" size={22} /></span>
        <span>
          <b style={{ color: BOX[overallCopy[2]].color }}>{t(overallCopy[0])}</b>
          <i>{t(overallCopy[1])}</i>
        </span>
      </section>

      <div className="vf-prog">
        <span className="vf-progBar"><span style={{ width: `${Math.round((done / 5) * 100)}%` }} /></span>
        <span className="vf-progT">{t("vfProg", { done, total: 5 })}</span>
            </div>

      <section className="vf-list">
        {rows.map((row) => {
          const st = statusMetaLabel(items[row.key].status, t);
          const tone = statusTone(items[row.key].status);
          const reason = rowReason(row.key);
          return (
            <button type="button" className="vf-row" key={row.key} data-go="1" onClick={() => openSheet(row.key)}>
              <span className="vf-rowI" style={TONE[tone]}><Icon name={row.icon} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>{row.title}</b>
                <i>{rowDetail(row.key)}</i>
                {reason ? <em>{reason}</em> : null}
            </span>
              <span className="vf-rowEnd">
                <span className="vf-pill" style={TONE[tone]}>{st}</span>
                <Icon name="arrow" size={17} />
              </span>
            </button>
          );
        })}
      </section>

      <p className="vf-note"><Icon name="shield" size={15} /><span>{t("vfPrivacy")}</span></p>

      {sheet && (
        <div className="vf-scrim" onClick={(e) => { if (e.target === e.currentTarget) closeSheet(); }}>
          <div className="vf-sheet" role="dialog">
            <div className="vf-sheetHead">
              {sheet === "identity" && idStep !== "list" && (
                <button type="button" className="vf-x" aria-label={t("vfBack")} onClick={() => {
                  if (idStep === "upload" && (front || back)) { setAsk("idback"); return; }
                  setIdStep(idStep === "upload" ? "type" : "list");
                  setFront(""); setBack(""); setSheetErr(""); setUpErr("");
                }}><Icon name="back" size={16} /></button>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{sheetTitle()}</b>
                <span>{sheet === "profile" || sheet === "identity" || sheet === "bank" || contactEditable ? "" : meta?.label}</span>
              </div>
              <button type="button" className="vf-x" aria-label={t("vfClose")} onClick={() => closeSheet()}>×</button>
            </div>

            {meta && sheet !== "identity" && ["review", "rejected", "verified"].includes(items[sheet].status) && !contactEditing && !bankEditing && (
              <div className="vf-res" style={BOX[meta.tone]}>
                <b style={{ color: BOX[meta.tone].color }}>
                  {sheet === "profile" && items.profile.status === "review" ? t("vfProfileReview") : meta.label}
                </b>
                <p>{statusNote()}</p>
                    </div>
            )}

            {contactVerified && (
              <>
                <div className="vf-kv"><span>{sheet === "email" ? t("vfEmail") : t("vfPhone")}</span><span>{items[sheet].value || t("vfDash")}<span className="vf-pill" style={TONE.ok}>✓ {t("vfVerified")}</span></span></div>
                <button type="button" className="vf-go" onClick={() => { setContactEditing(true); setNewVal(""); setSheetErr(""); }}>{t("vfChange")}</button>
              </>
            )}

            {contactEdit && (
              <>
                <div className="vf-kv"><span>{sheet === "email" ? t("vfCurrentEmail") : t("vfCurrentPhone")}</span><span>{items[sheet].value || t("vfDash")}</span></div>
                <label className="vf-lb">{sheet === "email" ? t("vfNewEmail") : t("vfNewPhone")} <i>*</i></label>
                {sheet === "phone" ? (
                  <span className="vf-inWrap"><span className="vf-inPre">+976</span><input inputMode="numeric" maxLength={9} value={newVal} placeholder="9911 2233" onChange={(e) => { setNewVal(e.target.value.replace(/[^\d\s]/g, "").slice(0, 9)); setSheetErr(""); }} /></span>
                ) : (
                  <input className="vf-in" maxLength={120} value={newVal} placeholder="name@example.com" onChange={(e) => { setNewVal(e.target.value.slice(0, 120)); setSheetErr(""); }} />
                )}
                <span className="vf-hint">{sheet === "email" ? t("vfEmailHint") : t("vfPhoneHint")}</span>
                {sheetErr ? <div className="vf-alert">{sheetErr}</div> : null}
                <button type="button" className="vf-go" disabled={sendOff || busy} onClick={sendCode}>{t("vfSendCode")}</button>
              </>
            )}

            {isOtp && (
              <>
                <p className="vf-hint">{sheet === "phone" ? t("vfOtpPhone", { value: newVal }) : t("vfOtpEmail", { value: newVal })}</p>
                <div className="vf-otpWrap">
                  <input className="vf-otpIn" inputMode="numeric" value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LEN)); setOtpMsg(""); }} />
                  <div className="vf-otp" onClick={(e) => e.currentTarget.previousSibling?.focus()}>
                    {Array.from({ length: OTP_LEN }).map((_, i) => (
                      <span key={i} className="vf-otpB" data-on={otp.length === i ? "1" : "0"} data-bad={otpMsg ? "1" : "0"}>{otp[i] || ""}</span>
                    ))}
                        </div>
                  {otpMsg ? <span className="vf-err">{otpMsg}</span> : null}
                  <span className="vf-hint">{left > 0 ? t("vfResendWait", { sec: left }) : t("vfResendReady")}</span>
                  </div>
                <div className="vf-acts">
                  <button type="button" className="vf-go" disabled={busy} onClick={verifyOtp}>{busy ? t("vfChecking") : t("vfVerify")}</button>
                  <button type="button" className="vf-gh" disabled={left > 0 || busy} onClick={resend}>{t("vfResend")}</button>
              </div>
              </>
            )}

            {sheet === "identity" && idStep === "list" && (
              <>
                <div className="vf-hero">
                  <span className="vf-heroI"><Icon name="shield" size={32} />{idStatus !== "verified" ? <em>!</em> : null}</span>
                  <h3>{idStatus === "review" ? t("vfIdReviewTitle") : idStatus === "verified" ? t("vfIdOkTitle") : idStatus === "rejected" ? t("vfNeedsFix") : t("vfIdEmptyTitle")}</h3>
                  <p>{idStatus === "review" ? t("vfIdReviewNote") : idStatus === "verified" ? t("vfIdOkNote") : idStatus === "rejected" ? (idDoc?.reason || t("vfNeedsFixNote")) : t("vfIdEmptyNote")}</p>
                </div>
                {idDoc && (
                  <div className="vf-docCard">
                    <div className="vf-docHead">
                      <span><b>{docLabel(idDoc.type)}</b><i>{idDoc.status === "verified" ? t("vfOkStamp", { when: stamp(idDoc.at) }) : t("vfSentStamp", { when: stamp(idDoc.at) })}</i></span>
                      <span className="vf-pill" style={TONE[statusTone(idDoc.status)]}>{statusMetaLabel(idDoc.status, t)}</span>
                </div>
                    <div className="vf-thumbs">
                      <div><span className="vf-shot" style={idDoc.front ? { backgroundImage: `url(${media(idDoc.front)})` } : undefined} /><span className="vf-thumbL">{t("vfFront")}</span></div>
                      <div><span className="vf-shot" style={idDoc.back ? { backgroundImage: `url(${media(idDoc.back)})` } : undefined} /><span className="vf-thumbL">{t("vfBack")}</span></div>
              </div>
                    {idDoc.status === "rejected" ? <p className="vf-note"><Icon name="clock" size={15} /><span>{t("vfIdRejectFoot")}</span></p> : null}
                      </div>
                    )}
                {(idStatus === "none" || idStatus === "rejected") && (
                  <button type="button" className="vf-go" onClick={() => { setIdStep("type"); setDocType(""); setFront(""); setBack(""); }}>{idStatus === "rejected" ? t("vfIdReplace") : t("vfIdAdd")}</button>
                )}
                <p className="vf-note vf-center"><Icon name="shield" size={15} /><span>{t("vfIdPrivacy")}</span></p>
              </>
            )}

            {sheet === "identity" && idStep === "type" && (
              <>
                <h3 className="vf-stepT">{t("vfChooseType")}</h3>
                <div className="vf-list">
                  {[{ id: "id", label: t("vfIdCard"), sub: t("vfIdCardSub") }, { id: "license", label: t("vfLicence"), sub: t("vfLicenceSub") }].map((doc) => (
                    <button type="button" className="vf-row" key={doc.id} onClick={() => { setDocType(doc.id); setIdStep("upload"); setFront(""); setBack(""); setSheetErr(""); }}>
                      <span className="vf-rowI" style={TONE.brand}><Icon name={doc.id === "id" ? "user" : "shield"} /></span>
                      <span style={{ flex: 1, minWidth: 0 }}><b>{doc.label}</b><i>{doc.sub}</i></span>
                      <Icon name="arrow" size={17} />
                      </button>
                  ))}
                    </div>
              </>
            )}

            {sheet === "identity" && idStep === "upload" && (
              <>
                <h3 className="vf-stepT">{docLabel(docType)}</h3>
                <p className="vf-stepP">{t("vfIdDesc", { name: docLabel(docType) })}</p>
                <div className="vf-dropGrid">
                  <Drop side="front" label={t("vfFront")} file={front} busy={frontBusy} onPick={pickFile} t={t} />
                  <Drop side="back" label={t("vfBack")} file={back} busy={backBusy} onPick={pickFile} t={t} />
                            </div>
                {upErr ? <div className="vf-alert">{upErr}</div> : null}
                {sheetErr ? <div className="vf-alert">{sheetErr}</div> : null}
                <p className="vf-note"><span>?</span><span>{t("vfIdSharp")}</span></p>
                <button type="button" className="vf-go" disabled={busy || !front || !back} onClick={submitDoc}>{busy ? t("vfSending") : t("vfSend")}</button>
              </>
            )}

            {bankRead && (
              <>
                <div className="vf-kv"><span>{t("vfBankName")}</span><span>{bankRec.bankName || t("vfDash")}</span></div>
                <div className="vf-kv"><span>{t("vfHolder")}</span><span>{bankRec.bankHolderName || t("vfDash")}</span></div>
                <div className="vf-kv"><span>{t("vfIban")}</span><span>{maskAcct(bankRec.accountNumber) || t("vfDash")}</span></div>
                <div className="vf-kv"><span>{t("vfSubmitted")}</span><span>{stamp(bankRec.verifiedAt || bankRec.updatedAt || bankRec.createdAt) || t("vfDash")}</span></div>
                <button type="button" className="vf-gh" onClick={() => {
                  if (bankStatus === "review" || bankStatus === "verified") { setAsk("bankreset"); return; }
                  setBankEditing(true);
                }}>{bankStatus === "rejected" ? t("vfSend") : t("vfChangeAccount")}</button>
              </>
            )}

            {bankForm && (
              <>
                <label className="vf-lb">{t("vfBankName")} <i>*</i></label>
                <div className="vf-sel">
                  <button type="button" className="vf-selBtn" data-empty={bankName ? "0" : "1"} aria-expanded={bankOpen} onClick={() => setBankOpen((v) => !v)}>
                    <span>{bankName || t("vfPickBank")}</span>
                    <Icon name="down" size={16} />
                        </button>
                  {bankOpen && (
                    <div className="vf-selPanel">
                      <input className="vf-in" value={bankQuery} placeholder={t("vfSearchBank")} onChange={(e) => setBankQuery(e.target.value)} />
                      <div className="vf-selList">
                        {bankHits.map((b) => (
                          <button type="button" className="vf-selOpt" key={b._id || b.bankName} aria-selected={bankName === b.bankName} onClick={() => { setBankName(b.bankName); setBankOpen(false); setBankQuery(""); setSheetErr(""); }}>
                            <span>{b.bankName}</span>
                            {bankName === b.bankName ? <Icon name="check" size={15} /> : null}
                      </button>
                        ))}
                        {bankHits.length === 0 ? <span className="vf-selNone">{t("vfNoBank")}</span> : null}
                    </div>
                  </div>
                )}
              </div>
                <label className="vf-lb">{t("vfIban")} <i>*</i></label>
                <input className="vf-in" value={bankIban} placeholder={t("vfIbanPh")} spellCheck={false} onChange={(e) => { setBankIban(formatIban(e.target.value)); setSheetErr(""); }} />
                {ibanMsg ? <span className="vf-err">{ibanMsg}</span> : null}
                <label className="vf-lb">{t("vfHolder")} <i>*</i></label>
                <input className="vf-in" maxLength={80} value={bankHolder} placeholder={t("vfHolderPh")} onChange={(e) => { setBankHolder(e.target.value.slice(0, 80)); setSheetErr(""); }} />
                <span className="vf-hint">{t("vfHolderHint")}</span>
                {sheetErr ? <div className="vf-alert">{sheetErr}</div> : null}
                <button type="button" className="vf-go" disabled={busy || !bankName || !ibanValid(bankIban) || !bankHolder.trim()} onClick={submitBank}>{busy ? t("vfSending") : t("vfSend")}</button>
              </>
            )}

            {sheet === "profile" && (
              <>
                <h3 className="vf-stepT">{t("vfPreviewTitle")}</h3>
                <div className="vf-pv">
                  <div className="vf-pvTop">
                    <span className="vf-pvAv" style={logo ? { backgroundImage: `url(${logo})` } : undefined} />
                    <span>
                      <b className="vf-pvName">{u.businessName || t("vfDash")}</b>
                      {categoryName ? <span className="vf-pvCat">{categoryName}</span> : null}
                      <span className="vf-pvBio">{u.shortDesc || u.bio || ""}</span>
                        </span>
                      </div>
                  {city ? <span className="vf-pvLoc"><Icon name="pin" size={15} /><span>{city}</span></span> : null}
                      </div>
                {(profileStatus === "none" || profileStatus === "rejected") && (
                  <>
                    <div className="vf-checks">
                      {profileFields.map((f) => (
                        <span className="vf-check" key={f.key}>
                          <span className="vf-checkI" style={f.done ? TONE.ok : TONE.warn}>{f.done ? "✓" : "!"}</span>
                          <span>{t(f.key)}</span>
                          <em>{f.done ? t("vfFilled") : t("vfMissing")}</em>
                        </span>
                      ))}
                    </div>
                    <span className="vf-hint">{t("vfParts", { done: profileDone, total: profileFields.length })}</span>
                  </>
                )}
                <p className="vf-note"><Icon name="shield" size={15} /><span>{t("vfProfilePrivacy")}</span></p>
                <div className="vf-acts">
                  <button type="button" className="vf-gh" onClick={() => {
                    if (profileStatus === "review" || profileStatus === "verified") { setAsk("profileedit"); return; }
                    router.push("/OrganizerProfile");
                  }}>{t("vfEditProfile")}</button>
                  <Link className="vf-go" href={userId ? `/profile?id=${userId}` : "/profile"}>{t("vfPreview")}</Link>
              </div>
              </>
            )}
          </div>
                </div>
      )}

      {ask && (
        <div className="vf-scrim" onClick={(e) => { if (e.target === e.currentTarget) setAsk(null); }}>
          <div className="vf-sheet vf-mini" role="dialog">
            <b className="vf-askT">{askTitle(ask, t)}</b>
            <p className="vf-askP">{askNote(ask, sheet, t)}</p>
            <div className="vf-acts">
              {ask === "bankreset" || ask === "profileedit" ? (
                <>
                  <button type="button" className="vf-gh" onClick={() => setAsk(null)}>{t("vfBack")}</button>
                  <button type="button" className="vf-go" onClick={() => {
                    if (ask === "profileedit") { router.push("/OrganizerProfile"); return; }
                    setAsk(null);
                    setBankEditing(true);
                    setBankName(bankRec?.bankName || "");
                    setBankIban(formatIban(bankRec?.accountNumber || ""));
                    setBankHolder(bankRec?.bankHolderName || "");
                  }}>{ask === "profileedit" ? t("vfEdit") : t("vfChange")}</button>
                </>
              ) : (
                <>
                  <button type="button" className="vf-gh" onClick={() => {
                    if (ask === "idback") { setAsk(null); setIdStep("type"); setFront(""); setBack(""); return; }
                    setAsk(null); setSheet(null); setStep("value"); setFront(""); setBack("");
                  }}>{ask === "otpcancel" ? t("cancel") : t("vfDiscardPhotos")}</button>
                  <button type="button" className="vf-go" onClick={() => setAsk(null)}>{t("vfContinue")}</button>
                </>
              )}
                    </div>
                  </div>
              </div>
            )}

      {toast ? <div className="vf-toast" role="status">{toast}</div> : null}
        </div>
  );

  function sheetTitle() {
    if (sheet === "identity") {
      if (idStep === "type") return t("vfChooseType");
      if (idStep === "upload") return t("vfUploadDoc");
      return t("vfDocs");
    }
    if (sheet === "phone" && (contactEditing || items.phone.status !== "verified")) return t("vfChangePhone");
    if (sheet === "email" && (contactEditing || items.email.status !== "verified")) return t("vfChangeEmail");
    return rows.find((r) => r.key === sheet)?.title || "";
  }
  function statusNote() {
    if (items[sheet]?.status === "rejected") return rowReason(sheet) || t("vfNeedsFixNote");
    if (sheet === "bank" && items.bank.status === "review") return t("vfBankReviewNote");
    if (sheet === "profile" && items.profile.status === "review") return t("vfProfileReviewNote");
    if (sheet === "email" && items.email.status === "verified") return t("vfEmailOk");
    if (sheet === "phone" && items.phone.status === "verified") return t("vfPhoneOk");
    if (items[sheet]?.status === "verified") return t("vfVerifiedNote");
    return t("vfReviewNote");
  }
}

function statusTone(status) {
  if (status === "verified") return "ok";
  if (status === "review") return "brand";
  if (status === "rejected") return "danger";
  return "warn";
}
function statusMetaLabel(status, t) {
  if (status === "verified") return t("vfVerified");
  if (status === "review") return t("vfReviewing");
  if (status === "rejected") return t("vfNeedsFix");
  return t("vfRequired");
}
function askTitle(ask, t) {
  if (ask === "otpcancel") return t("vfCancelAsk");
  if (ask === "bankreset") return t("vfChangeAsk");
  if (ask === "profileedit") return t("vfEditAsk");
  return t("vfLosePhotos");
}
function askNote(ask, sheet, t) {
  if (ask === "otpcancel") return sheet === "email" ? t("vfCancelEmail") : t("vfCancelPhone");
  if (ask === "bankreset") return t("vfChangeAskNote");
  if (ask === "profileedit") return t("vfEditAskNote");
  if (ask === "idback") return t("vfTypeChange");
  return t("vfLoseNote");
}

function Drop({ side, label, file, busy, onPick, t }) {
  return (
    <div>
      <span className="vf-lb">{label} <i>*</i></span>
      {file ? (
        <div className="vf-shot" style={{ backgroundImage: `url(${media(file)})` }}>
          <span className="vf-ok"><Icon name="check" size={13} />{t("vfAdded")}</span>
          <label className="vf-gh vf-shotBtn">{t("vfReplace")}<input type="file" accept="image/*,.pdf" onChange={(e) => { onPick(side, e.target.files?.[0]); e.target.value = ""; }} /></label>
        </div>
      ) : (
        <label className="vf-drop">
          <span className="vf-plus">+</span>
          <b>{busy ? t("vfUploading") : t("vfAddPhoto")}</b>
          <u>{t("vfPickDevice")}</u>
          <input type="file" accept="image/*,.pdf" onChange={(e) => { onPick(side, e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      )}
    </div>
  );
}

export default function VerificationPage() {
  return (
    <ProtectedRoute>
      <VerificationPageContent />
    </ProtectedRoute>
  );
}
