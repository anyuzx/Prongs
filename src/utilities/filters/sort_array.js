module.exports = function (value, keyArr, reverse) {
    var sortOrder = 1;
    if (reverse) sortOrder = -1;
    return value.sort(function (a, b) {
        var x = a,
            y = b;
        for (var i = 0; i < keyArr.length; i++) {
            x = x[keyArr[i]];
            y = y[keyArr[i]];
        }
        return sortOrder * ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}