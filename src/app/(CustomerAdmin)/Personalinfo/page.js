"use client";

import React, { useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function page() {
  const [value, setValue] = useState();
  return (
    <div>
      <div className="cards">
        <Form>
          <div className="personal-profile">
            <div className="personal-profile-lft">
              <div className="personal-profile-img">
                <img src="/img/avtar.png" alt="Profile" />
              </div>
              <div className="personal-profile-info">
                <h4>Hey Negar!</h4>
                <p>Negarkhosravii@yahoo.com</p>
              </div>
            </div>
            <div className="personal-profile-rgt">
              <button className="edit-profile-btn" type="button">
                <img src="/img/edit-icon.svg" alt="Edit" />
                <span>Edit</span>
              </button>
            </div>
          </div>
          <Row>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  value="Negar"
                />
                <label htmlFor="firstName">First Name</label>
                <span className="form-icon">
                  <img src="/img/form-user.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control "
                  id="lastName"
                  value="Khosravii"
                />
                <label htmlFor="lastName">Last Name</label>
                <span className="form-icon">
                  <img src="/img/form-user.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control "
                  id="email"
                  value="Negarkhosravii@yahoo.com"
                />
                <label htmlFor="email">Email</label>
                <span className="form-icon">
                  <img src="/img/form-email.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <select className="form-select" id="state" aria-label="State">
                  <option value="" selected="" disabled="" hidden="" />
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                </select>
                <label htmlFor="state">State</label>
                <span className="form-icon">
                  <img src="/img/form-globe.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control "
                  id="city"
                  value="City"
                />
                <label htmlFor="city">City</label>
                <span className="form-icon">
                  <img src="/img/form-mark.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input type="date" className="form-control " id="dob" />
                <label htmlFor="dob">Date of birth</label>
                <span className="form-icon">
                  <img src="/img/form-calendar.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className="custom-tel-input custom-floting">
                <PhoneInput
                  defaultCountry="US"
                  international
                  countryCallingCodeEditable={false}
                  value={value}
                  onChange={setValue}
                />
              </div>
            </Col>
            <Col md={6}>
              <div className="form-floating custom-floting">
                <input
                  type="text"
                  className="form-control "
                  id="zipcode"
                  value="90001"
                />
                <label htmlFor="zipcode">Zip code</label>
                <span className="form-icon">
                  <img src="/img/form-has.svg" alt="" />
                </span>
              </div>
            </Col>
            <Col md={12}>
              <div className="d-flex gap-2 justify-content-end mt-2">
                <button className="outline-btn" type="button">
                  Discard
                </button>
                <button className="custom-btn" type="button">
                  Save Changes
                </button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}
