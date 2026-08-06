import { join } from "node:path"

/** @type {import("puppeteer").Configuration} */
export default {
  cacheDirectory: join(import.meta.dirname, ".cache", "puppeteer"),
}
