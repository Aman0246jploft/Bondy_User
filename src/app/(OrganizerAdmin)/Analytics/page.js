"use client";
import React, { useState } from "react";
import { useRef,useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import { useLanguage } from "@/context/LanguageContext";
import RevenueChart from "../Components/RevenueChart";
import AttendeeChart from "../Components/AttendeeChart";
import AttendeeTable from "../Components/AttendeeTable";
import ProgramPerformance from "../Components/ProgramPerformance";

function page() {
  const { t } = useLanguage();
  const categories = [t("all"), t("upcoming"), t("ended")];
  const [selected, setSelected] = useState([categories[0]]);

  const handleToggle = (category) => {
    if (selected.includes(category)) {
      setSelected(selected.filter((item) => item !== category));
    } else {
      setSelected([...selected, category]);
    }
  };
  const inputRef = useRef(null);
  
  useEffect(() => {
    document.title = "Analytics - Bondy";
  }, []);


  return (
    <div>
      <div className="cards dashboard-home">
        <div className="card-header">
          <div>
            <h2 className="card-title">{t("analytics")}</h2>
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
                <option>{t("eventType")}</option>
              </select>
            </div>
            <div>
              <select className="form-select">
                <option>{t("location")}</option>
              </select>
            </div>
          </div>
        </div>
        <Row>
          <Col lg={3} xs={6}>
            <div className="dashbord-card">
              <div>
                <h6>{t("impressions")}</h6>
                <h3>12,345</h3>
              </div>
              <img src="/img/org-img/impressions-icon.svg" />
            </div>
          </Col>
          <Col lg={3} xs={6}>
            <div className="dashbord-card">
              <div>
                <h6>{t("pageViews")}</h6>
                <h3>6,789</h3>
              </div>
              <img src="/img/org-img/page-views-icon.svg" />
            </div>
          </Col>
          <Col lg={3} xs={6}>
            <div className="dashbord-card">
              <div>
                <h6>{t("clicks")}</h6>
                <h3>3,456</h3>
              </div>
              <img src="/img/org-img/click-icon.svg" />
            </div>
          </Col>
          <Col lg={3} xs={6}>
            <div className="dashbord-card">
              <div>
                <h6>{t("ticketsSold")}</h6>
                <h3>567</h3>
              </div>
              <img src="/img/org-img/ticket-icon.svg" />
            </div>
          </Col>
        </Row>
        <Row>
          <Col lg={3} xs={6}>
            <div className="dashbord-card">
              <div>
                <h6>{t("ctr")}</h6>
                <h5> 28%</h5>
              </div>
              <img src="/img/org-img/ctr-icon.svg" />
            </div>
          </Col>
          <Col lg={3} xs={6}>
            <div className="dashbord-card">
              <div>
                <h6>{t("fees")}</h6>
                <h5>₮1,245</h5>
              </div>
              <img src="/img/org-img/fees-icon.svg" />
            </div>
          </Col>
          <Col lg={3} xs={6}>
            <div className="dashbord-card">
              <div>
                <h6>{t("netPayout")}</h6>
                <h5>₮18,500</h5>
              </div>
              <img src="/img/org-img/payout-icon.svg" />
            </div>
          </Col>
          <Col lg={3} xs={6}>
            <div className="dashbord-card">
              <div>
                <h6>{t("grossSales")}</h6>
                <h5>₮17,255</h5>
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
              <h5 className="table-title">{t("programPerformance")}</h5>
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
                  <option>{t("ticketType")}</option>
                  <option>{t("professionals") || "Professionals"}</option>
                  <option>{t("friendGroups") || "Friend Groups"}</option>
                </select>
              </div>
              <div>
                <select className="form-select">
                  <option>{t("status")}</option>
                  <option>{t("confirm")}</option>
                  <option>{t("pending")}</option>
                  <option>{t("canceled")}</option>
                </select>
              </div>
            </div>
          </div>
          <ProgramPerformance />
        </div>
        <div className="custom-table-cards">
          <div className="card-header">
            <div>
              <h5 className="table-title">{t("attendeeList")}</h5>
            </div>
            <div className="dashboard-filter">
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control text-white"
                  placeholder={t("searchByNameEmail")}
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
                  <option>{t("ticketType")}</option>
                  <option>{t("professionals") || "Professionals"}</option>
                  <option>{t("friendGroups") || "Friend Groups"}</option>
                </select>
              </div>
              <div>
                <select className="form-select">
                  <option>{t("status")}</option>
                  <option>{t("confirm")}</option>
                  <option>{t("pending")}</option>
                  <option>{t("canceled")}</option>
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
