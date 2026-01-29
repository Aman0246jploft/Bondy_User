import React from "react";

function TicketDistributionChart() {
  const total = 1240;
  const professionals = 300;
  const friendGroups = 1140;

  const radius = 90;
  const stroke = 20;
  const circumference = 2 * Math.PI * radius;

  const professionalsOffset =
    circumference - (professionals / total) * circumference;
  return (
    <div>
      <div className="analytics-chart ticket-distribution">
        <h4 className="mb-4">Ticket Distribution</h4>
        <div className="ticket-card">
          <div className="d-flex justify-content-center">
            {/* Donut */}
            <svg width="220" height="220" viewBox="0 0 220 220">
              {/* Background circle */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="#0c5c58"
                strokeWidth={stroke}
                fill="none"
              />

              {/* Friend Groups */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="#2bb7aa"
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset="0"
                strokeLinecap="butt"
                transform="rotate(-90 110 110)"
              />

              {/* Professionals */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="#0f6f69"
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={professionalsOffset}
                strokeLinecap="butt"
                transform="rotate(-90 110 110)"
              />

              {/* Center Text */}
              <text
                x="110"
                y="105"
                textAnchor="middle"
                className="ticket-total">
                1,240
              </text>
              <text
                x="110"
                y="130"
                textAnchor="middle"
                className="ticket-label">
                Total Tickets Sold
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="ticket-legend">
            <div className="legend-row">
              <div className="legend-left">
                <span
                  className="legend-dot"
                  style={{ backgroundColor: "#0f6f69" }}
                />
                Professionals
              </div>
              <div className="legend-value">300</div>
            </div>

            <div className="legend-row">
              <div className="legend-left">
                <span
                  className="legend-dot"
                  style={{ backgroundColor: "#2bb7aa" }}
                />
                Friend Groups
              </div>
              <div className="legend-value">1,140</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDistributionChart;
