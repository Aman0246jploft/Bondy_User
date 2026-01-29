"use client";
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

const reviewData = [
  {
    id: 1,
    name: "Oranngy",
    date: "30 Dec 2025 13:50",
    text: "Amazing event! Great music and vibe. Worth attending.",
    img: "/img/img_r_1.png"
  },
  {
    id: 2,
    name: "Rusnane",
    date: "29 Dec 2025 13:50",
    text: "Loved every moment! The seating and arrangement were top notch",
    img: "/img/img_r_2.png"
  },
  {
    id: 3,
    name: "Vivek M.",
    date: "19 Dec 2025 10:50",
    text: "Music was good but crowd management could be better.",
    img: "/img/img_r_3.png"
  }
];

export default function Reviews() {
  return (
    <Container className="text-white mt-5 mb-5">
     <div className='review_sec'>
         <h3 className="section-title">Reviews</h3>
      <Row>
        <Col lg={12} md={12}>
          {reviewData.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-card_inner">
                <div className="review_profile">
                  <img src={review.img} alt={review.name} className="review-avatar" />
                  <div>
                    <h6 className="review-name">{review.name}</h6>
                    <p className="review-text">{review.text}</p>
                  </div>
                </div>
                <span className="review-date">{review.date}</span>
              </div>
            </div>
          ))}

        <hr className='border_css mt-4' />
          <div className="mt-4">
            <textarea 
              className="comment-box" 
              placeholder="Comment"
            ></textarea>
            <Button className="common_btn mt-4">Add Comment</Button>
          </div>
        </Col>
      </Row>
     </div>
    </Container>
  );
}