'use strict'
import {PDFOptions} from "puppeteer";
const path = require("path")
const puppeteer = require("puppeteer")
const fs = require("fs")
const yaml = require("js-yaml")
const pug = require('pug');

// Types and helper functions

interface ResumeData {
    name: string
    bannerTitle: string
    contactInfo: {
        value: string
        faIconClass: string
        link: string
    }[]
    keySkills: {
        title: string
        details: string
    }[]
    education: {
        school: string
        years: string
        degree: string
        additionalDetails: string[]
    }[]
    certifications: {
        company: string
        id: string
        link: string
        list: string[]
    }[]
    experience: {
        company: string
        title: string
        timeFrame: string
        details: string[]
    }
    projects: {
        headline: string
        additionaDetails: string[]
    }[]
}

interface cliArgs {
    resumeDataPath: string,
    generatePdf: boolean
}

function parseCliArguments(argv: Array<string>): cliArgs {
    let resumeDataPath: string
    resumeDataPath = process.argv[2]
    if (!resumeDataPath) {
        console.error('You must supply the file path to the file containing the resume data.')
        process.exit(1)
    }

    let generatePdf: boolean
    if (generatePdf) {
        generatePdf = argv[3] === 'true'
    } else {
        generatePdf = true
    }

    return { resumeDataPath, generatePdf }
}

function getResumeData(filePath: string): ResumeData {
    let resumeData: ResumeData
    try {
        resumeData = yaml.load(fs.readFileSync(filePath, 'utf8'))
    } catch (e) {
        console.error('There was a problem reading resume data from file ' + filePath)
        console.error(e)
        process.exit(1)
    }
    return resumeData
}

let pdfOptions: PDFOptions = {
    path: `${path.join(__dirname, '../dist/resume.pdf')}`,
    format: 'a4',
    margin: {
        top: "0px",
        left: "0px",
        right: "0px",
        bottom: "0px"
    },
    printBackground: true
}

let generatePdf = function (generate: boolean) {
    // https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#pagepdfoptions

    if (generate) {
        (async () => {
            try {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.goto(
                    `file:${path.join(__dirname, '../dist/resume.html')}`,
                    { waitUntil: 'networkidle0'}
                );
                await page.pdf(pdfOptions);
                await browser.close();
            } catch (e) {
                console.log(e)
                process.exit(1)
            }
        })()
    }
}

let compileHtml = function (compiledFunction: Function, resumeData: ResumeData): string {
    let resumeHtml: string
    try {
        resumeHtml = compiledFunction(resumeData)
    } catch (e) {
        console.error('There was a problem compiling the resume pug template templates/template.pug')
        console.error(e)
        process.exit(1)
    }

    return resumeHtml
}

// Core logic

let args = parseCliArguments(process.argv)

let resumeData = getResumeData(args.resumeDataPath)

const compiledFunction = pug.compileFile(path.join(__dirname, '../templates/template.pug'))

let resumeHtml = compileHtml(compiledFunction, resumeData)

fs.writeFile(
    path.join(__dirname, '../dist/resume.html'),
    resumeHtml,
    generatePdf
)