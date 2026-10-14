"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/api/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import { getFullImageUrl } from "@/utils/imageHelper";
import "./settings.css";

const TYPE_FIELDS = [
  { key: "bookingNotification", label: "osTypeBookings", note: "osTypeBookingsNote" },
  { key: "reminderNotification", label: "osTypeReminders", note: "osTypeRemindersNote" },
  { key: "organizerUpdateNotification", label: "osTypeUpdates", note: "osTypeUpdatesNote" },
  { key: "messageNotification", label: "osTypeMessages", note: "osTypeMessagesNote" },
];

const STR_COLOR = ["#FF5A5A", "#FF5A5A", "#FFB273", "#FFB273", "#34C759", "#34C759"];

const EMPTY_PW = { current: "", next: "", confirm: "" };

function Chevron() {
  return (
    <svg className="os-arw" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function strengthOf(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[a-zA-Z]/.test(pw)) score += 1;
  if (/[^0-9a-zA-Z]/.test(pw)) score += 1;
  if (pw.length >= 12) score += 1;
  return { score, pct: Math.round((score / 5) * 100) };
}

export default function SettingsPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [sheet, setSheet] = useState("");
  const [toast, setToast] = useState("");

  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifErr, setNotifErr] = useState("");
  const [pushTouched, setPushTouched] = useState(false);

  const [pw, setPw] = useState(EMPTY_PW);
  const [pwErr, setPwErr] = useState({});
  const [pwShow, setPwShow] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwAlert, setPwAlert] = useState("");
  const [pwDone, setPwDone] = useState(false);

  const [blocked, setBlocked] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedErr, setBlockedErr] = useState(false);
  const [unblocking, setUnblocking] = useState("");

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  const flash = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const loadSettings = useCallback(async () => {
    setNotifLoading(true);
    setNotifErr("");
    try {
      const res = await apiClient.get("/userSetting", { skipToast: true });
      if (res?.status && res?.data) {
        setSettings(res.data);
        setDraft(res.data);
        setPushTouched(false);
      } else {
        setNotifErr(res?.message || t("osNotifFailed"));
      }
    } catch (e) {
      setNotifErr(e?.response?.data?.message || t("osNotifFailed"));
    } finally {
      setNotifLoading(false);
    }
  }, [t]);

  const loadBlocked = useCallback(async () => {
    setBlockedLoading(true);
    setBlockedErr(false);
    try {
      const res = await apiClient.get("/block/list", { params: { pageNo: 1, size: 100 }, skipToast: true });
      if (res?.status) {
        setBlocked(res.data?.blockedUsers || []);
      } else {
        setBlockedErr(true);
      }
    } catch (e) {
      setBlockedErr(true);
    } finally {
      setBlockedLoading(false);
    }
  }, []);

  const openNotifs = () => {
    setSheet("notifs");
    setDraft(settings);
    setPushTouched(false);
    setNotifErr("");
    if (!settings) loadSettings();
  };

  const openPassword = () => {
    setPw(EMPTY_PW);
    setPwErr({});
    setPwAlert("");
    setPwDone(false);
    setPwShow(false);
    setSheet("password");
  };

  const closeSheet = () => {
    if (notifBusy || pwBusy || deleteBusy) return;
    setSheet("");
  };

  useEffect(() => {
    if (!sheet) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet]);

  const toggleChannel = (key) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === "pushNotification") {
        TYPE_FIELDS.forEach((f) => {
          next[f.key] = next.pushNotification;
        });
      }
      return next;
    });
    if (key === "pushNotification") setPushTouched(true);
  };

  const toggleType = (key) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const anyOn = TYPE_FIELDS.some((f) => next[f.key]);
      next.pushNotification = anyOn;
      return next;
    });
    setPushTouched(false);
  };

  const saveNotifs = async () => {
    if (!draft || notifBusy) return;
    setNotifBusy(true);
    setNotifErr("");
    const payload = {};
    if (pushTouched && draft.pushNotification !== settings?.pushNotification) {
      payload.pushNotification = draft.pushNotification;
    } else {
      TYPE_FIELDS.forEach((f) => {
        if (draft[f.key] !== settings?.[f.key]) payload[f.key] = draft[f.key];
      });
    }
    if (draft.emailNotification !== settings?.emailNotification) {
      payload.emailNotification = draft.emailNotification;
    }
    try {
      if (Object.keys(payload).length) {
        const res = await apiClient.post("/userSetting", payload, { skipToast: true });
        if (!res?.status) {
          setNotifErr(res?.message || t("osNotifFailed"));
          setNotifBusy(false);
          return;
        }
        setSettings(res.data);
        setDraft(res.data);
      }
      setSheet("");
      flash(t("osNotifSaved"));
    } catch (e) {
      setNotifErr(e?.response?.data?.message || t("osNotifFailed"));
    } finally {
      setNotifBusy(false);
    }
  };

  const setPwField = (key, value) => {
    setPw((prev) => ({ ...prev, [key]: value }));
    setPwErr((prev) => ({ ...prev, [key]: "" }));
    setPwAlert("");
  };

  const passwordIssues = () => {
    const e = {};
    if (!pw.current) e.current = t("osPwErrCurrent");
    if (!pw.next) e.next = t("osPwErrNext");
    else if (pw.next.length < 8) e.next = t("osPwErrLen");
    else if (!/[0-9]/.test(pw.next) || !/[a-zA-Z]/.test(pw.next)) e.next = t("osPwErrMix");
    else if (pw.current && pw.next === pw.current) e.next = t("osPwErrSame");
    if (!pw.confirm) e.confirm = t("osPwErrConfirm");
    else if (pw.next && pw.confirm !== pw.next) e.confirm = t("osPwErrMatch");
    return e;
  };

  const savePassword = async () => {
    const issues = passwordIssues();
    if (Object.keys(issues).length) {
      setPwErr(issues);
      setPwAlert(t("osPwCheck"));
      return;
    }
    setPwBusy(true);
    setPwAlert("");
    try {
      const res = await apiClient.post(
        "/user/change-password",
        { oldPassword: pw.current, newPassword: pw.next, confirmPassword: pw.confirm },
        { skipToast: true },
      );
      if (res?.status) {
        setPwDone(true);
        setPw(EMPTY_PW);
      } else {
        setPwAlert(res?.message || t("osNotifFailed"));
      }
    } catch (e) {
      setPwAlert(e?.response?.data?.message || t("osNotifFailed"));
    } finally {
      setPwBusy(false);
    }
  };

  const unblock = async (userId) => {
    setUnblocking(userId);
    try {
      const res = await apiClient.post("/block/delete", { toUser: userId }, { skipToast: true });
      if (res?.status) {
        setBlocked((prev) => prev.filter((row) => String(row.toUser?._id || row.toUser) !== String(userId)));
        flash(t("osUnblocked"));
      }
    } catch (e) {
      flash(t("osBlockedFailed"));
    } finally {
      setUnblocking("");
    }
  };

  const deleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteErr("");
    try {
      const res = await apiClient.delete("/user/delete-account", { skipToast: true });
      if (res?.status) {
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
        window.location.href = "/login";
        return;
      }
      setDeleteErr(res?.message || t("osDeleteFailed"));
    } catch (e) {
      setDeleteErr(e?.response?.data?.message || t("osDeleteFailed"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const rows = [
    { id: "notifs", label: t("osNotifications"), onClick: openNotifs },
    { id: "password", label: t("osChangePassword"), onClick: openPassword },
    {
      id: "blocked",
      label: t("osBlocked"),
      onClick: () => {
        setSheet("blocked");
        loadBlocked();
      },
    },
    { id: "help", label: t("osHelp"), onClick: () => router.push("/SupportTickets") },
    { id: "privacy", label: t("osPrivacy"), onClick: () => router.push("/privacy-policy") },
    { id: "terms", label: t("osTerms"), onClick: () => router.push("/terms") },
  ];

  const strength = strengthOf(pw.next || "");

  return (
    <div className="os-wrap">
      <div className="os-card">
        {rows.map((row) => (
          <button key={row.id} type="button" className="os-row" onClick={row.onClick}>
            <span className="os-rowL">{row.label}</span>
            <Chevron />
          </button>
        ))}
      </div>

      <div className="os-card os-card-gap">
        <button
          type="button"
          className="os-row"
          data-danger="1"
          onClick={() => {
            setDeleteErr("");
            setSheet("delete");
          }}
        >
          <span className="os-rowL">{t("osDeleteAccount")}</span>
          <Chevron />
        </button>
      </div>

      {sheet === "notifs" && (
        <div className="os-scrim" onClick={closeSheet}>
          <div className="os-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="os-head">
              <div>
                <b>{t("osNotifTitle")}</b>
                <span>{t("osNotifSub")}</span>
              </div>
              <button type="button" className="os-x" onClick={closeSheet} aria-label={t("osClose")}>×</button>
            </div>
            {notifLoading && <span className="os-hint"><span className="os-sp" /> {t("osLoading")}</span>}
            {!notifLoading && draft && (
              <>
                <span className="os-lb">{t("osChannels")}</span>
                {[
                  ["pushNotification", "osChanPush"],
                  ["emailNotification", "osChanEmail"],
                ].map(([key, label]) => (
                  <span className="os-tog" key={key}>
                    <span><b>{t(label)}</b></span>
                    <button
                      type="button"
                      className="os-sw"
                      aria-checked={!!draft[key]}
                      aria-label={t(label)}
                      onClick={() => toggleChannel(key)}
                    />
                  </span>
                ))}
                <span className="os-lb os-lb-gap">{t("osTypes")}</span>
                {TYPE_FIELDS.map((field) => (
                  <span className="os-tog" key={field.key}>
                    <span>
                      <b>{t(field.label)}</b>
                      <i>{t(field.note)}</i>
                    </span>
                    <button
                      type="button"
                      className="os-sw"
                      aria-checked={!!draft[field.key]}
                      aria-label={t(field.label)}
                      onClick={() => toggleType(field.key)}
                    />
                  </span>
                ))}
                <span className="os-hint">{t("osNotifHint")}</span>
              </>
            )}
            {notifErr && <div className="os-alert">{notifErr}</div>}
            <div className="os-acts">
              <button type="button" className="os-go" disabled={notifBusy || notifLoading || !draft} onClick={saveNotifs}>
                {notifBusy && <span className="os-sp" />}
                {notifBusy ? t("osSaving") : t("osSave")}
              </button>
              <button type="button" className="os-gh" onClick={closeSheet}>{t("osClose")}</button>
            </div>
          </div>
        </div>
      )}

      {sheet === "password" && (
        <div className="os-scrim" onClick={closeSheet}>
          <div className="os-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="os-head">
              <div>
                <b>{t("osPwTitle")}</b>
                <span>{t("osPwSub")}</span>
              </div>
              <button type="button" className="os-x" onClick={closeSheet} aria-label={t("osClose")}>×</button>
            </div>
            {pwDone ? (
              <>
                <div className="os-res os-res-ok">
                  <b>{t("osPwDone")}</b>
                  <p>{t("osPwDoneNote")}</p>
                </div>
                <div className="os-acts">
                  <button type="button" className="os-go" onClick={closeSheet}>{t("osPwFinish")}</button>
                </div>
              </>
            ) : (
              <>
                <label className="os-f">
                  <span className="os-lb">{t("osPwCurrent")} <i>*</i></span>
                  <span className="os-pw">
                    <input
                      type={pwShow ? "text" : "password"}
                      className="os-in"
                      value={pw.current}
                      aria-invalid={!!pwErr.current}
                      onChange={(e) => setPwField("current", e.target.value)}
                    />
                    <button type="button" className="os-eye" onClick={() => setPwShow((v) => !v)}>
                      {pwShow ? t("osHide") : t("osShow")}
                    </button>
                  </span>
                  {pwErr.current && <span className="os-er">{pwErr.current}</span>}
                </label>
                <label className="os-f">
                  <span className="os-lb">{t("osPwNext")} <i>*</i></span>
                  <input
                    type={pwShow ? "text" : "password"}
                    className="os-in"
                    value={pw.next}
                    aria-invalid={!!pwErr.next}
                    onChange={(e) => setPwField("next", e.target.value)}
                  />
                  {pw.next && (
                    <span className="os-str">
                      <span className="os-strBar"><span style={{ width: `${strength.pct}%`, background: STR_COLOR[strength.score] }} /></span>
                      <span className="os-strT" style={{ color: STR_COLOR[strength.score] }}>{t(`osStr${strength.score}`)}</span>
                    </span>
                  )}
                  {pwErr.next && <span className="os-er">{pwErr.next}</span>}
                  <span className="os-hint">{t("osPwHint")}</span>
                </label>
                <label className="os-f">
                  <span className="os-lb">{t("osPwConfirm")} <i>*</i></span>
                  <input
                    type={pwShow ? "text" : "password"}
                    className="os-in"
                    value={pw.confirm}
                    aria-invalid={!!pwErr.confirm}
                    onChange={(e) => setPwField("confirm", e.target.value)}
                  />
                  {pwErr.confirm && <span className="os-er">{pwErr.confirm}</span>}
                </label>
                {pwAlert && <div className="os-alert">{pwAlert}</div>}
                <div className="os-acts">
                  <button type="button" className="os-go" disabled={pwBusy} onClick={savePassword}>
                    {pwBusy && <span className="os-sp" />}
                    {pwBusy ? t("osSaving") : t("osPwCta")}
                  </button>
                  <button type="button" className="os-gh" onClick={closeSheet}>{t("osCancel")}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {sheet === "blocked" && (
        <div className="os-scrim" onClick={closeSheet}>
          <div className="os-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="os-head">
              <div><b>{t("osBlocked")}</b></div>
              <button type="button" className="os-x" onClick={closeSheet} aria-label={t("osClose")}>×</button>
            </div>
            {blockedLoading && <span className="os-hint"><span className="os-sp" /> {t("osLoading")}</span>}
            {!blockedLoading && blockedErr && (
              <div className="os-res">
                <b>{t("osBlockedFailed")}</b>
                <button type="button" className="os-go" onClick={loadBlocked}>{t("osRetry")}</button>
              </div>
            )}
            {!blockedLoading && !blockedErr && blocked.length === 0 && (
              <p className="os-empty">{t("osBlockedEmpty")}</p>
            )}
            {!blockedLoading && !blockedErr && blocked.map((row) => {
              const user = row.toUser || {};
              const id = user._id || row.toUser;
              const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "—";
              return (
                <span className="os-person" key={row._id || id}>
                  <span
                    className="os-av"
                    style={{ backgroundImage: user.profileImage ? `url(${getFullImageUrl(user.profileImage)})` : "none" }}
                  />
                  <b>{name}</b>
                  <button type="button" className="os-gh os-gh-sm" disabled={unblocking === id} onClick={() => unblock(id)}>
                    {t("osUnblock")}
                  </button>
                </span>
              );
            })}
            <div className="os-acts">
              <button type="button" className="os-gh" onClick={closeSheet}>{t("osClose")}</button>
            </div>
          </div>
        </div>
      )}

      {sheet === "delete" && (
        <div className="os-scrim" onClick={closeSheet}>
          <div className="os-sheet os-sheet-sm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <b className="os-ask">{t("osDeleteTitle")}</b>
            <p className="os-askp">{t("osDeleteBody")}</p>
            {deleteErr && <div className="os-alert">{deleteErr}</div>}
            <div className="os-acts">
              <button type="button" className="os-danger" disabled={deleteBusy} onClick={deleteAccount}>
                {deleteBusy && <span className="os-sp" />}
                {deleteBusy ? t("osDeleteBusy") : t("osDeleteCta")}
              </button>
              <button type="button" className="os-gh" onClick={closeSheet}>{t("osCancel")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="os-toast" role="status">{toast}</div>}
    </div>
  );
}
