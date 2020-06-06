module.exports = function (arr, key) {
    const result = {};
    arr.forEach(item => {
        const keys = key.split('.');
        const value = keys.reduce((object, key) => object[key], item);

        (result[value] || (result[value] = [])).push(item);
    });

    // now we need sort by year
    // use Map not Object since the integer key in Object can not be sorted
    let orderedResult = new Map([]);
    Object.keys(result).sort().reverse().forEach(function (key) {
        orderedResult.set(key, result[key])
    })
    return orderedResult;
}