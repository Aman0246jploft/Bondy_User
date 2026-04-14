'use client'
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import FAQ from "../../components/FAQ";
import Footer from "../../components/Footer";
import Field from "../../components/Field";
import { Col, Container, Row, Nav, Tab } from "react-bootstrap";
import ExploreItem from "@/components/ExploreItem";
import categoryApi from "@/api/categoryApi";
import { useLanguage } from "@/context/LanguageContext";

function ExploreContent() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("Events");
  const [activeFilter, setActiveFilter] = useState("upcoming");
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({});

  useEffect(() => {
    document.title = `${t("explorePageTitle")} | Bondy`;
  }, [t]);

  const fetchCategories = async (type) => {
    try {
      setLoading(true);
      const apiType = type === "Events" ? "event" : "course";
      const response = await categoryApi.getCategories({
        type: apiType,
        limit: 10000,
      });

      if (response?.data?.categories) {
        setCategories(response?.data?.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchParams_url = useSearchParams();

  useEffect(() => {
    const search = searchParams_url.get("search") || "";
    const lat = searchParams_url.get("latitude");
    const lng = searchParams_url.get("longitude");
    const filter = searchParams_url.get("filter") || "upcoming";
    const date = searchParams_url.get("date");

    const newParams = { ...searchParams };
    if (search) newParams.search = search;
    if (lat && lng) {
      newParams.latitude = lat;
      newParams.longitude = lng;
    }
    if (date) newParams.date = date;

    setSearchParams(newParams);
    setActiveFilter(filter);
  }, [searchParams_url]);

  useEffect(() => {
    fetchCategories(activeTab);
    setSelected([]);
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

  const handleSearch = (params) => {
    setSearchParams(params);
    if (params.filter && params.filter !== "all") {
      setActiveFilter(params.filter);
    }
  };

  return (
    <>
      <div className="listing_page">
        <Header />
        <div className="breadcrumb_text text-center py-5">
          <h1>{t("explorePageTitle")}</h1>
          <p>{t("explorePageSubtitle")}</p>
        </div>
      </div>
 
      <div className="listing_bannr_field">
        <Container>
          {/* Search Field Component */}
          <Field
            onSearch={handleSearch}
            label={activeTab === "Events" ? <small>{t("eventcategory")}</small> : <small>{t("courseCategory")}</small>}
            placeholder={activeTab === "Events" ? "e.g. music festival" : "e.g. guitar course"}
          />

          {/* Categories/Multi-Select Filters */}
          <div className="MUiltiSelect mb-4">
            {loading ? (
              <div>{t("loadingCategories")}</div>
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
              <div>{t("noCategoriesFound")}</div>
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
                      <Nav.Link eventKey="Events">{t("eventsTab")}</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="Program">{t("programTab")}</Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col>

                <Col sm={12}>
                  <Tab.Content>
                    <Tab.Pane eventKey="Events">
                      <ExploreItem
                        type="Events"
                        placement="explorePage"
                        filter={activeFilter}
                        onFilterChange={setActiveFilter}
                        categoryId={selected.join(",")}
                        search={searchParams.search}
                        latitude={searchParams.latitude}
                        longitude={searchParams.longitude}
                        date={searchParams.date}
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="Program">
                      <ExploreItem
                        type="Program"
                        filter={activeFilter}
                        onFilterChange={setActiveFilter}
                        categoryId={selected.join(",")}
                        search={searchParams.search}
                        latitude={searchParams.latitude}
                        longitude={searchParams.longitude}
                        date={searchParams.date}
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

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}

