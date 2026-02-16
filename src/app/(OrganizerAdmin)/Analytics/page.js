"use client";
import React, { useState } from "react";
import { useRef } from "react";
import { Col, Row } from "react-bootstrap";
import RevenueChart from "../Components/RevenueChart";
import AttendeeChart from "../Components/AttendeeChart";
import AttendeeTable from "../Components/AttendeeTable";
import ProgramPerformance from "../Components/ProgramPerformance";
const categories = ["All", "Upcoming", "Ended"];
function page() {
  const [selected, setSelected] = useState(["All"]);

  const handleToggle = (category) => {
    if (selected.includes(category)) {
      setSelected(selected.filter((item) => item !== category));
    } else {
      setSelected([...selected, category]);
    }
  };
  const inputRef = useRef(null);
  return (
    <div>
      <div className="cards dashboard-home">
        <div className="card-header">
          <div>
            <h2 className="card-title">Analytics</h2>
          </div>
          <div className="dashboard-filter">
            <div className="date-input-wrapper">
              <input
                ref={inputRef}
                type="date"
                className="date-input form-control"
              />

              <span
                className="calendar-icon"
                onClick={() => inputRef.current.showPicker()}>
                <img src="/img/white-calendar.svg" alt="calendar" />
              </span>
            </div>
            <div>
              <select className="form-select">
                <option>Event type</option>
              </select>
            </div>
            <div>
              <select className="form-select">
                <option>Location</option>
              </select>
            </div>
          </div>
        </div>
        <Row>
          <Col md={3}>
            <div className="dashbord-card">
              <div>
                <h6>Impressions</h6>
                <h3>12,345</h3>
              </div>
              <img src="/img/org-img/impressions-icon.svg" />
            </div>
          </Col>
          <Col md={3}>
            <div className="dashbord-card">
              <div>
                <h6>Page Views</h6>
                <h3>6,789</h3>
              </div>
              <img src="/img/org-img/page-views-icon.svg" />
            </div>
          </Col>
          <Col md={3}>
            <div className="dashbord-card">
              <div>
                <h6>Clicks</h6>
                <h3>3,456</h3>
              </div>
              <img src="/img/org-img/click-icon.svg" />
            </div>
          </Col>
          <Col md={3}>
            <div className="dashbord-card">
              <div>
                <h6>Tickets Sold</h6>
                <h3>567</h3>
              </div>
              <img src="/img/org-img/ticket-icon.svg" />
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={3}>
            <div className="dashbord-card">
              <div>
                <h6>CTR</h6>
                <h5> 28%</h5>
              </div>
              <img src="/img/org-img/ctr-icon.svg" />
            </div>
          </Col>
          <Col md={3}>
            <div className="dashbord-card">
              <div>
                <h6>Fees</h6>
                <h5>$1,245</h5>
              </div>
              <img src="/img/org-img/fees-icon.svg" />
            </div>
          </Col>
          <Col md={3}>
            <div className="dashbord-card">
              <div>
                <h6>Net Payout</h6>
                <h5>$18,500</h5>
              </div>
              <img src="/img/org-img/payout-icon.svg" />
            </div>
          </Col>
          <Col md={3}>
            <div className="dashbord-card">
              <div>
                <h6>Gross Sales</h6>
                <h5>$17,255</h5>
              </div>
              <img src="/img/org-img/sales-icon.svg" />
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={7}>
            <RevenueChart />
          </Col>
          <Col md={5}>
            <AttendeeChart />
          </Col>
        </Row>
        <div className="custom-table-cards">
          <div className="card-header">
            <div className="d-flex gap-3">
              <h5 className="table-title">Program Performance</h5>
              <div className="MUiltiSelect m-0 w-auto">
                {categories.map((item) => (
                  <div key={item} className="d-inline-block me-2">
                    <input
                      type="checkbox"
                      id={`chk-${item}`}
                      className="category-checkbox"
                      checked={selected.includes(item)}
                      onChange={() => handleToggle(item)}
                    />
                    <label htmlFor={`chk-${item}`} className="category-label">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="dashboard-filter">
              <div className="date-input-wrapper">
                <input
                  ref={inputRef}
                  type="date"
                  className="date-input form-control"
                />

                <span
                  className="calendar-icon"
                  onClick={() => inputRef.current.showPicker()}>
                  <img src="/img/white-calendar.svg" alt="calendar" />
                </span>
              </div>
              <div>
                <select className="form-select">
                  <option>Ticket Type</option>
                  <option>Professionals</option>
                  <option>Friend Groups</option>
                </select>
              </div>
              <div>
                <select className="form-select">
                  <option>Status</option>
                  <option>Confirm</option>
                  <option>Pending</option>
                  <option>Canceled</option>
                </select>
              </div>
            </div>
          </div>
          <ProgramPerformance />
        </div>
        <div className="custom-table-cards">
          <div className="card-header">
            <div>
              <h5 className="table-title">Attendee List</h5>
            </div>
            <div className="dashboard-filter">
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control text-white"
                  placeholder="Search by name/email"
                />
                <button
                  type="button"
                  className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent pe-2">
                  <img src="/img/org-img/search-white.svg" />
                </button>
              </div>
              <div className="date-input-wrapper">
                <input
                  ref={inputRef}
                  type="date"
                  className="date-input form-control"
                />

                <span
                  className="calendar-icon"
                  onClick={() => inputRef.current.showPicker()}>
                  <img src="/img/white-calendar.svg" alt="calendar" />
                </span>
              </div>
              <div>
                <select className="form-select">
                  <option>Ticket Type</option>
                  <option>Professionals</option>
                  <option>Friend Groups</option>
                </select>
              </div>
              <div>
                <select className="form-select">
                  <option>Status</option>
                  <option>Confirm</option>
                  <option>Pending</option>
                  <option>Canceled</option>
                </select>
              </div>
            </div>
          </div>
          <AttendeeTable />
        </div>
      </div>
    </div>
  );
}

export default page;
