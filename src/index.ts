'use strict'
const path = require("path")
const puppeteer = require("puppeteer")
const fs = require("fs")
const yaml = require("js-yaml")
const pug = require('pug');

interface ResumeData {
    name: string
    bannerTitle: string
    contact: {
        address?: string
        encodedAddress?: string
        email?: string
        phone?: string
        website?: string
        linkedin?: string
    }
    keySkills: Array<any>
    education: Array<any>
    certifications: Array<any>
    awards: Array<any>
    [key: string]: any
}

function parseCliArguments(argv: Array<string>): string | Error {
    let resumeDataPath: string
    resumeDataPath = process.argv[2]
    if (!resumeDataPath) {
        return Error('You must supply the file path to the file containing the resume data.')
    }
    return resumeDataPath
}

function getResumeData(filePath: string): ResumeData | Error {
    let resumeData: ResumeData
    try {
        resumeData = yaml.load(fs.readFileSync(resumeDataPath, 'utf8'))
    } catch (e) {
        return e
    }
    return resumeData
}

let resumeDataPath = parseCliArguments(process.argv)
if (resumeDataPath instanceof Error) {
    console.error('There was a problem parsing the CLI arguments')
    console.error(resumeDataPath)
    process.exit(1)
}

let resumeData = getResumeData(resumeDataPath)
if (resumeData instanceof Error) {
    console.error('There was a problem parsing the resume data in file ' + resumeDataPath)
    console.error(resumeData)
    process.exit(1)
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