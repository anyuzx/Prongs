const tabs = document.querySelectorAll(".nav-tab li");
const sections = document.querySelectorAll(".tab-pane");

tabs.forEach(tab => {
  tab.addEventListener("click", e => {
    e.preventDefault();
    removeActiveTab();
    addActiveTab(tab);
  });
})

const removeActiveTab = () => {
  tabs.forEach(tab => {
    tab.classList.remove("tab-active");
  });
  sections.forEach(section => {
    section.classList.remove("tab-active");
  });
}

const addActiveTab = tab => {
  tab.classList.add("tab-active");
  const href = tab.querySelector("a").getAttribute("href");
  const matchingSection = document.querySelector(href);
  matchingSection.classList.add("tab-active");
}
