"use client";
import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Col, Container, Row, Nav, Tab } from "react-bootstrap";
import ExploreItem from "@/components/ExploreItem";
import categoryApi from "@/api/categoryApi";

export default function Page() {
  const [selected, setSelected] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("Events");
  const [activeFilter, setActiveFilter] = useState("upcoming");
  const [loading, setLoading] = useState(false);

  const fetchCategories = async (type) => {
    try {
      setLoading(true);
      const apiType = type === "Events" ? "event" : "course";
      const response = await categoryApi.getCategories({
        type: apiType,
        limit: 10000,
      });

      if (response?.data?.categories) {
        setCategories(response.data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(activeTab);
    setSelected([]); // Reset selection on tab switch
  }, [activeTab]);

  const handleToggle = (categoryId) => {
    if (selected.includes(categoryId)) {
      setSelected(selected.filter((item) => item !== categoryId));
    } else {
      setSelected([...selected, categoryId]);
    }
  };

  const handleTabSelect = (key) => {
    if (key) {
      setActiveTab(key);
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
            {loading ? (
              <div>Loading categories...</div>
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat._id} className="d-inline-block me-2">
                  <input
                    type="checkbox"
                    id={`chk-${cat._id}`}
                    className="category-checkbox"
                    checked={selected.includes(cat._id)}
                    onChange={() => handleToggle(cat._id)}
                  />
                  <label htmlFor={`chk-${cat._id}`} className="category-label">
                    {cat.name}
                  </label>
                </div>
              ))
            ) : (
              <div>No categories found</div>
            )}
          </div>

          {/* Tabs Section */}
          <div className="eventExplore">
            <Tab.Container
              id="explore-tabs"
              defaultActiveKey="Events"
              activeKey={activeTab}
              onSelect={handleTabSelect}
            >
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
                      <ExploreItem
                        type="Events"
                        filter={activeFilter}
                        onFilterChange={setActiveFilter}
                        categoryId={selected.join(",")}
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="Program">
                      <ExploreItem
                        type="Program"
                        filter={activeFilter}
                        onFilterChange={setActiveFilter}
                        categoryId={selected.join(",")}
                      />
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
