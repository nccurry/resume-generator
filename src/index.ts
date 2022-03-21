'use strict'
import {PDFOptions} from "puppeteer"
const path = require("path")
const puppeteer = require("puppeteer")
const fs = require("fs")
const yaml = require("js-yaml")
const pug = require('pug')

// Types

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
        companyType: string
        tagline: string
        additionaDetails: string[]
    }[]
}

interface cliArgs {
    resumeDataPath: string,
    generatePdf: boolean
}

// Helper functions

function parseCliArguments(argv: Array<string>): cliArgs {
    let cliArgs = {
        resumeDataPath: '',
        generatePdf: true
    }

    cliArgs.resumeDataPath = process.argv[2]
    if (!cliArgs.resumeDataPath) {
        console.error('You must supply the file path to the file containing the resume data.')
        process.exit(1)
    }

    if (argv[3]) {
        cliArgs.generatePdf = argv[3] === 'true'
    }

    return cliArgs
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

let extractFileName = function(resumeDataPath: string): string {
    let regex = '[A-Za-z0-9_\\-\\.]+(?=\\.[A-Za-z0-9]+$)'
    let filename = resumeDataPath.match(regex)
    if (!filename) {
        console.error('There was a problem extracting the file name from file path ' + resumeDataPath)
        process.exit(1)
    }
    return filename[0]
}

// Core logic

let args = parseCliArguments(process.argv)

let resumeData = getResumeData(args.resumeDataPath)

const compiledFunction = pug.compileFile(path.join(__dirname, '../templates/template.pug'))

let resumeHtml = compileHtml(compiledFunction, resumeData)

let fileName = extractFileName(args.resumeDataPath)

fs.writeFile(
  path.join(__dirname, `../dist/${fileName}.html`),
  resumeHtml,
  // Callback to conditionally generate a PDF in addition to the HTML file
  async () => {
      if (!args.generatePdf) {
          return
      }

      let pdfOptions: PDFOptions = {
          path: `${path.join(__dirname, `../dist/${fileName}.pdf`)}`,
          format: 'a4',
          pageRanges: '1',
          margin: {
              top: "0px",
              left: "0px",
              right: "0px",
              bottom: "0px"
          },
          printBackground: true
      }

      try {
          const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
          const page = await browser.newPage()
          await page.setContent(resumeHtml, { waitUntil: 'networkidle0' })
          await page.pdf(pdfOptions)
          await browser.close()
      } catch (e) {
          console.error(e)
          process.exit(1)
      }
  }
)