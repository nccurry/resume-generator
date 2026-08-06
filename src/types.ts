export interface Arguments {
  [x: string]: unknown
  file: string
  f: string
  template: TemplateType
  t: TemplateType
  timezone: string
  z: string
  pdf: boolean
  p: boolean
  _: string[]
  $0: string
}
/**
 * Checks that an unknown yargs result contains the required generator options.
 * The CLI entry point uses this type guard before passing parsed values to `main`.
 */
export function isArguments(object: unknown): object is Arguments {
  return (
    object !== null &&
    typeof object === "object" &&
    "file" in object &&
    "template" in object &&
    "pdf" in object
  )
}

export interface CliArgs {
  resumeDataPath: string
  generatePdf: boolean
  templateName: TemplateType
}

export const templateTypes = ["green-columns", "man-page"] as const
export type TemplateType = (typeof templateTypes)[number]

/**
 * Checks whether a string names one of the supported Pug templates.
 * Callers can use this guard when accepting a template name outside yargs,
 * which already validates its CLI option against `templateTypes`.
 */
export function isTemplateType(str: string): str is TemplateType {
  return templateTypes.includes(str as TemplateType)
}

export interface ResumeData {
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
    details: string[] | null
  }
  projects: {
    companyType: string
    tagline: string
    additionalDetails: string[]
  }[]
  showGeneratedByFooter: boolean
}
