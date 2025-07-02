#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const inputPath = path.join(__dirname, '../dist/bookmarklet.js')
const outputPath = path.join(__dirname, '../dist/bookmarklet.wrapped.js')

if (!fs.existsSync(inputPath)) {
  console.error('❌ Error: dist/bookmarklet.js not found. Run `npm run build` first.')
  process.exit(1)
}

const js = fs.readFileSync(inputPath, 'utf-8')
const wrapped = `javascript:(()=>{${js.replace(/\n/g, '')}})();`
fs.writeFileSync(outputPath, wrapped)

console.log('✅ Bookmarklet created at dist/bookmarklet.wrapped.js')
