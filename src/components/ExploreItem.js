import Link from 'next/link';
import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const categories = [
  "Upcoming",
  "Today",
  "This Weekend",
  "Next Week"
];

export default function ExploreItem() {
  const [selected, setSelected] = useState(["Upcoming"]);

  // 10 Cards ka Dummy Data
  const eventsData = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: i === 0 ? "AI & Machine Learning Summit 2026" : `Tech Innovation Event ${i + 1}`,
    description: "Join industry leaders to explore the latest advances in artificial intelligence, machine learning, and data science applications.",
    location: "San Francisco, CA",
    date: "March 15-17, 2026",
    attendees: "2,845 attendees registered",
    image: "/img/image_explore.png"
  }));

  const handleToggle = (category) => {
    if (selected.includes(category)) {
      setSelected(selected.filter(item => item !== category));
    } else {
      setSelected([...selected, category]);
    }
  };

  return (
    <div className="Explore_sec"> 
      <Container className='p-0'>
        
        {/* Multi-Select Filters */}
        <div className="MUiltiSelect upcoming_sc w-100 mb-4">
          {categories.map((item) => (
            <div key={item}>
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

        {/* 10 Events List Rendering */}
        {eventsData.map((event) => (
         
         <Link href="/eventDetails" > 
         <div className="featured-card mb-4" key={event.id}>
            <Row className="g-0 align-items-center">
              <Col md={5}>
                <div className="img-box">
                  <span className="event-badge">Featured Event</span>
                  <img
                    src={event.image}
                    alt={event.title}
                    className="featured-img"
                  />
                </div>
              </Col>

              <Col md={7}>
                <div className="content-box">
                  <h2 className="title">{event.title}</h2>
                  <p className="description">{event.description}</p>

                  <div className="info-list">
                    <div className="info-item">
                      <img src="/img/locationEX_icon.svg" className='info-icon' alt="icon" /> 
                      {event.location}
                    </div>
                    <div className="info-item">
                      <img src="/img/DateEX_icon.svg" className='info-icon' alt="icon" /> 
                      {event.date}
                    </div>
                    <div className="info-item">
                      <img src="/img/UserEX_icon.svg" className='info-icon' alt="icon" /> 
                      {event.attendees}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
          </Link>

        ))}

      </Container>
    </div>
  );
}