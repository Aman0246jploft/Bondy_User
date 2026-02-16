import React from "react";
import { Col, Row } from "react-bootstrap";

function page() {
  return (
    <div>
      <div className="cards">
        <div className="card-header">
          <div>
            <h2 className="card-title">Promotion Packages</h2>
            <p className="card-desc">
              Boost your event's visibility with our promotion packages. Choose
              the package that best fits your needs and budget.
            </p>
          </div>
        </div>
        <h5 className="promation-title">Choose a promotion package</h5>
        <Row className="gx-5">
          <Col md={4}>
            <div className="pricing-cards">
              <div>
                <h5>Basic</h5>
                <h2>
                  ₮25,000 <span>3 days</span>
                </h2>
              </div>
              <p>
                <img src="/img/checkmark-vector.svg" className="me-3" alt="" />
                Discover Feed
              </p>
              <p>
                <img src="/img/checkmark-vector.svg" className="me-3" alt="" />
                Category Page
              </p>
              <button type="button" className="custom-btn w-100">
                Select
              </button>
            </div>
          </Col>
          <Col md={4}>
            <div className="pricing-cards">
              <div>
                <h5>Standard</h5>
                <h2>
                  ₮70,000 <span>7 days</span>
                </h2>
              </div>
              <p>
                <img src="/img/checkmark-vector.svg" className="me-3" alt="" />
                Discover Feed
              </p>
              <p>
                <img src="/img/checkmark-vector.svg" className="me-3" alt="" />
                Category Page
              </p>
              <p>
                <img src="/img/checkmark-vector.svg" className="me-3" alt="" />
                Homepage
              </p>
              <p>
                <img src="/img/checkmark-vector.svg" className="me-3" alt="" />
                Higher visibility
              </p>
              <button type="button" className="custom-btn w-100">
                Select
              </button>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default page;
