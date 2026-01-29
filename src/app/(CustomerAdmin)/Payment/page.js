import Link from "next/link";
import React from "react";

function page() {
  return (
    <div>
      <div className="cards payment-cards">
        <img src="/img/card-img.svg" alt="Credit Card" />
        <h5>You haven’t added a card yet!</h5>
        <p>Add one now so you can complete your payment and get your ticket</p>
        <Link href="/AddNewCard" className="custom-btn">
          Add new card
        </Link>
      </div>
    </div>
  );
}

export default page;
