"use client";
import Link from "next/link";
import React from "react";
import { Button } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";

export default function GiveRating(props) {
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
            <div className="modal_title addto_list text-center mb-4">
              <h3>How was your Event</h3>
              <p>Share your experience and let us know how your event went.</p>
            </div>
            <div className="rating-star">
              <Button type="button" className="rating-star-icn">
                {" "}
                <img src="/img/star-big-color.svg" />
              </Button>
              <Button type="button" className="rating-star-icn">
                {" "}
                <img src="/img/star-big-color.svg" />
              </Button>
              <Button type="button" className="rating-star-icn">
                {" "}
                <img src="/img/star-big-color.svg" />
              </Button>
              <Button type="button" className="rating-star-icn">
                {" "}
                <img src="/img/star-big-color.svg" />
              </Button>
              <Button type="button" className="rating-star-icn">
                {" "}
                <img src="/img/star-big-grey.svg" />
              </Button>
            </div>
            <textarea placeholder="Comment"></textarea>
            <div className="align_btn mt-3">
              <Link href="/" className="common_btn">
                Add Review
              </Link>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
