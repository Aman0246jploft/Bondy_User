const padDatePart = (value) => String(value).padStart(2, "0");

const formatDateParts = (date) => {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  return `${year}-${month}-${day}`;
};

export const toUtcDateRangeValue = (date, boundary = "start") => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const formattedDate = formatDateParts(date);

  return boundary === "end"
    ? `${formattedDate}T23:59:59.999Z`
    : `${formattedDate}T00:00:00.000Z`;
};
