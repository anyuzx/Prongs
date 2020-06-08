// Reference: https://codepen.io/pen?template=JNLMXb
// Create NGL Stage object
var stage = new NGL.Stage("NGLviewport");

// Handle window resizing
window.addEventListener("resize", function (event) {
    stage.handleResize();
}, false);

// set background to white
stage.setParameters({
    backgroundColor: "white"
})

// load PDB entry 1CRN
stage.loadFile("rcsb://1crn", {
    defaultRepresentation: true
});