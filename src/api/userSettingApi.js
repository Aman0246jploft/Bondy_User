import apiClient from "./apiClient";

const userSettingApi = {
    getUserSetting: () => {
        return apiClient.get("/userSetting", { skipToast: true });
    },
    updateUserSetting: (data) => {
        return apiClient.post("/userSetting", data);
    },
};

export default userSettingApi;
