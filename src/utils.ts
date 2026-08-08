import type { LocalsObject } from "pug"
import type { ResumeData } from "./types.js"

/**
 * Applies parsed resume data to a compiled Pug template and returns its HTML.
 * `main` uses this after `pug.compileFile`; template failures terminate the CLI
 * with a useful error instead of producing a partial output file.
 */
export function compileHtml(
  compiledFunction: (locals?: LocalsObject) => string,
  resumeData: ResumeData,
): string {
  try {
    return compiledFunction(resumeData)
  } catch (e) {
    console.error("There was a problem compiling the pug template")
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}

/**
 * Extracts the source YAML basename without its extension.
 * `main` uses the result as the prefix for timestamped HTML and PDF filenames.
 */
export function extractFileName(resumeDataPath: string): string {
  const regex = "[A-Za-z0-9_\\-\\.]+(?=\\.[A-Za-z0-9]+$)"
  const filename = resumeDataPath.match(regex)
  if (!filename) {
    console.error(
      "There was a problem extracting the file name from file path " +
        resumeDataPath,
    )
    process.exit(1)
  }
  return filename[0]
}
