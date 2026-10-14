const cloudinary = require("cloudinary").v2;

// A signed Cloudinary link for a stored patient file.
// Patient files are uploaded with type "authenticated", so a plain link does not open them.
// Only call this for someone who is allowed to see the file.
function signedUrl(file, download = false) {
  if (!file || !file.publicId) return null;

  const options = {
    type: "authenticated",
    sign_url: true,
    secure: true,
    resource_type: file.resourceType || "image",
  };
  if (file.format) options.format = file.format;
  if (download) options.flags = "attachment"; // makes the browser download it

  return cloudinary.url(file.publicId, options);
}

module.exports = { signedUrl };
