"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import referralApi from "@/api/referralApi";
import { useLanguage } from "@/context/LanguageContext";

function money(value) {
  return `₮${Number(value || 0).toLocaleString("en-US")}`;
}

function earnedAmount(rewards) {
  return rewards.reduce((sum, reward) => {
    if (reward.discountType === "percentage") {
      return sum + (Number(reward.maxDiscountAmount) || 0);
    }
    return sum + (Number(reward.discountValue) || 0);
  }, 0);
}

export default function CustomerReferralPage() {
  const { t } = useLanguage();
  const [referralLink, setReferralLink] = useState("");
  const [invited, setInvited] = useState(0);
  const [rewards, setRewards] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = `${t("ivTitle")} - Bondy`;
  }, [t]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [codeRes, statsRes, rewardRes] = await Promise.all([
          referralApi.getMyCode(),
          referralApi.getStats(),
          referralApi.getRewards(),
        ]);
        if (!alive) return;
        if (codeRes?.status) setReferralLink(codeRes.data?.referralLink || "");
        if (statsRes?.status) setInvited(statsRes.data?.totalReferrals || 0);
        if (rewardRes?.status) setRewards(earnedAmount(rewardRes.data?.rewards || []));
      } catch (error) {
        console.error("Failed to load invites", error);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(t("referralLinkCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy invite link", error);
    }
  };

  return (
    <section className="iv-card">
      <h2>{t("ivTitle")}</h2>
      <p className="iv-lead">{t("ivLead")}</p>
      <div className="iv-share">
        <label className="iv-link">
          <input type="text" value={referralLink} readOnly aria-label={t("ivTitle")} />
        </label>
        <button type="button" className="iv-copy" onClick={handleCopy} disabled={!referralLink}>
          {copied ? t("ivCopied") : t("ivCopy")}
        </button>
      </div>
      <div className="iv-stats">
        <div className="iv-stat">
          <b>{t("ivInvited")}</b>
          <span>{invited}</span>
        </div>
        <div className="iv-stat">
          <b>{t("ivRewards")}</b>
          <span className="iv-money">{money(rewards)}</span>
        </div>
      </div>
    </section>
  );
}
