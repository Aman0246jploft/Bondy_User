import apiClient from "./apiClient";

const globalSettingApi = {
    getPrivacyPolicy: () => apiClient.get("/globalsetting/privacy_policy", { skipToast: true }),
    getTermsConditions: () => apiClient.get("/globalsetting/terms_conditions", { skipToast: true }),
};

export default globalSettingApi;
