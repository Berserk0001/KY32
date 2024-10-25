"use strict";
/*
 * compress.js
 * A module that compresses an image.
 * compress(httpRequest, httpResponse, ReadableStream);
 */
const sharp = require('sharp');
const redirect = require('./redirect');

function compress(req, res, input) {
  const initialFormat = req.params.webp ? 'webp' : 'jpeg';

  // Create a sharp instance for metadata extraction
  const sharpInstance = sharp(input.body);

  sharpInstance
    .metadata()
    .then(metadata => {
      let format = initialFormat;

      // Maximum WebP size is 16383 x 16383; use JPEG if dimensions exceed this limit.
      if (initialFormat === 'webp' && (metadata.height > 16383 || metadata.width > 16383)) {
        format = 'jpeg';
      }

      // Compress the image using the selected format and parameters
      return sharp(input.body)
        .grayscale(req.params.grayscale)
        .toFormat(format, {
          quality: req.params.quality,
          progressive: true,
          optimizeScans: true,
        })
        .toBuffer()
        .then(output => {
          return { output, info: { size: output.length } }; // Create a mock info object
        });
    })
    .then(({ output, info }) => {
      _sendResponse(null, output, info, format, req, res);
    })
    .catch(err => {
      console.error("Error processing image:", err);
      redirect(req, res);
    });
}

function _sendResponse(err, output, info, format, req, res) {
  if (err || !info) return redirect(req, res);

  res.setHeader('content-type', 'image/' + format);
  res.setHeader('content-length', info.size);
  res.setHeader('x-original-size', req.params.originSize);
  res.setHeader('x-bytes-saved', req.params.originSize - info.size);
  res.status(200).write(output).end();
}

module.exports = compress;
