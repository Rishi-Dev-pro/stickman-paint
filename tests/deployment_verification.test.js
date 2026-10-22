/**
 * Production Deployment Verification Test Suite
 * Validates production entry point, asset resolution, script syntax,
 * zero localhost dependencies, and Vercel configuration integrity.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'app');

console.log('--- RUNNING VERCEL DEPLOYMENT VERIFICATION TEST SUITE ---');

// Test 1: Production Entry Point
console.log('Validating production entry point...');
const indexPath = path.join(APP_DIR, 'index.html');
assert.strictEqual(fs.existsSync(indexPath), true, 'app/index.html must exist as production entry point');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
assert.ok(indexHtml.includes('<!DOCTYPE html>'), 'index.html must be a valid HTML5 document');
assert.ok(indexHtml.includes('id="paper-sheet"'), 'Paper sheet container must be present in index.html');
assert.ok(indexHtml.includes('id="layers-container"'), 'Canvas layers container must be present in index.html');
assert.ok(indexHtml.includes('id="preview-canvas"'), 'Preview canvas must be present in index.html');
assert.ok(indexHtml.includes('id="stickman-actor"'), 'Stickman actor must be present in index.html');
console.log('✓ Test 1 Passed: Production entry point app/index.html verified');

// Test 2: Core Scripts Resolution & Syntax
console.log('Validating production script files...');
const requiredScripts = [
  'sprites.js',
  'stickman_character.js',
  'tricks.js',
  'paint.js'
];
for (const script of requiredScripts) {
  const scriptPath = path.join(APP_DIR, script);
  assert.strictEqual(fs.existsSync(scriptPath), true, `Required script ${script} must exist in app/`);
  const code = fs.readFileSync(scriptPath, 'utf8');
  assert.ok(code.length > 500, `${script} must not be empty`);
  // Verify basic syntax validity
  assert.doesNotThrow(() => {
    new Function(code);
  }, `Script ${script} must contain valid JavaScript syntax`);
}
console.log('✓ Test 2 Passed: All 4 production scripts exist and contain valid JavaScript syntax');

// Test 3: Core Stylesheet Resolution & Integrity
console.log('Validating production stylesheet...');
const cssPath = path.join(APP_DIR, 'style.css');
assert.strictEqual(fs.existsSync(cssPath), true, 'app/style.css must exist');
const cssContent = fs.readFileSync(cssPath, 'utf8');
assert.ok(cssContent.includes('.paint-app'), 'style.css must contain .paint-app rules');
assert.ok(cssContent.includes('.trick-gallery-modal'), 'style.css must contain .trick-gallery-modal rules');
assert.ok(cssContent.includes('.trick-playback-bar'), 'style.css must contain .trick-playback-bar rules');
console.log('✓ Test 3 Passed: Production stylesheet app/style.css verified');

// Test 4: Critical Sprite & Asset Resolution
console.log('Validating critical visual assets...');
const requiredAssets = [
  'stickman_idle.png',
  'stickman_drawing.png',
  'stickman_hover.png',
  'stickman_thinking.png',
  'warrior_bg.jpg'
];
for (const asset of requiredAssets) {
  const assetPath = path.join(APP_DIR, 'assets', asset);
  assert.strictEqual(fs.existsSync(assetPath), true, `Asset ${asset} must exist in app/assets/`);
  const stat = fs.statSync(assetPath);
  assert.ok(stat.size > 1000, `Asset ${asset} must be non-empty (size: ${stat.size} bytes)`);
}
console.log('✓ Test 4 Passed: All 5 critical production assets exist and are non-empty');

// Test 5: Zero Localhost / Local Filesystem Dependencies
console.log('Auditing codebase for localhost or local machine dependencies...');
const filesToAudit = [
  'app/index.html',
  'app/style.css',
  'app/paint.js',
  'app/tricks.js',
  'app/stickman_character.js',
  'app/sprites.js'
];
const forbiddenPatterns = [
  { name: 'localhost', regex: /localhost/i },
  { name: '127.0.0.1', regex: /127\.0\.0\.1/ },
  { name: 'Windows drive path', regex: /[A-Za-z]:\\[a-zA-Z0-9_]/ },
  { name: 'http:// scheme (non-secure)', regex: /http:\/\/(?!www\.w3\.org)/ }
];
for (const relFile of filesToAudit) {
  const content = fs.readFileSync(path.join(ROOT_DIR, relFile), 'utf8');
  for (const { name, regex } of forbiddenPatterns) {
    const match = content.match(regex);
    assert.strictEqual(match, null, `Forbidden pattern "${name}" found in ${relFile}: ${match ? match[0] : ''}`);
  }
}
console.log('✓ Test 5 Passed: Zero localhost, local drive, or insecure URLs found in production files');

// Test 6: Vercel Configuration Integrity
console.log('Validating vercel.json configuration...');
const vercelConfigPath = path.join(ROOT_DIR, 'vercel.json');
assert.strictEqual(fs.existsSync(vercelConfigPath), true, 'vercel.json must exist in root');
const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
assert.ok(vercelConfig.version === 2, 'vercel.json must specify version 2');
assert.ok(Array.isArray(vercelConfig.rewrites), 'vercel.json must define rewrites');
const rootRewrite = vercelConfig.rewrites.find(r => r.source === '/');
assert.ok(rootRewrite && rootRewrite.destination === '/app/index.html', 'vercel.json must rewrite "/" to "/app/index.html"');
console.log('✓ Test 6 Passed: vercel.json exists, is valid JSON, and routes correctly to app/index.html');

// Test 7: Package Configuration Integrity
console.log('Validating package.json configuration...');
const pkgPath = path.join(ROOT_DIR, 'package.json');
assert.strictEqual(fs.existsSync(pkgPath), true, 'package.json must exist in root');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
assert.ok(pkg.scripts && pkg.scripts.test, 'package.json must define a "test" script');
assert.ok(pkg.scripts.start, 'package.json must define a "start" script');
console.log('✓ Test 7 Passed: package.json exists and defines standard operational scripts');

// Test 8: Gitignore Integrity
console.log('Validating .gitignore...');
const gitignorePath = path.join(ROOT_DIR, '.gitignore');
assert.strictEqual(fs.existsSync(gitignorePath), true, '.gitignore must exist in root');
const gitignore = fs.readFileSync(gitignorePath, 'utf8');
assert.ok(gitignore.includes('node_modules'), '.gitignore must ignore node_modules');
assert.ok(gitignore.includes('.vercel'), '.gitignore must ignore .vercel');
console.log('✓ Test 8 Passed: .gitignore exists and covers node_modules and .vercel');

console.log('----------------------------------------------------');
console.log('ALL 8 DEPLOYMENT VERIFICATION TESTS PASSED!');
console.log('----------------------------------------------------');
