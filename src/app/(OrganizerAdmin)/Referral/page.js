"use client";
import React, { useState, useEffect, useRef } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import referralApi from "@/api/referralApi";

function page() {
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [stats, setStats] = useState({
    totalReferrals: 0,
    signedUp: 0,
    completed: 0,
    totalRewardEarned: 0,
  });
  const [history, setHistory] = useState([]);
  const [loadingCode, setLoadingCode] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [search, setSearch] = useState("");

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
          signedUp: res.data.signedUp,
          completed: res.data.completed,
          totalRewardEarned: res.data.totalRewardEarned,
        });
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch referral stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchCode();
    fetchStats();
  }, []);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    setInviting(true);
    try {
      const res = await referralApi.invite(inviteEmail.trim());
      if (res?.status) {
        toast.success(`Invite sent to ${inviteEmail}! 🎉`);
        setInviteEmail("");
        fetchStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const statusClass = (status) => {
    switch (status) {
      case "COMPLETED": return "complete";
      case "SIGNED_UP": return "upcoming";
      case "PENDING": return "pending";
      case "EXPIRED": return "past";
      default: return "pending";
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "COMPLETED": return "Rewarded";
      case "SIGNED_UP": return "Signed Up";
      case "PENDING": return "Pending";
      case "EXPIRED": return "Expired";
      default: return status;
    }
  };

  const filteredHistory = history.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.refereeEmail?.toLowerCase().includes(q) ||
      r.referee?.firstName?.toLowerCase().includes(q) ||
      r.referee?.lastName?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">Referral</h2>
            <p className="card-desc">Invite organizers & earn ₮75,000 per successful signup.</p>
          </div>
        </div>

        <Row className="mb-4">
          {/* Left — Share link + invite */}
          <Col md={6}>
            <div className="analytics-chart link-cards border-0">
              <h4 className="mb-1">Invite Organizers & Earn</h4>
              <p className="mb-3" style={{ color: "#999", fontSize: "14px" }}>
                Get ₮75,000 credit for every organizer who joins and hosts their first event.
              </p>

              {/* Referral link */}
              <h6 className="mb-2">Your Unique Referral Link</h6>
              <div className="link-bx">
                {loadingCode ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <input
                      type="text"
                      className="form-control"
                      value={referralLink}
                      readOnly
                    />
                    <button className="common_btn" type="button" onClick={handleCopyLink}>
                      Copy Link
                    </button>
                    <span className="link-icon">
                      <img src="/img/link.svg" alt="link" />
                    </span>
                  </>
                )}
              </div>

              {/* Invite by email */}

              {/* <h6 className="mb-2 mt-4">Invite via Email</h6>
              <form onSubmit={handleInvite} className="d-flex gap-2">
                <input
                  type="email"
                  className="form-control"
                  placeholder="organizer@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button type="submit" className="common_btn" disabled={inviting} style={{ whiteSpace: "nowrap" }}>
                  {inviting ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <img src="/img/org-img/email.svg" className="me-1" alt="email" />
                      Send Invite
                    </>
                  )}
                </button>
              </form> */}
            </div>
          </Col>

          {/* Right — Stats */}
          <Col md={6}>
            <div className="referal-cards analytics-chart border-0 mb-3">
              <h6>Total Referrals</h6>
              <h3>{loadingStats ? "—" : stats.totalReferrals}</h3>
            </div>
            <div className="referal-cards analytics-chart border-0 mb-3">
              <h6>Successful Signups</h6>
              <h3>{loadingStats ? "—" : stats.signedUp}</h3>
            </div>
            <div className="referal-cards analytics-chart border-0">
              <h6>Total Reward Earned</h6>
              <h3>₮{loadingStats ? "—" : stats.totalRewardEarned.toLocaleString()}</h3>
            </div>
          </Col>
        </Row>

        {/* Referral History Table */}
        <div className="custom-table-cards billing-history">
          <div className="card-header">
            <div>
              <h5 className="table-title">Referral History</h5>
            </div>
            <div className="table-search">
              <input
                type="text"
                className="form-control"
                placeholder="Search referrals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="button">
                <img src="/img/org-img/search-white.svg" width={16} alt="search" />
              </button>
            </div>
          </div>
          <div className="table table-responsive custom-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Invited User</th>
                  <th>Date Invited</th>
                  <th>Status</th>
                  <th>Reward</th>
                </tr>
              </thead>
              <tbody>
                {loadingStats ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      <Spinner animation="border" size="sm" /> Loading...
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4" style={{ color: "#999" }}>
                      {search ? "No matching referrals found." : "No referrals yet. Start inviting!"}
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div>
                          {r.referee
                            ? `${r.referee.firstName || ""} ${r.referee.lastName || ""}`.trim() || "Organizer"
                            : "—"}
                          <br />
                          <span className="sub">{r.refereeEmail}</span>
                        </div>
                      </td>
                      <td>
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span className={`status-badge ${statusClass(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td>
                        {r.status === "COMPLETED"
                          ? `₮${(r.rewardAmount || 75000).toLocaleString()}`
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
