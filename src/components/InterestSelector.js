import React, { useState } from "react";
import {
  Mic,
  Activity,
  Disc,
  Wind,
  Music,
  Footprints,
  Palette,
  Gamepad2,
  Waves,
  Camera,
  Utensils,
} from "lucide-react";

const InterestSelector = () => {
  const [data, setData] = useState([
    {
      id: 1,
      label: "Karaoke",
      image: "/img/insterest_icon01.svg",
      active: true,
    },
    { id: 2, label: "Yoga", image: "/img/insterest_icon02.svg", active: false },
    {
      id: 3,
      label: "Tennis",
      image: "/img/insterest_icon03.svg",
      active: false,
    },
    {
      id: 4,
      label: "Extreme",
      image: "/img/insterest_icon04.svg",
      active: true,
    },
    { id: 5, label: "Music", image: "/img/insterest_icon05.svg", active: true },
    { id: 6, label: "Run", image: "/img/insterest_icon06.svg", active: false },
    { id: 7, label: "Art", image: "/img/insterest_icon07.svg", active: false },
    {
      id: 8,
      label: "Games",
      image: "/img/insterest_icon08.svg",
      active: false,
    },
    {
      id: 9,
      label: "Swimming",
      image: "/img/insterest_icon09.svg",
      active: false,
    },
    {
      id: 10,
      label: "Photography",
      image: "/img/insterest_icon10.svg",
      active: false,
    },
    {
      id: 11,
      label: "Cooking",
      image: "/img/insterest_icon11.svg",
      active: false,
    },
  ]);

  const toggleBtn = (id) => {
    setData(
      data.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item,
      ),
    );
  };

  return (
    <div className="interest-container">
      {data.map((item) => (
        <div
          key={item.id}
          onClick={() => toggleBtn(item.id)}
          className={`chip ${item.active ? "selected" : ""}`}>
          {/* Agar image hai toh image dikhao, nahi toh icon */}
          <span className="icon">
            {item.image ? (
              <img
                src={item.image}
                alt={item.label}
                style={{ width: "24px", height: "24px" }}
              />
            ) : (
              item.icon
            )}
          </span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default InterestSelector;
