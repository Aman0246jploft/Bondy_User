"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import authApi from "@/api/authApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";

const EMPTY_FORM = {
  logo: "",
  cover: "",
  name: "",
  about: "",
  phone: "",
  email: "",
  social: "",
};

export default function OrganizerProfilePage() {
  const { language } = useLanguage();
  const isMn = language === "mn";

  // Form and persistence states
  const [savedData, setSavedData] = useState(EMPTY_FORM);
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [userId, setUserId] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("userProfile");
        if (cached) {
          const u = JSON.parse(cached);
          if (u?._id || u?.id || u?.userId) return u._id || u.id || u.userId;
        }
        const directId = localStorage.getItem("userId");
        if (directId) return directId;
      } catch (e) { }
    }
    return "";
  });

  // Image Modal / Sheet states
  const [imgSheet, setImgSheet] = useState(null); // 'cover' | 'logo' | null
  const [sheetStep, setSheetStep] = useState("choose"); // 'choose' | 'adjust' | 'preview' | 'del'
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [croppedUrl, setCroppedUrl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imgErr, setImgErr] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const imgElRef = useRef(null);
  const frameRef = useRef(null);
  const dragStartRef = useRef(null);

  // 1. Fetch real dynamic profile from API on mount
  useEffect(() => {
    let active = true;

    // Clear legacy prototype mock keys if any exist in browser
    try {
      localStorage.removeItem("bondy.orgprofile.local");
    } catch (e) { }

    const loadProfile = async () => {
      try {
        setLoadingInitial(true);
        const res = await authApi.getSelfProfile();
        if (active && res?.status && res?.data?.user) {
          const u = res.data.user;
          const curId = u._id || u.id || u.userId;
          if (curId) setUserId(curId);
          const dynamicData = {
            logo: u.profileImage ? getFullImageUrl(u.profileImage) : "",
            cover: u.backgroundImage ? getFullImageUrl(u.backgroundImage) : "",
            name: u.businessName || (u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : "") || u.email || "",
            about: u.shortDesc || u.bio || "",
            phone: u.contactNumber || "",
            email: u.email || "",
            social: u.socialMediaLink || "",
          };
          setIsVerified(Boolean(u.isVerified || u.isAllVerified || u.organizerVerificationStatus === "approved"));
          setSavedData(dynamicData);
          setForm(dynamicData);
        } else {
          // Fallback to localStorage userProfile if available
          const cached = localStorage.getItem("userProfile");
          if (cached) {
            const u = JSON.parse(cached);
            const curId = u._id || u.id || u.userId;
            if (curId) setUserId(curId);
            const dynamicData = {
              logo: u.profileImage ? getFullImageUrl(u.profileImage) : "",
              cover: u.backgroundImage ? getFullImageUrl(u.backgroundImage) : "",
              name: u.businessName || (u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : "") || u.email || "",
              about: u.shortDesc || u.bio || "",
              phone: u.contactNumber || "",
              email: u.email || "",
              social: u.socialMediaLink || "",
            };
            setIsVerified(Boolean(u.isVerified || u.isAllVerified || u.organizerVerificationStatus === "approved"));
            setSavedData(dynamicData);
            setForm(dynamicData);
          }
        }
      } catch (err) {
        console.error("Failed to load selfProfile from API:", err);
        const cached = localStorage.getItem("userProfile");
        if (cached) {
          try {
            const u = JSON.parse(cached);
            const curId = u._id || u.id || u.userId;
            if (curId) setUserId(curId);
            const dynamicData = {
              logo: u.profileImage ? getFullImageUrl(u.profileImage) : "",
              cover: u.backgroundImage ? getFullImageUrl(u.backgroundImage) : "",
              name: u.businessName || (u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : "") || u.email || "",
              about: u.shortDesc || u.bio || "",
              phone: u.contactNumber || "",
              email: u.email || "",
              social: u.socialMediaLink || "",
            };
            setSavedData(dynamicData);
            setForm(dynamicData);
          } catch (e) { }
        }
      } finally {
        if (active) setLoadingInitial(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  // Validation errors
  const errors = (() => {
    const e = {};
    const name = String(form.name || "").trim();
    if (!name) e.name = isMn ? "Зохион байгуулагчийн нэрээ бичнэ үү." : "Organizer name is required.";
    else if (name.length < 2) e.name = isMn ? "Нэр хамгийн багадаа 2 тэмдэгт байна." : "Name must be at least 2 characters.";

    const about = String(form.about || "").trim();
    if (about && about.length < 10) {
      e.about = isMn ? "Танилцуулга дор хаяж 10 тэмдэгт байна." : "About must be at least 10 characters.";
    }

    const phone = String(form.phone || "").trim();
    if (!phone) e.phone = isMn ? "Холбоо барих утсаа бичнэ үү." : "Contact phone is required.";
    else if (!/^[+\d][\d\s-]{6,}$/.test(phone)) e.phone = isMn ? "Утасны дугаар буруу байна." : "Invalid phone number.";

    const email = String(form.email || "").trim();
    if (!email) e.email = isMn ? "Имэйл хаягаа бичнэ үү." : "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = isMn ? "Имэйл хаяг буруу байна." : "Invalid email address.";

    const social = String(form.social || "").trim();
    if (social && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/.test(social)) {
      e.social = isMn ? "Зөв URL оруулна уу (https:// -ээр эхэлнэ)." : "Please enter a valid URL (starting with https://).";
    }
    return e;
  })();

  const isDirty = ["logo", "cover", "name", "about", "phone", "email", "social"].some(
    (key) => String(form[key] || "") !== String(savedData[key] || "")
  );
  const isValid = Object.keys(errors).length === 0;

  // Handle Input Changes
  const handleFieldChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setSaveErr("");
  };

  // Revert changes
  const handleRevert = () => {
    setForm({ ...savedData });
    setTouched(false);
    setSaveErr("");
    toast(isMn ? "Өөрчлөлт цуцлагдлаа" : "Changes reverted");
  };

  // Save changes to backend dynamically
  const handleSave = async () => {
    setTouched(true);
    if (!isValid) {
      setSaveErr(isMn ? "Талбаруудыг шалгана уу." : "Please correct the highlighted fields.");
      return;
    }

    setBusy(true);
    setSaveErr("");
    try {
      const payload = {
        businessName: form.name.trim(),
        shortDesc: form.about.trim(),
        bio: form.about.trim(),
        contactNumber: form.phone.trim(),
        email: form.email.trim(),
        socialMediaLink: form.social.trim(),
      };

      const res = await authApi.updateProfile(payload);
      if (res?.status) {
        const updatedUser = res.data?.user || {};
        const freshData = {
          ...form,
          name: updatedUser.businessName || form.name,
          about: updatedUser.shortDesc || updatedUser.bio || form.about,
          phone: updatedUser.contactNumber || form.phone,
          email: updatedUser.email || form.email,
          social: updatedUser.socialMediaLink || form.social,
        };
        setSavedData(freshData);
        setForm(freshData);

        try {
          const currentCached = JSON.parse(localStorage.getItem("userProfile") || "{}");
          localStorage.setItem("userProfile", JSON.stringify({ ...currentCached, ...updatedUser, ...payload }));
        } catch (e) { }

        setJustSaved(true);
        toast.success(isMn ? "Профайл амжилттай хадгалагдлаа" : "Profile saved successfully");
        setTimeout(() => setJustSaved(false), 5000);
      } else {
        setSaveErr(isMn ? "Хадгалахад алдаа гарлаа." : "Failed to save profile changes.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveErr(err?.response?.data?.message || (isMn ? "Хадгалахад алдаа гарлаа." : "Failed to save profile changes."));
    } finally {
      setBusy(false);
    }
  };

  // -------------------------------------------------------------
  // Image Crop & Adjustment Mechanics
  // -------------------------------------------------------------
  const frameOf = useCallback((kind) => {
    return kind === "cover" ? { w: 300, h: 132 } : { w: 220, h: 220 };
  }, []);

  const getGeometry = useCallback(() => {
    const im = imgElRef.current;
    if (!im || !im.naturalWidth || !imgSheet) return null;
    const fr = frameOf(imgSheet);
    const s = Math.max(fr.w / im.naturalWidth, fr.h / im.naturalHeight) * zoom;
    const dw = im.naturalWidth * s;
    const dh = im.naturalHeight * s;
    const left = Math.min(0, Math.max(fr.w - dw, (fr.w - dw) / 2 + pan.x));
    const top = Math.min(0, Math.max(fr.h - dh, (fr.h - dh) / 2 + pan.y));
    return { dw, dh, left, top, fr };
  }, [imgSheet, zoom, pan, frameOf]);

  const renderCropCanvas = useCallback(() => {
    return new Promise((resolve) => {
      const g = getGeometry();
      const im = imgElRef.current;
      if (!g || !im) {
        resolve(null);
        return;
      }
      const k = 2; // 2x high dpi render
      const canvas = document.createElement("canvas");
      canvas.width = g.fr.w * k;
      canvas.height = g.fr.h * k;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(im, g.left * k, g.top * k, g.dw * k, g.dh * k);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve({ blob, url });
          } else {
            resolve(null);
          }
        },
        "image/jpeg",
        0.92
      );
    });
  }, [getGeometry]);

  const openImgSheet = (kind) => {
    setImgSheet(kind);
    setSheetStep("choose");
    setPendingFile(null);
    setPendingUrl(null);
    setCroppedBlob(null);
    setCroppedUrl(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImgErr("");
  };

  const closeImgSheet = () => {
    setImgSheet(null);
    setSheetStep("choose");
    setPendingFile(null);
    if (pendingUrl && pendingUrl.startsWith("blob:")) URL.revokeObjectURL(pendingUrl);
    if (croppedUrl && croppedUrl.startsWith("blob:")) URL.revokeObjectURL(croppedUrl);
    setPendingUrl(null);
    setCroppedUrl(null);
    setCroppedBlob(null);
    setImgErr("");
  };

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setImgErr(isMn ? "Зөвхөн зураг оруулна уу." : "Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImgErr(isMn ? "Зургийн хэмжээ 5 МБ-аас хэтэрсэн." : "File size exceeds 5MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgElRef.current = img;
      setPendingFile(file);
      setPendingUrl(url);
      setSheetStep("adjust");
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImgErr("");
    };
    img.onerror = () => {
      setImgErr(isMn ? "Зургийг уншиж чадсангүй." : "Could not read image file.");
    };
    img.src = url;
    e.target.value = "";
  };

  // Drag to reposition
  const handlePointerDown = (e) => {
    e.preventDefault();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPanX: pan.x,
      initPanY: pan.y,
    };

    const handlePointerMove = (moveEv) => {
      if (!dragStartRef.current) return;
      const dx = moveEv.clientX - dragStartRef.current.startX;
      const dy = moveEv.clientY - dragStartRef.current.startY;
      setPan({
        x: dragStartRef.current.initPanX + dx,
        y: dragStartRef.current.initPanY + dy,
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      dragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Proceed from adjust to preview
  const handleProceedToPreview = async () => {
    const rendered = await renderCropCanvas();
    if (rendered) {
      setCroppedBlob(rendered.blob);
      setCroppedUrl(rendered.url);
      setSheetStep("preview");
    }
  };

  // Upload cropped image dynamically & update profile in backend
  const handleApplyImage = async () => {
    if (!imgSheet) return;
    setUploadingImage(true);
    setImgErr("");

    try {
      let finalImageUrl = croppedUrl || pendingUrl;

      // Upload blob to server via authApi.uploadFile
      if (croppedBlob) {
        const formData = new FormData();
        const filename = `${imgSheet}_${Date.now()}.jpg`;
        formData.append("files", croppedBlob, filename);
        const uploadRes = await authApi.uploadFile(formData);
        if (uploadRes?.status && uploadRes?.data?.files?.[0]) {
          finalImageUrl = uploadRes.data.files[0];
        }
      }

      // Update backend profile
      const updatePayload =
        imgSheet === "cover"
          ? { backgroundImage: finalImageUrl }
          : { profileImage: finalImageUrl };

      await authApi.updateProfile(updatePayload);

      // Update state with server image
      const resolvedUrl = getFullImageUrl(finalImageUrl);
      const updatedForm = { ...form, [imgSheet]: resolvedUrl };
      setForm(updatedForm);
      setSavedData((prev) => ({ ...prev, [imgSheet]: resolvedUrl }));

      try {
        const curUser = JSON.parse(localStorage.getItem("userProfile") || "{}");
        localStorage.setItem("userProfile", JSON.stringify({ ...curUser, ...updatePayload }));
      } catch (e) { }

      toast.success(
        imgSheet === "cover"
          ? isMn
            ? "Хавтасны зураг амжилттай солигдлоо"
            : "Cover photo updated successfully"
          : isMn
            ? "Профайл зураг амжилттай солигдлоо"
            : "Profile photo updated successfully"
      );
      closeImgSheet();
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(isMn ? "Зураг хадгалахад алдаа гарлаа" : "Failed to upload image");
      setImgErr(err?.response?.data?.message || (isMn ? "Зураг хуулахад алдаа гарлаа" : "Image upload failed"));
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove photo dynamically
  const handleRemoveImage = async () => {
    if (!imgSheet) return;
    try {
      const updatePayload =
        imgSheet === "cover"
          ? { backgroundImage: "" }
          : { profileImage: "" };

      await authApi.updateProfile(updatePayload);

      const updatedForm = { ...form, [imgSheet]: "" };
      setForm(updatedForm);
      setSavedData((prev) => ({ ...prev, [imgSheet]: "" }));

      try {
        const curUser = JSON.parse(localStorage.getItem("userProfile") || "{}");
        localStorage.setItem("userProfile", JSON.stringify({ ...curUser, ...updatePayload }));
      } catch (e) { }

      toast(
        imgSheet === "cover"
          ? isMn
            ? "Хавтасны зураг устлаа"
            : "Cover photo removed"
          : isMn
            ? "Профайл зураг устлаа"
            : "Profile photo removed"
      );
    } catch (e) {
      toast.error(isMn ? "Алдаа гарлаа" : "Failed to remove image");
    } finally {
      closeImgSheet();
    }
  };

  const geo = getGeometry();
  const fr = imgSheet ? frameOf(imgSheet) : { w: 220, h: 220 };
  const displayName = form.name || (isMn ? "Зохион байгуулагч" : "Organizer");

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Mobile Bar */}
      <div className="pe-mobbar">
        <Link href="/Dashboard" className="pe-mobback" aria-label="Буцах">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="pe-mobbarT">{isMn ? "Профайл" : "Profile"}</span>
        <span className="pe-mobbar-sp" />
      </div>

      {/* Hero Cover & Avatar Banner Card */}
      <section
        style={{
          borderRadius: "22px",
          background: "linear-gradient(158deg, rgba(255, 255, 255, 0.055) 0%, rgba(255, 255, 255, 0.013) 44%, rgba(255, 255, 255, 0) 100%), var(--bd-ink-850)",
          border: "1px solid var(--bd-border)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 16px 36px rgba(0, 0, 0, 0.26)",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Cover Photo */}
        <div style={{ position: "relative", height: "clamp(160px, 18vw, 220px)", width: "100%" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: form.cover
                ? `center 40%/cover no-repeat url("${form.cover}")`
                : "linear-gradient(135deg, rgba(35, 173, 164, 0.22) 0%, rgba(20, 20, 20, 0.95) 100%), #141414",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(8, 8, 8, 0.2) 0%, transparent 45%, rgba(14, 14, 14, 0.95) 100%)",
            }}
          />

          {/* Change Cover Photo Button */}
          <button
            type="button"
            onClick={() => openImgSheet("cover")}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "34px",
              padding: "0 14px",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              background: "rgba(0, 0, 0, 0.52)",
              backdropFilter: "blur(8px)",
              color: "var(--bd-white)",
              fontFamily: "var(--bd-font-ui)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.65)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.52)";
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8.6h2.3l1.2-1.9h9l1.2 1.9H20a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
              <circle cx="12" cy="13.6" r="3.2" />
            </svg>
            {isMn ? "Ковер зураг солих" : "Change cover photo"}
          </button>
        </div>

        {/* Bottom Avatar & Action Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "18px",
            flexWrap: "wrap",
            padding: "0 24px 22px",
            marginTop: "-38px",
            position: "relative",
          }}
        >
          {/* Avatar and Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
            {/* 86px Avatar with Camera Edit Button */}
            <span style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
              {form.logo ? (
                <img
                  src={form.logo}
                  alt={displayName}
                  style={{
                    width: "86px",
                    height: "86px",
                    borderRadius: "50%",
                    border: "2px solid rgba(255, 255, 255, 0.22)",
                    background: "var(--bd-ink-800)",
                    objectFit: "cover",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)",
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/img/default-user.png";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "86px",
                    height: "86px",
                    borderRadius: "50%",
                    border: "2px solid rgba(255, 255, 255, 0.22)",
                    background: "var(--bd-ink-800)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--bd-teal-300)",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {form.name ? form.name.slice(0, 2).toUpperCase() : "OR"}
                </div>
              )}
              <button
                type="button"
                className="pe-logoEdit"
                onClick={() => openImgSheet("logo")}
                aria-label={isMn ? "Лого солих" : "Change logo"}
                title={isMn ? "Лого солих" : "Change logo"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 8.6h2.3l1.2-1.9h9l1.2 1.9H20a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
                  <circle cx="12" cy="13.6" r="3.2" />
                </svg>
              </button>
            </span>

            {/* Name and Verified Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", minWidth: 0 }}>
              <b
                style={{
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "clamp(20px, 2.2vw, 25px)",
                  fontWeight: 700,
                  letterSpacing: "-0.016em",
                  color: "var(--bd-white)",
                }}
              >
                {displayName}
              </b>
              {isVerified && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: "rgba(52, 199, 89, 0.15)",
                    border: "1px solid rgba(52, 199, 89, 0.35)",
                    color: "#34C759",
                    fontSize: "12px",
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {isMn ? "Баталгаажсан" : "Verified"}
                </span>
              )}
            </div>
          </div>

          {/* Right Action: View Public Page */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <Link
              href={userId ? `/profile?id=${userId}` : "/profile"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: "38px",
                padding: "0 18px",
                borderRadius: "999px",
                border: "1px solid var(--bd-border-strong)",
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--bd-white)",
                fontSize: "13.5px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                textDecoration: "none",
                transition: "all var(--bd-dur) var(--bd-ease)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--acc)";
                e.currentTarget.style.background = "rgba(35, 173, 164, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--bd-border-strong)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {isMn ? "Нийтийн хуудсыг харах" : "View public page"}
            </Link>
          </div>
        </div>
      </section>

      {/* Main Profile Form Card ("Organizer details") */}
      <section
        style={{
          borderRadius: "22px",
          background: "linear-gradient(158deg, rgba(255, 255, 255, 0.055) 0%, rgba(255, 255, 255, 0.013) 44%, rgba(255, 255, 255, 0) 100%), var(--bd-ink-850)",
          border: "1px solid var(--bd-border)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 16px 36px rgba(0, 0, 0, 0.26)",
          padding: "26px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            margin: "0 0 4px",
            fontFamily: "var(--bd-font-ui)",
            fontSize: "17px",
            fontWeight: 700,
            letterSpacing: "-0.012em",
            color: "var(--bd-white)",
          }}
        >
          {isMn ? "Зохион байгуулагчийн мэдээлэл" : "Organizer details"}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--bd-gray-600)" }}>
          {isMn ? "Нийтийн профайл дээр харагдана." : "Shown on your public profile."}
        </p>

        {/* 1. Organizer Name (Full Width) */}
        <label className="pe-f" style={{ marginBottom: "18px" }}>
          <span className="pe-lb">
            {isMn ? "Зохион байгуулагчийн нэр" : "Organizer name"} <i>*</i>
          </span>
          <input
            type="text"
            className="pe-in"
            value={form.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            aria-invalid={touched && !!errors.name}
            maxLength={60}
            placeholder={isMn ? "Зохион байгуулагчийн нэр" : "Organizer name"}
          />
          {touched && errors.name && <span className="pe-er">{errors.name}</span>}
        </label>

        {/* 2. About Bio Textarea (Full Width) */}
        <label style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
          <span className="pe-lb">{isMn ? "Танилцуулга" : "About"}</span>
          <textarea
            rows={4}
            className="pe-ta"
            value={form.about}
            onChange={(e) => handleFieldChange("about", e.target.value)}
            aria-invalid={touched && !!errors.about}
            maxLength={300}
            placeholder={isMn ? "Байгууллагынхаа тухай товч танилцуулна уу..." : "Write about your organization..."}
          />
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
            <span className="pe-hint" style={{ margin: "2px 0 0" }}>
              {String(form.about || "").length} / 300
            </span>
          </div>
          {touched && errors.about && <span className="pe-er">{errors.about}</span>}
        </label>

        {/* 3. Contact Phone (Full Width) */}
        <label className="pe-f" style={{ marginBottom: "18px" }}>
          <span className="pe-lb">
            {isMn ? "Холбоо барих утас" : "Contact phone"} <i>*</i>
          </span>
          <input
            type="tel"
            className="pe-in"
            value={form.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            aria-invalid={touched && !!errors.phone}
            placeholder="+976 9911 2233"
          />
          {touched && errors.phone && <span className="pe-er">{errors.phone}</span>}
        </label>

        {/* 4. Email (Full Width) */}
        <label className="pe-f" style={{ marginBottom: "18px" }}>
          <span className="pe-lb">
            {isMn ? "Имэйл" : "Email"} <i>*</i>
          </span>
          <input
            type="email"
            className="pe-in"
            value={form.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            aria-invalid={touched && !!errors.email}
            placeholder="info@example.com"
          />
          {touched && errors.email && <span className="pe-er">{errors.email}</span>}
        </label>

        {/* 5. Social Links (Full Width) */}
        <label className="pe-f" style={{ marginBottom: "18px" }}>
          <span className="pe-lb">{isMn ? "Сошиал холбоос" : "Social links"}</span>
          <input
            type="url"
            className="pe-in"
            value={form.social}
            onChange={(e) => handleFieldChange("social", e.target.value)}
            aria-invalid={touched && !!errors.social}
            placeholder="https://facebook.com/..."
          />
          {touched && errors.social && <span className="pe-er">{errors.social}</span>}
        </label>

        {/* Error Alert */}
        {saveErr && <div className="pe-alert">{saveErr}</div>}

        {/* Action Buttons */}
        <div className="pe-acts" style={{ marginTop: "24px" }}>
          <button
            type="button"
            className="pe-go"
            onClick={handleSave}
            disabled={busy || !isDirty || (touched && !isValid)}
          >
            {busy && <span className="pe-sp" />}
            {busy
              ? isMn
                ? "Хадгалж байна…"
                : "Saving…"
              : isMn
                ? "Хадгалах"
                : "Save changes"}
          </button>

          {isDirty && (
            <button type="button" className="pe-gh" onClick={handleRevert}>
              {isMn ? "Өөрчлөлтийг цуцлах" : "Discard changes"}
            </button>
          )}

          {isDirty && (
            <span className="pe-hint" style={{ alignSelf: "center" }}>
              {isMn ? "Хадгалаагүй өөрчлөлт байна" : "Unsaved changes"}
            </span>
          )}

          {justSaved && !isDirty && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                alignSelf: "center",
                height: "36px",
                padding: "0 14px",
                borderRadius: "999px",
                border: "1px solid rgba(52, 199, 89, 0.45)",
                background: "rgba(52, 199, 89, 0.12)",
                fontSize: "13px",
                fontWeight: 600,
                color: "#34C759",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {isMn ? "Хадгалагдлаа" : "Saved"}
            </span>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Interactive Image Picker & Crop Sheet Modal */}
      {/* ------------------------------------------------------------- */}
      {imgSheet && (
        <div className="pe-scrim" onClick={closeImgSheet}>
          <div className="pe-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="pe-shead">
              <b
                style={{
                  display: "block",
                  fontFamily: "var(--bd-font-ui)",
                  fontSize: "17.5px",
                  fontWeight: 700,
                  letterSpacing: "-0.012em",
                  color: "var(--bd-white)",
                }}
              >
                {sheetStep === "adjust"
                  ? imgSheet === "cover"
                    ? isMn ? "Хавтасны зураг тохируулах" : "Adjust cover photo"
                    : isMn ? "Профайл зураг тохируулах" : "Adjust profile photo"
                  : sheetStep === "preview"
                    ? imgSheet === "cover"
                      ? isMn ? "Хавтасны зургийн урьдчилан харах" : "Cover photo preview"
                      : isMn ? "Профайл зургийн урьдчилан харах" : "Profile photo preview"
                    : sheetStep === "del"
                      ? isMn ? "Зургийг устгах уу?" : "Remove photo?"
                      : imgSheet === "cover"
                        ? isMn ? "Хавтасны зураг" : "Cover Photo"
                        : isMn ? "Профайл зураг" : "Profile Photo"}
              </b>
              <button
                type="button"
                className="pe-x"
                onClick={closeImgSheet}
                title={isMn ? "Хаах" : "Close"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Step 1: Choose File */}
            {sheetStep === "choose" && (
              <>
                <label className="pe-opt">
                  <span style={{ display: "inline-flex", flexShrink: 0, color: "var(--acc-bright)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </span>
                  <span>
                    <b>{isMn ? "Шинэ зураг сонгох" : "Choose new photo"}</b>
                    <small>{isMn ? "Компьютерээс сонгох (JPEG, PNG)" : "Upload from your computer (JPEG, PNG)"}</small>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePickFile}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  />
                </label>

                {form[imgSheet] && (
                  <button
                    type="button"
                    className="pe-opt pe-opt-del"
                    onClick={() => setSheetStep("del")}
                  >
                    <span style={{ display: "inline-flex", flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </span>
                    <span>
                      <b style={{ color: "inherit" }}>{isMn ? "Зургийг устгах" : "Remove current photo"}</b>
                      <small>{isMn ? "Одоогийн зургийг арилгах" : "Clear this photo"}</small>
                    </span>
                  </button>
                )}

                <button type="button" className="pe-opt" onClick={closeImgSheet}>
                  <span style={{ display: "inline-flex", flexShrink: 0, color: "var(--bd-gray-500)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                  <span>
                    <b>{isMn ? "Цуцлах" : "Cancel"}</b>
                  </span>
                </button>
              </>
            )}

            {/* Step 2: Adjust / Crop */}
            {sheetStep === "adjust" && (
              <>
                <span className="pe-hint" style={{ margin: 0, textAlign: "center" }}>
                  {isMn ? "Зургийг чирж байрлалыг тохируулна уу" : "Drag to reposition the image"}
                </span>

                <div
                  ref={frameRef}
                  className="pe-frame"
                  onPointerDown={handlePointerDown}
                  style={{
                    width: `${fr.w}px`,
                    height: `${fr.h}px`,
                    borderRadius: imgSheet === "cover" ? "14px" : "50%",
                    backgroundImage: pendingUrl ? `url("${pendingUrl}")` : "none",
                    backgroundSize: geo ? `${geo.dw}px ${geo.dh}px` : "cover",
                    backgroundPosition: geo ? `${geo.left}px ${geo.top}px` : "center",
                  }}
                >
                  <span className="pe-grid" />
                </div>

                {/* Zoom Controller */}
                <div className="pe-zoom">
                  <button
                    type="button"
                    className="pe-zbtn"
                    onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                    title="Zoom out"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    className="pe-range"
                    min="1"
                    max="3"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value) || 1)}
                    aria-label="Zoom"
                  />
                  <button
                    type="button"
                    className="pe-zbtn"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                    title="Zoom in"
                  >
                    +
                  </button>
                </div>

                <div className="pe-acts" style={{ marginTop: "4px" }}>
                  <button
                    type="button"
                    className="pe-gh"
                    onClick={() => setSheetStep("choose")}
                    style={{ flex: 1 }}
                  >
                    {isMn ? "Цуцлах" : "Back"}
                  </button>
                  <button
                    type="button"
                    className="pe-go"
                    onClick={handleProceedToPreview}
                    style={{ flex: 1 }}
                  >
                    {isMn ? "Үргэлжлүүлэх" : "Continue"}
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Preview Crop */}
            {sheetStep === "preview" && (
              <>
                <div
                  className="pe-frame"
                  style={{
                    width: `${fr.w}px`,
                    height: `${fr.h}px`,
                    borderRadius: imgSheet === "cover" ? "14px" : "50%",
                    backgroundImage: croppedUrl ? `url("${croppedUrl}")` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    cursor: "default",
                  }}
                />
                <span className="pe-hint" style={{ margin: 0, textAlign: "center" }}>
                  {imgSheet === "cover"
                    ? isMn
                      ? "Энэ зураг таны профайлын хавтас дээр харагдана."
                      : "This photo will appear on your public banner."
                    : isMn
                      ? "Энэ зураг таны нийтийн профайл дээр харагдана."
                      : "This photo will appear as your public organizer avatar."}
                </span>

                <div className="pe-acts" style={{ marginTop: "4px" }}>
                  <button
                    type="button"
                    className="pe-gh"
                    onClick={() => setSheetStep("adjust")}
                    style={{ flex: 1 }}
                  >
                    {isMn ? "Цуцлах" : "Back"}
                  </button>
                  <button
                    type="button"
                    className="pe-go"
                    onClick={handleApplyImage}
                    disabled={uploadingImage}
                    style={{ flex: 1 }}
                  >
                    {uploadingImage && <span className="pe-sp" />}
                    {uploadingImage
                      ? isMn
                        ? "Хадгалж байна…"
                        : "Uploading…"
                      : isMn
                        ? "Хадгалах"
                        : "Apply & Save"}
                  </button>
                </div>
              </>
            )}

            {/* Step 4: Delete Confirmation */}
            {sheetStep === "del" && (
              <>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "13px" }}>
                  <span className="pe-warn">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <span style={{ minWidth: 0, paddingTop: "2px" }}>
                    <b style={{ display: "block", fontFamily: "var(--bd-font-ui)", fontSize: "15px", fontWeight: 600, color: "var(--bd-white)" }}>
                      {isMn ? "Зургийг устгах уу?" : "Remove this photo?"}
                    </b>
                    <span className="pe-hint" style={{ display: "block", margin: "4px 0 0" }}>
                      {isMn ? "Энэ үйлдлийг буцаах боломжгүй." : "This will clear this photo."}
                    </span>
                  </span>
                </div>

                <div className="pe-acts" style={{ marginTop: "4px" }}>
                  <button
                    type="button"
                    className="pe-gh"
                    onClick={() => setSheetStep("choose")}
                    style={{ flex: 1 }}
                  >
                    {isMn ? "Цуцлах" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    className="pe-danger"
                    onClick={handleRemoveImage}
                    style={{ flex: 1 }}
                  >
                    {isMn ? "Устгах" : "Remove"}
                  </button>
                </div>
              </>
            )}

            {/* Error Message */}
            {imgErr && <p className="pe-alert" style={{ margin: 0 }}>{imgErr}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
