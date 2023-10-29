import {ResumeData} from "./types";
import * as yaml from "js-yaml";
import * as fs from "fs"
import {LocalsObject} from "pug";

export function getResumeData (file: string): ResumeData {
    try {
        const resumeData = yaml.load(fs.readFileSync(file, 'utf8'))
        return resumeData as ResumeData

    } catch (e) {
        console.error('There was a problem reading resume data from file ' + file)
        console.error(e.toLocaleString())
        process.exit(1)
    }
}

export function compileHtml (compiledFunction: (locals?: LocalsObject) => string, resumeData: ResumeData): string {
    try {
        return compiledFunction(resumeData)
    } catch (e) {
        console.error('There was a problem compiling the pug template')
        console.error(e.toLocaleString())
        process.exit(1)
    }
}

export function extractFileName (resumeDataPath: string): string {
    const regex = '[A-Za-z0-9_\\-\\.]+(?=\\.[A-Za-z0-9]+$)'
    const filename = resumeDataPath.match(regex)
    if (!filename) {
        console.error('There was a problem extracting the file name from file path ' + resumeDataPath)
        process.exit(1)
    }
    return filename[0]
}