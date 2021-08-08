'use strict'
import {write} from "fs";
import {callbackify} from "util";

const path = require("path")
const puppeteer = require("puppeteer")
const fs = require("fs")
const yaml = require("js-yaml")
const pug = require('pug');

// Parse CLI arguments
let resumeDataPath: String
resumeDataPath = process.argv[2]
if (!resumeDataPath) {
    throw new Error('You must supply the file path to the file containing the resume data.')
}

// Generate html from yaml
let resumeData: Object
try {
  resumeData = yaml.load(fs.readFileSync(resumeDataPath, 'utf8'))
} catch (e) {
  console.error('There was a problem parsing ' + resumeDataPath)
  throw new Error(e)
}

const compiledFunction = pug.compileFile(path.join(__dirname, '../templates/template.pug'))

let resumeHtml: string
try {
  resumeHtml = compiledFunction(resumeData)
} catch (e) {
    console.error('There was a problem compiling the template')
    throw new Error(e)
}

let generatePdf = function () {
    console.log('test')
}

fs.writeFile(path.join(__dirname, '../dist/resume.html'), resumeHtml, generatePdf)


// https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#pagepdfoptions
//
// (async() => {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(
//     `file:${path.join(__dirname, 'template.html')}`,
//     { waitUntil: 'networkidle0'}
//     );
//     await page.pdf({
//         path: 'test.pdf',
//         format: 'A4',
//         margin: {
//             top: "0px",
//             left: "0px",
//             right: "0px",
//             bottom: "0px"
//         },
//         printBackground: true
//     });
//     await browser.close();
// })();

export {}