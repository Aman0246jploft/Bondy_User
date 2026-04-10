import { formatDate } from "@/utils/dateFormater";
import { getFullImageUrl } from "@/utils/imageHelper";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";

const ProgramCart = ({ programsArray, pagination }) => {
  const [programs, setPrograms] = useState([]);
  useEffect(() => {
    setPrograms(programsArray || []);
  }, [programsArray]);

  const programss = [
    {
      id: 1,
      image: "/img/imageholder.png",
      title: "Salsa for Beginners",
      instructor: "With Marco & Elena",
      duration: "2hrs",
      sessions: "12 sessions",
      date: "May 1 – Jun 1",
      price: "$300",
      available: true,
    },
    {
      id: 2,
      image: "/img/imageholder-1.png",
      title: "Salsa for Beginners",
      instructor: "With Marco & Elena",
      duration: "2hrs",
      sessions: "12 sessions",
      date: "May 1 – Jun 1",
      available: false,
    },
    {
      id: 3,
      image: "/img/imageholder-2.png",
      title: "Salsa for Beginners",
      instructor: "With Marco & Elena",
      duration: "2hrs",
      sessions: "12 sessions",
      date: "May 1 – Jun 1",
      price: "$300",
      available: true,
    },
  ];

  return (
    <section className="recommended-section program_page">
      <div className="container">
        <Row className="gy-5">
          {programs.map((program) => (
            <Col xl={3} lg={4} md={6} key={program.id}>
              <div className="event_main_cart">
                <div className="recommended-card">
                  {program.isFeatured && (
                    <span className="event-badge">Featured</span>
                  )}
                  <img
                    src={getFullImageUrl(program?.posterImage?.[0]) || "/img/sidebar-logo.svg"}
                    alt={program?.courseTitle}
                    onError={(e) => { e.target.src = "/img/sidebar-logo.svg"; }}
                  />
                </div>
                <div className="card-overlay">
                  <div className="overlay-content program_cart">
                    <div className="program_cart_inner">
                      <Link href={`/programDetails?id=${program?._id}`}>
                        <div className="program_cart_cntent">
                          <h4
                            title={program?.courseTitle}
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-word',
                              minHeight: '2.8em' // Optional: maintain consistent height
                            }}
                          >
                            {program?.courseTitle}
                          </h4>
                          <span
                            title={program?.courseCategory?.categoryName}
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {program?.courseCategory?.categoryName}
                          </span>
                        </div>
                      </Link>
                      <Link href="/profile">
                        <img
                          src={getFullImageUrl(program?.createdBy?.profileImage) || "/img/default-user.png"}
                          alt="profile"
                          onError={(e) => { e.target.src = "/img/default-user.png"; }}
                        />
                      </Link>
                    </div>
                    <div
                      className="program_time_grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px 10px',
                        marginBottom: '15px'
                      }}
                    >
                      <div title={program?.duration} style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--white, #fff)' }}>
                        <img src="/img/session_icon.svg" style={{ width: '16px', height: '16px' }} /> {program?.duration}
                      </div>
                      <div title={`${program?.schedules?.length} sessions`} style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--white, #fff)' }}>
                        <img src="/img/time_icon.svg" style={{ width: '16px', height: '16px' }} />
                        {program?.schedules?.length} sessions
                      </div>

                      <div
                        title={`${formatDate(program?.currentSchedule?.startDate)} – ${formatDate(program?.currentSchedule?.endDate)}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          gridColumn: 'span 2',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--white, #fff)'
                        }}
                      >
                        <img src="/img/0date_icon.svg" style={{ width: '16px', height: '16px' }} />{" "}
                        {formatDate(program?.currentSchedule?.startDate)} –{" "}
                        {formatDate(program?.currentSchedule?.endDate)}
                      </div>
                    </div>
                    <div className="price_align" style={{ marginTop: 'auto' }}>
                      {!program?.currentSchedule?.isFull ? (
                        <>
                          <span style={{ fontWeight: '700' }}>${program?.price}</span>
                          <Link
                            href={
                              program?.currentSchedule?._id
                                ? `/eventbooking?id=${program._id}&scheduleId=${program.currentSchedule._id}`
                                : `/eventbooking?id=${program._id}`
                            }
                            className="common_btn"
                          >
                            Book Now
                          </Link>
                        </>
                      ) : (
                        <>
                          <span className="redText" style={{ fontWeight: '700' }}>Seats Full</span>
                          <Link href="" className="common_btn">
                            Join Waitlist
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

export default ProgramCart;
