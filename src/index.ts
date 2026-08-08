import * as fs from "node:fs/promises"
import * as path from "node:path"
import pug from "pug"
import puppeteer, { type PDFOptions } from "puppeteer"
import yargs from "yargs"
import { getResumeData } from "./resume-data.js"
import { type Arguments, isArguments, templateTypes } from "./types.js"
import { compileHtml, extractFileName } from "./utils.js"

const argv = yargs(process.argv.slice(2))
  .option("template", {
    alias: "t",
    type: "string",
    description: "The resume template to use",
    choices: templateTypes,
    default: templateTypes[0],
  })
  .option("pdf", {
    alias: "p",
    type: "boolean",
    description: "Whether to generate a PDF",
    default: true,
  })
  .option("file", {
    alias: "f",
    type: "string",
    description: "The path to the resume data YAML file",
  })
  .option("timezone", {
    alias: "z",
    type: "string",
    description: "The timezone to use when generating timestamps",
    default: "America/Chicago",
  })
  .demandOption(["file"])
  .parseSync()

/**
 * Generates the requested resume outputs from validated CLI arguments.
 * The CLI entry point calls this after `isArguments` confirms the yargs result;
 * it always writes HTML and optionally launches Puppeteer to write a PDF.
 */
async function main(arguments_: Arguments): Promise<void> {
  const resumeData = getResumeData(arguments_.file)
  const compiledFunction = pug.compileFile(
    path.join(import.meta.dirname, `../templates/${arguments_.template}.pug`),
  )
  const resumeHtml = compileHtml(compiledFunction, resumeData)
  const fileName = extractFileName(arguments_.file)
  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: arguments_.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  )
  const timestamp = `${dateParts.year}-${dateParts.month}-${dateParts.day}`
  const outputDirectory = path.join(import.meta.dirname, "../dist")
  const outputBase = path.join(outputDirectory, `${fileName}-${timestamp}`)

  await fs.mkdir(outputDirectory, { recursive: true })
  await fs.writeFile(`${outputBase}.html`, resumeHtml)

  if (!arguments_.pdf) {
    return
  }

  const pdfOptions: PDFOptions = {
    path: `${outputBase}.pdf`,
    format: "a4",
    pageRanges: arguments_.template === "simple" ? undefined : "1",
    margin: {
      top: "0px",
      left: "0px",
      right: "0px",
      bottom: "0px",
    },
    preferCSSPageSize: arguments_.template === "simple",
    printBackground: true,
  }

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(resumeHtml, { waitUntil: "load" })
    await page.waitForNetworkIdle()
    await page.pdf(pdfOptions)
  } finally {
    await browser.close()
  }
}

if (isArguments(argv)) {
  try {
    await main(argv)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
} else {
  console.error("Got invalid CLI arguments")
  process.exitCode = 1
}
