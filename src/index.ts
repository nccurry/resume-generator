'use strict'
import { PDFOptions } from "puppeteer"
import * as path from "path"
import * as puppeteer from "puppeteer"
import * as fs from "fs"
import * as yaml from "js-yaml"
import * as pug from "pug"
import {LocalsObject} from "pug";

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
    showGeneratedByFooter: boolean
}

interface CliArgs {
    resumeDataPath: string,
    generatePdf: boolean
}

// Helper functions

function parseCliArguments (argv: string[]): CliArgs {
    const cliArgs = {
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

function getResumeData (filePath: string): ResumeData {
    try {
        const resumeData = yaml.load(fs.readFileSync(filePath, 'utf8'))
        return resumeData as ResumeData

    } catch (e) {
        console.error('There was a problem reading resume data from file ' + filePath)
        console.error(e)
        process.exit(1)
    }
}

function compileHtml (compiledFunction: (locals?: LocalsObject) => string, resumeData: ResumeData): string {
    try {
        return compiledFunction(resumeData)
    } catch (e) {
        console.error('There was a problem compiling the resume pug template templates/template.pug')
        console.error(e)
        process.exit(1)
    }
}

function extractFileName (resumeDataPath: string): string {
    const regex = '[A-Za-z0-9_\\-\\.]+(?=\\.[A-Za-z0-9]+$)'
    const filename = resumeDataPath.match(regex)
    if (!filename) {
        console.error('There was a problem extracting the file name from file path ' + resumeDataPath)
        process.exit(1)
    }
    return filename[0]
}

// Core logic

const args = parseCliArguments(process.argv)

const resumeData = getResumeData(args.resumeDataPath)

const compiledFunction = pug.compileFile(path.join(__dirname, '../templates/template.pug'))

const resumeHtml = compileHtml(compiledFunction, resumeData)

const fileName = extractFileName(args.resumeDataPath)

const cstTime = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
const timestamp = new Date(cstTime).toJSON().slice(0,10)

fs.writeFile(
  path.join(__dirname, `../dist/${fileName}-${timestamp}.html`),
  resumeHtml,
  // Callback to conditionally generate a PDF in addition to the HTML file
  async () => {
      if (!args.generatePdf) {
          return
      }

      const pdfOptions: PDFOptions = {
          path: `${path.join(__dirname, `../dist/${fileName}-${timestamp}.pdf`)}`,
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