import apiClient from "./apiClient";

const globalSettingApi = {
    getPrivacyPolicy: () => apiClient.get("/globalsetting/privacy_policy", { skipToast: true }),
    getTermsConditions: () => apiClient.get("/globalsetting/terms_conditions", { skipToast: true }),
    getSocialLinks: () => apiClient.get("/globalsetting/SOCIAL_LINKS", { skipToast: true }),
};

export default globalSettingApi;
