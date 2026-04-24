/**
 * Extract all pick(locale, arStr, enStr) calls with exactly 3 args.
 * Only handles string-literal or no-substitution-template-literal args.
 * Outputs JSON: [{ file, enText, quote, kind }, ...]
 *
 * Run: pnpm tsx scripts/extract-pick-strings.ts
 */
import ts from 'typescript'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '..')
const SCAN_DIRS = ['app', 'components', 'lib', 'emails']
const EXTS = new Set(['.ts', '.tsx'])

function collectFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue
      collectFiles(p, out)
    } else if (EXTS.has(path.extname(entry.name))) {
      out.push(p)
    }
  }
  return out
}

type Occurrence = {
  file: string
  line: number
  enText: string
  arText: string
  // serialized quote info to faithfully reconstruct
}

const all: Occurrence[] = []
const uniqueEn = new Set<string>()

for (const dir of SCAN_DIRS) {
  const files = collectFiles(path.join(ROOT, dir))
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8')
    if (!src.includes('pick(')) continue
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const expr = node.expression
        if (ts.isIdentifier(expr) && expr.text === 'pick') {
          const args = node.arguments
          if (args.length === 3) {
            const [locArg, arArg, enArg] = args
            const isStr = (n: ts.Node): n is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral =>
              ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)
            if (isStr(arArg) && isStr(enArg)) {
              const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
              all.push({ file: path.relative(ROOT, file), line: line + 1, enText: enArg.text, arText: arArg.text })
              uniqueEn.add(enArg.text)
            }
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }
}

fs.writeFileSync(path.join(ROOT, 'scripts/pick-occurrences.json'), JSON.stringify(all, null, 2))
fs.writeFileSync(path.join(ROOT, 'scripts/pick-unique-en.json'), JSON.stringify([...uniqueEn].sort(), null, 2))

console.log(`Total occurrences: ${all.length}`)
console.log(`Unique English strings: ${uniqueEn.size}`)
console.log(`Files touched: ${new Set(all.map((o) => o.file)).size}`)
