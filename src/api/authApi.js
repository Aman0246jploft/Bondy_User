import apiClient from "./apiClient";

const authApi = {
    customerSignup: (data) => apiClient.post("/user/customer/signup", data),
    organizerSignup: (data) => apiClient.post("/user/organizer/signup", data),
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
    verifyUniversalOtp: (data) => apiClient.post("/user/verify-otp", data),
    resendUniversalOtp: (data) => apiClient.post("/user/resendOtp", data),
    getFaqs: () => apiClient.get("/faq/list", { skipToast: true }),
    getGlobalSetting: (key) => apiClient.get(`/globalsetting/${key}`, { skipToast: true }),
    getUserProfileById: (userId) => apiClient.get(`/user/profile/${userId}`, { skipToast: true }),
    followUser: (data) => apiClient.post("/follow/create", data),
    unfollowUser: (data) => apiClient.post("/follow/delete", data),
    // Forgot Password APIs
    forgotPasswordInit: (data) => apiClient.post("/user/forgot-password/init", data),
    verifyForgotPasswordOtp: (data) => apiClient.post("/user/forgot-password/verify", data),
    resetPassword: (data) => apiClient.post("/user/reset-password", data),
    getFollowers: (params) => apiClient.get("/follow/followers", { params, skipToast: true }),
    getFollowing: (params) => apiClient.get("/follow/following", { params, skipToast: true }),

};

export default authApi;
