import apiClient from "./apiClient";

const wishlistApi = {
    addToWishlist: (data) => {
        return apiClient.post("/wishlist/add", data);
    },
    removeFromWishlist: (data) => {
        return apiClient.delete("/wishlist/remove", { data });
    },
    getMyWishlist: (params = {}) => {
        return apiClient.get("/wishlist/my-wishlist", { params, skipToast: true });
    },
};

export default wishlistApi;
