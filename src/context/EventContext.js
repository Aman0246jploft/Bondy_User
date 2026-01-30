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
            latitude: 0,
            longitude: 0,
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
            maxAge: 60
        },
        dressCode: "Business Casual",
        fetcherEvent: false,
        isDraft: false,
    });

    React.useEffect(() => {
        const storedData = localStorage.getItem("eventCreationData");
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);

                // Ensure latitude and longitude are 0 if null/undefined (handle legacy data)
                if (parsed.venueAddress) {
                    if (parsed.venueAddress.latitude === null || parsed.venueAddress.latitude === undefined) {
                        parsed.venueAddress.latitude = 0;
                    }
                    if (parsed.venueAddress.longitude === null || parsed.venueAddress.longitude === undefined) {
                        parsed.venueAddress.longitude = 0;
                    }
                }

                setEventData(parsed);
            } catch (e) {
                console.error("Failed to parse stored event data", e);
            }
        }
    }, []);

    const updateEventData = (newData) => {
        setEventData((prev) => {
            const updated = { ...prev, ...newData };
            localStorage.setItem("eventCreationData", JSON.stringify(updated));
            return updated;
        });
    };

    const clearEventData = () => {
        setEventData({
            eventTitle: "",
            eventCategory: "",
            posterImage: [],
            shortdesc: "",
            longdesc: "",
            tags: [],
            venueName: "",
            venueAddress: {
                address: "",
                city: "",
                country: "",
                latitude: 0,
                longitude: 0,
            },
            startDate: "",
            endDate: "",
            startTime: "",
            endTime: "",
            ticketName: "",
            ticketQtyAvailable: 0,
            ticketSelesStartDate: "",
            ticketSelesEndDate: "",
            ticketPrice: 0,
            totalTickets: 0,
            refundPolicy: "",
            addOns: "",
            mediaLinks: [],
            shortTeaserVideo: [],
            accessAndPrivacy: true,
            ageRestriction: { type: "MIN_AGE", minAge: 18 },
            dressCode: "Business Casual",
            fetcherEvent: false,
            isDraft: false,
        });
        localStorage.removeItem("eventCreationData");
    };

    return (
        <EventContext.Provider value={{ eventData, updateEventData, setEventData, clearEventData }}>
            {children}
        </EventContext.Provider>
    );
};

export const useEventContext = () => {

    return useContext(EventContext);
};
