(function () {
  function initialize() {
    var viewport = document.getElementById('NGLviewport');
    if (!viewport || viewport.dataset.initialized) return;
    viewport.dataset.initialized = 'true';

    var fallback = document.getElementById('NGLfallback');
    var status = document.getElementById('NGLstatus');
    var imageCredit = document.getElementById('NGLimageCredit');
    var stage;
    var timeout;
    var failed = false;

    function showFallback(message) {
      failed = true;
      window.clearTimeout(timeout);
      viewport.style.visibility = 'hidden';
      fallback.hidden = false;
      imageCredit.hidden = false;
      status.textContent = message;
      if (stage && stage.viewer && stage.viewer.renderer) stage.dispose();
    }

    if (!window.NGL || typeof window.NGL.Stage !== 'function') {
      showFallback('The interactive viewer is unavailable. Showing a static view of PDB 6CO8.');
      return;
    }

    status.textContent = 'Loading interactive structure…';
    try {
      stage = new window.NGL.Stage(viewport, { backgroundColor: 'white' });
      // NGL returns a partial Stage instead of throwing when WebGL is unavailable.
      if (!stage.viewer || !stage.viewer.renderer) {
        showFallback('Interactive 3D viewing is unavailable in this browser. Showing a static view of PDB 6CO8.');
        return;
      }

      timeout = window.setTimeout(function () {
        showFallback('The interactive structure took too long to load. Showing a static view of PDB 6CO8.');
      }, 30000);

      // The old rcsb:// default used the retired MMTF service. Request mmCIF explicitly.
      stage.loadFile('https://files.rcsb.org/download/6CO8.cif', {
        defaultAssembly: 'BU1'
      }).then(function (component) {
        if (failed) return;
        component.addRepresentation('cartoon', { sele: 'polymer' });
        stage.autoView();
        window.clearTimeout(timeout);
        viewport.style.visibility = 'visible';
        fallback.hidden = true;
        imageCredit.hidden = true;
        status.textContent = 'Drag to rotate; scroll or pinch to zoom.';
        window.addEventListener('resize', function () { stage.handleResize(); });
      }).catch(function () {
        if (!failed) showFallback('The interactive structure could not be loaded. Showing a static view of PDB 6CO8.');
      });
    } catch (error) {
      showFallback('Interactive 3D viewing is unavailable in this browser. Showing a static view of PDB 6CO8.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
