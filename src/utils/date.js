// backend/src/utils/date.js
// "2025-12-07" gibi bir tarihi Date objesine çevirip saatleri sıfırlar
function normalizeDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
        throw new Error("Invalid date format, expected YYYY-MM-DD");
    }
    d.setHours(0, 0, 0, 0);
    return d;
}

module.exports = {
    normalizeDate,
};
