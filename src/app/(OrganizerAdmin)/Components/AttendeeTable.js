import Link from "next/link";

const rows = [
  {
    name: "Sophia Clark",
    ticket: "Professionals",
    organizer: "Eventful Gatherings",
    date: "2024-07-20",
    status: "complete",
  },
  {
    name: "Ethan Bennett",
    ticket: "Friend Groups",
    organizer: "City Events Co.",
    date: "2024-07-20",
    status: "pending",
  },
  {
    name: "Olivia Hayes",
    ticket: "Friend Groups",
    organizer: "Eventful Gatherings",
    date: "2024-07-20",
    status: "cancel",
  },
  {
    name: "Liam Carter",
    ticket: "Friend Groups",
    organizer: "City Events Co.",
    date: "2024-07-20",
    status: "complete",
  },
  {
    name: "Ava Foster",
    ticket: "Professionals",
    organizer: "Eventful Gatherings",
    date: "2024-07-20",
    status: "cancel",
  },
];

const statusText = {
  complete: "Confirm",
  pending: "Pending",
  cancel: "Canceled",
};

export default function AttendeeTable() {
  return (
    <div className="table table-responsive custom-table-wrapper">
      <table className="table mb-0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Ticket Type</th>
            <th>Program Name</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>{row.name}</td>
              <td>{row.ticket}</td>
              <td>{row.organizer}</td>
              <td>{row.date}</td>
              <td>
                <span className={`status-badge ${row.status}`}>
                  {statusText[row.status]}
                </span>
              </td>
              <td>
                <Link href="/UserDetails" className="common_btn">
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
