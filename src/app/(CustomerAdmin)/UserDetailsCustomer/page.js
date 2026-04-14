"use client";
import { useLanguage } from "@/context/LanguageContext";
import { Row, Col } from "react-bootstrap";
import ProtectedRoute from "@/components/ProtectedRoute";
import useEffect from "react";

function UserDetailsCustomer() {
  return (
    <ProtectedRoute>
      <UserDetailsCustomerContent />
    </ProtectedRoute>
  );
}

function UserDetailsCustomerContent() {
  
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${t("userProfile")} - Bondy`;
  }, []);

  return (
    <div>
      <div className="cards ticket-details">
        <Row>
          <Col md={2}>
            <div className="ticket-dtl-card">
              <div className="ticket-dtl-card-img">
                <img src="/img/ticket-frame.png" alt="Ticket Icon" />
              </div>
              <h3>Adele Concert</h3>
            </div>
          </Col>
          <Col md={10}>
            <div className="ticket-dtl-main">
              <div className="tickt-dtl-info">
                <h4>{t("userProfile") || "User Details"}</h4>
              </div>
              <div className="event-dtl-innr">
                <div>
                  <h6>
                    <img src="/img/Map-Point.svg" alt="" />
                    {t("city") || "Location"}
                  </h6>
                  <p>American Airlines Center Dallas,Texas,USA</p>
                </div>
                <div>
                  <h6>
                    <img src="/img/white-calendar.svg" alt="" /> {t("eventDate") || "Event Date"}
                  </h6>
                  <p>
                    <span>Tue 30 Sep</span>{" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="4"
                      height="4"
                      viewBox="0 0 4 4"
                      fill="none">
                      <circle cx="2" cy="2" r="2" fill="#999999" />
                    </svg>{" "}
                    <span>7:30 PM</span>
                  </p>
                </div>
                <div>
                  <h6>
                    <img src="/img/Chair.svg" alt="" />
                    Selected Seat
                  </h6>
                  <p>
                    <span>Section 324</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="5"
                      height="5"
                      viewBox="0 0 5 5"
                      fill="none">
                      <circle cx="2.5" cy="2.5" r="2.5" fill="#B3B3B3" />
                    </svg>
                    <span>Row T</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="5"
                      height="5"
                      viewBox="0 0 5 5"
                      fill="none">
                      <circle cx="2.5" cy="2.5" r="2.5" fill="#B3B3B3" />
                    </svg>
                    <span>Seats 29-30</span>
                  </p>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <div className="payment-dtl">
          <h4 className="line-title">
            <span>{t("payment") || "Payment"}</span>
          </h4>
          <ul className="payment-dtl-innr">
            <li>
              <div>
                <h6>{t("ticketCount") || "Ticket count"}</h6>
                <p>2 {t("ticketsSuffix") || "tickets"}</p>
              </div>
              <div>
                <h6>{t("paidBy") || "Paid by"}</h6>
                <p>Negar khosravi</p>
              </div>
            </li>
            <li>
              <div>
                <h6>{t("transactionCosts") || "Transaction costs"}</h6>
                <p>$20</p>
              </div>
              <div>
                <h6>{t("paymentMethod") || "Payment method"}</h6>
                <p>Stripe</p>
              </div>
            </li>
            <li>
              <div>
                <h6>{t("totalPaid") || "Total paid"}</h6>
                <p>$260</p>
              </div>
              <div>
                <h6>{t("transactionID") || "Transaction ID"}</h6>
                <p>7984-KJD8-3827</p>
              </div>
            </li>
            <li>
              <img src="/img/barcode-ticket.svg" alt="Barcode" />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserDetailsCustomer;
