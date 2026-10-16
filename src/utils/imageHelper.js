export const getFullImageUrl = (path) => {
    if (!path) return "/img/sidebar-logo.svg";

    const strPath = String(path).trim();
    if (!strPath) return "/img/sidebar-logo.svg";

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

    // If path is already a complete absolute URL
    if (strPath.startsWith("http://") || strPath.startsWith("https://")) {
        // If baseUrl is defined and path is an /uploads/ file from another origin/environment,
        // normalize it to the current configured baseUrl so it resolves correctly
        if (baseUrl && strPath.includes("/uploads/")) {
            try {
                const parsedUrl = new URL(strPath);
                const parsedBase = new URL(baseUrl);
                if (parsedUrl.origin !== parsedBase.origin) {
                    const uploadPart = strPath.split(/\/uploads\//i)[1];
                    if (uploadPart) {
                        return `${baseUrl}/uploads/${uploadPart}`;
                    }
                }
            } catch {
                // Fall back to original URL if parsing fails
            }
        }
        return strPath;
    }

    // Relative path
    const cleanPath = strPath.startsWith("/") ? strPath.substring(1) : strPath;
    return baseUrl ? `${baseUrl}/${cleanPath}` : `/${cleanPath}`;
};
