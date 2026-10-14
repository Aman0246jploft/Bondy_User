"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import promotionsApi from "@/api/promotionsApi";
import { useLanguage } from "@/context/LanguageContext";
import "./promotion-plan-modal.css";

const RESULTS = {
  active: { title: "cdPromoResActive", note: "cdPromoResActiveNote", tone: "ok" },
  failed: { title: "cdPromoResFailed", note: "cdPromoResFailedNote", tone: "danger" },
  timeout: { title: "cdPromoResTimeout", note: "cdPromoResTimeoutNote", tone: "danger" },
  offline: { title: "cdPromoResOffline", note: "cdPromoResOfflineNote", tone: "danger" },
  duplicate: { title: "cdPromoResDup", note: "cdPromoResDupNote", tone: "warn" },
  ineligible: { title: "cdPromoResIneligible", note: "cdPromoResIneligibleNote", tone: "danger" },
};

/**
 * Promotion plan picker + purchase result, shared by the course and event
 * detail pages. Plans come from the packages API for the given kind.
 *
 * kind        "course" | "event"
 * listingId   id of the course or event being promoted
 * title       listing title shown under the heading
 * viewHref    public page of the listing
 * running     true when the listing already has an active promotion
 * ineligible  true when the listing has ended or was cancelled
 * onPurchased called after a successful purchase so the page can refresh
 */
export default function PromotionPlanModal({ open, kind, listingId, title, viewHref, running = false, ineligible = false, onClose, onPurchased }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planErr, setPlanErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setPlan(null);
    setPlanErr(false);
    setResult("");
    setBusy(false);
    setLoading(true);
    const load = kind === "event" ? promotionsApi.getEventPackages : promotionsApi.getCoursePackages;
    load()
      .then((res) => {
        if (!alive) return;
        const data = res?.data;
        setPackages(res?.status ? (Array.isArray(data?.packages) ? data.packages : Array.isArray(data) ? data : []) : []);
      })
      .catch(() => alive && setPackages([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, kind]);

  if (!open) return null;

  const placementName = (key) => {
    if (key === "homePage") return t("cdPromoHome");
    if (key === "explorePage") return t("cdPromoExplore");
    return String(key);
  };
  const placements = (pkg) => {
    const list = Array.isArray(pkg?.placements) ? pkg.placements : [];
    return [...list].sort((a, b) => (a === "homePage" ? -1 : b === "homePage" ? 1 : 0)).map(placementName).join(" + ");
  };
  const note = (pkg) => {
    const list = Array.isArray(pkg?.placements) ? pkg.placements : [];
    const home = list.includes("homePage");
    const explore = list.includes("explorePage");
    if (home && explore) return t("cdPromoNoteBoth");
    if (home && list.length === 1) return t("cdPromoNoteHome");
    if (explore && list.length === 1) return t("cdPromoNoteExplore");
    return "";
  };
  const days = (pkg) => {
    const count = Number(pkg?.durationInDays || 0);
    return t(count === 1 ? "cdPromoDay" : "cdPromoDays", { count });
  };
  const price = (pkg) => `₮${Number(pkg?.price || 0).toLocaleString("en-US")}`;

  const close = () => {
    if (busy) return;
    onClose();
  };

  const pay = async () => {
    if (!plan) {
      setPlanErr(true);
      return;
    }
    if (ineligible) {
      setResult("ineligible");
      return;
    }
    if (running) {
      setResult("duplicate");
      return;
    }
    setBusy(true);
    try {
      const body = kind === "event" ? { eventId: listingId, packageId: plan._id } : { courseId: listingId, packageId: plan._id };
      const res = await (kind === "event" ? promotionsApi.checkoutEventPromotion(body) : promotionsApi.checkoutCoursePromotion(body));
      const url = res?.data?.invoiceUrl || res?.data?.paymentUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      if (res?.status) {
        setResult("active");
        if (onPurchased) await onPurchased();
      } else {
        setResult(/already/i.test(String(res?.message || "")) ? "duplicate" : "failed");
      }
    } catch (err) {
      if (!err?.response) {
        setResult(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : err?.code === "ECONNABORTED" ? "timeout" : "failed");
      } else {
        setResult(/already/i.test(String(err.response?.data?.message || "")) ? "duplicate" : "failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const res = result ? RESULTS[result] : null;
  const retry = ["failed", "timeout", "offline"].includes(result);

  const details = (withStart) => plan && (
    <div>
      <span className="pp-kv"><span>{t("cdPromoListing")}</span><span>{title || "—"}</span></span>
      <span className="pp-kv"><span>{t("cdPromoPlan")}</span><span>{plan.name}</span></span>
      {placements(plan) ? <span className="pp-kv"><span>{t("cdPromoPlacement")}</span><span>{placements(plan)}</span></span> : null}
      <span className="pp-kv"><span>{t("cdPromoDuration")}</span><span>{days(plan)}</span></span>
      {withStart ? <span className="pp-kv"><span>{t("cdPromoStart")}</span><span>{t("cdPromoOnPay")}</span></span> : null}
      <span className="pp-kv"><span>{t("cdPromoPayment")}</span><span>{price(plan)}</span></span>
    </div>
  );

  return (
    <div className="pp-scrim" onClick={close}>
      <div className="pp-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="pp-head">
          <div>
            <b>{t("cdPromoTitle")}</b>
            <span>{title || ""}</span>
          </div>
          <button type="button" className="pp-x" onClick={close} aria-label={t("cdClose")}>×</button>
        </div>

        {!res ? (
          <>
            <p className="pp-hint">{t("cdPromoBody")}</p>
            {loading ? <p className="pp-hint">{t("cdPromoLoading")}</p> : packages.length === 0 ? <p className="pp-hint">{t("cdPromoEmpty")}</p> : (
              <div className="pp-rail">
                {packages.map((pkg) => (
                  <button key={pkg._id} type="button" className="pp-plan" aria-selected={plan?._id === pkg._id} onClick={() => { setPlan(pkg); setPlanErr(false); }}>
                    <b>{pkg.name}</b>
                    <span className="pp-price">{price(pkg)}</span>
                    <i>{days(pkg)}</i>
                    {placements(pkg) ? <em>{placements(pkg)}</em> : null}
                    {note(pkg) ? <span className="pp-note">{note(pkg)}</span> : null}
                  </button>
                ))}
              </div>
            )}
            {planErr ? <span className="pp-er">{t("cdPromoPick")}</span> : null}
            {details(true)}
            <div className="pp-acts">
              <button type="button" className="pp-go" disabled={busy || loading} onClick={pay}>
                {busy ? <span className="pp-sp" /> : null}
                {busy ? t("cdPromoBusy") : t("cdPromoPay")}
              </button>
              <button type="button" className="pp-gh" disabled={busy} onClick={close}>{t("cancel")}</button>
            </div>
          </>
        ) : (
          <>
            <div className={`pp-res pp-${res.tone}`}>
              <b>{t(res.title)}</b>
              <p>{t(res.note)}</p>
            </div>
            {result !== "ineligible" ? details(false) : null}
            <div className="pp-acts">
              {retry ? <button type="button" className="pp-go" onClick={() => setResult("")}>{t("cdPromoRetry")}</button> : null}
              {result === "active" ? (
                <>
                  <button type="button" className="pp-go" onClick={() => viewHref && router.push(viewHref)}>{t("cdPromoViewListing")}</button>
                  <button type="button" className="pp-gh" onClick={() => router.push("/Promotions")}>{t("cdPromoPromotions")}</button>
                  <button type="button" className="pp-gh" onClick={() => router.push("/Dashboard")}>{t("cdPromoDashboard")}</button>
                </>
              ) : null}
              {!retry && result !== "active" ? <button type="button" className="pp-gh pp-full" onClick={onClose}>{t("cdClose")}</button> : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
