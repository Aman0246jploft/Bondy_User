import apiClient from "./apiClient";

const courseApi = {
    getCourses: (params) => {
        return apiClient.get("/course/list", { params, skipToast: true });
    },
};

export default courseApi;
