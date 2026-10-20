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

function describeError(error) {
  // Admin API rejections wrap the message in `error`; never log the whole
  // rejection object, which can also contain authenticated request options.
  const detail = error && error.error ? error.error : error;
  const message = typeof detail === "string" ? detail
    : typeof detail?.message === "string" ? detail.message : "Unknown Cloudinary error";
  const status = detail?.http_code || detail?.code;
  return status ? `${message} (${status})` : message;
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
    return Array.isArray(parsed) && parsed.every((photo) =>
      photo && typeof photo.public_id === "string" && photo.public_id.length > 0 && photo.bytes > 0
    ) ? parsed : [];
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

    const { resources, next_cursor } = await cloudinary.api.resources(query);
    if (!Array.isArray(resources)) {
      throw new Error("Cloudinary returned an invalid photo listing");
    }

    allResources = allResources.concat(resources);
    nextCursor = next_cursor;
  } while (nextCursor);

  return allResources;
}

async function getSinglePhotoInfo(publicId) {
  return cloudinary.api.resource(publicId, { image_metadata: true });
}

async function resolvePhotoMetadata(resources, cached) {
  const cacheById = new Map(cached.map((photo) => [photo.public_id, photo]));
  const photos = [];
  for (const resource of resources.filter((item) => item.bytes > 0)) {
    const previous = cacheById.get(resource.public_id);
    if (previous && resource.asset_id && previous.asset_id === resource.asset_id &&
        resource.version !== undefined && previous.version === resource.version &&
        previous.image_metadata && typeof previous.image_metadata === "object") {
      // Embedded EXIF is unchanged for the same asset version. Refresh mutable
      // listing fields, including removals of tags and contextual captions.
      photos.push({ ...previous, ...resource, tags: resource.tags || [], context: resource.context || {} });
    } else {
      // Only new or changed images need a separate metadata request. Fetch them
      // sequentially so a failed request stops before spending more API quota.
      photos.push(await getSinglePhotoInfo(resource.public_id));
    }
  }
  return photos;
}

module.exports = async function getPhotos() {
  const cached = await readCache();
  if (!shouldFetchRemoteData()) {
    if (cached.length === 0) {
      throw new Error("No usable Cloudinary photo cache; run npm run build:refresh-data to populate it");
    }
    return cached;
  }

  const prefix = getCloudinaryPrefix();
  try {
    const allResources = await fetchAllResources(prefix);
    console.log(
      `Cloudinary refresh: fetched ${allResources.length} resources (prefix=${prefix || "<none>"})`
    );
    allResources.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const photos = await resolvePhotoMetadata(allResources, cached);
    if (photos.length === 0) {
      throw new Error("Cloudinary returned no photos; refusing to replace the photo cache with an empty gallery");
    }

    console.log(`Cloudinary refresh: resolved ${photos.length} photos with metadata`);
    await writeCache(photos);
    return photos;
  } catch (error) {
    const reason = describeError(error);
    if (shouldRequireRemoteData()) {
      throw new Error(`Cloudinary refresh failed and REQUIRE_REMOTE_DATA=1: ${reason}`);
    }
    if (cached.length === 0) {
      throw new Error(`Cloudinary refresh failed and no usable photo cache is available: ${reason}`);
    }
    console.warn(`Cloudinary refresh failed: ${reason}. Using ${cached.length} cached photos; new photo changes will appear after a successful refresh.`);
    return cached;
  }
};
