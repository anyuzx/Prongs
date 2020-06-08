module.exports = function (photoID, alt, breakPoint, fallBackWidth, widthsArray, classLst, cloudinaryID) {
    const urlBase = `https://res.cloudinary.com/${cloudinaryID}/image/upload/`;
    const src = `${urlBase}c_scale,f_auto,q_auto:good,w_${fallBackWidth}/${photoID}.jpg`;
    const srcsetJPG = widthsArray.map(x => {
        return `${urlBase}c_scale,f_auto,q_auto:good,w_${x}/${photoID}.jpg ${x}w`
    }).join(', ');
    const srcsetWEBP = widthsArray.map(x => {
        return `${urlBase}c_scale,f_auto,q_auto:good,w_${x}/${photoID}.webp ${x}w`
    }).join(', ');

    return `<picture>
    <source
      srcset="${srcsetWEBP}"
      type="image/webp">
      <img
      sizes="${breakPoint}"
      srcset="${srcsetJPG}"
      src="${src}"
      alt="${alt}"
      class="${classLst.join(' ')}"
      >
    </picture>` 
}