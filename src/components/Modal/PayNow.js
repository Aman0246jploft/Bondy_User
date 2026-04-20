"use client";
import Link from "next/link";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { useRouter } from "next/navigation";
import authApi from "@/api/authApi";
import { useLanguage } from "@/context/LanguageContext";


export default function PayNow(props) {

 const router = useRouter();
 const { t } = useLanguage();

 const handleRedirect = async () => {
  try {
    const res = await authApi.getSelfProfile();

    if (res?.status) {
      const role = res?.data?.user?.userRole;

      if (role === "ORGANIZER") {
        router.push("/MyTicketsOrganiser");
      } else if (role === "CUSTOMER") {
        router.push("/MyTickets");
      }
    }
  } catch (error) {
    console.error(error);
  }
};


    return (
        <>

            <Modal
                show={props.show}
                onHide={props.onHide}
                size="md"
                aria-labelledby="contained-modal-title-vcenter"
                centered
                className="common_modal gradientsSc"
            >
                <Modal.Header closeButton />
                <Modal.Body>

                    <div className="modal_box">
                        <div className="img_box">
                            <img src="/img/Success.svg" />
                        </div>
                        <div className="modal_title addto_list text-center mb-4">
                          <h3>{t("paymentSuccessful")}</h3>
                          <p>{t("paymentSuccessDesc")}</p>
                        </div>
                        {/* <div className="align_btn mt-5">
                            <Link href="/" className="common_btn">
                                Go to My Tickets
                            </Link>
                        </div> */}
                         <button className="common_btn mt-4" onClick={handleRedirect}>
            {t("goToMyTickets")}
          </button>
                    </div>
                </Modal.Body>
            </Modal>

        </>
    );
}
