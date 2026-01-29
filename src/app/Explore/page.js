"use client";
import React, { useState } from "react";
import Header from "../../components/Header";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Col, Container, Row, Nav, Tab } from "react-bootstrap";
import ExploreItem from "@/components/ExploreItem";

// Filter Categories
const categories = [
  "Business",
  "Social Activities",
  "Hobbies",
  "Sports",
  "Travel",
];

export default function Page() {
  const [selected, setSelected] = useState(["Business"]);

  const handleToggle = (category) => {
    if (selected.includes(category)) {
      setSelected(selected.filter((item) => item !== category));
    } else {
      setSelected([...selected, category]);
    }
  };

  return (
    <>
      <div className="listing_page">
        <Header />
        <div className="breadcrumb_text text-center py-5">
          <h1>Explore</h1>
          <p>"A Night to Remember: Adele Live with Her Greatest Hits " 🎶✨</p>
        </div>
      </div>

      <div className="listing_bannr_field">
        <Container>
          {/* Search Field Component */}
          <Field />

          {/* Categories/Multi-Select Filters */}
          <div className="MUiltiSelect mb-4">
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

          {/* Tabs Section */}
          <div className="eventExplore">
            {/* defaultActiveKey ko "Events" rakha hai taaki pehla tab active dikhe */}
            <Tab.Container id="explore-tabs" defaultActiveKey="Events">
              <Row>
                <Col sm={12} className="mb-4">
                  <Nav variant="pills" className="custom-nav-pills">
                    <Nav.Item>
                      <Nav.Link eventKey="Events">Events</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="Program">Program</Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col>

                <Col sm={12}>
                  <Tab.Content>
                    <Tab.Pane eventKey="Events">
                      <ExploreItem />
                    </Tab.Pane>
                    <Tab.Pane eventKey="Program">
                      <ExploreItem />
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </div>
        </Container>
      </div>

      <FAQ />
      <Footer />
    </>
  );
}
