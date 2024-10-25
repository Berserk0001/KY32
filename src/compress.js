"use strict";
/*
 * compress.js
 * A module that compress a image.
 * compress(httpRequest, httpResponse, ReadableStream);
 */
const sharp = require('sharp')
const redirect = require('./redirect')

const sharpStream = _ => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

async function compress(req, res, input) {
  
   let format = req.params.webp ? 'webp' : 'jpeg';
  const imageProcessing = sharp(input.body)

  const metadata = await imageProcessing.metadata();

  if (format == 'webp'){
    // maximum webp size was 16383 x 16383. using jpeg if more than 16383
    if (metadata.height > 16383 || metadata.width > 16383 ){
      format = 'jpeg'
    }
  }
  /*
   * Determine the uncompressed image size when there's no content-length header.
   */

  /*
   * input.pipe => sharp (The compressor) => Send to httpResponse
   * The following headers:
   * |  Header Name  |            Description            |           Value            |
   * |---------------|-----------------------------------|----------------------------|
   * |x-original-size|Original photo size                |OriginSize                  |
   * |x-bytes-saved  |Saved bandwidth from original photo|OriginSize - Compressed Size|
   */
  input.body.pipe(sharpStream()
    .grayscale(req.params.grayscale)
    .toFormat(format, {
      quality: req.params.quality,
      progressive: true,
      optimizeScans: true
    })
    .toBuffer((err, output, info) => _sendResponse(err, output, info, format, req, res)))
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
