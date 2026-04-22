"use client";
import React, { useEffect, useState } from "react";
import { Col, Row, Tab, Tabs, Spinner } from "react-bootstrap";
import wishlistApi from "@/api/wishlistApi";
import { getFullImageUrl } from "@/utils/imageHelper";
import { formatDate } from "@/utils/dateFormater";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { useLanguage } from "@/context/LanguageContext";

function Page() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("Event");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocs: 0,
  });

  const fetchWishlist = async (type, page = 1) => {
    setLoading(true);
    try {
      const response = await wishlistApi.getMyWishlist({
        type: type,
        page: page,
        limit: pagination.limit,
      });
      if (response && response.data) {
        setWishlistItems(response.data.docs || []);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages,
          totalDocs: response.data.totalDocs,
        });
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist(activeTab, 1);
    document.title = `${t("myFavorite")} - Bondy`;
  }, [activeTab, t]);

  const handleTabSelect = (k) => {
    setActiveTab(k);
    setWishlistItems([]); // Clear items on tab switch
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchWishlist(activeTab, newPage);
    }
  };

  const handleRemove = async (e, entityId) => {
    e.preventDefault(); // Prevent link navigation if wrapped

    try {
      const response = await wishlistApi.removeFromWishlist({ entityId });
      if (response.status) {
        toast.success(t("removedFromWishlist"));
        fetchWishlist(activeTab, pagination.page); // Refresh list
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error(t("failedToRemoveItem"));
    }
  };

  const renderCard = (item) => {
    const entity = item.entityId;
    if (!entity) return null;

    const isEvent = activeTab === "Event";
    const title = isEvent ? entity.eventTitle || entity.title : entity.courseTitle || entity.title;

    // Date Logic: Check startDate on entity (Event) or first schedule (Course)
    let date = t("dateNA");
    if (entity.startDate) {
      date = formatDate(entity.startDate);
    } else if (entity.schedules && entity.schedules.length > 0 && entity.schedules[0].startDate) {
      date = formatDate(entity.schedules[0].startDate);
    }

    const location = entity.venueAddress ? entity.venueAddress.city || entity.venueAddress.address : t("locationNA");

    const image = getFullImageUrl(
      entity.posterImage?.[0] || entity.posterImage || entity.galleryImages?.[0] || entity.image
    );
    const link = isEvent ? `/eventDetails?id=${entity._id}` : `/programDetails?id=${entity._id}`;

    return (
      <Col xl={3} lg={4} sm={6} xs={12} key={item._id}>
        <div className="event_main_cart">
          <div className="recommended-card">
            <img src={image || "/img/imageholder.png"} alt={title} />
          </div>
          <div className="card-overlay">
            <div className="overlay-content">
              <Link href={link} className="text-white text-decoration-none">
                <span className="artist-name">{title}</span>
              </Link>

              <div className="event-meta">
                <span>
                  <img src="/img/date_icon.svg" />
                  {date}
                </span>
                <span>
                  <img src="/img/loc_icon.svg" /> {location}
                </span>
              </div>

              {/* <div className="price-tag">from {price}</div> */}
            </div>
          </div>
          <button
            type="button"
            className="bookmark-btn"
            onClick={(e) => handleRemove(e, entity._id)}
            aria-label={t("removeFavoriteConfirm")}
          >
            <img src="/img/bookmark.svg" alt={t("myFavorite")} />
          </button>
        </div>
      </Col>
    );
  };

  return (
    <div className="wishlist-page">
      <div className="cards">
        <div className="card-title mb-4">
          <h3>{t("myFavorite")}</h3>
        </div>

        <Tabs
          id="wishlist-tabs"
          activeKey={activeTab}
          onSelect={handleTabSelect}
          className="mb-4 ticket-tabs wishlist-tabs"
        >
          <Tab eventKey="Event" title={t("events")}>
            {/* Content rendered below to share grid logic */}
          </Tab>
          <Tab eventKey="Course" title={t("courses")}>
            {/* Content rendered below */}
          </Tab>
        </Tabs>

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">{t("loading")}</span>
            </Spinner>
          </div>
        ) : (
          <>
            {wishlistItems.length > 0 ? (
              <Row className="gy-5">
                {wishlistItems.map(renderCard)}
              </Row>
            ) : (
              <div className="text-center my-5">
                <p>{t("noItemsFound").replace("{type}", activeTab === "Event" ? t("events") : t("courses"))}</p>
              </div>
            )}

            {/* Basic Pagination */}
            {pagination.totalPages > 1 && (
              <div className="d-flex justify-content-center mt-5">
                <button
                  className="btn btn-outline-primary me-2"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  {t("previous")}
                </button>
                <span className="align-self-center">
                  {t("pageOf").replace("{current}", pagination.page).replace("{total}", pagination.totalPages)}
                </span>
                <button
                  className="btn btn-outline-primary ms-2"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  {t("next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Page;
