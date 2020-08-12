//const gpujs = require('GPU.js');
const gpujs = require('./gpu-browser.min.js');

const pixels = require('image-pixels');

const $ = require('jquery');

async function main() {
    const pixelData = await pixels('flowers.png');
    //const pixelData = await pixels('writing64.png');

    const width = pixelData.width;
    const height = pixelData.height;
    const outWidth = 40;
    const outHeight = 40;

    const nbWidth = 4 * width;
    const size = width * height;
    console.log(pixelData);

    const gpu = new gpujs.GPU();

    function euclid(a, b) {
        let dx = a[0] - b[0];
        let dy = a[1] - b[1];
        let dz = a[2] - b[2];
        let dw = a[3] - b[3];
        return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
    }

    function euclidRGB(a, b) {
        let dw = a[3] - b[3];
        let dx = (a[0] - b[0]) * dw;
        let dy = (a[1] - b[1]) * dw;
        let dz = (a[2] - b[2]) * dw;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // Check if color at source:x,y is a candidate for current:tx,ty.
    // If current:tx,ty is unoccupied and at least one neighbour current:tx+tdx,ty+tdy is occupied, then:
    // Check if there exists a pair source:x,y and source:x+dx,y+dy such that:
    // distance between source:x+dx,y+dy and current:tx+tdx,ty+tdy is below a threshold.
    function checkPixel(current, source, x, y, tx, ty) {
        let sum = 0.0;
        let count = 0;
        let count2 = 0;
        let nbOccupied = 0;
        let check = true;
        let avgValid = 0;

        // let nb2r = source[(x + y * this.constants.width) * 4 + 0] / 255.0;
        // let nb2g = source[(x + y * this.constants.width) * 4 + 1] / 255.0;
        // let nb2b = source[(x + y * this.constants.width) * 4 + 2] / 255.0;
        // let nb2a = source[(x + y * this.constants.width) * 4 + 3] / 255.0;
        let before = [current[flip(ty)][tx][0], current[flip(ty)][tx][1], current[flip(ty)][tx][2], current[flip(ty)][tx][3]];

        let k = 1;
        {
            for (let tdx = -k; tdx <= k; tdx += 1) {
                for (let tdy = -k; tdy <= k; tdy += 1) {
                    let nbOccupied2 = 0;
                    let valid = 0;
                    let invalid = 0;
                    for (let dx = -k; dx <= k; dx += 1) {
                        for (let dy = -k; dy <= k; dy += 1) {
                            if (x + dx >= 0 &&
                                x + dy < this.constants.width &&
                                tx + tdx >= 0 &&
                                tx + tdx < this.constants.width2 &&
                                y + dy >= 0 &&
                                y + dy < this.constants.height &&
                                ty + tdy >= 0 &&
                                ty + tdy < this.constants.height2 &&
                                Math.abs(dx) + Math.abs(dy) > 0.5 &&
                                Math.abs(tdx) + Math.abs(tdy) > 0.5 &&
                                euclid([tdx, tdy, 0, 0], [0, 0, 0, 0]) <= 2 * k &&
                                euclid([dx, dy, 0, 0], [0, 0, 0, 0]) <= 2 * k) {

                                let x1 = x + dx;
                                let y1 = y + dy;
                                let x2 = x + tdx;
                                let y2 = y + tdy;
                                let x3 = tx + tdx;
                                let y3 = ty + tdy;

                                let nb1r = source[(x1 + y1 * this.constants.width) * 4 + 0] / 255.0;
                                let nb1g = source[(x1 + y1 * this.constants.width) * 4 + 1] / 255.0;
                                let nb1b = source[(x1 + y1 * this.constants.width) * 4 + 2] / 255.0;
                                let nb1a = source[(x1 + y1 * this.constants.width) * 4 + 3] / 255.0;
                                let nb2r = source[(x2 + y2 * this.constants.width) * 4 + 0] / 255.0;
                                let nb2g = source[(x2 + y2 * this.constants.width) * 4 + 1] / 255.0;
                                let nb2b = source[(x2 + y2 * this.constants.width) * 4 + 2] / 255.0;
                                let nb2a = source[(x2 + y2 * this.constants.width) * 4 + 3] / 255.0;

                                let a = [nb1r, nb1g, nb1b, nb1a];
                                let c = [nb2r, nb2g, nb2b, nb2a];
                                let b = [current[flip(y3)][x3][0], current[flip(y3)][x3][1], current[flip(y3)][x3][2], current[flip(y3)][x3][3]];

                                //let d = Math.abs(distance(a, b));//Math.sqrt(length(a) * length(b));
                                let d = euclidRGB(a, b);
                                let d1 = euclid(a, [0, 0, 0, 0]);
                                let d2 = euclid(b, [0, 0, 0, 0]);
                                let d3 = euclid(b, c);
                                let d5 = euclid(before, [0, 0, 0, 0]);
                                let uninit = d5 <= 1.0e-6 ? true : false;
                                let d4 = euclid(before, c);

                                let nbDist = Math.abs(tdx) + Math.abs(tdy);

                                //if (nbDist > 0.5 && nbDist < 1.5 && euclid([dx, dy, 0, 0], [-tdx, -tdy, 0, 0]) < 0.1) {


                                //if (nbDist > 0.5 && nbDist < 1.5 && euclid([dx, dy, 0, 0], [tdx, tdy, 0, 0]) < 0.1) {
                                // if (nbDist > 0.5 && nbDist < 1.5) {
                                if (d2 > 0.0) {
                                    nbOccupied += 1.0;
                                    nbOccupied2++;
                                    //if (dy == tdy && dx == tdx && d < 0.00001) {


                                    //if (euclid([dx, dy, 0, 0], [-tdx, tdy, 0, 0]) < 0.1 ||
                                    //    euclid([dx, dy, 0, 0], [tdx, -tdy, 0, 0]) < 0.1) {
                                    //if ((uninit == true || d3 < d4) && d3 < 1.0e-6) {

                                        if (d3 < 1.0e-6) {
                                            valid++;
                                            avgValid += 1.0;
                                        }
                                     // }
                                    //}
                                    //}

                                    //sum += d3;
                                    //sum += (1.0 + euclid(a, [0, 0, 0, 0])) * (1.0 + euclid(b, [0, 0, 0, 0]));
                                    sum += (1.0 - d3);
                                    count2 += 1;
                                }


                                // if (nbDist > 0.5 && nbDist < 1.5) {
                                //     if (d2 > 0.000001) {
                                //         //nbOccupied++;
                                //         if (d < 0.00001) {
                                //             valid += 1.0;
                                //         } else {
                                //             invalid += 1.0;
                                //         }
                                //     }
                                // }

                                if (d <= 0.01 || d1 < 0.01 || d2 < 0.01) {
                                    //sum += 1.0;
                                }
                                /*
                                if (nbDist > 0.5 && nbDist < 1.5 && euclid([dx, dy, 0, 0], [tdx, tdy, 0, 0]) < 0.1) {
                                    //if (nbDist > 0.5 && nbDist < 1.5) {
                                    //sum += (euclid(a, [0, 0, 0, 0]) * euclid(b, [0, 0, 0, 0]));
                                    sum += d3;
                                    count2 += 1;
                                } else {
                                    //sum += 1.0;
                                    //count2 += 1;
                                }
                                */
                                //sum += d;
                            }
                            count += 1;
                        }
                    }
                    //check = check && valid >= nbOccupied2 && valid > 1.5;
                    if (nbOccupied2 > 0.5) {
                        check = check && valid >= nbOccupied2;
                    }
                }
            }
            if (count > 0) {
                //return 1;
                //return (nbOccupied > 0.5 && check) ? 1.0 + avgValid / (k * k) : 0;
                //return (nbOccupied > 0.5 && check) ? 10 * avgValid / nbOccupied : 0;
                //return (nbOccupied > 0.5 && check) ? 10.0 * sum : 0;
                //return (check) ? 1 + avgValid : 0;
                //return (check) ? 1 : 0;
                //return (nbOccupied > 0.5 && check && avgValid >= nbOccupied) ? 1 : 0;
                //return (nbOccupied > 0.5 && check && avgValid >= nbOccupied) ? avgValid : 0;
                //return (nbOccupied > 0.5 && check) ? 1 : 0;
                // return (nbOccupied > 0.5 && check) ? (nbOccupied + avgValid) : 0;
                return (nbOccupied > 0.5 && check) ? 1 : 0;
                //return (check) ? nbOccupied : 0;
                //sum /= count2;
                //return (sum >= 0.0 && sum < 1.0 && nbOccupied > 0.5) ? 1 : 0;
                //return (sum > 0.85 && nbOccupied > 0.5) ? 1 : 0;
                //return (sum > 0.0 && sum <= 1.0) ? 1 : 0;
                //return (nbOccupied > 0.5 && sum > 0.0 && sum <= 0.4) ? 1 : 0;
                //return (nbOccupied > 0.5 && sum > 2.0) ? 1 : 0;
                //return 1;
                //return nbOccupied > 0.5 ? 1 : 0;
            } else {
                return 0;
            }
        }
    }

    function flip(y) {
        //return this.constants.width2 - y - 1;
        return y;
    }

    const findNeighbours = gpu.createKernel(function(current, source, level, filled, evenodd, mx, my) {

        //return [Math.random(), Math.random(), Math.random(), 1.0];

        //let ttx = this.constants.width2 - this.thread.x - 1;
        let ttx = this.thread.x;
        let tty = this.thread.y; //this.constants.height2 - this.thread.y - 1;

        let x = Math.floor(ttx % this.constants.width);
        let y = Math.floor(tty % this.constants.height); //this.constants.height - Math.floor(tty % this.constants.height) - 1;
        //let tx = mx;
        //let ty = my;
        let tx = mx > -0.5 ? mx : Math.floor(ttx / this.constants.width);
        let ty = my > -0.5 ? my : Math.floor(tty / this.constants.height);

        //let ty = this.constants.height2 - Math.floor(tty / this.constants.height) - 1;
        //let ty = tty - y; //Math.floor(tty / this.constants.height);

        let cur = [current[flip(ty)][tx][0], current[flip(ty)][tx][1], current[flip(ty)][tx][2], current[flip(ty)][tx][3]];

        //this.color(Math.random(), Math.random(), Math.random(), 1.0);
        let ret = [0.0, 0.0, 0.0, 0.0];

        // if (length(cur) < 0.001 && checkPixel(current, source, x, y, tx, ty) > 0.5) {
        let cp = checkPixel(current, source, x, y, tx, ty);
        if (
            //Math.abs((tx + ty) % 4 - evenodd) <= 0.1 &&
            //tx == mx && ty == my &&
            (filled || euclid(cur, [0, 0, 0, 0]) < 0.001) &&
            cp > 0.5 + level) {
            // let nb1r = source[(x + y * this.constants.width) * 4 + 0] / 255.0;
            // let nb1g = source[(x + y * this.constants.width) * 4 + 1] / 255.0;
            // let nb1b = source[(x + y * this.constants.width) * 4 + 2] / 255.0;
            // let nb1a = source[(x + y * this.constants.width) * 4 + 3] / 255.0;
            let ai = Math.floor(Math.random() * (this.constants.width * this.constants.height));
            ret = [x + y * this.constants.width + 1, cp, ai, Math.random()];
            //ret = [nb1r, nb1g, nb1b, nb1a];
        }

        return ret;
    },{
        constants: {
            width: width,
            height: height,
            width2: outWidth,
            height2: outHeight
        }
    })
        .setFunctions([checkPixel, flip, euclid, euclidRGB])
        //.setOutput([width, height]);
        .setOutput([outWidth * width, outHeight * height]);


    const remapCurrent = gpu.createKernel(function(current, source, bigMap, mx, my, frame) {

        //let ttx = this.constants.width2 - this.thread.x - 1;
        let ttx = this.thread.x;
        let tty = this.thread.y;
        //let tty = this.constants.height2 - this.thread.y - 1;

        //let ox = this.constants.width - this.thread.x - 1;
        let ox = ttx;
        let oy = tty;
        //let oy = this.constants.height2 - this.thread.y - 1;
        // let tx = mx > -0.5 ? ttx : ttx * this.constants.width;
        // let ty = my > -0.5 ? tty : tty * this.constants.height;

        let ret = [current[flip(oy)][ox][0], current[flip(oy)][ox][1], current[flip(oy)][ox][2], current[flip(oy)][ox][3]];
        //if (length(ret) <= 0.001) {

        let sx = mx > -1 ? mx : 0;
        let sy = my > -1 ? my : 0;

        let n = 0;
        let nn = 2 * n + 1;
        let r = frame; // + Math.random() * nn;
        let framex = r % nn;
        let framey = Math.floor(r / nn);
        let ftx = n > 0.5 ? ((framex) % nn - n) : 0;
        let fty = n > 0.5 ? ((framey) % nn - n) : 0;
        // if (mx > -1) {
        //     tx = tx + ftx;
        //     ty = ty + fty;
        // } else {
        //     if (n > 0.5) {
        //         tx = (ttx - (ttx % nn) + ftx) * this.constants.width;
        //         ty = (tty - (tty % nn) + fty) * this.constants.height;
        //     }
        // }
        let tx = (ttx - (ttx % nn) + ftx) * this.constants.width;
        let ty = (tty - (tty % nn) + fty) * this.constants.height;

        if ((mx < 0 || my < 0) || (ox == mx && oy == my))
        {
            let validCount = 0;
            let good = true;
            {
                let n = 0;
                // let nn = 1;
                // let txo = tx;
                // let tyo = ty;
                {
                    for (let x = tx; x < tx + this.constants.width; x++) {
                        for (let y = ty; y < ty + this.constants.height; y++) {
                            for (let dx = -n; dx <= n; dx++) {
                                for (let dy = -n; dy <= n; dy++) {
                                    if (
                                        x + dx * this.constants.width >= 0 && x + dx * this.constants.width < this.constants.width  * this.constants.width2 &&
                                        y + dy * this.constants.height >= 0 && y + dy * this.constants.height < this.constants.height * this.constants.height2) {
                                        let aiv = bigMap[y - sy + dy * this.constants.height][x - sx + dx * this.constants.width];
                                        //let a = [source[ai * 4 + 0], source[ai * 4 + 1], source[ai * 4 + 2], source[ai * 4 + 3]];
                                        if (aiv[0] > 0.0) {
                                            //if (x - sx + dx == txo && y - sy + dy == tyo) {
                                            if (dx == 0 && dy == 0) {
                                                validCount += aiv[1];
                                            }
                                            //validCount2 += aiv[1];
                                        }
                                    }
                                }
                            }
                        }
                    }
                    //good = good && validCount2 >= 1.0;
                }
            }

            if (validCount <= 1.0e-6) {
            //if (!good) {
                //ret = [0, 0, 0, 0];
                // let ctx = tx + ftx;
                // let cty = ty + fty;
                let aiv = bigMap[ty + oy - sy][tx + ox - sx];
                let aix = aiv[2] % this.constants.width;
                let aiy = Math.floor(aiv[2] / this.constants.width);
                let aix2 = aix + ftx;
                let aiy2 = aiy + fty;
                if (aix2 >= 0 && aix2 < this.constants.width && aiy2 >= 0 && aiy2 < this.constants.height) {
                    let ai = aix2 + aiy2 * this.constants.width;
                    let a = source[ai * 4 + 0] / 255;
                    let b = source[ai * 4 + 1] / 255;
                    let c = source[ai * 4 + 2] / 255;
                    let d = source[ai * 4 + 3] / 255;
                    if (euclid(ret, [0, 0, 0, 0]) > 0.0) {
                        //ret = [a, b, c, d];
                    }
                }
                return ret;
            }
            //let rndCandidate = Math.floor(Math.random() * validCount);
            let rndCandidate = Math.random() * validCount;
            // let ctx = tx + ftx;
            // let cty = ty + fty;
            //let aiv = bigMap[ty + (tty - tty % n) - sy][tx + (ttx - ttx % n) - sx];
            //let aiv = bigMap[tty + fty - sy][ttx + ftx - sx];
            let aiv = bigMap[ty / this.constants.height - sy][tx / this.constants.width - sx];
            //let rndCandidate = aiv[3] * validCount;
            let validCount2 = 0;
            //let ret = [0, 0, 0, 0];
            {
                //let tx = tx + ftx;
                //let ty = ty + fty;
                for (let x = tx; x < tx + this.constants.width; x++) {
                    for (let y = ty; y < ty + this.constants.height; y++) {
                        let aiv = bigMap[y - sy][x - sx];
                        //let ai = aiv2[0];
                        if (aiv[0] > 0.0) {
                            validCount2 += aiv[1];
                            if (validCount2 >= rndCandidate) {
                                //ret = [source[aiv[0] * 4 + 0], source[aiv[0] * 4 + 1], source[aiv[0] * 4 + 2], source[aiv[0] * 4 + 3]];
                                //let ai = aiv[0] - 1;
                                //let ai = Math.max(0, aiv[0] - 1 + (n - tx % nn) + (n - ty % nn) * this.constants.width);
                                //let ai = Math.max(0, aiv[0] - 1 + (n - tx % nn) + (n - ty % nn) * this.constants.width);

                                let aix = (aiv[0] - 1) % this.constants.width;
                                let aiy = Math.floor((aiv[0] - 1) / this.constants.width);
                                let aix2 = aix - ftx;
                                let aiy2 = aiy - fty;
                                if (aix2 >= 0 && aix2 < this.constants.width && aiy2 >= 0 && aiy2 < this.constants.height) {
                                    let ai = aix2 + aiy2 * this.constants.width;
                                    let a = source[ai * 4 + 0] / 255;
                                    let b = source[ai * 4 + 1] / 255;
                                    let c = source[ai * 4 + 2] / 255;
                                    let d = source[ai * 4 + 3] / 255;
                                    //if (euclid(ret, [0, 0, 0, 0]) <= 0.0) {
                                        ret = [a, b, c, d];
                                    //}
                                    return ret;
                                } else {
                                    return ret;
                                }
                            }
                        }
                    }
                }
            }
        }
        return ret;
    },{
        constants: {
            width: width,
            height: height,
            width2: outWidth,
            height2: outHeight
        }
    })
        .setFunctions([flip, euclid])
        .setOutput([outWidth, outHeight]);

    const createCurrent = gpu.createKernel(function(source) {
        //this.color(0.0, 0.0, 0.0, 0.0);
        //this.color(source[0], source[1], source[2], source[3]);
        return [0.0, 0.0, 0.0, 0.0];
    })
        .setOutput([outWidth, outHeight]);

    let current = createCurrent(pixelData.data);

    //const x = Math.floor(Math.random() * width);
    //const y = Math.floor(Math.random() * height);
    //const y = height - 1;
    //const y2 = outHeight / 2;
    //for (let x2 = 0; x2 < outWidth; x2++) {
    let d = 1;

    // for (let y2 = outHeight / 2 - d; y2 < outHeight / 2 + d; y2++) {
    //     for (let x2 = outWidth / 2 - d; x2 < outWidth / 2 + d; x2++) {
    //         if (euclid([x2, y2, 0, 0], [outWidth / 2, outHeight / 2, 0, 0])) {
    //             continue;
    //         }
    //         let x = width / 2 + x2 - outWidth / 2 - d;
    //         let y = height / 2 + y2 - outHeight / 2 - d;
    //         current[y2][x2][0] = pixelData.data[(x + y * width) * 4 + 0] / 255;
    //         current[y2][x2][1] = pixelData.data[(x + y * width) * 4 + 1] / 255;
    //         current[y2][x2][2] = pixelData.data[(x + y * width) * 4 + 2] / 255;
    //         current[y2][x2][3] = pixelData.data[(x + y * width) * 4 + 3] / 255;
    //     }
    // }

    // const x = 0;
    // const y = 0;
    // const x2 = 0;
    // const y2 = 0;
    // current[y2][x2][0] = pixelData.data[(x + y * width) * 4 + 0] / 255;
    // current[y2][x2][1] = pixelData.data[(x + y * width) * 4 + 1] / 255;
    // current[y2][x2][2] = pixelData.data[(x + y * width) * 4 + 2] / 255;
    // current[y2][x2][3] = pixelData.data[(x + y * width) * 4 + 3] / 255;


    for (let y2 = outHeight - 1; y2 < outHeight; y2++) {
        for (let x2 = 0; x2 < outWidth; x2++) {
            let x = 0;
            let y = height - 1;
            current[y2][x2][0] = pixelData.data[(x + y * width) * 4 + 0] / 255;
            current[y2][x2][1] = pixelData.data[(x + y * width) * 4 + 1] / 255;
            current[y2][x2][2] = pixelData.data[(x + y * width) * 4 + 2] / 255;
            current[y2][x2][3] = pixelData.data[(x + y * width) * 4 + 3] / 255;
        }
    }

    //console.log("current", current);

    const superKernel = gpu.combineKernels(findNeighbours, remapCurrent, function(current, source, level, filled, evenodd, mx, my, frame) {
        return remapCurrent(current, source, findNeighbours(current, source, level, filled, evenodd, mx, my), mx, my, frame);
        //return findNeighbours(current, source);
    });

    function dump(current) {
        const data = current.flat();
        const canvas = document.body.appendChild(document.createElement('canvas'));
        canvas.width = outWidth;
        canvas.height = outHeight;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(outWidth, outHeight);
        //const imgData = ctx.getImageData(0, 0, outWidth, outHeight);
        //imgData.data = data;
        for (let i = 0; i < data.length; i += 1) {
            //console.log(data[i]);
            // data[i] = Math.random();
            // data[i+1] = Math.random();
            // data[i+2] = Math.random();
            imgData.data[i * 4] = Math.floor(data[i][0] * 255);
            imgData.data[i * 4 + 1] = Math.floor(data[i][1] * 255);
            imgData.data[i * 4 + 2] = Math.floor(data[i][2] * 255);
            imgData.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    let maxi = 2 * Math.max(outWidth, outHeight);
    for (let i = 0; i < outWidth * outHeight; i++) {
        const mx = i % outWidth;
        const my = Math.floor(i / outWidth);
        //current = superKernel(current, pixelData.data, 0, false, i % 4, -1, -1, i);
        // current = superKernel(current, pixelData.data, 0, true, i % 4, -1, -1, i + Math.floor(Math.random() * 3));
        current = superKernel(current, pixelData.data, 0, false, i % 4, -1, -1, i);
        //current = superKernel(current, pixelData.data, 0, true, i % 4, mx, my, i + Math.floor(Math.random() * 3));
        dump(current);
    }
    /*
    for (let i = 0; i < maxi; i++) {
        console.log("Iteration: " + i);
        //current = superKernel(current, pixelData.data, Math.floor(i * 7 / maxi));
        current = superKernel(current, pixelData.data, 0, false, i % 4);
        dump(current);
    }
    */
    /*for (let i = 0; i < maxi; i++) {
        console.log("Iteration: " + i);
        current = superKernel(current, pixelData.data, i, true, i % 4);
        //current = superKernel(current, pixelData.data, Math.floor(i * 7 / maxi));
        //current = superKernel(current, pixelData.data, 0, true);
    }*/
    dump(current);


    //console.log(pixelData.data);
    console.log("current", current);

    // const canvas = remapCurrent.canvas;
    // document.body.appendChild(canvas);
    // canvas.width = outWidth;
    // canvas.height = outHeight;
    //
    // document.body.appendChild(findNeighbours.canvas);
    // findNeighbours.canvas.width = outWidth * width;
    // findNeighbours.canvas.height = outHeight * height;

    document.body.appendChild(document.createElement('canvas'))
        .getContext('2d')
        .putImageData(pixelData, 0, 0);





}

$(main);
