"use client";
import { useState } from "react";

const data = [
  { label: "18-24", percent: 28, count: 1134 },
  { label: "25-29", percent: 32.0, count: 1296 },
  { label: "30-34", percent: 20.0, count: 810 },
  { label: "35-44", percent: 14, count: 567 },
  { label: "44+", percent: 6.0, count: 243 },
];
const AttendeeChart = () => {
  const [gender, setGender] = useState(false);
  return (
    <div className="attendee-card analytics-chart">
      <div className=" d-flex justify-content-between mb-3">
        <h4>Attendee insights with Age</h4>
        <div className="gender-toggle">
          <span className={!gender ? "active-label" : ""}></span>

          <label className="switch">
            <input
              type="checkbox"
              checked={gender}
              onChange={() => setGender(!gender)}
            />
            <span className="slider"></span>
          </label>

          <span className={gender ? "active-label" : ""}></span>
          <strong>{gender ? "Female" : "Male"}</strong>
        </div>
      </div>

      {data.map((item) => (
        <div className="age-row" key={item.label}>
          <div className="text-end">
            <div className="age-value">
              {item.percent}% ({item.count.toLocaleString()})
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="age-label">{item.label}</div>
            <div className="bar-container">
              <div className="bar-fill" style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttendeeChart;
