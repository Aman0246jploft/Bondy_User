import apiClient from "./apiClient";

const eventApi = {
    getEvents: (params) => {
        // Construct query string manually or let axios handle it
        // params should include: page, limit, filter, categoryId, search, latitude, longitude
        return apiClient.get("/event/list", { params, skipToast: true });
    },
    getTopEvents: (params) => {
        return apiClient.get("/event/top/list", { params, skipToast: true });
    },
    getExploreList: (params) => {
        return apiClient.get("/explore/list", { params, skipToast: true });
    },
    getOrganizerEvents: (params) => {
        return apiClient.get("/event/list", { params: { ...params, filter: "organizer" }, skipToast: true });
    },
    createEvent: (data) => apiClient.post("/event/create", data),
    getEventDetails: (eventId) => apiClient.get(`/event/details/${eventId}`, { skipToast: true }),
    getAllAttendees: (eventId, params) => apiClient.get(`/event/attendees/${eventId}`, { params, skipToast: true }),
    getOrganizerStats: () => apiClient.get("/event/organizer/stats", { skipToast: true }),
    updateEvent: (eventId, data) => apiClient.post(`/event/edit/${eventId}`, data),
    getRefundPolicies: (lang) => {
        const config = { skipToast: true };
        if (lang) {
            config.params = { language: lang };
            config.headers = { "Accept-Language": lang, "language": lang };
        }
        return apiClient.get("/event/refund-policies", config);
    },
    getEventAnalytics: (eventId, params) => apiClient.get(`/event/analytics/${eventId}`, { params, skipToast: true }),
    getEventsAnalyticsSummary: (params) => apiClient.get("/event/analytics/summary", { params, skipToast: true }),
    deleteDraftEvent: (eventId) => apiClient.post(`/event/delete/${eventId}`),
};

export default eventApi;
