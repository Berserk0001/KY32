"use strict";
/*
 * compress.js
 * A module that compresses an image.
 * compress(request, reply, ReadableStream);
 */
const sharp = require('sharp');
const redirect = require('./redirect');

async function compress(req, res, input) {
    const format = request.params.webp ? 'webp' : 'jpeg'

    try {
        const sharpInstance = sharp()
            .grayscale(req.params.grayscale)
            .toFormat(format, {
                quality: req.params.quality,
            });

        // Pipe the input stream into the Sharp instance and convert it to a buffer
        const { data, info } = await input.body
            .pipe(sharpInstance)
            .toBuffer();

        res.setHeader('content-type', 'image/' + format);
       res.setHeader('content-length', info.size);
       res.setHeader('x-original-size', req.params.originSize);
       res.setHeader('x-bytes-saved', req.params.originSize - info.size);
       res.status(200);
       res.write(data);
       res.end();
    } catch (error) {
        return redirect(req, res);
    }
}

module.exports = compress;
