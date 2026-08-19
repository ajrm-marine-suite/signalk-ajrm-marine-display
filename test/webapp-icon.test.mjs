/** Verifies that Signal K can serve the Webapps catalogue icon. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));

test("appIcon resolves inside the served public directory", () => {
  const packageInfo = require("../package.json");
  const iconUrl = packageInfo.signalk?.appIcon;
  assert.match(iconUrl, /^\.\/[A-Za-z0-9._-]+$/);
  const iconPath = path.join(here, "..", "public", iconUrl.slice(2));
  assert.ok(fs.statSync(iconPath).size > 0, `${iconPath} must be a non-empty file`);
});
