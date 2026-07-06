/**
 * imagekit.js — Pleasant Homes ImageKit helper
 *
 * Exports a ready-to-use ImageKit instance + helper functions:
 *  - getAuthParams()  →  signed auth token for frontend direct uploads (optional)
 *  - deleteFile(id)   →  delete by fileId
 *  - getUrl(path)     →  build CDN URL with optional transforms
 */
const ImageKit = require('imagekit');

if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
  console.warn('[ImageKit] Missing env variables — ImageKit features will not work.');
}

const ik = new ImageKit({
  publicKey:   process.env.IMAGEKIT_PUBLIC_KEY   || '',
  privateKey:  process.env.IMAGEKIT_PRIVATE_KEY  || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ''
});

/**
 * Generate signed authentication params for frontend direct uploads.
 * Returns { token, expire, signature }
 */
const getAuthParams = () => ik.getAuthenticationParameters();

/**
 * Delete a file from ImageKit by its fileId.
 * Returns a promise.
 */
const deleteFile = (fileId) => {
  return new Promise((resolve, reject) => {
    ik.deleteFile(fileId, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

/**
 * Build an ImageKit URL with optional transformation options.
 * @param {string} filePath   — e.g. "/pleasant-homes/properties/img.jpg"
 * @param {Array}  transforms — e.g. [{width:400,height:300,crop:'at_max'}]
 */
const getUrl = (filePath, transforms = []) => {
  return ik.url({ path: filePath, transformation: transforms });
};

module.exports = { ik, getAuthParams, deleteFile, getUrl };
