"use client";
import React, { useState, useEffect } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import referralApi from "@/api/referralApi";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { getFullImageUrl } from "@/utils/imageHelper";

export default function OrganizerReferralPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    pendingValidation: 0,
    successfulReferrals: 0,
  });
  const [history, setHistory] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [showAllReferrals, setShowAllReferrals] = useState(false);
  const [rewardCounts, setRewardCounts] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    usedCoupons: 0,
    expiredCoupons: 0,
  });
  const [loadingCode, setLoadingCode] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRewards, setLoadingRewards] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchCode = async () => {
    try {
      setLoadingCode(true);
      const res = await referralApi.getMyCode();
      if (res?.status) {
        setReferralCode(res.data.referralCode);
        setReferralLink(res.data.referralLink);
      }
    } catch (err) {
      console.error("Failed to fetch referral code", err);
    } finally {
      setLoadingCode(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await referralApi.getStats();
      if (res?.status) {
        setStats({
          totalReferrals: res.data.totalReferrals,
          pendingReferrals: res.data.pendingReferrals,
          pendingValidation: res.data.pendingValidation,
          successfulReferrals: res.data.successfulReferrals,
        });
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch referral stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRewards = async () => {
    try {
      setLoadingRewards(true);
      const res = await referralApi.getRewards();
      if (res?.status) {
        setRewards(res.data.rewards || []);
        setRewardCounts({
          totalCoupons: res.data.totalCoupons || 0,
          activeCoupons: res.data.activeCoupons || 0,
          usedCoupons: res.data.usedCoupons || 0,
          expiredCoupons: res.data.expiredCoupons || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch referral rewards", err);
    } finally {
      setLoadingRewards(false);
    }
  };

  useEffect(() => {
    fetchCode();
    fetchStats();
    fetchRewards();
    document.title = "Organizer Referral - Bondy";
  }, []);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied!`);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    setInviting(true);
    try {
      const res = await referralApi.invite(inviteEmail.trim());
      if (res?.status) {
        toast.success(`Invite sent successfully to ${inviteEmail}!`);
        setInviteEmail("");
        fetchStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  // Metrics fetched from API
  const totalCoupons = rewardCounts.totalCoupons;
  const activeCoupons = rewardCounts.activeCoupons;
  const usedCoupons = rewardCounts.usedCoupons;
  const expiredCoupons = rewardCounts.expiredCoupons;

  return (
    <div className="cards">
      {/* Header */}
      <div className="card-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="card-title">{t("referral") || "Referrals"}</h2>
          <p className="card-desc">Track and manage your earned rewards in MNT.</p>
        </div>
      </div>

      {/* Rewards Coupon Overview Grid */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <div className="card-varticl mb-3">
            <span>Total Earned</span>
            <h3>{totalCoupons} <span style={{ fontSize: "14px", fontWeight: "normal", color: "#8b949e" }}>Coupons</span></h3>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="card-varticl mb-3">
            <span>Active Now</span>
            <h3>{String(activeCoupons).padStart(2, "0")} <span style={{ fontSize: "14px", fontWeight: "normal", color: "#8b949e" }}>Coupons</span></h3>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="card-varticl mb-3">
            <span>Used</span>
            <h3>{String(usedCoupons).padStart(2, "0")}</h3>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="card-varticl mb-3">
            <span>Expired</span>
            <h3>{String(expiredCoupons).padStart(2, "0")}</h3>
          </div>
        </Col>
      </Row>

      {/* Referral Link Sharing Section */}
      <div className="card-varticl mb-4">
        <h5 className="mb-2 fw-semibold text-white" style={{ fontSize: "16px" }}>Invite Friends & Earn Discount Coupons</h5>
        <p className="text-secondary mb-3" style={{ fontSize: "13px" }}>
          Get ₮75,000 coupon credit for every organizer who joins and hosts their first event or friend who books their first experience.
        </p>
        <div className="d-flex align-items-center bg-black p-2 rounded-2" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          {loadingCode ? (
            <Spinner animation="border" size="sm" className="text-info mx-auto" />
          ) : (
            <>
              <img src="/img/link.svg" alt="link" style={{ width: "16px", height: "16px", marginRight: "10px", filter: "invert(0.6)" }} />
              <input
                type="text"
                className="form-control bg-transparent text-white border-0 p-0 shadow-none"
                style={{ fontSize: "13px" }}
                value={referralLink}
                readOnly
              />
              <button
                onClick={handleCopyLink}
                className="btn btn-sm px-3 py-1 fw-semibold text-nowrap ms-2"
                style={{ backgroundColor: "#23ada4", color: "#ffffff", borderRadius: "5px" }}
              >
                Copy Link
              </button>
            </>
          )}
        </div>
      </div>

      {/* Coupons Section */}
      <h5 className="mb-3 fw-bold text-white" style={{ fontSize: "18px" }}>Your Reward Coupons</h5>
      {loadingRewards ? (
        <div className="text-center py-4"><Spinner animation="border" className="text-info" /></div>
      ) : rewards.length === 0 ? (
        <p className="text-secondary mb-4" style={{ fontSize: "13px" }}>No coupons earned yet. Start inviting other organizers to earn rewards!</p>
      ) : (
        <div className="d-flex flex-column gap-3 mb-4">
          {rewards.map((reward) => {
            const isExpired = reward.validUntil && new Date() > new Date(reward.validUntil);
            const isUsed = reward.usedCount >= (reward.maxUsage || 1);
            let status = "AVAILABLE";
            let statusColor = "#23ada4";
            let statusBg = "rgba(35, 173, 164, 0.1)";

            if (isUsed) {
              status = "USED";
              statusColor = "#8b949e";
              statusBg = "rgba(139, 148, 158, 0.15)";
            } else if (isExpired) {
              status = "EXPIRED";
              statusColor = "#ff4d4f";
              statusBg = "rgba(255, 77, 79, 0.15)";
            }

            return (
              <div
                key={reward._id}
                className="d-flex rounded-3 overflow-hidden"
                style={{ border: `1px solid ${isUsed ? "#333" : "#23ada4"}`, background: "#323232", minHeight: "90px" }}
              >
                {/* Left side discount value box */}
                <div
                  className="d-flex flex-column justify-content-center align-items-center px-3 text-center"
                  style={{
                    backgroundColor: isUsed ? "#444" : "#23ada4",
                    color: "#ffffff",
                    width: "100px",
                    fontWeight: "bold",
                    fontSize: "12px"
                  }}
                >
                  <div>VALUE</div>
                  <div style={{ fontSize: "18px" }}>
                    {reward.discountType === "percentage" ? `${reward.discountValue}%` : `₮${reward.discountValue}`}
                  </div>
                  <div style={{ fontSize: "11px" }}>OFF</div>
                </div>

                {/* Right side details */}
                <div className="flex-grow-1 p-3 d-flex flex-column justify-content-between position-relative">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="fw-bold text-white d-block" style={{ fontSize: "15px" }}>{reward.code}</span>
                      <span className="text-secondary" style={{ fontSize: "12px" }}>
                        {isUsed
                          ? `Used on ${new Date(reward.updatedAt).toLocaleDateString()}`
                          : `Expires on ${new Date(reward.validUntil).toLocaleDateString()}`}
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-2 fw-semibold"
                      style={{ fontSize: "10px", color: statusColor, backgroundColor: statusBg, border: `1px solid ${statusColor}44` }}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-secondary" style={{ fontSize: "11px" }}>
                      {reward.maxDiscountAmount ? `Max Discount: ₮${reward.maxDiscountAmount.toLocaleString()}` : ""}
                      {reward.minOrderAmount ? ` • Min Order: ₮${reward.minOrderAmount.toLocaleString()}` : ""}
                    </span>
                    {!isUsed && !isExpired && (
                      <button
                        onClick={() => handleCopyCode(reward.code)}
                        className="btn btn-sm px-2 py-1 text-white border-0 fw-semibold"
                        style={{ backgroundColor: "#23ada4", borderRadius: "5px", fontSize: "11px" }}
                      >
                        Copy Code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Referrals Stats Summary */}
      <Row className="g-3 mb-4">
        <Col xs={6}>
          <div className="card-varticl text-center">
            <span>Total Referrals</span>
            <h3>{loadingStats ? "—" : stats.totalReferrals}</h3>
          </div>
        </Col>
        <Col xs={6}>
          <div className="card-varticl text-center">
            <span>Pending Referrals</span>
            <h3>{loadingStats ? "—" : (stats.pendingReferrals + stats.pendingValidation)}</h3>
          </div>
        </Col>
      </Row>

      {/* Recent Referrals List */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="m-0 fw-bold text-white" style={{ fontSize: "18px" }}>Recent Referrals</h5>
        {history.length > 5 && (
          <span 
            className="text-info" 
            style={{ fontSize: "13px", cursor: "pointer" }}
            onClick={() => setShowAllReferrals(!showAllReferrals)}
          >
            {showAllReferrals ? "Show Less" : "View All"}
          </span>
        )}
      </div>

      {loadingStats ? (
        <div className="text-center py-4"><Spinner animation="border" className="text-info" /></div>
      ) : history.length === 0 ? (
        <p className="text-secondary" style={{ fontSize: "13px" }}>No referrals recorded yet.</p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {(showAllReferrals ? history : history.slice(0, 5)).map((referral) => {
            const refereeName = referral.referee
              ? `${referral.referee.firstName || ""} ${referral.referee.lastName || ""}`.trim()
              : referral.refereeEmail;

            let statusLabel = "Pending";
            let statusDot = "#ffa100";
            if (referral.status === "SUCCESSFUL_REFERRAL") {
              statusLabel = "Completed";
              statusDot = "#2ec4b6";
            } else if (referral.status === "PENDING_VALIDATION") {
              statusLabel = "Pending validation";
              statusDot = "#e71d36";
            }

            return (
              <div
                key={referral._id}
                className="card-varticl-attention mb-2"
              >
                <div className="d-flex align-items-center">
                  {referral.referee?.profileImage ? (
                    <img
                      src={getFullImageUrl(referral.referee.profileImage)}
                      alt="referee"
                      className="rounded-circle me-3"
                      style={{ width: "40px", height: "40px", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "#0b0c10",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#23ada4"
                      }}
                    >
                      {refereeName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="fw-bold text-white d-block" style={{ fontSize: "14px" }}>{refereeName}</span>
                    <span className="d-flex align-items-center" style={{ fontSize: "11px", color: "#8b949e" }}>
                      <span className="me-1" style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusDot, display: "inline-block" }}></span>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-secondary" style={{ fontSize: "12px" }}>
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
