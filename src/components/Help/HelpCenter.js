"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import authApi from "@/api/authApi";
import supportTicketApi from "@/api/supportTicketApi";
import { useLanguage } from "@/context/LanguageContext";
import "./help-center.css";

const CLOSED_STATUSES = ["Resolved", "Cancelled", "closed"];
const OTHER_TOPIC = "Other";

const STATUS_KEYS = {
  Pending: "hcStPending",
  Open: "hcStOpen",
  Reopen: "hcStReopen",
  Resolved: "hcStResolved",
  Cancelled: "hcStCancelled",
  closed: "hcStClosed",
};

const EMPTY_FORM = { topic: "", subject: "", referenceNumber: "", description: "" };

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function TopicIcon({ slug }) {
  switch (slug) {
    case "events-courses":
      return (
        <svg {...iconProps}>
          <path d="M4 8.5V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2.2 2.2 0 0 0 0 4.4V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4.1a2.2 2.2 0 0 0 0-4.4Z" />
        </svg>
      );
    case "bookings-registrations":
      return (
        <svg {...iconProps}>
          <path d="M7 3h10a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      );
    case "payments-payouts":
      return (
        <svg {...iconProps}>
          <path d="M3 7h18v11H3zM3 10h18M7 15h3" />
        </svg>
      );
    case "staff-qr":
      return (
        <svg {...iconProps}>
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-4M14 18h2" />
        </svg>
      );
    case "verification":
      return (
        <svg {...iconProps}>
          <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" />
          <path d="m8.5 12 2.2 2.2 4.8-5" />
        </svg>
      );
    case "account-settings":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
        </svg>
      );
  }
}

const Chevron = ({ dir = "right", size = 17 }) => {
  const rot = { right: 0, left: 180, down: 90 }[dir];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rot}deg)`, transition: "transform 200ms" }}
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
};

export default function HelpCenter() {
  const { t, language } = useLanguage();
  const isMn = language === "mn";

  // Help content (real data from the DB)
  const [topics, setTopics] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState(false);
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState("");
  const [openFaq, setOpenFaq] = useState("");

  // Requests
  const [view, setView] = useState("main"); // main | list
  const [tickets, setTickets] = useState([]);
  const [tLoading, setTLoading] = useState(true);
  const [tError, setTError] = useState(false);
  const [filter, setFilter] = useState("all");

  // Create sheet
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [newRef, setNewRef] = useState("");

  // Detail sheet
  const [detail, setDetail] = useState(null); // { loading, ticket, error }
  const [statusBusy, setStatusBusy] = useState(false);

  const topicLabel = useCallback(
    (topic) => (isMn ? topic?.name_mn || topic?.name : topic?.name) || "",
    [isMn],
  );

  const loadHelp = useCallback(async () => {
    setFaqLoading(true);
    setFaqError(false);
    try {
      const [topicRes, faqRes] = await Promise.all([authApi.getFaqTopics(), authApi.getFaqs()]);
      if (topicRes?.status) setTopics(topicRes.data?.topics || []);
      if (faqRes?.status) setFaqs(faqRes.data?.faqs || []);
      if (!topicRes?.status && !faqRes?.status) setFaqError(true);
    } catch (e) {
      setFaqError(true);
    } finally {
      setFaqLoading(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setTLoading(true);
    setTError(false);
    try {
      const res = await supportTicketApi.getMyTickets({ page: 1, limit: 100 });
      if (res?.status) {
        setTickets(res.data?.tickets || []);
      } else {
        setTError(true);
      }
    } catch (e) {
      setTError(true);
    } finally {
      setTLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHelp();
    loadTickets();
  }, [loadHelp, loadTickets]);

  // ---------- derived data ----------
  const faqTopicId = (f) => String(f.category?._id || f.categoryId || "");

  const normalizedQuery = query.trim().toLowerCase();

  const visibleTopics = useMemo(() => {
    if (!normalizedQuery) return topics;
    return topics.filter((tp) =>
      `${tp.name || ""} ${tp.name_mn || ""}`.toLowerCase().includes(normalizedQuery),
    );
  }, [topics, normalizedQuery]);

  const visibleFaqs = useMemo(() => {
    return faqs.filter((f) => {
      if (topicId && faqTopicId(f) !== topicId) return false;
      if (!normalizedQuery) return true;
      const q = isMn ? f.question_mn || f.question : f.question;
      const a = isMn ? f.answer_mn || f.answer : f.answer;
      return `${q || ""} ${a || ""}`.toLowerCase().includes(normalizedQuery);
    });
  }, [faqs, topicId, normalizedQuery, isMn]);

  const activeTopic = topics.find((tp) => String(tp._id) === topicId);

  const isClosed = (ticket) => CLOSED_STATUSES.includes(ticket.status);
  const awaiting = tickets.filter((tk) => !isClosed(tk)).length;
  const filteredTickets = tickets.filter((tk) => {
    if (filter === "open") return !isClosed(tk);
    if (filter === "closed") return isClosed(tk);
    return true;
  });

  const statusLabel = (status) => (STATUS_KEYS[status] ? t(STATUS_KEYS[status]) : status);

  const ticketTopicLabel = (ticket) => {
    const category = typeof ticket.category === "object" ? ticket.category?.name : ticket.category;
    if (!category) return "";
    if (category === OTHER_TOPIC) return t("hcOther");
    const match = topics.find((tp) => tp.name === category);
    return match ? topicLabel(match) : category;
  };

  const formatDate = (value, withTime = false) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(isMn ? "mn-MN" : "en-US", {
      month: "short",
      day: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  };

  const ticketMeta = (ticket) => {
    const replies = ticket.replyCount ?? ticket.adminComments?.length ?? 0;
    const parts = [
      ticketTopicLabel(ticket),
      formatDate(ticket.createdAt),
      t("hcReplies", { count: replies }),
    ];
    if (ticket.referenceNumber) parts.push(`${t("hcRefShort")} ${ticket.referenceNumber}`);
    return parts.filter(Boolean).join(" · ");
  };

  // ---------- create ----------
  const openCreate = (prefillTopic = "") => {
    setForm({ ...EMPTY_FORM, topic: prefillTopic });
    setErrors({});
    setFormError("");
    setNewRef("");
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    if (newRef) {
      setView("list");
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const submitTicket = async () => {
    const next = {
      topic: !form.topic,
      subject: form.subject.trim().length < 5,
      description: form.description.trim().length < 20,
    };
    setErrors(next);
    if (next.topic || next.subject || next.description) return;

    setBusy(true);
    setFormError("");
    try {
      const payload = {
        category: form.topic,
        subject: form.subject.trim(),
        description: form.description.trim(),
        referenceNumber: form.referenceNumber.trim(),
      };
      const res = await supportTicketApi.createTicket(payload);
      if (res?.status) {
        setNewRef(res.data?.ticket?.ticketId || "");
        loadTickets();
      } else {
        setFormError(res?.message || t("hcSubmitFailed"));
      }
    } catch (e) {
      setFormError(e?.data?.message || t("hcSubmitFailed"));
    } finally {
      setBusy(false);
    }
  };

  // ---------- detail ----------
  const openDetail = async (ticketId) => {
    setDetail({ loading: true, ticket: null, error: false });
    try {
      const res = await supportTicketApi.getTicketDetails(ticketId);
      if (res?.status && res.data?.ticket) {
        setDetail({ loading: false, ticket: res.data.ticket, error: false });
      } else {
        setDetail({ loading: false, ticket: null, error: true });
      }
    } catch (e) {
      setDetail({ loading: false, ticket: null, error: true });
    }
  };

  const changeStatus = async (status) => {
    if (!detail?.ticket) return;
    setStatusBusy(true);
    try {
      const res = await supportTicketApi.updateStatus(detail.ticket.ticketId, status);
      if (res?.status) {
        setDetail((prev) => ({ ...prev, ticket: { ...prev.ticket, status } }));
        loadTickets();
      }
    } catch (e) {
      // keep the sheet open, status remains unchanged
    } finally {
      setStatusBusy(false);
    }
  };

  // Escape closes sheets
  useEffect(() => {
    if (!createOpen && !detail) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (detail) setDetail(null);
        else closeCreate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, detail, newRef]);

  const pillClass = (ticket) =>
    isClosed(ticket) ? "hc-pill hc-pill-closed" : "hc-pill hc-pill-open";

  // ---------- render helpers ----------
  const renderCreateSheet = () => (
    <div className="hc-scrim" onClick={closeCreate}>
      <div className="hc-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="hc-sheet-head">
          <h2 className="hc-h2">{t("hcNewRequest")}</h2>
          <button type="button" className="hc-x" onClick={closeCreate} aria-label={t("hcClose")}>
            ×
          </button>
        </div>

        {newRef ? (
          <div className="hc-done">
            <span className="hc-done-ic">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12.2 2.4 2.4 4.6-5" />
              </svg>
            </span>
            <b>{t("hcReceived")}</b>
            <p>{t("hcReceivedNote", { ref: newRef })}</p>
            <button type="button" className="hc-btn" onClick={closeCreate}>
              {t("hcToRequests")}
            </button>
          </div>
        ) : (
          <div className="hc-form">
            <label>
              <span className="hc-lb">
                {t("hcType")} <i>*</i>
              </span>
              <select
                className="hc-in"
                value={form.topic}
                aria-invalid={!!errors.topic}
                onChange={(e) => setField("topic", e.target.value)}
              >
                <option value="">{t("hcSelect")}</option>
                {topics.map((tp) => (
                  <option key={tp._id} value={tp.name}>
                    {topicLabel(tp)}
                  </option>
                ))}
                <option value={OTHER_TOPIC}>{t("hcOther")}</option>
              </select>
              {errors.topic && <span className="hc-err">{t("hcErrType")}</span>}
            </label>

            <label>
              <span className="hc-lb">
                {t("hcSubject")} <i>*</i>
              </span>
              <input
                type="text"
                className="hc-in"
                value={form.subject}
                maxLength={100}
                aria-invalid={!!errors.subject}
                placeholder={t("hcSubjectPh")}
                onChange={(e) => setField("subject", e.target.value)}
              />
              {errors.subject && <span className="hc-err">{t("hcErrSubject")}</span>}
            </label>

            <label>
              <span className="hc-lb">{t("hcRefLabel")}</span>
              <input
                type="text"
                className="hc-in"
                value={form.referenceNumber}
                maxLength={50}
                placeholder={t("hcRefPh")}
                onChange={(e) => setField("referenceNumber", e.target.value)}
              />
            </label>

            <label>
              <span className="hc-lb">
                {t("hcDescription")} <i>*</i>
              </span>
              <textarea
                className="hc-in hc-ta"
                value={form.description}
                maxLength={1000}
                aria-invalid={!!errors.description}
                placeholder={t("hcDescriptionPh")}
                onChange={(e) => setField("description", e.target.value)}
              />
              {errors.description && <span className="hc-err">{t("hcErrDescription")}</span>}
            </label>

            {formError && <div className="hc-form-err">{formError}</div>}

            <div className="hc-actions">
              <button type="button" className="hc-btn hc-btn-lg" onClick={submitTicket} disabled={busy}>
                {busy && <span className="hc-spin" />}
                {busy ? t("hcSending") : t("hcSend")}
              </button>
              <button type="button" className="hc-btn-ghost" onClick={closeCreate}>
                {t("hcCancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailSheet = () => {
    const ticket = detail.ticket;
    const comments = ticket?.adminComments || [];
    return (
      <div className="hc-scrim" onClick={() => setDetail(null)}>
        <div className="hc-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="hc-sheet-head">
            <div style={{ minWidth: 0 }}>
              {ticket && (
                <span className="hc-meta-row">
                  <span className="hc-ref">{ticket.ticketId}</span>
                  <span className={pillClass(ticket)}>{statusLabel(ticket.status)}</span>
                </span>
              )}
              <h2 className="hc-h2" style={{ marginTop: ticket ? 8 : 0 }}>
                {ticket ? ticket.subject : t("hcRequestTitle")}
              </h2>
            </div>
            <button type="button" className="hc-x" onClick={() => setDetail(null)} aria-label={t("hcClose")}>
              ×
            </button>
          </div>

          {detail.loading && (
            <div className="hc-skels">
              <div className="hc-skel" style={{ height: 60 }} />
              <div className="hc-skel" style={{ height: 60 }} />
            </div>
          )}

          {detail.error && <p className="hc-note">{t("hcDetailFailed")}</p>}

          {ticket && (
            <>
              <div className="hc-info">
                {ticketTopicLabel(ticket) && (
                  <span>
                    <em>{t("hcType")}</em>
                    {ticketTopicLabel(ticket)}
                  </span>
                )}
                {ticket.referenceNumber && (
                  <span>
                    <em>{t("hcRefLabel")}</em>
                    {ticket.referenceNumber}
                  </span>
                )}
              </div>

              <div className="hc-thread">
                <span className="hc-msg hc-msg-me">
                  <span className="hc-bubble hc-bubble-me">{ticket.description}</span>
                  <span className="hc-who">
                    {t("hcYou")} · {formatDate(ticket.createdAt, true)}
                  </span>
                </span>
                {comments.map((c, i) => (
                  <span className="hc-msg hc-msg-them" key={c._id || i}>
                    <span className="hc-bubble hc-bubble-them">{c.comment}</span>
                    <span className="hc-who">
                      {t("hcSupportName")} · {formatDate(c.createdAt, true)}
                    </span>
                  </span>
                ))}
                {comments.length === 0 && <p className="hc-note">{t("hcNoReplies")}</p>}
              </div>

              {isClosed(ticket) && <p className="hc-note">{t("hcClosedNote")}</p>}

              <div className="hc-actions">
                {isClosed(ticket) ? (
                  <button
                    type="button"
                    className="hc-btn hc-btn-lg"
                    disabled={statusBusy}
                    onClick={() => changeStatus("Reopen")}
                  >
                    {t("hcReopen")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="hc-btn-ghost"
                    disabled={statusBusy}
                    onClick={() => changeStatus("closed")}
                  >
                    {t("hcCloseRequest")}
                  </button>
                )}
                <button type="button" className="hc-btn-ghost hc-btn-strong" onClick={() => setDetail(null)}>
                  {t("hcClose")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderRequests = () => (
    <>
      <button type="button" className="hc-back" onClick={() => setView("main")}>
        <Chevron dir="left" size={16} />
        {t("hcTitle")}
      </button>
      <section className="hc-card">
        <div className="hc-row-head">
          <div style={{ minWidth: 0 }}>
            <h2 className="hc-h2">{t("hcRequestsTitle")}</h2>
            <p className="hc-sub">{t("hcSummary", { awaiting, total: tickets.length })}</p>
          </div>
          <button type="button" className="hc-btn" onClick={() => openCreate()}>
            {t("hcNewRequest")}
          </button>
        </div>

        <div className="hc-chips">
          {[
            ["all", t("hcAll")],
            ["open", t("hcPending")],
            ["closed", t("hcClosed")],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="hc-chip"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tLoading && (
          <div className="hc-skels">
            <div className="hc-skel" style={{ height: 74 }} />
            <div className="hc-skel" style={{ height: 74 }} />
            <div className="hc-skel" style={{ height: 74 }} />
          </div>
        )}

        {!tLoading && tError && (
          <div className="hc-state">
            <b>{t("hcRequestsFailed")}</b>
            <button type="button" className="hc-btn" onClick={loadTickets}>
              {t("hcRetry")}
            </button>
          </div>
        )}

        {!tLoading && !tError && filteredTickets.length === 0 && (
          <div className="hc-state">
            <b>{filter === "all" ? t("hcNoRequests") : t("hcNoRequestsFilter")}</b>
            <p>{t("hcNoRequestsNote")}</p>
          </div>
        )}

        {!tLoading && !tError && filteredTickets.length > 0 && (
          <div className="hc-tickets">
            {filteredTickets.map((tk) => (
              <button
                key={tk._id || tk.ticketId}
                type="button"
                className="hc-ticket"
                onClick={() => openDetail(tk.ticketId)}
              >
                <span className="hc-ticket-main">
                  <span className="hc-meta-row">
                    <span className="hc-ref">{tk.ticketId}</span>
                    <span className={pillClass(tk)}>{statusLabel(tk.status)}</span>
                  </span>
                  <b>{tk.subject}</b>
                  <span className="hc-ticket-meta">{ticketMeta(tk)}</span>
                </span>
                <span className="hc-ticket-chev">
                  <Chevron />
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );

  const renderMain = () => (
    <>
      {/* Topics */}
      {(visibleTopics.length > 0 || faqLoading) && (
        <section className="hc-card">
          <h2 className="hc-h2">{t("hcTopics")}</h2>
          {faqLoading ? (
            <div className="hc-topics">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="hc-skel" style={{ height: 70, borderRadius: 16 }} />
              ))}
            </div>
          ) : (
            <div className="hc-topics">
              {visibleTopics.map((tp) => {
                const on = topicId === String(tp._id);
                return (
                  <button
                    key={tp._id}
                    type="button"
                    className="hc-topic"
                    aria-selected={on}
                    onClick={() => {
                      setTopicId(on ? "" : String(tp._id));
                      setOpenFaq("");
                      const el = document.getElementById("hc-faq");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    <span className="hc-topic-ic">
                      <TopicIcon slug={tp.slug} />
                    </span>
                    <b>{topicLabel(tp)}</b>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* FAQ */}
      <section className="hc-card" id="hc-faq">
        <div className="hc-row-head">
          <h2 className="hc-h2">{activeTopic ? topicLabel(activeTopic) : t("hcFaqTitle")}</h2>
          {topicId && (
            <button type="button" className="hc-btn-ghost" onClick={() => setTopicId("")}>
              {t("hcShowAll")}
            </button>
          )}
        </div>

        {faqLoading && (
          <div className="hc-skels">
            <div className="hc-skel" style={{ height: 48 }} />
            <div className="hc-skel" style={{ height: 48 }} />
            <div className="hc-skel" style={{ height: 48 }} />
          </div>
        )}

        {!faqLoading && faqError && (
          <div className="hc-state">
            <b>{t("hcFaqFailed")}</b>
            <button type="button" className="hc-btn" onClick={loadHelp}>
              {t("hcRetry")}
            </button>
          </div>
        )}

        {!faqLoading && !faqError && (
          <div style={{ marginTop: 14 }}>
            {visibleFaqs.map((f) => {
              const open = openFaq === f._id;
              return (
                <div key={f._id}>
                  <button
                    type="button"
                    className="hc-q"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? "" : f._id)}
                  >
                    <span>{isMn ? f.question_mn || f.question : f.question}</span>
                    <span className="hc-q-chev" style={{ transform: open ? "rotate(180deg)" : "none" }}>
                      <Chevron dir="down" size={18} />
                    </span>
                  </button>
                  {open && <p className="hc-a">{isMn ? f.answer_mn || f.answer : f.answer}</p>}
                </div>
              );
            })}
            {visibleFaqs.length === 0 && (
              <p className="hc-empty">{faqs.length === 0 ? t("noFaqsFound") : t("hcNoMatch")}</p>
            )}
          </div>
        )}
      </section>

      {/* Escalate */}
      <section className="hc-card">
        <h2 className="hc-h2">{t("hcStillNeedHelp")}</h2>
        <div className="hc-esc-wrap">
          <button type="button" className="hc-esc" onClick={() => openCreate()}>
            <span className="hc-esc-ic">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h16v12H8l-4 3V5Z" />
                <path d="M8 10h8M8 13h5" />
              </svg>
            </span>
            <span className="hc-esc-txt">
              <b>{t("hcSendToBondy")}</b>
              <span>{t("hcHours")}</span>
            </span>
            <span className="hc-esc-chev">
              <Chevron />
            </span>
          </button>
        </div>
      </section>

      {/* My requests */}
      <button type="button" className="hc-card hc-hist" onClick={() => setView("list")}>
        <span className="hc-hist-ic">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3h10a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" />
            <path d="M9 8h6M9 12h6" />
          </svg>
        </span>
        <span className="hc-esc-txt">
          <b>{t("hcMyRequests")}</b>
          <span>
            {tLoading
              ? t("hcLoading")
              : tickets.length > 0
                ? t("hcSummary", { awaiting, total: tickets.length })
                : t("hcNoRequests")}
          </span>
        </span>
        <span className="hc-hist-chev">
          <Chevron />
        </span>
      </button>
    </>
  );

  return (
    <div className="hc-wrap">
      {view === "main" && (
        <label className="hc-search">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpenFaq("");
            }}
            placeholder={t("hcSearchPh")}
          />
        </label>
      )}

      <div className="hc-stack">{view === "main" ? renderMain() : renderRequests()}</div>

      {createOpen && renderCreateSheet()}
      {detail && renderDetailSheet()}
    </div>
  );
}
