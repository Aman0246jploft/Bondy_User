import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import eventApi from "@/api/eventApi";
import courseApi from "@/api/courseApi";

const categories = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "Next Week", value: "nextWeek" }
];

export default function ExploreItem({ type = "Events", filter = "upcoming", onFilterChange, categoryId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        let response;
        if (type === "Events") {
          response = await eventApi.getEvents({
            filter: filter,
            limit: 10,
            categoryId: categoryId
          });
          console.log(`Events for ${filter} cat=${categoryId}:`, response?.data);
          if (response?.data?.events) {
            setItems(response.data.events);
          }
        } else if (type === "Program") {
          response = await courseApi.getCourses({
            filter: filter,
            limit: 10,
            categoryId: categoryId
          });
          console.log(`Courses for ${filter} cat=${categoryId}:`, response?.data);
          if (response?.data?.courses) {
            setItems(response.data.courses);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setItems([]);
      }
    };

    fetchItems();
  }, [filter, type, categoryId]);

  const handleToggle = (value) => {
    if (onFilterChange) {
      onFilterChange(value);
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
          items.map((item) => {
            const isEvent = type === "Events";
            const linkHref = isEvent
              ? `/eventDetails?id=${item._id}`
              : `/courseDetails?id=${item._id}`;
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
                        <span className="event-badge">Featured {isEvent ? "Event" : "Course"}</span>
                        <img
                          src={image}
                          alt={title}
                          className="featured-img"
                        />
                      </div>
                    </Col>

                    <Col md={7}>
                      <div className="content-box">
                        <h2 className="title">{title}</h2>
                        <p className="description">{description}</p>

                        <div className="info-list">
                          <div className="info-item">
                            <img src="/img/locationEX_icon.svg" className='info-icon' alt="icon" />
                            {item.venueAddress?.city || "Location not available"}
                          </div>
                          <div className="info-item">
                            <img src="/img/DateEX_icon.svg" className='info-icon' alt="icon" />
                            {isEvent
                              ? new Date(item.startDate).toLocaleDateString()
                              : (item.currentSchedule ? new Date(item.currentSchedule.startDate).toLocaleDateString() : "Date N/A")
                            }
                          </div>
                          <div className="info-item">
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
          })
        ) : (
          <div className="text-center py-5">
            <h4>No {type.toLowerCase()} found for this filter.</h4>
          </div>
        )}

      </Container>
    </div>
  );
}
