
import React from "react";
import { Col, Row } from "react-bootstrap";

function page() {
  return (
    <div>
      <div className="cards ">
        <div className="card-title">
          <h3>My Favorites</h3>
        </div>
        <Row className="gy-5">
          <Col md={3}>
            <div className="event_main_cart">
              <div className="recommended-card">
                <img src="/img/img_01.png" alt="" />
              </div>
              <div className="card-overlay">
                <div className="overlay-content">
                  <span className="artist-name">Nora Bayes</span>

                  <div className="event-meta">
                    <span>
                      {" "}
                      <img src="/img/date_icon.svg" />
                      May 6, 2025
                    </span>
                    <span>
                      <img src="/img/loc_icon.svg" /> Hagen
                    </span>
                  </div>

                  <div className="price-tag">from $779.58</div>
                </div>
              </div>
              <span className="bookmark-btn">
                <img src="/img/bookmark.svg" />
              </span>
            </div>
          </Col>
          <Col md={3}>
            <div className="event_main_cart">
              <div className="recommended-card">
                <img src="/img/img_06.png" alt="" />
              </div>
              <div className="card-overlay">
                <div className="overlay-content">
                  <span className="artist-name">Lady A</span>

                  <div className="event-meta">
                    <span>
                      {" "}
                      <img src="/img/date_icon.svg" />
                      Aug 2, 2025
                    </span>
                    <span>
                      <img src="/img/loc_icon.svg" /> Nashville
                    </span>
                  </div>

                  <div className="price-tag">from $779.58</div>
                </div>
              </div>
              <span className="bookmark-btn">
                <img src="/img/bookmark.svg" />
              </span>
            </div>
          </Col>
          <Col md={3}>
            <div className="event_main_cart">
              <div className="recommended-card">
                <img src="/img/img_11.png" alt="" />
              </div>
              <div className="card-overlay">
                <div className="overlay-content">
                  <span className="artist-name">Joan Baez</span>

                  <div className="event-meta">
                    <span>
                      {" "}
                      <img src="/img/date_icon.svg" />
                      Dec 29, 2025
                    </span>
                    <span>
                      <img src="/img/loc_icon.svg" /> Hagen
                    </span>
                  </div>

                  <div className="price-tag">from $779.58</div>
                </div>
              </div>
              <span className="bookmark-btn">
                <img src="/img/bookmark.svg" />
              </span>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default page;
