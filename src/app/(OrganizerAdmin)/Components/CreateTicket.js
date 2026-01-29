"use client";
import React from "react";
import { Col, Form, Row } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";

export default function CreateTicket(props) {
  return (
    <>
      <Modal
        show={props.show}
        onHide={props.onHide}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        className="common_modal gradientsSc create-ticket-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Tickets</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={12}>
                <div className="event-frm-bx">
                  <label className="form-label">Ticket Category</label>
                  <select className="form-select">
                    <option>Payment</option>
                    <option>Account</option>
                    <option>Other</option>
                  </select>
                </div>
              </Col>
              <Col md={6}>
                <div className="event-frm-bx">
                  <label className="form-label">Subject</label>
                  <input type="text" className="form-control" />
                </div>
              </Col>
              <Col md={6}>
                <div className="event-frm-bx">
                  <label className="form-label">Priority (Optional)</label>
                  <select className="form-select">
                    <option>Open</option>
                    <option>Pending</option>
                    <option>Resolved</option>
                  </select>
                </div>
              </Col>
              <Col md={12}>
                <div className="event-frm-bx">
                  <label className="form-label">Subject</label>
                  <textarea></textarea>
                </div>
              </Col>
            </Row>
            <div className="text-center">
              <button type="button" className="custom-btn">
                Submit Ticket
              </button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}
