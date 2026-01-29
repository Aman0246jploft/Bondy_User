"use client";
import React from "react";
import Image from "next/image";
import { useState } from "react";

function page() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState({
    code: "en",
    label: "English",
    flag: "/img/usflag.svg",
  });

  const languages = [
    { code: "en", label: "English (US)", flag: "/img/usflag.svg" },
    { code: "hn", label: "Hindi", flag: "/img/india.svg" },
    { code: "de", label: "English (UK)", flag: "/img/usflag.svg" },
  ];
  return (
    <div>
      <div className="cards setting-card">
        <div className="card-title">
          <h3>Setting</h3>
        </div>
        <div className="setting-info">
          <div className="setting-info-lft">
            <h5>Event Reminders</h5>
            <p>Get notified before your event starts,so you never miss it!</p>
          </div>
          <div className="setting-info-rgt">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="eventReminders"
              />
            </div>
          </div>
        </div>
        <div className="setting-info">
          <div className="setting-info-lft">
            <h5>Exclusive Offers & Discounts</h5>
            <p>Receive special offers and discounts only available for you.</p>
          </div>
          <div className="setting-info-rgt">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="offer"
                checked
              />
            </div>
          </div>
        </div>
        <div className="setting-info">
          <div className="setting-info-lft">
            <h5>Ticket Availability Alerts</h5>
            <p>
              Get notified when tickets for your desired event are available for
              purchase.
            </p>
          </div>
          <div className="setting-info-rgt">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="availability"
              />
            </div>
          </div>
        </div>
        <div className="setting-info">
          <div className="setting-info-lft">
            <h5>Email notfications</h5>
            <p>
              Stay updated with event news and updates directly to your email.
            </p>
          </div>
          <div className="setting-info-rgt">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="notfications"
                checked
              />
            </div>
          </div>
        </div>
        <div className="language-wrapper">
          <p className="title">Select your preferred language</p>

          <div className="language-select" onClick={() => setOpen(!open)}>
            <div className="d-flex align-items-center gap-2">
              <Image src={language.flag} alt="" width={22} height={22} />
              <span>{language.label}</span>
            </div>

            <span className={`arrow ${open ? "rotate" : ""}`}>
              <img src="/img/arrow-down.svg" />
            </span>
          </div>

          {open && (
            <div className="language-dropdown">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className="language-item"
                  onClick={() => {
                    setLanguage(lang);
                    setOpen(false);
                  }}
                >
                  <img src={lang.flag} alt="" />
                  <span>{lang.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default page;
