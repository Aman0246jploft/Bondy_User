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
                  <img
                    src={getFullImageUrl(program?.posterImage?.[0])}
                    alt={program?.courseTitle}
                  />
                </div>
                <div className="card-overlay">
                  <div className="overlay-content program_cart">
                    <div className="program_cart_inner">
                      <Link href="/programDetails">
                        <div className="program_cart_cntent">
                          <h4>{program?.courseTitle}</h4>
                          <span>{program?.courseCategory?.categoryName}</span>
                        </div>
                      </Link>
                      <Link href="/profile">
                        <img
                          src={getFullImageUrl(
                            program?.createdBy?.profileImage,
                          )}
                          alt="profile"
                        />
                      </Link>
                    </div>
                    <ul className="program_time">
                      <li>
                        <img src="/img/session_icon.svg" /> {program?.duration}
                      </li>
                      <li>
                        <img src="/img/time_icon.svg" />
                        {program?.schedules?.length} sessions
                      </li>

                      <li>
                        <img src="/img/0date_icon.svg" /> {program?.date}May 1 –
                        Jun 1
                      </li>
                    </ul>
                    <div className="price_align">
                      {program?.available ? (
                        <>
                          <span>{program?.price}</span>
                          <Link href="/eventbooking" className="common_btn">
                            Book Now
                          </Link>
                        </>
                      ) : (
                        <>
                          <span className="redText">Seats Full</span>
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
