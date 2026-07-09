import apiClient from "./apiClient";

const courseApi = {
    getCourses: (params) => {
        return apiClient.get("/course/list", { params, skipToast: true });
    },
    getCourseDetails: (courseId) => {
        return apiClient.get(`/course/details/${courseId}`);
    },
    getOrganizerCourses: (params) => {
        return apiClient.get("/course/list", { params: { ...params, filter: "organizer" }, skipToast: true });
    },
    createCourse: (data) => {
        return apiClient.post("/course/create", data);
    },
    updateCourse: (courseId, data) => {
        return apiClient.post(`/course/edit/${courseId}`, data);
    },
    getCourseAnalytics: (courseId, params) => {
        return apiClient.get(`/course/analytics/${courseId}`, { params, skipToast: true });
    },
};

export default courseApi;
