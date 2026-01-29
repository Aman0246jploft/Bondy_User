import React from 'react';

const EventGallery = () => {
  return (
    <section className=" organizations-event">
      <div className="container">
        <div className="row g-3">
          
          {/* Card 1 - Large (6 columns) */}
          <div className="col-lg-6 col-md-12">
            <div className="organizations-event-card">
              <img src="/img/Img_ev_01.png" alt="Event" className="organizations-event-img" />
              <div className="organizations-event-overlay">
                <p className="organizations-event-tag">Memorable experience</p>
                <h3 className="organizations-event-title">Unforgettable Moments at Eventive 2026</h3>
              </div>
            </div>
          </div>

          {/* Card 2 - Small (3 columns) */}
          <div className="col-lg-3 col-md-6">
            <div className="organizations-event-card">
              <img src="/img/Img_ev_02.png" alt="Event" className="organizations-event-img" />
              <div className="organizations-event-overlay">
                <p className="organizations-event-tag">Skilled Speakers</p>
                <h3 className="organizations-event-title">Storytelling Festival</h3>
              </div>
            </div>
          </div>

          {/* Card 3 - Small (3 columns) */}
          <div className="col-lg-3 col-md-6">
            <div className="organizations-event-card">
              <img src="/img/Img_ev_03.png" alt="Event" className="organizations-event-img" />
              <div className="organizations-event-overlay">
                <p className="organizations-event-tag">Community Build</p>
                <h3 className="organizations-event-title">Build Networking</h3>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default EventGallery;