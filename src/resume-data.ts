import * as fs from "node:fs"
import { load } from "js-yaml"
import type { ExperienceCompany, ExperienceRole, ResumeData } from "./types.js"

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function requiredString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${path} must be a non-empty string`)
  }
  return value
}

function optionalString(value: unknown, path: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  return requiredString(value, path)
}

function stringList(value: unknown, path: string): string[] {
  if (value === undefined || value === null) {
    return []
  }
  if (!Array.isArray(value)) {
    throw new TypeError(`${path} must be a list of strings`)
  }
  return value.map((item, index) => requiredString(item, `${path}[${index}]`))
}

function normalizeRole(value: unknown, path: string): ExperienceRole {
  if (!isRecord(value)) {
    throw new TypeError(`${path} must be an object`)
  }

  const summary = optionalString(value.summary, `${path}.summary`)
  const details = stringList(value.details, `${path}.details`)
  const focusArea = optionalString(value.focusArea, `${path}.focusArea`)
  const timeFrame = optionalString(value.timeFrame, `${path}.timeFrame`)

  return {
    title: requiredString(value.title, `${path}.title`),
    ...(focusArea ? { focusArea } : {}),
    ...(timeFrame ? { timeFrame } : {}),
    details: summary ? [summary, ...details] : details,
  }
}

/**
 * Converts supported YAML experience shapes into the company-grouped render
 * model. Legacy flat entries are grouped by exact company name in first-seen
 * order, while their dates remain attached to their roles.
 */
export function normalizeExperience(value: unknown): ExperienceCompany[] {
  if (!Array.isArray(value)) {
    throw new TypeError("experience must be a list")
  }

  const companies = new Map<string, ExperienceCompany>()

  for (const [index, entry] of value.entries()) {
    const path = `experience[${index}]`
    if (!isRecord(entry)) {
      throw new TypeError(`${path} must be an object`)
    }

    const company = requiredString(entry.company, `${path}.company`)
    let normalizedCompany = companies.get(company)
    if (!normalizedCompany) {
      normalizedCompany = { company, roles: [] }
      companies.set(company, normalizedCompany)
    }

    if (entry.roles !== undefined) {
      if (!Array.isArray(entry.roles) || entry.roles.length === 0) {
        throw new TypeError(`${path}.roles must be a non-empty list`)
      }

      const timeFrame = optionalString(entry.timeFrame, `${path}.timeFrame`)
      if (
        normalizedCompany.timeFrame &&
        timeFrame &&
        normalizedCompany.timeFrame !== timeFrame
      ) {
        throw new TypeError(
          `${path}.timeFrame conflicts with another ${company} company entry`,
        )
      }
      if (timeFrame) {
        normalizedCompany.timeFrame = timeFrame
      }

      normalizedCompany.roles.push(
        ...entry.roles.map((role, roleIndex) =>
          normalizeRole(role, `${path}.roles[${roleIndex}]`),
        ),
      )
      continue
    }

    normalizedCompany.roles.push(normalizeRole(entry, path))
  }

  return [...companies.values()]
}

/** Parses YAML and normalizes it into the render model. */
export function parseResumeData(source: string): ResumeData {
  const parsed = load(source)
  if (!isRecord(parsed)) {
    throw new TypeError("resume data must be an object")
  }
  return {
    ...parsed,
    experience:
      parsed.experience === undefined || parsed.experience === null
        ? []
        : normalizeExperience(parsed.experience),
  } as unknown as ResumeData
}

/**
 * Reads and parses resume data from a YAML file.
 * `main` uses this before template compilation and reports a fatal CLI error when
 * the file cannot be read or parsed.
 */
export function getResumeData(file: string): ResumeData {
  try {
    return parseResumeData(fs.readFileSync(file, "utf8"))
  } catch (e) {
    console.error(`There was a problem reading resume data from file ${file}`)
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
}
