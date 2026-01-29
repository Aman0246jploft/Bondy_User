import React from "react";

const data = [
  { label: "18-24", percent: 28, count: 1134 },
  { label: "25-29", percent: 32.0, count: 1296 },
  { label: "30-34", percent: 20.0, count: 810 },
  { label: "35-44", percent: 14, count: 567 },
  { label: "44+", percent: 6.0, count: 243 },
];
const AttendeeChart = () => {
  return (
    <div className="attendee-card analytics-chart">
      <h4>ATTENDEE AGES</h4>

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
