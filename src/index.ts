'use strict';
let path = require("path")
let puppeteer = require("puppeteer")
let fs = require("fs")
let yaml = require("js-yaml")

// Parse CLI arguments
let resumeDataPath: String
resumeDataPath = process.argv[2]
if (!resumeDataPath) {
    throw new Error('You must supply the file path to the file containing the resume data.')
}

// Generate html from yaml
try {
  const doc = yaml.load(fs.readFileSync('/home/ixti/example.yml', 'utf8'));
  console.log(doc);
} catch (e) {
  console.log(e);
}

// https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#pagepdfoptions

(async() => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(
    `file:${path.join(__dirname, 'template.html')}`,
    { waitUntil: 'networkidle0'}
    );
    await page.pdf({
        path: 'test.pdf',
        format: 'A4',
        margin: {
            top: "0px",
            left: "0px",
            right: "0px",
            bottom: "0px"
        },
        printBackground: true
    });
    await browser.close();
})();