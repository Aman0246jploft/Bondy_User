export const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const getTicketSalesEndDate = (salesEndVal) => {
    if (!salesEndVal) return null;
    if (typeof salesEndVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(salesEndVal.trim())) {
        const d = new Date(`${salesEndVal.trim()}T23:59:59.999`);
        return isNaN(d.getTime()) ? new Date(salesEndVal) : d;
    }
    const d = new Date(salesEndVal);
    if (isNaN(d.getTime())) return null;
    if (
        (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) ||
        (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0)
    ) {
        const utcEnd = new Date(d);
        utcEnd.setUTCHours(23, 59, 59, 999);
        const locEnd = new Date(d);
        locEnd.setHours(23, 59, 59, 999);
        return utcEnd > locEnd ? utcEnd : locEnd;
    }
    return d;
};

export const getTicketSalesStartDate = (salesStartVal) => {
    if (!salesStartVal) return null;
    if (typeof salesStartVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(salesStartVal.trim())) {
        const d = new Date(`${salesStartVal.trim()}T00:00:00.000`);
        return isNaN(d.getTime()) ? new Date(salesStartVal) : d;
    }
    const d = new Date(salesStartVal);
    return isNaN(d.getTime()) ? null : d;
};

export const isTicketSalesEnded = (salesEndVal, now = new Date()) => {
    const end = getTicketSalesEndDate(salesEndVal);
    return end ? now > end : false;
};

export const isTicketSalesStarted = (salesStartVal, now = new Date()) => {
    const start = getTicketSalesStartDate(salesStartVal);
    return start ? now >= start : true;
};