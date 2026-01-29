import React from "react";

const eventData = [
  {
    id: 1,
    name: "Drake",
    info: "20 June, Toronto",
    img: "https://picsum.photos/200/200?random=1",
  },
  {
    id: 2,
    name: "Taylor Swift",
    info: "10 July, Nashville",
    img: "https://picsum.photos/200/200?random=2",
  },
  {
    id: 3,
    name: "Ed Sheeran",
    info: "25 August, Los Angeles",
    img: "https://picsum.photos/200/200?random=3",
  },
  {
    id: 4,
    name: "Billie Eilish",
    info: "30 September, Chicago",
    img: "https://picsum.photos/200/200?random=4",
  },
  {
    id: 5,
    name: "Adele",
    info: "5 May, New York",
    img: "https://picsum.photos/200/200?random=5",
  },
];

const TopEvents = () => {
  const doubleData = [...eventData, ...eventData];

  return (
    <div className="events-section">
      <div className="container">
        <div className="main_title text-center">
          <h2>Top Events</h2>
          <p>
            Find the singers you're looking for quickly.{" "}
            <a href="#" className="text-theme-color text-decoration-underline">
              You can see more.
            </a>
          </p>
        </div>
      </div>

      <div className="slider-wrapper animate-left ">
        {doubleData.map((item, index) => (
          <div className="event-card" key={index}>
            <img src={item.img} alt={item.name} />
            <div>
              <h5>{item.name}</h5>
              <p>{item.info}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="slider-wrapper animate-right">
        {doubleData.map((item, index) => (
          <div className="event-card" key={index}>
            <img src={item.img} alt={item.name} />
            <div>
              <h5>{item.name}</h5>
              <p>{item.info}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopEvents;
