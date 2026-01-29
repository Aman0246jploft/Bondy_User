import apiClient from "./apiClient";

const eventApi = {
    getEvents: (params) => {
        // Construct query string manually or let axios handle it
        // params should include: page, limit, filter, categoryId, search, latitude, longitude
        return apiClient.get("/event/list", { params, skipToast: true });
    },
};

export default eventApi;
