// Without JavaScript these are ordinary links to two fully visible sections.
(() => {
  const container = document.querySelector(".publication-tabs");
  if (!container) return;

  const tabList = container.querySelector(".publication-tab-list");
  const tabs = Array.from(tabList.querySelectorAll("a[href^='#']"));
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  if (!tabs.length || panels.some(panel => !panel)) return;

  tabList.setAttribute("role", "tablist");
  tabList.setAttribute("aria-label", "Publication sections");
  container.classList.add("tabs-enhanced");

  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].setAttribute("tabindex", "0");
  });

  const activate = (selectedIndex, updateHash = false) => {
    tabs.forEach((tab, index) => {
      const selected = index === selectedIndex;
      tab.setAttribute("aria-selected", String(selected));
      tab.setAttribute("tabindex", selected ? "0" : "-1");
      tab.classList.toggle("tab-active", selected);
      panels[index].hidden = !selected;
    });
    if (updateHash) {
      window.history.replaceState(null, "", tabs[selectedIndex].hash);
    }
  };

  const activateFromHash = () => {
    const selectedIndex = tabs.findIndex(tab => tab.hash === window.location.hash);
    activate(selectedIndex < 0 ? 0 : selectedIndex);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", event => {
      // Preserve the browser's normal open-in-new-tab behavior for modified clicks.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activate(index, true);
    });

    tab.addEventListener("keydown", event => {
      let nextIndex;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      if (event.key === " ") nextIndex = index;
      if (nextIndex === undefined) return;
      event.preventDefault();
      activate(nextIndex, true);
      tabs[nextIndex].focus();
    });
  });

  activateFromHash();
  window.addEventListener("hashchange", activateFromHash);
})();
