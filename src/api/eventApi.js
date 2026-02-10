import apiClient from "./apiClient";

const eventApi = {
    getEvents: (params) => {
        // Construct query string manually or let axios handle it
        // params should include: page, limit, filter, categoryId, search, latitude, longitude
        return apiClient.get("/event/list", { params, skipToast: true });
    },
    getOrganizerEvents: (params) => {
        return apiClient.get("/event/organizer/list", { params, skipToast: true });
    },
    createEvent: (data) => apiClient.post("/event/create", data),
    getEventDetails: (eventId) => apiClient.get(`/event/details/${eventId}`, { skipToast: true }),
    getAllAttendees: (eventId, search) => apiClient.get(`/event/attendees/${eventId}`, { params: { search }, skipToast: true }),
    getOrganizerStats: () => apiClient.get("/event/organizer/stats", { skipToast: true }),
};

export default eventApi;
