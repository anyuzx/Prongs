const SVGO = require("svgo");

// initialize SVGO
var svgo = new SVGO({
    plugins: [{
            removeXMLNS: true
        },
        {
            removeDimensions: true
        },
        {
            removeViewBox: false
        }
    ]
});

module.exports = async (svgContent, callback) => {
    var svgmin = await svgo.optimize(svgContent).then(({
        data
    }) => data);
    callback(null, svgmin);
}