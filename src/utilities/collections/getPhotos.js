// getPhotos.js
module.exports = async function (collection) {
    const cloudinary = require('cloudinary').v2;
  
    // 1. Configure Cloudinary if not already done in .env or global config
    //    cloudinary.config({
    //      cloud_name: 'YOUR_CLOUD_NAME',
    //      api_key: 'YOUR_API_KEY',
    //      api_secret: 'YOUR_API_SECRET'
    //    });
  
    /**
     * Fetch resources from Cloudinary in multiple pages if needed
     * so we get ALL resources (not just the first 500).
     */
    async function fetchAllResources(prefix) {
      let allResources = [];
      let nextCursor = null;
  
      do {
        // For each "page", call cloudinary.api.resources()
        const { resources = [], rate_limit_allowed, rate_limit_reset_at, rate_limit_remaining, next_cursor } =
          await new Promise((resolve, reject) => {
            cloudinary.api.resources(
              {
                type: "upload",
                resource_type: 'image',
                prefix,
                tags: true,
                context: true,
                max_results: 500,
                next_cursor: nextCursor,
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
          });
  
        // Log rate-limit info for each chunk
        console.log(
          `\nFetched ${resources.length} resource(s) (cumulative: ${allResources.length + resources.length})`
        );
        console.log(
          'Rate Limit Allowed:', rate_limit_allowed,
          '\nRate Limit Reset At:', rate_limit_reset_at,
          '\nRate Limit Remaining:', rate_limit_remaining
        );
  
        // Add to the overall list
        allResources = allResources.concat(resources);
        nextCursor = next_cursor; // if `next_cursor` is set, loop again
      } while (nextCursor);
  
      return allResources;
    }
  
    /**
     * Fetch *detailed* information (with metadata) for a single resource
     */
    async function getSinglePhotoInfo(publicId) {
      return new Promise((resolve, reject) => {
        cloudinary.api.resource(publicId, { image_metadata: true }, (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        });
      });
    }
  
    // 2. Fetch all top-level resources from the folder `guangshi.io`
    let allResources;
    try {
      allResources = await fetchAllResources('guangshi.io');
    } catch (err) {
        console.error('Failed to fetch top-level resource list from Cloudinary. Full error below:');
        console.error(err); // Log the entire object
        // optionally: console.error(JSON.stringify(err, null, 2));
        throw err; // or return [];
    }
  
    // 3. Sort by creation date (ascending)
    //    If you want descending (most recent first), reverse the sort comparison.
    allResources.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateA - dateB; // ascending
    });
  
    // 4. Fetch detailed info for each resource
    //    (only if it has >0 bytes, which probably means it’s valid)
    const photoArrayPromises = allResources
      .filter((item) => item.bytes > 0)
      .map((item) => getSinglePhotoInfo(item.public_id));
  
    let photos;
    try {
      photos = await Promise.all(photoArrayPromises);
    } catch (err) {
      console.error('Failed to fetch detailed info for some photos:', err.message);
      throw err; // or return partial data if you like
    }
  
    // 5. Return the final array of photo objects
    return photos;
  };
