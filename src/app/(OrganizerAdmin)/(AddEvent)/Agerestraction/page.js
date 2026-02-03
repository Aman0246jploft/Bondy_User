"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import authApi from "@/api/authApi";
import { Col, Form, Row } from "react-bootstrap";
import { useEventContext } from "@/context/EventContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

function page() {
  const { eventData, updateEventData } = useEventContext();
  const router = useRouter();
  // Dynamically import or require authApi if needed, or assume it is available in scope if I add the import at the top.
  // Ideally, I should add the import at the top separately.
  // Let's assume I will add `import authApi from "@/api/authApi";` at line 2.
  // Wait, I can't add imports easily with replace in the middle.
  // Let's replace the whole top section including imports.

  const [featureFee, setFeatureFee] = useState(5.0); // Default fallback

  useEffect(() => {
    const fetchFeatureFee = async () => {
      try {
        const response = await authApi.getGlobalSetting("FEATURE_EVENT_FEE");
        if (response.status && response.data && response.data.value) {
          setFeatureFee(Number(response.data.value));
        }
      } catch (error) {
        console.error("Error fetching feature fee:", error);
      }
    };
    fetchFeatureFee();
  }, []);

  // Local state for age slider if needed, or directly use eventData
  // We'll trust eventData is the source of truth

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    updateEventData({ [name]: checked });
  };

  const handleDressCodeChange = (e) => {
    updateEventData({ dressCode: e.target.value });
  };

  const handleAgeTypeChange = (type) => {
    // If All Ages, maybe reset minAge or just ignore it
    updateEventData({
      ageRestriction: {
        ...eventData.ageRestriction,
        type: type,
        // Reset minAge if ALL_AGES? Or keep it? keeping it is safer for switching back
      },
    });
  };

  const handleMinAgeChange = (e) => {
    updateEventData({
      ageRestriction: {
        ...eventData.ageRestriction,
        minAge: parseInt(e.target.value),
      },
    });
  };

  const handleMaxAgeChange = (e) => {
    updateEventData({
      ageRestriction: {
        ...eventData.ageRestriction,
        maxAge: parseInt(e.target.value),
      },
    });
  };

  const handleNext = (e) => {
    e.preventDefault();
    // Validation if needed
    router.push("/Gallery");
  };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md={8}>
          <ul className="event-steps">
            <li className="steps-item">
              <Link href="/BasicInfo" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-01.svg" className="me-2" />
                  Event Basic Info
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/DateTime" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-02.svg" className="me-2" />
                  Date, Time and Location
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/TicketsPricing" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-03.svg" className="me-2" />
                  Tickets & Pricing
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/Agerestraction" className="steps-link active">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-04.svg" className="me-2" />
                  Age Restriction
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
            <li className="steps-item">
              <Link href="/Gallery" className="steps-link">
                <span className="steps-text">
                  <img src="/img/org-img/step-icon-01.svg" className="me-2" />
                  Gallery
                </span>
                <span className="steps-arrow">
                  <img src="/img/Arrow-Right.svg" className="ms-3" />
                </span>
              </Link>
            </li>
          </ul>
          <Form className="row">
            <div className="event-form-card">
              <Row>
                <Col md={12}>
                  <div className="event-frm-bx d-flex justify-content-between align-items-center">
                    <div>
                      <label className="form-label mb-0">
                        Access & Privacy
                      </label>
                      <p className="text-white small mb-0">
                        Only People with the link can view
                      </p>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="accessAndPrivacy"
                        checked={eventData.accessAndPrivacy}
                        onChange={handleToggleChange}
                        style={{ width: "3em", height: "1.5em" }}
                      />
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <hr className="my-4" style={{ borderColor: "#333" }} />
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">Age Restriction</label>
                    <div className="d-flex gap-3 mb-4">
                      <button
                        type="button"
                        className={`custom-btn ${eventData.ageRestriction?.type === "ALL_AGES" ? "" : "outline-btn"}`}
                        onClick={() => handleAgeTypeChange("ALL_AGES")}
                        style={{ minWidth: "100px" }}
                      >
                        All Ages
                      </button>
                      <button
                        type="button"
                        className={`custom-btn ${eventData.ageRestriction?.type === "MIN_AGE" && eventData.ageRestriction?.minAge === 18 ? "" : "outline-btn"}`}
                        onClick={() => {
                          updateEventData({
                            ageRestriction: { type: "MIN_AGE", minAge: 18 },
                          });
                        }}
                        style={{ minWidth: "100px" }}
                      >
                        18+
                      </button>
                      <button
                        type="button"
                        className={`custom-btn ${eventData.ageRestriction?.type === "MIN_AGE" && eventData.ageRestriction?.minAge === 21 ? "" : "outline-btn"}`}
                        onClick={() => {
                          updateEventData({
                            ageRestriction: { type: "MIN_AGE", minAge: 21 },
                          });
                        }}
                        style={{ minWidth: "100px" }}
                      >
                        21+
                      </button>
                      <button
                        type="button"
                        className={`custom-btn ${eventData.ageRestriction?.type === "RANGE" ? "" : "outline-btn"}`}
                        onClick={() => {
                          handleAgeTypeChange("RANGE");
                          if (!eventData.ageRestriction.maxAge) {
                            updateEventData({
                              ageRestriction: {
                                ...eventData.ageRestriction,
                                type: "RANGE",
                                minAge: 18,
                                maxAge: 60,
                              },
                            });
                          }
                        }}
                        style={{ minWidth: "100px" }}
                      >
                        Range
                      </button>
                    </div>

                    {/* Single Slider for Custom Min Age */}
                    {eventData.ageRestriction?.type === "MIN_AGE" && (
                      <div className="mt-3">
                        <label className="form-label small text-white">
                          Minimum Age: {eventData.ageRestriction.minAge}
                        </label>
                        <input
                          type="range"
                          className="form-range"
                          min="0"
                          max="100"
                          value={eventData.ageRestriction.minAge}
                          onChange={handleMinAgeChange}
                        />
                      </div>
                    )}

                    {/* Dual Inputs/Sliders for Range */}
                    {eventData.ageRestriction?.type === "RANGE" && (
                      <div className="mt-3">
                        <Row>
                          <Col md={6}>
                            <label className="form-label small text-white">
                              Min Age: {eventData.ageRestriction.minAge}
                            </label>
                            <input
                              type="range"
                              className="form-range"
                              min="0"
                              max="100"
                              value={eventData.ageRestriction.minAge}
                              onChange={handleMinAgeChange}
                            />
                          </Col>
                          <Col md={6}>
                            <label className="form-label small text-white">
                              Max Age: {eventData.ageRestriction.maxAge}
                            </label>
                            <input
                              type="range"
                              className="form-range"
                              min="0"
                              max="100"
                              value={eventData.ageRestriction.maxAge}
                              onChange={handleMaxAgeChange}
                            />
                          </Col>
                        </Row>
                      </div>
                    )}
                  </div>
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx">
                    <label className="form-label">Dress Code / Notes</label>
                    <textarea
                      className="form-control"
                      name="dressCode"
                      value={eventData.dressCode}
                      onChange={handleDressCodeChange}
                      placeholder="e.g. Black tie only. No outside food or drinks allowed Doors close at 10 PM sharp..."
                      rows={4}
                    ></textarea>
                  </div>
                </Col>

                <Col md={12}>
                  <hr className="my-4" style={{ borderColor: "#333" }} />
                </Col>

                <Col md={12}>
                  <div className="event-frm-bx d-flex justify-content-between align-items-center">
                    <div>
                      <label className="form-label mb-0">Feature Event</label>
                      <p className="text-white small mb-0">
                        Boost visibility on the homepage for $
                        {featureFee.toFixed(2)}
                      </p>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="fetcherEvent"
                        checked={eventData.fetcherEvent}
                        onChange={handleToggleChange}
                        style={{ width: "3em", height: "1.5em" }}
                      />
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <Link href="/TicketsPricing" className="outline-btn">
                  Back
                </Link>
                <button
                  type="button"
                  onClick={handleNext}
                  className="custom-btn"
                >
                  Save and Continue
                </button>
              </div>
            </div>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default page;
