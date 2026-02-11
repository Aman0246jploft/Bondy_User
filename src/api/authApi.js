import apiClient from "./apiClient";

const authApi = {
    customerSignup: (data) => apiClient.post("/user/customer/signup", data),
    customerVerifyOtp: (data) => apiClient.post("/user/customer/verify-otp", data),
    organizerSignup: (data) => apiClient.post("/user/organizer/signup", data),
    organizerVerifyOtp: (data) => apiClient.post("/user/organizer/verify-otp", data),
    uploadFile: (formData) =>
        apiClient.post("/user/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),
    getSelfProfile: () => apiClient.get("/user/selfProfile", { skipToast: true }),
    updateProfile: (data) => apiClient.post("/user/update-profile", data, { skipToast: true }),
    getCategoryList: (params) => apiClient.get("/category/list", {
        params: {
            page: 1,
            limit: 1000000000,
            search: "",
            ...params
        }
    }),
    loginInit: (data) => apiClient.post("/user/login/init", data),
    loginVerify: (data) => apiClient.post("/user/login/verify", data),
    resendOtp: (data) => apiClient.post("/user/resend-otp", data),
    getFaqs: () => apiClient.get("/faq/list", { skipToast: true }),
    getGlobalSetting: (key) => apiClient.get(`/globalsetting/${key}`, { skipToast: true }),
    getUserProfileById: (userId) => apiClient.get(`/user/profile/${userId}`, { skipToast: true }),
    followUser: (data) => apiClient.post("/follow/create", data),
    unfollowUser: (data) => apiClient.post("/follow/delete", data),
};

export default authApi;
