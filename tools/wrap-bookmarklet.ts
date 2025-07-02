import { readFileSync, writeFileSync } from 'fs'

const js = readFileSync('dist/bookmarklet.js', 'utf-8')
const wrapped = `javascript:(()=>{${js.replace(/\n/g, '')}})();`
writeFileSync('dist/bookmarklet.final.js', wrapped)
console.log('Bookmarklet created: dist/bookmarklet.final.js')
