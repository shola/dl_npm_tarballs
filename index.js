'use strict';

const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const download = require('download');
const exec = require('child_process').exec;

module.exports = downloadPackages;

async function downloadPackages(count = 10, callback) {
    if (count > 36) {
        console.error(
            'ERROR: Pagination only allows the top 36 depended on NPM modules to be returned.'
        );
        return;
    }
    const url = 'https://www.npmjs.com/browse/depended';
    const packageListPromise = await new Promise((resolve, reject) => {
        request(url, (err, resp, html) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                const $ = cheerio.load(html);
                const $packages = $('.package-details a.name');
                const $top10packages = $packages.slice(0, count);
                const packageNames = $top10packages.map((i, el) => el.firstChild.data);
                resolve(Array.from(packageNames));
            }
        });
    });

    const tarballsPromise = packageListPromise.map(async pkg => {
        const url = `https://registry.npmjs.org/${pkg}/latest`;
        const tarballUrl = await new Promise((resolve, reject) => {
            request(url, (err, resp, body) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    const metaData = JSON.parse(body);
                    resolve(metaData.dist.tarball);
                }
            });
        });
        const data = await download(tarballUrl);
        const writeData = await new Promise((resolve, reject) => {
            fs.writeFile(`packages/${pkg}.tgz`, data, function(err) {
                if (!err) {
                    resolve(`${pkg}.tgz was properly downloaded`);
                } else {
                    reject(err);
                }
            });
        });

        if (!fs.existsSync(`packages/${pkg}`)) {
            fs.mkdirSync(`packages/${pkg}`);
        }

        const extractTarball = await new Promise((resolve, reject) => {
            exec(
                `tar xfv packages/${pkg}.tgz -C  packages/${pkg} --strip-components=1`,
                (err, stdout, stderr) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(`${pkg} was properly extracted`);
                    }
                }
            );
        });
        const removeTarball = await new Promise((resolve, reject) => {
            exec(`rm packages/${pkg}.tgz `, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(`${pkg}.tgz was cleaned up`);
                }
            });
        });
    });
    return Promise.all(tarballsPromise)
        .then(values => {
            if (values.every(v => v === undefined)) {
                callback(undefined, undefined);
            }
        })
        .catch(err => console.error(err));
}
