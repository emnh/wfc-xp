//const gpujs = require('GPU.js');
const gpujs = require('./gpu-browser.min.js');

const pixels = require('image-pixels');

const $ = require('jquery');

async function main() {
    const pixelData = await pixels('flowers.png');

    const width = pixelData.width;
    const height = pixelData.height;
    const outWidth = 100;
    const outHeight = 100;

    const nbWidth = 4 * width;
    const size = width * height;
    console.log(pixelData);

    const gpu = new gpujs.GPU();

    function getCandidate(current, source, x1, y1, x2, y2, x3, y3) {
        let nb1r = source[(x1 + y1 * this.constants.width) * 4 + 0];
        let nb1g = source[(x1 + y1 * this.constants.width) * 4 + 1];
        let nb1b = source[(x1 + y1 * this.constants.width) * 4 + 2];
        let nb1a = source[(x1 + y1 * this.constants.width) * 4 + 3];
        let nb2r = source[(x2 + y2 * this.constants.width) * 4 + 0];
        let nb2g = source[(x2 + y2 * this.constants.width) * 4 + 1];
        let nb2b = source[(x2 + y2 * this.constants.width) * 4 + 2];
        let nb2a = source[(x2 + y2 * this.constants.width) * 4 + 3];
        let cr = current[(x3 + y3 * this.constants.width2) * 4 + 0];
        let cg = current[(x3 + y3 * this.constants.width2) * 4 + 1];
        let cb = current[(x3 + y3 * this.constants.width2) * 4 + 2];
        let ca = current[(x3 + y3 * this.constants.width2) * 4 + 3];
        //if (nb1r == cr && nb1g == cg && nb1b == cb && nb1a == ca) {
        let a = [nb1r, nb1g, nb1b];
        let b = [cr, cg, cb];
        if (distance(a, b) <= 0.001) {
            this.color(nb2r, nb2g, nb2b, nb2a);
            //this.color(Math.random(), Math.random(), Math.random(), 1.0);
            return 1;
        }
        return 0;
    };

    function checkPixel(current, source, x, y, tx, ty) {
        let sum = 0.0;
        let count = 0;
        for (let tdx = -1; tdx <= 1; tdx += 1) {
            for (let tdy = -1; tdy <= 1; tdy += 1) {
                for (let dx = -1; dx <= 1; dx += 1) {
                    for (let dy = -1; dy <= 1; dy += 1) {
                        if (x + dx >= 0 &&
                            x + dy < this.constants.width &&
                            tx + tdx >= 0 &&
                            tx + tdx < this.constants.width &&
                            y + dy >= 0 &&
                            y + dy < this.constants.height &&
                            ty + tdy >= 0 &&
                            ty + tdy < this.constants.height) {

                            let x1 = x + dx;
                            let y1 = y + dy;
                            let x3 = tx + tdx;
                            let y3 = ty + tdy;

                            let nb1r = source[(x1 + y1 * this.constants.width) * 4 + 0];
                            let nb1g = source[(x1 + y1 * this.constants.width) * 4 + 1];
                            let nb1b = source[(x1 + y1 * this.constants.width) * 4 + 2];
                            let nb1a = source[(x1 + y1 * this.constants.width) * 4 + 3];
                            let cr = current[(x3 + y3 * this.constants.width2) * 4 + 0];
                            let cg = current[(x3 + y3 * this.constants.width2) * 4 + 1];
                            let cb = current[(x3 + y3 * this.constants.width2) * 4 + 2];
                            let ca = current[(x3 + y3 * this.constants.width2) * 4 + 3];

                            let a = [nb1r, nb1g, nb1b, nb1a];
                            let b = [cr, cg, cb, ca];
                            let d = Math.sqrt(length(a) * length(b));
                            sum += d;
                        }
                        count += 1;
                    }
                }
            }
        }
        if (count > 0) {
            sum /= count;
            //return sum > 0.0 && sum <= 10.0 ? 1 : 0;
            return 1;
        } else {
            return 0;
        }
    }

    const findNeighbours = gpu.createKernel(function(current, source) {
        let exists = 0;
        let good = 0;

        /*
        let tx = this.thread.x % this.constants.width2;
        let ty = this.thread.y % this.constants.height2;
        let x = Math.floor(this.thread.x / this.constants.width2);
        let y = Math.floor(this.thread.y / this.constants.height2);
         */
        let x = this.thread.x % this.constants.width;
        let y = this.thread.y % this.constants.height;
        let tx = Math.floor(this.thread.x / this.constants.width);
        let ty = Math.floor(this.thread.y / this.constants.height);

        let cr = current[(tx + ty * this.constants.width2) * 4 + 0];
        let cg = current[(tx + ty * this.constants.width2) * 4 + 1];
        let cb = current[(tx + ty * this.constants.width2) * 4 + 2];
        let ca = current[(tx + ty * this.constants.width2) * 4 + 3];

        this.color(1.0, 0.0, 0.0, 1.0);
        //this.color(Math.random(), Math.random(), Math.random(), 1.0);

        /*
        if (checkPixel(current, source, x, y, this.thread.x, this.thread.y) > 0.5) {
            let nb1r = source[(x + y * this.constants.width) * 4 + 0];
            let nb1g = source[(x + y * this.constants.width) * 4 + 1];
            let nb1b = source[(x + y * this.constants.width) * 4 + 2];
            let nb1a = source[(x + y * this.constants.width) * 4 + 3];
            this.color(nb1r, nb1g, nb1b, nb1a);
            this.color(1.0, 0.0, 0.0, 1.0);
        } else {
            this.color(1.0, 0.0, 0.0, 1.0);
        }*/

        /*
        if (length([cr, cg, cb]) <= 0.1) {

            /*
            let validCount = 0;
            for (let x = 0; x < this.constants.width; x++) {
                for (let y = 0; y < this.constants.height; y++) {
                    for (let tdx = 0; tdx <= 2; tdx += 1) {
                        for (let tdy = 0; tdy <= 2; tdy += 1) {
                            validCount += checkPixel(current, source, x, y, this.thread.x, this.thread.y, tdx - 1, tdy - 1);
                        }
                    }
                }
            }
            let rndCandidate = Math.floor(Math.random() * validCount);
            validCount = 0;
            for (let x = 0; x < this.constants.width; x++) {
                for (let y = 0; y < this.constants.height; y++) {
                    for (let tdx = 0; tdx <= 2; tdx += 1) {
                        for (let tdy = 0; tdy <= 2; tdy += 1) {
                            if (validCount == rndCandidate) {
                                let nb1r = source[(x + y * this.constants.width) * 4 + 0];
                                let nb1g = source[(x + y * this.constants.width) * 4 + 1];
                                let nb1b = source[(x + y * this.constants.width) * 4 + 2];
                                let nb1a = source[(x + y * this.constants.width) * 4 + 3];
                                this.color(nb1r, nb1g, nb1b, nb1a);
                            }
                            validCount += checkPixel(current, source, x, y, this.thread.x, this.thread.y, tdx - 1, tdy - 1);
                        }
                    }
                }
            }*/
        // } else {
        //     this.color(cr, cg, cb, ca);
        // }
        //this.color(Math.random(), Math.random(), Math.random(), 1.0);
    },  {
        constants: {
            width: width,
            height: height,
            width2: outWidth,
            height2: outHeight
        }
    })
        .setFunctions([getCandidate, checkPixel])
        .setOutput([outWidth * width, outHeight * height])
        .setGraphical(true);

    const remapCurrent = gpu.createKernel(function(current, bigMap) {
        let tx = this.thread.x * this.constants.width;
        let ty = this.thread.y * this.constants.height;

        let validCount = 0;
        {
            for (let x = 0; x < this.constants.width; x++) {
                for (let y = 0; y < this.constants.height; y++) {
                    let nb1r = bigMap[((tx + x) + (ty + y) * this.constants.width) * 4 + 0];
                    let nb1g = bigMap[((tx + x) + (ty + y) * this.constants.width) * 4 + 1];
                    let nb1b = bigMap[((tx + x) + (ty + y) * this.constants.width) * 4 + 2];
                    let nb1a = bigMap[((tx + x) + (ty + y) * this.constants.width) * 4 + 3];
                    let a = [nb1r, nb1g, nb1b, nb1a];
                    if (length(a) > 0.0) {
                        validCount++;
                    }
                }
            }
        }
        let rndCandidate = Math.floor(Math.random() * validCount);
        let validCount2 = 0;
        {
            for (let x = 0; x < this.constants.width; x++) {
                for (let y = 0; y < this.constants.height; y++) {
                    let nb1r = bigMap[((tx + x) + (ty + y) * this.constants.width) * 4 + 0];
                    let nb1g = bigMap[((tx + x) + (ty + y) * this.constants.width) * 4 + 1];
                    let nb1b = bigMap[((tx + x) + (ty + y) * this.constants.width) * 4 + 2];
                    let nb1a = bigMap[((tx + x) + (ty + y) * this.constants.width) * 4 + 3];
                    let a = [nb1r, nb1g, nb1b, nb1a];
                    if (validCount2 == rndCandidate) {
                        this.color(nb1r, nb1g, nb1b, nb1a);
                    }
                    if (length(a) > 0.0) {
                        validCount2++;
                    }
                }
            }
        }
    },{
        constants: {
            width: width,
            height: height,
            width2: outWidth,
            height2: outHeight
        }
    })
        .setOutput([outWidth, outHeight])
        .setGraphical(true);;

    const createCurrent = gpu.createKernel(function(source) {
        this.color(0.0, 0.0, 0.0, 0.0);
        //this.color(source[0], source[1], source[2], source[3]);
    })
        .setOutput([outWidth, outHeight])
        .setGraphical(true);

    createCurrent(pixelData.data);

    let current = createCurrent.getPixels();

    current[0] = pixelData.data[0];
    current[1] = pixelData.data[1];
    current[2] = pixelData.data[2];
    current[3] = pixelData.data[3];

    console.log("current", current);

    for (let i = 0; i < 10; i++) {
        console.log("Iteration: " + i);
        findNeighbours(current, pixelData.data);
        const bigMap = findNeighbours.getPixels();
        remapCurrent(current, bigMap);
        current = remapCurrent.getPixels();
    }

    const canvas = remapCurrent.canvas;
    document.body.appendChild(canvas);
    canvas.width = outWidth;
    canvas.height = outHeight;

    document.body.appendChild(findNeighbours.canvas);
    findNeighbours.canvas.width = outWidth * width;
    findNeighbours.canvas.height = outHeight * height;

    document.body.appendChild(document.createElement('canvas'))
        .getContext('2d')
        .putImageData(pixelData, 0, 0);
}

$(main);
