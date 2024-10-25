"use strict";
/*
 * compress.js
 * A module that compresses an image.
 * compress(httpRequest, httpResponse, ReadableStream);
 */
const sharp = require('sharp');
const redirect = require('./redirect');

const sharpStream = _ => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

function compress(req, res, input) {
  let format = req.params.webp ? 'webp' : 'jpeg';

  /*
   * Determine the uncompressed image size when there's no content-length header.
   */

  input.body.pipe(
    sharpStream()
      .metadata()
      .then(metadata => {
        // Maximum WebP size is 16383 x 16383; use JPEG if dimensions exceed this limit.
        if (format === 'webp' && (metadata.height > 16383 || metadata.width > 16383)) {
          format = 'jpeg';
        }

        return sharpStream()
          .grayscale(req.params.grayscale)
          .toFormat(format, {
            quality: req.params.quality,
            progressive: true,
            optimizeScans: true,
          })
          .toBuffer((err, output, info) => _sendResponse(err, output, info, format, req, res));
      })
      .catch(err => {
        console.error("Error processing image metadata:", err);
        redirect(req, res);
      })
  );
}

function _sendResponse(err, output, info, format, req, res) {
  if (err || !info) return redirect(req, res);

  res.setHeader('content-type', 'image/' + format);
  res.setHeader('content-length', info.size);
  res.setHeader('x-original-size', req.params.originSize);
  res.setHeader('x-bytes-saved', req.params.originSize - info.size);
  res.status(200);
  res.write(output);
  res.end();
}

module.exports = compress;
