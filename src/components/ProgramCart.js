import Link from "next/link";
import React from "react";
import { Col, Row } from "react-bootstrap";

const ProgramCart = () => {
    return (
        <section className="recommended-section program_page">
            <div className="container">

                <Row className="gy-5">
                    <Col xl={3} lg={4} md={6} >
                        <div className="event_main_cart">
                            <div className="recommended-card">
                                <img src="/img/imageholder.png" alt="Nora Bayes" />
                            </div>

                            <div className="card-overlay">
                                <div className="overlay-content program_cart">
                                    <div className="program_cart_inner">
                                        <Link href="/programDetails">
                                            <div className="program_cart_cntent">
                                                <h4>Salsa for Beginners</h4>
                                                <span>With Marco & Elena</span>
                                            </div>
                                        </Link>
                                       <Link href="/profile"> <img src="/img/prfl.png" /></Link>
                                    </div>
                                    <ul className="program_time">
                                        <li><img src="/img/session_icon.svg" />2hrs</li>
                                        <li><img src="/img/time_icon.svg" />12 sessions</li>
                                        <li><img src="/img/0date_icon.svg" />May 1 – Jun 1</li>
                                    </ul>

                                    <div className="price_align">
                                        <span>$300</span>
                                        <Link href="/eventbooking" className="common_btn" >Book Now</Link>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </Col>
                    <Col xl={3} lg={4} md={6} >
                        <div className="event_main_cart">
                            <div className="recommended-card">
                                <img src="/img/imageholder-1.png" alt="Nora Bayes" />
                            </div>

                            <div className="card-overlay">
                                <div className="overlay-content program_cart">
                                    <div className="program_cart_inner">
                                        <Link href="/programDetails">
                                            <div className="program_cart_cntent">
                                                <h4>Salsa for Beginners</h4>
                                                <span>With Marco & Elena</span>
                                            </div>
                                        </Link>
                                          <Link href="/profile"> <img src="/img/prfl.png" /></Link>
                                    </div>
                                    <ul className="program_time">
                                        <li><img src="/img/session_icon.svg" />2hrs</li>
                                        <li><img src="/img/time_icon.svg" />12 sessions</li>
                                        <li><img src="/img/0date_icon.svg" />May 1 – Jun 1</li>
                                    </ul>

                                    <div className="price_align">
                                        <span className="redText">Seats Full</span>
                                        <Link href="" className="common_btn" >Join Waitlist</Link>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </Col>
                    <Col xl={3} lg={4} md={6} >
                        <div className="event_main_cart">
                            <div className="recommended-card">
                                <img src="/img/imageholder-2.png" alt="Nora Bayes" />
                            </div>

                            <div className="card-overlay">
                                <div className="overlay-content program_cart">
                                    <div className="program_cart_inner">
                                        <Link href="/programDetails">
                                            <div className="program_cart_cntent">
                                                <h4>Salsa for Beginners</h4>
                                                <span>With Marco & Elena</span>
                                            </div>
                                        </Link>
                                        <Link href="/profile"> <img src="/img/prfl.png" /></Link>
                                    </div>
                                    <ul className="program_time">
                                        <li><img src="/img/session_icon.svg" />2hrs</li>
                                        <li><img src="/img/time_icon.svg" />12 sessions</li>
                                        <li><img src="/img/0date_icon.svg" />May 1 – Jun 1</li>
                                    </ul>

                                    <div className="price_align">
                                        <span>$300</span>
                                      <Link href="/eventbooking" className="common_btn" >Book Now</Link>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </Col>
                    <Col xl={3} lg={4} md={6} >
                        <div className="event_main_cart">
                            <div className="recommended-card">
                                <img src="/img/imageholder-3.png" alt="Nora Bayes" />
                            </div>

                            <div className="card-overlay">
                                <div className="overlay-content program_cart">
                                    <div className="program_cart_inner">
                                        <Link href="/programDetails">
                                            <div className="program_cart_cntent">
                                                <h4>Salsa for Beginners</h4>
                                                <span>With Marco & Elena</span>
                                            </div>
                                        </Link>
                                         <Link href="/profile"> <img src="/img/prfl.png" /></Link>
                                    </div>
                                    <ul className="program_time">
                                        <li><img src="/img/session_icon.svg" />2hrs</li>
                                        <li><img src="/img/time_icon.svg" />12 sessions</li>
                                        <li><img src="/img/0date_icon.svg" />May 1 – Jun 1</li>
                                    </ul>

                                    <div className="price_align">
                                        <span className="redText">Seats Full</span>
                                        <Link href="" className="common_btn" >Join Waitlist</Link>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </Col>
                    <Col xl={3} lg={4} md={6} >
                        <div className="event_main_cart">
                            <div className="recommended-card">
                                <img src="/img/imageholder-4.png" alt="Nora Bayes" />
                            </div>

                            <div className="card-overlay">
                                <div className="overlay-content program_cart">
                                    <div className="program_cart_inner">
                                        <Link href="/programDetails">
                                            <div className="program_cart_cntent">
                                                <h4>Salsa for Beginners</h4>
                                                <span>With Marco & Elena</span>
                                            </div>
                                        </Link>
                                         <Link href="/profile"> <img src="/img/prfl.png" /></Link>
                                    </div>
                                    <ul className="program_time">
                                        <li><img src="/img/session_icon.svg" />2hrs</li>
                                        <li><img src="/img/time_icon.svg" />12 sessions</li>
                                        <li><img src="/img/0date_icon.svg" />May 1 – Jun 1</li>
                                    </ul>

                                    <div className="price_align">
                                        <span>$300</span>
                                       <Link href="/eventbooking" className="common_btn" >Book Now</Link>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </Col>
                    <Col xl={3} lg={4} md={6} >
                        <div className="event_main_cart">
                            <div className="recommended-card">
                                <img src="/img/imageholder-5.png" alt="Nora Bayes" />
                            </div>

                            <div className="card-overlay">
                                <div className="overlay-content program_cart">
                                    <div className="program_cart_inner">
                                        <Link href="/programDetails">
                                            <div className="program_cart_cntent">
                                                <h4>Salsa for Beginners</h4>
                                                <span>With Marco & Elena</span>
                                            </div>
                                        </Link>
                                         <Link href="/profile"> <img src="/img/prfl.png" /></Link>
                                    </div>
                                    <ul className="program_time">
                                        <li><img src="/img/session_icon.svg" />2hrs</li>
                                        <li><img src="/img/time_icon.svg" />12 sessions</li>
                                        <li><img src="/img/0date_icon.svg" />May 1 – Jun 1</li>
                                    </ul>

                                    <div className="price_align">
                                        <span className="redText">Seats Full</span>
                                        <Link href="" className="common_btn" >Join Waitlist</Link>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </Col>
                    <Col xl={3} lg={4} md={6} >
                        <div className="event_main_cart">
                            <div className="recommended-card">
                                <img src="/img/imageholder-6.png" alt="Nora Bayes" />
                            </div>

                            <div className="card-overlay">
                                <div className="overlay-content program_cart">
                                    <div className="program_cart_inner">
                                        <Link href="/programDetails">
                                            <div className="program_cart_cntent">
                                                <h4>Salsa for Beginners</h4>
                                                <span>With Marco & Elena</span>
                                            </div>
                                        </Link>
                                         <Link href="/profile"> <img src="/img/prfl.png" /></Link>
                                    </div>
                                    <ul className="program_time">
                                        <li><img src="/img/session_icon.svg" />2hrs</li>
                                        <li><img src="/img/time_icon.svg" />12 sessions</li>
                                        <li><img src="/img/0date_icon.svg" />May 1 – Jun 1</li>
                                    </ul>

                                    <div className="price_align">
                                        <span>$300</span>
                                       <Link href="/eventbooking" className="common_btn" >Book Now</Link>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </Col>
                    <Col xl={3} lg={4} md={6} >
                        <div className="event_main_cart">
                            <div className="recommended-card">
                                <img src="/img/imageholder-7.png" alt="Nora Bayes" />
                            </div>

                            <div className="card-overlay">
                                <div className="overlay-content program_cart">
                                    <div className="program_cart_inner">
                                        <Link href="/programDetails">
                                            <div className="program_cart_cntent">
                                                <h4>Salsa for Beginners</h4>
                                                <span>With Marco & Elena</span>
                                            </div>
                                        </Link>
                                         <Link href="/profile"> <img src="/img/prfl.png" /></Link>
                                    </div>
                                    <ul className="program_time">
                                        <li><img src="/img/session_icon.svg" />2hrs</li>
                                        <li><img src="/img/time_icon.svg" />12 sessions</li>
                                        <li><img src="/img/0date_icon.svg" />May 1 – Jun 1</li>
                                    </ul>

                                    <div className="price_align">
                                        <span className="redText">Seats Full</span>
                                        <Link href="" className="common_btn" >Join Waitlist</Link>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </Col>
                </Row>
            </div>
        </section>
    );
};

export default ProgramCart;