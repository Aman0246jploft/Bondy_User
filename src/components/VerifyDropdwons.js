"use client";
import React, { useState } from 'react';

const VerifyDropdwons = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="verified-wrapper">
      {/* Clickable Icon */}
      <div className="verified-trigger" onClick={() => setIsOpen(!isOpen)}>
        <img src="/img/veriy_icon.svg" />
      </div>

     
      {isOpen && (
        <div className="verified-dropdown">
          <div className="verified-header">
            <div className="verified-icon-box">
             <img src="/img/shield.svg" />
            </div>
            <div>
              <h3 className="verified-title-main">Verified Organizer</h3>
              <p className="verified-name">Esther Howard</p>
              <p className="verified-date">Verified on: Jan 2024</p>
            </div>
          </div>

          <div className="verified-divider"></div>

          <h4 className="verified-section-title">What's verified</h4>
          <ul className="verified-list">
            <li className="verified-list-item">
              <svg className="verified-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Identity verified (Gov ID checked)
            </li>
            <li className="verified-list-item">
              <svg className="verified-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Contact verified (Phone email)
            </li>
            <li className="verified-list-item">
              <svg className="verified-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Payout verified (Bank/QPay merchant linked)
            </li>
            <li className="verified-list-item">
              <svg className="verified-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Business verified
            </li>
          </ul>

          <div className="verified-divider"></div>

          <p className="verified-footer">
            Verified doesn't guarantee event quality or that changes won't happen.
          </p>
        </div>
      )}
    </div>
  );
};

export default VerifyDropdwons;