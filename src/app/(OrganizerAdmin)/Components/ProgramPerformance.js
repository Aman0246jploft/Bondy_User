import Link from "next/link";

const rows = [
  {
    img: "/img/details_img01.png",
    event: "Yoga Flow - Beginner",
    type: "Event",
    views: "2.1K",
    ticketssold: "235",
    beveirce: "$4,112",
  },
  {
    img: "/img/details_img02.png",
    event: "Photography Basics Workshop",
    type: "Course",
    views: "1.5K",
    ticketssold: "178",
    beveirce: "$5,340",
  },
  {
    img: "/img/details_img03.png",
    event: "Intro to Coding Bootcamp",
    type: "Workshop",
    views: "2.1K",
    ticketssold: "235",
    beveirce: "$4,112",
  },
  {
    img: "/img/details_img04.png",
    event: "Yoga Flow - Beginner",
    type: "Event",
    views: "2.1K",
    ticketssold: "235",
    beveirce: "$4,112",
  },
  {
    img: "/img/details_img05.png",
    event: "Intro to Coding Bootcamp",
    type: "Workshop",
    views: "2.1K",
    ticketssold: "235",
    beveirce: "$4,112",
  },
];

const statusText = {
  complete: "Confirm",
  pending: "Pending",
  cancel: "Canceled",
};

export default function ProgramPerformance() {
  return (
    <div className="table table-responsive custom-table-wrapper">
      <table className="table mb-0">
        <thead>
          <tr>
            <th>Event</th>
            <th>Type</th>
            <th>Views</th>
            <th>Tickets Sold</th>
            <th>Beveirce</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>
                <img
                  src={row.img}
                  alt={row.name}
                  style={{
                    borderRadius: "10px",
                    width: "100px",
                    height: "80px",
                    objectFit: "cover",
                    marginRight: "12px",
                  }}
                />
                {row.event}
              </td>
              <td>{row.type}</td>
              <td>{row.views}</td>
              <td>{row.ticketssold}</td>
              <td>{row.beveirce}</td>
              <td>
                <Link href="/EventDetails" className="common_btn">
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
