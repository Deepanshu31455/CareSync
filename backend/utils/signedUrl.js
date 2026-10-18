const cloudinary = require("cloudinary").v2;

// A signed Cloudinary link for a stored patient file.
// Patient files are uploaded with type "authenticated", so a plain link does not open them.
// Only call this for someone who is allowed to see the file.
//
// Expiry: 1 hour from now. Without an explicit expiry, Cloudinary signed URLs are permanent
// bearer tokens — anyone who intercepts the link can access the file forever.
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

function signedUrl(file, download = false) {
  if (!file || !file.publicId) return null;

  const options = {
    type: "authenticated",
    sign_url: true,
    secure: true,
    resource_type: file.resourceType || "image",
    // expires_at is a Unix timestamp (seconds since epoch)
    expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS,
  };
  if (file.format) options.format = file.format;
  if (download) options.flags = "attachment"; // makes the browser download it

  return cloudinary.url(file.publicId, options);
}

module.exports = { signedUrl };
