const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const packageInfo = require(path.join(root, "package.json"));
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const sourceIndex = fs.readFileSync(path.join(root, "src", "web", "index.html"), "utf8");
const refreshController = fs.readFileSync(
  path.join(root, "src", "web", "assets", "scripts", "app-refresh-controller.mjs"),
  "utf8",
);

assert.match(packageInfo.version, /^\d+\.\d+\.\d+$/);
assert.equal(packageInfo.main, "plugin/index.js");
assert.ok(packageInfo.keywords.includes("signalk-node-server-plugin"));
assert.ok(packageInfo.keywords.includes("signalk-webapp"));
assert.equal(packageInfo["signalk-plugin-enabled-by-default"], true);
assert.equal(packageInfo.signalk.displayName, "AJRM Marine Display");
assert.equal(packageInfo.signalk.appIcon, "./assets/icon-120.png");
assert.ok(fs.existsSync(path.join(root, "plugin", "lib", "compatibility.js")));
assert.ok(fs.existsSync(path.join(root, "src", "web", "assets", "ne_10m_land.pmtiles")));
assert.ok(fs.existsSync(path.join(root, "src", "shared", "target-model.mjs")));
assert.ok(fs.existsSync(path.join(root, "public", "index.html")));
assert.ok(
  fs.readdirSync(path.join(root, "public", "assets")).some((file) => file.endsWith(".js")),
);
assert.match(
  sourceIndex,
  new RegExp(`AJRM_MARINE_WEBAPP_VERSION = "${packageInfo.version.replaceAll(".", "\\.")}"`),
);
assert.match(sourceIndex, /AJRM Marine Display Help/);
assert.match(sourceIndex, /id="displayAudioModeLabel"[\s\S]*Sounds/);
assert.match(refreshController, /applyEngineTargetProjection/);
assert.doesNotMatch(refreshController, /updateDerivedData/);
assert.match(readme, /AJRM Marine architecture/i);
assert.match(readme, /without Traffic Core/i);

console.log("AJRM Marine Display v2 package shape is valid.");
