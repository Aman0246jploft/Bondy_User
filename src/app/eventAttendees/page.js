"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import eventApi from "@/api/eventApi";
import { Container, Form, InputGroup } from "react-bootstrap";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import Header from "@/components/Header";
import { getFullImageUrl } from "@/utils/imageHelper";
import { useLanguage } from "@/context/LanguageContext";


function EventAttendeesContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const router = useRouter();
  const { t } = useLanguage();

  const [attendees, setAttendees] = useState([]);
  const [host, setHost] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchAttendees = async () => {
      try {
        setLoading(true);
        const response = await eventApi.getAllAttendees(eventId, search);
        if (response?.status) {
          setAttendees(response?.data?.attendees || []);
          setHost(response?.data?.host);
          setEventTitle(response?.data?.eventTitle);
        }
      } catch (error) {
        console.error("Error fetching attendees:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchAttendees, 500);
    return () => clearTimeout(timer);
  }, [eventId, search]);

  useEffect(() => {
    if (eventTitle) {
      document.title = `${eventTitle} ${t("attendees")} | Bondy`;
    } else {
      document.title = `${t("eventAttendeesTitle")} | Bondy`;
    }
  }, [eventTitle, t]);

  return (
    <>
      <Header />
      <div
        className="event-page-wrapper py-5"
        style={{ minHeight: "100vh", backgroundColor: "#000", color: "#fff" }}
      >
        <Container>
          <div className="d-flex align-items-center mb-4">
            <button
              onClick={() => router.back()}
              className="btn btn-link text-white text-decoration-none p-0 me-3"
            >
              <FaArrowLeft size={20} />
            </button>
            <h2 className="mb-0 fw-bold" style={{ marginTop: "50px" }}>{t("eventAttendeesTitle")}</h2>
          </div>

          <div className="mb-4">
            <InputGroup>
              <InputGroup.Text className="bg-dark border-secondary text-secondary">
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder={t("searchAttendeesPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-dark text-white border-secondary"
              />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">{t("loading")}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Event Title */}
              {eventTitle && (
                <h4 className="mb-4 text-white fw-semibold">{eventTitle}</h4>
              )}

              {/* Host Card */}
              {host && (
                <div
                  className="d-flex align-items-center p-3 mb-4 rounded-3"
                  style={{ backgroundColor: "#1a1a2e", border: "1px solid #333", cursor: "pointer" }}
                  onClick={() => router.push(`/profile?id=${host._id}`)}
                >
                  <img
                    src={getFullImageUrl(host.profileImage)}
                    alt={`${host.firstName} ${host.lastName}`}
                    className="rounded-circle me-3"
                    style={{
                      width: 50,
                      height: 50,
                      objectFit: "cover",
                      border: "2px solid #e94560",
                    }}
                    onError={(e) => {
                      e.target.src = "/img/sidebar-logo.svg";
                    }}
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-0 text-white fw-semibold">
                      {host.firstName} {host.lastName}
                    </h6>
                    <small className="text-secondary">{t("hostOrganizer")}</small>
                  </div>
                  {host.isVerified && (
                    <span className="badge bg-success">{t("verified")}</span>
                  )}
                </div>
              )}

              {/* Attendees List */}
              <h5 className="mb-3 text-white">
                {t("attendees")} ({attendees.length})
              </h5>

              {attendees.length === 0 ? (
                <div
                  className="text-center py-5 rounded-3"
                  style={{ backgroundColor: "#1a1a2e" }}
                >
                  <p className="text-secondary mb-0">{t("noAttendeesFound")}</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {attendees.map((attendee) => (
                    <div
                      key={attendee._id}
                      className="d-flex align-items-center p-3 rounded-3"
                      onClick={() => router.push(`/profile?id=${attendee._id}`)}
                      style={{
                        backgroundColor: "#1a1a2e",
                        border: "1px solid #262640",
                        transition: "background-color 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#222244")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#1a1a2e")
                      }
                    >
                      <img
                        src={getFullImageUrl(attendee.profileImage)}
                        alt={`${attendee.firstName} ${attendee.lastName}`}
                        className="rounded-circle me-3"
                        style={{
                          width: 45,
                          height: 45,
                          objectFit: "cover",
                          border: "2px solid #444",
                        }}
                        onError={(e) => {
                          e.target.src = "/img/sidebar-logo.svg";
                        }}
                      />
                      <div className="flex-grow-1">
                        <h6 className="mb-0 text-white">
                          {attendee.firstName} {attendee.lastName}
                        </h6>
                      </div>
                      <div className="text-end">
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: "#e94560",
                            fontSize: "0.8rem",
                            padding: "6px 12px",
                          }}
                        >
                          {attendee.ticketsBought}{" "}
                          {attendee.ticketsBought === 1 ? t("ticket") : t("tickets")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Container>
      </div>
    </>
  );
}

export default function EventAttendeesPage() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <EventAttendeesContent />
    </Suspense>
  );
}
