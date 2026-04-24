/**
 * Codemod: rewrite `pick(locale, arStr, enStr)` (3 args) → `pick(locale, arStr, enStr, trStr)` (4 args)
 *
 * - Only touches pick() CallExpressions with EXACTLY 3 args
 * - Only when the 2nd and 3rd args are StringLiteral or NoSubstitutionTemplateLiteral
 * - Looks up tr translation from scripts/tr-translations.json (keyed by English text)
 * - Preserves quote style of the 3rd (English) arg
 * - Skips (with reason logged) anything else
 *
 * Run: pnpm tsx scripts/add-tr-to-pick.ts
 */
import ts from 'typescript'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '..')
const SCAN_DIRS = ['app', 'components', 'lib', 'emails']
const EXTS = new Set(['.ts', '.tsx'])

const translations: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts/tr-translations.json'), 'utf8'),
)

type Edit = { start: number; end: number; text: string }

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

function escapeForQuote(text: string, quote: string): string {
  // quote is one of: "'" or '"' or '`'
  let escaped = text.replace(/\\/g, '\\\\')
  if (quote === "'") {
    escaped = escaped.replace(/'/g, "\\'")
  } else if (quote === '"') {
    escaped = escaped.replace(/"/g, '\\"')
  } else if (quote === '`') {
    escaped = escaped.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
  }
  // Preserve newlines literally for backticks; escape them for '/"
  if (quote !== '`') {
    escaped = escaped.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
  }
  return quote + escaped + quote
}

function processFile(filePath: string, stats: Stats) {
  const source = fs.readFileSync(filePath, 'utf8')
  if (!source.includes('pick(')) return

  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits: Edit[] = []

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const expr = node.expression
      if (ts.isIdentifier(expr) && expr.text === 'pick') {
        const args = node.arguments
        if (args.length === 3) {
          const [, arArg, enArg] = args
          const isStr = (n: ts.Node): n is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral =>
            ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)
          if (isStr(arArg) && isStr(enArg)) {
            const enText = enArg.text
            if (!(enText in translations)) {
              stats.skipped.push({ file: filePath, reason: 'no translation for EN text', text: enText })
              return ts.forEachChild(node, visit)
            }
            const trText = translations[enText]
            // Determine quote from enArg's raw text
            const enRaw = enArg.getText(sf)
            const quote = enRaw[0] // ', ", or `
            const trLiteral = escapeForQuote(trText, quote)
            // Insert ", <trLiteral>" right before the closing paren
            const insertPos = enArg.getEnd()
            edits.push({ start: insertPos, end: insertPos, text: `, ${trLiteral}` })
            stats.replaced++
          } else {
            stats.skipped.push({
              file: filePath,
              reason: 'non-literal args (template/expr)',
              text: enArg.getText(sf),
            })
          }
        } else if (args.length === 4) {
          stats.alreadyDone++
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  if (edits.length === 0) return
  edits.sort((a, b) => b.start - a.start)
  let out = source
  for (const e of edits) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end)
  }
  fs.writeFileSync(filePath, out)
  stats.filesModified++
}

type Stats = {
  filesModified: number
  replaced: number
  alreadyDone: number
  skipped: { file: string; reason: string; text: string }[]
}

function main() {
  const stats: Stats = { filesModified: 0, replaced: 0, alreadyDone: 0, skipped: [] }
  const files: string[] = []
  for (const d of SCAN_DIRS) files.push(...collectFiles(path.join(ROOT, d)))

  for (const f of files) {
    try {
      processFile(f, stats)
    } catch (err) {
      stats.skipped.push({ file: f, reason: `error: ${(err as Error).message}`, text: '' })
    }
  }

  console.log('Files modified:', stats.filesModified)
  console.log('Replacements:', stats.replaced)
  console.log('Already 4-arg (skipped):', stats.alreadyDone)
  console.log('Skipped (non-literal or other):', stats.skipped.length)
  if (stats.skipped.length) {
    const byReason: Record<string, number> = {}
    for (const s of stats.skipped) byReason[s.reason] = (byReason[s.reason] ?? 0) + 1
    console.log('  Reasons:', byReason)
    // Dump first few
    for (const s of stats.skipped.slice(0, 10)) {
      console.log('  -', s.file, '|', s.reason, '|', s.text.slice(0, 80))
    }
  }
}

main()
