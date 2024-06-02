exports.sortFields = function (obj) {
    let entries = Object.entries(obj);
    entries.sort(([a], [b]) => (a > b ? 1 : a === b ? 0 : -1));
    let newObj = {};
    entries.forEach(([key, value]) => {
        newObj[key] = value;
    });
    return newObj;
};
