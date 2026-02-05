import apiClient from "./apiClient";

const courseApi = {
    getCourses: (params) => {
        return apiClient.get("/course/list", { params, skipToast: true });
    },
    getCourseDetails: (courseId) => {
        return apiClient.get(`/course/details/${courseId}`);
    },
};

export default courseApi;
