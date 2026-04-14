import apiClient from "./apiClient";

const categoryApi = {
    getCategories: (params) => {
        // params: { page, limit, search, type }
        return apiClient.get("/category/list", { params, skipToast: true });
    },
    getCategoryStats: () => {
        return apiClient.get("/category/stats", { skipToast: true });
    },
    getCategoryDetails: (id) => {
        return apiClient.get(`/category/details/${id}`, { skipToast: true });
    },
};

export default categoryApi;
