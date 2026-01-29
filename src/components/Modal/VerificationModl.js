"use client";
import Link from "next/link";
import React from "react";
import Modal from "react-bootstrap/Modal";

export default function VerificationModl(props) {
  return (
    <>
      <Modal
        show={props.show}
        onHide={props.onHide}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        className="common_modal gradientsSc">
        <Modal.Header closeButton />
        <Modal.Body>
          <div className="modal_box">
            <div className="img_box">
              <img src="/img/Success.svg" />
            </div>
            <div className="modal_title addto_list text-center mb-4">
              <h3>Admin Verification Required</h3>
              <p>
                All submitted business details will be verified by the admin.
                Approval or rejection will be provided after review.
              </p>
            </div>
            <div className="align_btn mt-5">
              <Link href="/" className="common_btn">
                Go to Home
              </Link>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
