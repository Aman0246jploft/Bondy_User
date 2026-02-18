"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import eventApi from "@/api/eventApi";
import { Container, Form, InputGroup } from "react-bootstrap";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import Header from "@/components/Header";
import { getFullImageUrl } from "@/utils/imageHelper";

function EventAttendeesContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const router = useRouter();

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
        if (response.status) {
          setAttendees(response.data.attendees || []);
          setHost(response.data.host);
          setEventTitle(response.data.eventTitle);
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
            <h2 className="mb-0 fw-bold">Event Attendees</h2>
          </div>

          <div className="mb-4">
            <InputGroup>
              <InputGroup.Text className="bg-dark border-secondary text-secondary">
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search attendees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-dark text-white border-secondary"
              />
            </InputGroup>
          </div>

          {/* Rest of your UI remains unchanged */}
        </Container>
      </div>
    </>
  );
}

export default function EventAttendeesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventAttendeesContent />
    </Suspense>
  );
}
