import apiClient from "./apiClient";

const categoryApi = {
    getCategories: (params) => {
        // params: { page, limit, search, type }
        return apiClient.get("/category/list", { params, skipToast: true });
    },
};

export default categoryApi;
