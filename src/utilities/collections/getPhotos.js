const fs = require("fs/promises");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const CACHE_PATH = path.join(__dirname, "../../contents/photos/cloudinary_photos.json");

function shouldFetchRemoteData() {
  return process.env.FETCH_REMOTE_DATA === "1" || process.env.ELEVENTY_FETCH_REMOTE === "1";
}

async function readCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeCache(photos) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, `${JSON.stringify(photos, null, 2)}\n`, "utf8");
}

async function fetchAllResources(prefix) {
  let allResources = [];
  let nextCursor = null;

  do {
    const { resources = [], next_cursor } = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix,
      tags: true,
      context: true,
      max_results: 500,
      next_cursor: nextCursor
    });

    allResources = allResources.concat(resources);
    nextCursor = next_cursor;
  } while (nextCursor);

  return allResources;
}

async function getSinglePhotoInfo(publicId) {
  return cloudinary.api.resource(publicId, { image_metadata: true });
}

module.exports = async function getPhotos() {
  const cached = await readCache();
  if (!shouldFetchRemoteData()) {
    return cached;
  }

  try {
    const allResources = await fetchAllResources("guangshi.io");
    allResources.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const photoArrayPromises = allResources
      .filter((item) => item.bytes > 0)
      .map((item) => getSinglePhotoInfo(item.public_id));
    const photos = await Promise.all(photoArrayPromises);

    await writeCache(photos);
    return photos;
  } catch (error) {
    console.error(`Failed to refresh Cloudinary photos: ${error.message}`);
    return cached;
  }
};
