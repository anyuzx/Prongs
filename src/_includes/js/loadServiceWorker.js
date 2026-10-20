if ('serviceWorker' in navigator) {
  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register('/service-worker.js');
    } catch (error) {
      console.warn('Offline support could not be initialized:', error);
    }
  };

  // Finish loading the page before installation starts fetching offline assets.
  if (document.readyState === 'complete') {
    registerServiceWorker();
  } else {
    window.addEventListener('load', registerServiceWorker, { once: true });
  }
}
