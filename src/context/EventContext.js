"use client";
import React, { createContext, useContext, useState } from "react";

const EventContext = createContext();

export const EventProvider = ({ children }) => {
    const [eventData, setEventData] = useState({
        // Basic Info
        eventTitle: "",
        eventCategory: "",
        posterImage: [],
        shortdesc: "",
        longdesc: "",
        tags: [],

        // Date & Time & Location
        venueName: "",
        venueAddress: {
            address: "",
            city: "",
            country: "",
            latitude: null,
            longitude: null,
        },
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",

        // Tickets & Pricing
        ticketName: "",
        ticketQtyAvailable: 0,
        ticketSelesStartDate: "",
        ticketSelesEndDate: "",
        ticketPrice: 0,
        totalTickets: 0,
        refundPolicy: "",
        addOns: "",

        // Gallery
        mediaLinks: [],
        shortTeaserVideo: [],

        // Other settings (defaults)
        accessAndPrivacy: true,
        ageRestriction: {
            type: "MIN_AGE",
            minAge: 18,
        },
        dressCode: "Business Casual",
        fetcherEvent: false,
        isDraft: false,
    });

    const updateEventData = (newData) => {
        setEventData((prev) => ({
            ...prev,
            ...newData,
        }));
    };

    return (
        <EventContext.Provider value={{ eventData, updateEventData, setEventData }}>
            {children}
        </EventContext.Provider>
    );
};

export const useEventContext = () => {
    return useContext(EventContext);
};
