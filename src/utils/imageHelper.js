export const getFullImageUrl = (path) => {
    // console.log("getFullImageUrl called with path:", path);
    if (!path) return "/img/default-user.png";
    if (path.startsWith("http")) return path;

    // Ensure we don't have double slashes if path starts with /
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8080";

    return `${baseUrl}/${cleanPath}`;
};
