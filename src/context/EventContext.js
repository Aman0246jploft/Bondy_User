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

    const loadEventForEdit = (eventDetails) => {
        // Transform GeoJSON venueAddress back to flat structure
        const transformedEvent = { ...eventDetails };
        if (eventDetails.venueAddress && eventDetails.venueAddress.type === "Point") {
            transformedEvent.venueAddress = {
                latitude: eventDetails.venueAddress.coordinates[1],
                longitude: eventDetails.venueAddress.coordinates[0],
                city: eventDetails.venueAddress.city || "",
                country: eventDetails.venueAddress.country || "",
                address: eventDetails.venueAddress.address || "",
            };
        }

        // Extract IDs from populated fields
        if (transformedEvent.eventCategory && typeof transformedEvent.eventCategory === 'object') {
            transformedEvent.eventCategory = transformedEvent.eventCategory._id;
        }
        if (transformedEvent.createdBy && typeof transformedEvent.createdBy === 'object') {
            transformedEvent.createdBy = transformedEvent.createdBy._id;
        }

        // Format dates for input fields (YYYY-MM-DD)
        const formatDateForInput = (isoDate) => {
            if (!isoDate) return "";
            const date = new Date(isoDate);
            return date.toISOString().split('T')[0];
        };

        if (transformedEvent.startDate) {
            transformedEvent.startDate = formatDateForInput(transformedEvent.startDate);
        }
        if (transformedEvent.endDate) {
            transformedEvent.endDate = formatDateForInput(transformedEvent.endDate);
        }
        if (transformedEvent.ticketSelesStartDate) {
            transformedEvent.ticketSelesStartDate = formatDateForInput(transformedEvent.ticketSelesStartDate);
        }
        if (transformedEvent.ticketSelesEndDate) {
            transformedEvent.ticketSelesEndDate = formatDateForInput(transformedEvent.ticketSelesEndDate);
        }

        // Store the event ID for edit mode
        transformedEvent._id = eventDetails._id;

        setEventData(transformedEvent);
        localStorage.setItem("eventCreationData", JSON.stringify(transformedEvent));
    };

    return (
        <EventContext.Provider value={{ eventData, updateEventData, setEventData, clearEventData, loadEventForEdit }}>
            {children}
        </EventContext.Provider>
    );
};

export const useEventContext = () => {

    return useContext(EventContext);
};
