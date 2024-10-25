const sharp = require('sharp');
const redirect = require('./redirect');

async function compress(req, res, input) {
    const format = req.params.webp ? 'webp' : 'jpeg';
    const transform = sharp()
        .grayscale(req.params.grayscale)
        .toFormat(format, {
            quality: req.params.quality,
            progressive: true,
            optimizeScans: true,
            effort:0
        });

    try {
        // Pipe the input stream to sharp for transformation and then use sharp.toBuffer() to get the final buffer
        const output = await input.body.pipe(transform).toBuffer();
        const info = await sharp(output).metadata(); // Get metadata like file size, etc.

        // Set headers and send the response using Fastify's reply object
res.setHeader('content-type', 'image/' + format);
  res.setHeader('content-length', info.size);
  res.setHeader('x-original-size', req.params.originSize);
  res.setHeader('x-bytes-saved', req.params.originSize - info.size);
  res.status(200);
  res.write(output);
  res.end();
    } catch (err) {
        console.error('Compression error:', err);
        return redirect(req, res);
    }
}

module.exports = compress;
