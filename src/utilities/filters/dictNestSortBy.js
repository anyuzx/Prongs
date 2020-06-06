module.exports = function (value, key) {
    var sorted = {};
    Object.keys(value).sort(function (a, b) {
            return value[b][key] - value[a][key];
        })
        .forEach(function (key) {
            sorted[key] = value[key];
        });
    return sorted;
}