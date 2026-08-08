import assert from "node:assert/strict"
import * as fs from "node:fs"
import * as path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import pug from "pug"
import { normalizeExperience, parseResumeData } from "./resume-data.js"
import { templateTypes } from "./types.js"

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

test("keeps grouped companies and role description lists", () => {
  assert.deepEqual(
    normalizeExperience([
      {
        company: "Example Company",
        timeFrame: "2020 - Present",
        roles: [
          {
            title: "Senior Engineer",
            focusArea: "Platform Reliability",
            details: ["Led platform delivery.", "Mentored engineers."],
          },
          { title: "Engineer", details: ["Built customer services."] },
        ],
      },
    ]),
    [
      {
        company: "Example Company",
        timeFrame: "2020 - Present",
        roles: [
          {
            title: "Senior Engineer",
            focusArea: "Platform Reliability",
            details: ["Led platform delivery.", "Mentored engineers."],
          },
          { title: "Engineer", details: ["Built customer services."] },
        ],
      },
    ],
  )
})

test("groups legacy entries by exact company name in first-seen order", () => {
  assert.deepEqual(
    normalizeExperience([
      {
        company: "First Company",
        title: "Lead Engineer",
        timeFrame: "2022 - Present",
        details: ["Led delivery."],
      },
      {
        company: "Second Company",
        title: "Engineer",
        timeFrame: "2021 - 2022",
        details: ["Built services."],
      },
      {
        company: "First Company",
        title: "Engineer",
        timeFrame: "2020 - 2022",
        details: ["Built the original platform."],
      },
    ]),
    [
      {
        company: "First Company",
        roles: [
          {
            title: "Lead Engineer",
            timeFrame: "2022 - Present",
            details: ["Led delivery."],
          },
          {
            title: "Engineer",
            timeFrame: "2020 - 2022",
            details: ["Built the original platform."],
          },
        ],
      },
      {
        company: "Second Company",
        roles: [
          {
            title: "Engineer",
            timeFrame: "2021 - 2022",
            details: ["Built services."],
          },
        ],
      },
    ],
  )
})

test("moves a legacy summary before existing details", () => {
  assert.deepEqual(
    normalizeExperience([
      {
        company: "Example Company",
        roles: [
          {
            title: "Engineer",
            summary: "Owned service delivery.",
            details: ["Reduced incidents."],
          },
        ],
      },
    ])[0]?.roles[0]?.details,
    ["Owned service delivery.", "Reduced incidents."],
  )
})

test("reports invalid fields with their YAML path", () => {
  assert.throws(
    () =>
      normalizeExperience([
        {
          company: "Example Company",
          roles: [{ title: "Engineer", details: "Not a list" }],
        },
      ]),
    /experience\[0\]\.roles\[0\]\.details must be a list of strings/,
  )
})

test("rejects conflicting company-level timeframes", () => {
  assert.throws(
    () =>
      normalizeExperience([
        {
          company: "Example Company",
          timeFrame: "2020 - Present",
          roles: [{ title: "Senior Engineer", details: [] }],
        },
        {
          company: "Example Company",
          timeFrame: "2019 - Present",
          roles: [{ title: "Engineer", details: [] }],
        },
      ]),
    /experience\[1\]\.timeFrame conflicts/,
  )
})

test("surfaces malformed YAML", () => {
  assert.throws(
    () => parseResumeData("experience:\n  - company: Example\n   roles:\n"),
    /bad indentation/,
  )
})

test("normalizes an omitted or blank experience section to an empty list", () => {
  assert.deepEqual(parseResumeData("name: Example").experience, [])
  assert.deepEqual(parseResumeData("name: Example\nexperience:").experience, [])
})

test("renders normalized content through every public template", () => {
  const resumeData = parseResumeData(
    fs.readFileSync(path.join(repositoryRoot, "exampleData.yaml"), "utf8"),
  )

  for (const template of templateTypes) {
    const html = pug.compileFile(
      path.join(repositoryRoot, "templates", `${template}.pug`),
    )(resumeData)

    assert.equal(
      html.split("Recognizable Corporation").length - 1,
      1,
      `${template} should render each company once`,
    )
    assert.match(html, /Mrs\. Manager/)
    assert.match(html, /Assistant to the Manager/)
    assert.match(html, /Experienced professional with over 15 years/)
    assert.doesNotMatch(html, /undefined/)
  }
})

test("embeds contact icons and grouped technologies in the simple template", () => {
  const resumeData = parseResumeData(
    fs.readFileSync(path.join(repositoryRoot, "exampleData.yaml"), "utf8"),
  )
  const html = pug.compileFile(
    path.join(repositoryRoot, "templates", "simple.pug"),
  )(resumeData)

  assert.equal(html.match(/class="contact-icon"/g)?.length, 5)
  assert.match(html, /Font Awesome Free 7\.3\.1/)
  assert.match(html, /Used Technologies/)
  assert.match(html, /class="technology-group-title">Languages:/)
  assert.match(html, />TypeScript, Go<\/span>/)
})
