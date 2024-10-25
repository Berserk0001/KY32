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

  // Get metadata to check dimensions
  sharp(input.body).metadata().then(metadata => {
    // Check dimensions for WebP format
    if (format === 'webp' && (metadata.height > 16383 || metadata.width > 16383)) {
      format = 'jpeg';
    }

    // Pipe input to sharp and process the image
    input.body.pipe(sharpStream()
      .grayscale(req.params.grayscale)
      .toFormat(format, {
        quality: req.params.quality,
        progressive: true,
        optimizeScans: true
      })
      .toBuffer((err, output, info) => _sendResponse(err, output, info, format, req, res)));
  })
}

function _sendResponse(err, output, info, format, req, res) {
  if (err || !info) {
    console.error('Error during image compression:', err);
    return redirect(req, res);
  }

  // Set response headers
  res.setHeader('content-type', 'image/' + format);
  res.setHeader('content-length', info.size);
  res.setHeader('x-original-size', req.params.originSize);
  res.setHeader('x-bytes-saved', req.params.originSize - info.size);
  res.status(200).send(output);
}

module.exports = compress;
