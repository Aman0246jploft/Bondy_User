"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import eventApi from "@/api/eventApi";
import { Container, Row, Col, Form, InputGroup } from "react-bootstrap";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import Header from "@/components/Header";
import { getFullImageUrl } from "@/utils/imageHelper";

export default function EventAttendees() {
    const searchParams = useSearchParams();
    const eventId = searchParams.get("id");
    const router = useRouter();
    const [attendees, setAttendees] = useState([]);
    const [host, setHost] = useState(null);
    const [eventTitle, setEventTitle] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendees = async () => {
            if (!eventId) return;
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

        const timer = setTimeout(() => {
            fetchAttendees();
        }, 500); // Debounce search

        return () => clearTimeout(timer);
    }, [eventId, search]);

    return (
        <>
            <Header />
            <div className="event-page-wrapper py-5" style={{ minHeight: "100vh", backgroundColor: "#000", color: "#fff" }}>
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
                        <InputGroup className="custom-search-input">
                            <InputGroup.Text className="bg-dark border-secondary text-secondary">
                                <FaSearch />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search attendees..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-dark text-white border-secondary"
                                style={{ boxShadow: "none" }}
                            />
                        </InputGroup>
                    </div>

                    {host && (
                        <div className="mb-4 p-3 rounded-4" style={{ backgroundColor: "#1a1a1a" }}>
                            <div className="d-flex align-items-center">
                                <img
                                    src={host.profileImage ? getFullImageUrl(host.profileImage) : "/img/default-user.png"}
                                    alt="Host"
                                    className="rounded-circle object-fit-cover me-3"
                                    width={50}
                                    height={50}
                                />
                                <div>
                                    <h5 className="mb-0 fw-semibold">{host.firstName} {host.lastName}</h5>
                                    <small className="text-teal" style={{ color: "#26a69a" }}>Event Host</small>
                                </div>
                            </div>
                        </div>
                    )}

                    <h5 className="mb-3 text-secondary">Guests ({attendees.length})</h5>

                    <div className="attendees-list">
                        {loading ? (
                            <p className="text-center text-secondary">Loading...</p>
                        ) : attendees.length > 0 ? (
                            attendees.map((user) => (
                                <div key={user._id} className="mb-3 p-3 rounded-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: "#1a1a1a" }}>
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={user.profileImage ? getFullImageUrl(user.profileImage) : "/img/default-user.png"}
                                            alt={user.firstName}
                                            className="rounded-circle object-fit-cover me-3"
                                            width={45}
                                            height={45}
                                        />
                                        <div>
                                            <h6 className="mb-0 fw-semibold">{user.firstName} {user.lastName}</h6>
                                            {/* <small className="text-secondary">Bought {user.ticketsBought} ticket{user.ticketsBought > 1 ? 's' : ''}</small> */}
                                        </div>
                                    </div>
                                    {/* <span className="badge bg-secondary rounded-pill">Guest</span> */}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-secondary mt-5">No attendees found.</p>
                        )}
                    </div>

                </Container>
            </div>
        </>
    );
}
