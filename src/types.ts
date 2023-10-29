export interface Arguments  {
    [x: string]: unknown
    file: string,
    f: string,
    template: TemplateType,
    t: TemplateType,
    timezone: string,
    z: string,
    pdf: boolean,
    p: boolean,
    _: string[]
    $0: string
}
export function isArguments(object: any): object is Arguments {
    return 'file' in object
        && 'template' in object
        && 'pdf' in object
}

export interface CliArgs {
    resumeDataPath: string,
    generatePdf: boolean,
    templateName: TemplateType
}

export const templateTypes = ['green-columns', 'man-page'] as const
export type TemplateType = typeof templateTypes[number]
export function isTemplateType(str: string): str is TemplateType {
    return !!templateTypes.find((templateType) => str === templateType)
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
        details: string[]
    }
    projects: {
        companyType: string
        tagline: string
        additionalDetails: string[]
    }[]
    showGeneratedByFooter: boolean
}