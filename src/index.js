
const gpu = require('GPU.js');

const pixels = require('image-pixels');

const pixelData = await pixels('flowers.png');

document.body.appendChild(document.createElement('canvas'))
    .getContext('2d')
    .putImageData(pixelData)