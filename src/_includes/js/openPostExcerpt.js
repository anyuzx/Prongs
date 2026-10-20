// Excerpts remain readable when JavaScript is unavailable.
(() => {
  document.querySelectorAll("[data-excerpt-toggle]").forEach(toggle => {
    const excerpt = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!excerpt) return;

    const setExpanded = expanded => {
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-label", `${expanded ? "Hide" : "Show"} excerpt: ${toggle.dataset.postTitle}`);
      toggle.classList.toggle("plus-minus-toggle", expanded);
      excerpt.hidden = !expanded;
    };

    setExpanded(false);
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      setExpanded(toggle.getAttribute("aria-expanded") !== "true");
    });
  });
})();
