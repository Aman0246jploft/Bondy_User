import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import eventApi from "@/api/eventApi";
import courseApi from "@/api/courseApi";
import ProgramCart from './ProgramCart';
import PaginationComponent from './PaginationComponent';

const categories = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "Next Week", value: "nextWeek" }
];

export default function ExploreItem({ type = "Events", filter = "upcoming", onFilterChange, categoryId, search, latitude, longitude, date, placement }) {
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    // Reset to page 1 if type, filter, category, or search params change
    setCurrentPage(1);
  }, [type, filter, categoryId, search, latitude, longitude, date, placement]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        let response;
        if (type === "Events") {
          response = await eventApi.getEvents({
            filter: filter,
            limit: limit,
            page: currentPage,
            categoryId: categoryId,
            search: search,
            latitude: latitude,
            longitude: longitude,
            date: date,
            placement: placement
          });
          const eventData = response?.data?.data || response?.data || response;
          if (eventData?.events) {
            setItems(eventData.events);
            // Calculate totalPages for events: data.total / data.limit
            const tPages = eventData.totalPages || (eventData.total ? Math.ceil(eventData.total / (eventData.limit || limit)) : 1);
            setTotalPages(tPages);
          } else {
            setItems([]);
            setTotalPages(1);
          }
        } else if (type === "Program") {
          response = await courseApi.getCourses({
            filter: filter,
            limit: limit,
            page: currentPage,
            categoryId: categoryId,
            search: search,
            latitude: latitude,
            longitude: longitude,
            date: date
          });
          const courseData = response?.data?.data || response?.data || response;
          if (courseData?.courses) {
            setItems(courseData.courses);
            setTotalPages(courseData.totalPages || 1);
          } else {
            setItems([]);
            setTotalPages(1);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setItems([]);
        setTotalPages(1);
      }
    };

    fetchItems();
  }, [filter, type, categoryId, currentPage, limit, search, latitude, longitude, date, placement]);

  const handleToggle = (value) => {
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="Explore_sec">
      <Container className='p-0'>

        {/* Multi-Select Filters */}
        <div className="MUiltiSelect upcoming_sc w-100 mb-4">
          {categories.map((item) => (
            <div key={item.value}>
              <input
                type="checkbox"
                id={`chk-${item.value}`}
                className="category-checkbox"
                checked={filter === item.value}
                onChange={() => handleToggle(item.value)}
              />
              <label htmlFor={`chk-${item.value}`} className="category-label">
                {item.label}
              </label>
            </div>
          ))}
        </div>

        {/* List Rendering */}
        {items.length > 0 ? (
          <>
            {items.map((item) => {
              const isEvent = type === "Events";
              const linkHref = isEvent
                ? `/eventDetails?id=${item._id}`
                : `/programDetails?id=${item._id}`;
              const image = isEvent
                ? (item.posterImage?.[0] || "/img/image_explore.png")
                : (item.posterImage?.[0] || "/img/image_explore.png");
              const title = isEvent ? item.eventTitle : item.courseTitle;
              const description = item.shortdesc || item.description;

              return (
                <Link href={linkHref} key={item._id}>
                  <div className="featured-card mb-4">
                    <Row className="g-0 align-items-center">
                      <Col md={5}>
                        <div className="img-box">
                          {(item.isFeatured || item.fetcherEvent) && (
                            <span className="event-badge">Featured {isEvent ? "Event" : "Course"}</span>
                          )}
                          <img
                            src={image}
                            alt={title}
                            className="featured-img"
                          />
                        </div>
                      </Col>

                      <Col md={7}>
                        <div className="content-box">
                          <h2 className="title"
                            title={title}
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-word'
                            }}
                          >
                            {title}
                          </h2>
                          <p className="description"
                            title={description}
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-word',
                              minHeight: '3em'
                            }}
                          >
                            {description}
                          </p>

                          <div className="info-list">
                            <div className="info-item" title={item.venueAddress?.city} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--white, #fff)' }}>
                              <img src="/img/locationEX_icon.svg" className='info-icon' alt="icon" />
                              {item.venueAddress?.city || "Location not available"}
                            </div>
                            <div className="info-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--white, #fff)' }}>
                              <img src="/img/DateEX_icon.svg" className='info-icon' alt="icon" />
                              {isEvent
                                ? new Date(item.startDate).toLocaleDateString()
                                : (item.currentSchedule ? new Date(item.currentSchedule.startDate).toLocaleDateString() : "Date N/A")
                              }
                            </div>
                            <div className="info-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--white, #fff)' }}>
                              <img src="/img/UserEX_icon.svg" className='info-icon' alt="icon" />
                              {isEvent ? item.totalAttendees : item.acquiredSeats || 0} attendees
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Link>
              );
            })}

            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center py-5">
            <h4>No {type.toLowerCase()} found for this filter.</h4>
          </div>
        )}

      </Container>
    </div>
  );
}
