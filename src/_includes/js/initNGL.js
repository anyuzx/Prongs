// Create NGL Stage object
var stage = new NGL.Stage("NGLviewport");

// Handle window resizing
window.addEventListener("resize", function (event) {
    stage.handleResize();
}, false);

// Set background to white
stage.setParameters({
    backgroundColor: "white"
});

// PDB ID of the structure to load
var pdbId = '6CO8';

// Load the PDB entry
stage.loadFile("rcsb://" + pdbId, { defaultAssembly: "BU1" })
    .then(function(component) {
        component.addRepresentation('cartoon', {sele: 'Polymer'});
        stage.autoView();
    });
