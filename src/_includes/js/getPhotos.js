module.exports = async function(collection) {
    // require cloudinary node.js SDK
    const cloudinary = require('cloudinary').v2;

    // function to fetch all photos in the folder guangshi.io
    // return a promise to be used in asycn function
    const getAllPhotosInfo = () => {
        return new Promise(function(resolve, reject) {
            cloudinary.api.resources(
            {
                type:"upload",
                prefix:"guangshi.io",
                tags: true,
                context:true,
                max_results: 500
            },
            function(error, result){
                resolve(result);
            }
            );
        })
    }

    // function to fetch detailed information of a single photo
    // public_id for the photo should be provided as the argument
    const getSinglePhotoInfo = (public_id) => {
        return new Promise(function(resolve, reject) {
            cloudinary.api.resource(public_id, {image_metadata: true}, function (error, result) {
            resolve(result);
            });
        });
    };

    // wait for the getAllPhotosInfo to be resolved
    var allPhotosInfo = await getAllPhotosInfo();
    console.log("Rate Limit Allowed:",allPhotosInfo.rate_limit_allowed,
    "\nRate Limit Reset At", allPhotosInfo.rate_limit_reset_at,
    "\nRate Limit Remaining", allPhotosInfo.rate_limit_remaining);
    // sort the array by upload date
    allPhotosInfo.resources.sort(function(a,b){
        var keyA = new Date(a.created_at),
            keyB = new Date(b.created_at);
        // compare the two dates
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
    });
    // initiate an array for storing getSinglePhotoInfo promises
    var photoArrayPromise = [];
    // iterate all photos to fetch detailed information
    allPhotosInfo.resources.forEach(function(item){
        if (item.bytes > 0.0) {
            photoArrayPromise.push(getSinglePhotoInfo(item.public_id))
        }
    });
    // wait for all members of photoArrayPromise to be resolved
    var photos = await Promise.all(photoArrayPromise);

    // return the final result
    // photos is an array whose element is object containing all information of each photo
    return photos;
}