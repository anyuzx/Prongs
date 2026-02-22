const fs = require("fs/promises");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const CACHE_PATH = path.join(__dirname, "../../contents/photos/cloudinary_photos.json");
const DEFAULT_CLOUDINARY_PREFIX = "guangshi.io";

function shouldFetchRemoteData() {
  return process.env.FETCH_REMOTE_DATA === "1" || process.env.ELEVENTY_FETCH_REMOTE === "1";
}

function shouldRequireRemoteData() {
  return process.env.REQUIRE_REMOTE_DATA === "1";
}

function getCloudinaryPrefix() {
  // Empty string means "fetch all images" without prefix filter.
  if (process.env.CLOUDINARY_PHOTO_PREFIX !== undefined) {
    return process.env.CLOUDINARY_PHOTO_PREFIX;
  }
  return DEFAULT_CLOUDINARY_PREFIX;
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
    const query = {
      type: "upload",
      resource_type: "image",
      tags: true,
      context: true,
      max_results: 500,
      next_cursor: nextCursor
    };
    if (prefix) {
      query.prefix = prefix;
    }

    const { resources = [], next_cursor } = await cloudinary.api.resources(query);

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

  const prefix = getCloudinaryPrefix();
  try {
    const allResources = await fetchAllResources(prefix);
    console.log(
      `Cloudinary refresh: fetched ${allResources.length} resources (prefix=${prefix || "<none>"})`
    );
    allResources.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const photoArrayPromises = allResources
      .filter((item) => item.bytes > 0)
      .map((item) => getSinglePhotoInfo(item.public_id));
    const photos = await Promise.all(photoArrayPromises);

    console.log(`Cloudinary refresh: resolved ${photos.length} photos with metadata`);
    await writeCache(photos);
    return photos;
  } catch (error) {
    console.error(`Failed to refresh Cloudinary photos: ${error.message}`);
    if (shouldRequireRemoteData()) {
      throw new Error(`Cloudinary refresh failed and REQUIRE_REMOTE_DATA=1: ${error.message}`);
    }
    return cached;
  }
};
