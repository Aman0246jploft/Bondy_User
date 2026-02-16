import apiClient from "./apiClient";

const courseApi = {
    getCourses: (params) => {
        return apiClient.get("/course/list", { params, skipToast: true });
    },
    getCourseDetails: (courseId) => {
        return apiClient.get(`/course/details/${courseId}`);
    },
    getOrganizerCourses: (params) => {
        return apiClient.get("/course/organizer/list", { params, skipToast: true });
    },
    createCourse: (data) => {
        return apiClient.post("/course/create", data);
    },
    updateCourse: (courseId, data) => {
        return apiClient.post(`/course/edit/${courseId}`, data);
    },
};

export default courseApi;
