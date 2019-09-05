function openExcerpt(toggle, id) {
  var elem = document.getElementById(id);

  toggle.classList.toggle("plus-minus-toggle");

  let compStyles = window.getComputedStyle(elem);
  let elemMaxHeight = compStyles.getPropertyValue("max-height");

  if ((elemMaxHeight === "0px") || (elem.style.maxHeight === "0px")) {
    elem.style.maxHeight = elem.scrollHeight + "px";
  } else {
    elem.style.maxHeight = "0px";
  }
}
