'use strict'
import { PDFOptions } from "puppeteer"
import * as path from "path"
import * as puppeteer from "puppeteer"
import * as fs from "fs"
import * as pug from "pug"
import {templateTypes, Arguments, isArguments} from "./types"
import * as yargs from "yargs"
import {compileHtml, extractFileName, getResumeData} from "./utils";

const argv = yargs(process.argv.slice(2))
    .option('template', {
        alias: 't',
        type: 'string',
        description: 'The resume template to use',
        choices: templateTypes,
        default: templateTypes[0]
    })
    .option('pdf', {
        alias: 'p',
        type: 'boolean',
        description: 'Whether to generate a pdf',
        default: true
    })
    .option('file', {
        alias: 'f',
        type: 'string',
        description: 'The path to the resume data YAML file'
    })
    .option('timezone', {
        alias: 'z',
        type: 'string',
        description: 'The timezone to use when generating timestamps',
        default: 'America/Chicago'
    })
    .demandOption(['file'])
    .parseSync()

function main (argv: Arguments) {
    const resumeData = getResumeData(argv.file)

    const compiledFunction = pug.compileFile(path.join(__dirname, `../templates/${argv.template}.pug`))

    const resumeHtml = compileHtml(compiledFunction, resumeData)

    const fileName = extractFileName(argv.file)

    const cstTime = new Date().toLocaleString("en-US", { timeZone: argv.timezone });
    const timestamp = new Date(cstTime).toJSON().slice(0,10)

    fs.writeFile(
        path.join(__dirname, `../dist/${fileName}-${timestamp}.html`),
        resumeHtml,
        // Callback to conditionally generate a PDF in addition to the HTML file
        async () => {
            if (!argv.pdf) {
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
}

if (isArguments(argv)) {
    main(argv)
} else {
    console.error("Got invalid CLI arguments")
    process.exit(1)
}
