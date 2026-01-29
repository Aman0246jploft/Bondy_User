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
    getCategoryList: () => apiClient.get("/category/list?page=1&limit=1000000000&search="),
};

export default authApi;
