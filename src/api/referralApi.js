import apiClient from "./apiClient";

const referralApi = {
    getMyCode: () => apiClient.get("/referral/my-code", { skipToast: true }),
    getStats: () => apiClient.get("/referral/stats", { skipToast: true }),
    invite: (email) => apiClient.post("/referral/invite", { email }),
};

export default referralApi;
