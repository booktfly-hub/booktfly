/**
 * Codemod: rewrite `isAr ? <arStr> : <enStr>` → `pick(locale, <arStr>, <enStr>)`
 * and add `import { pick } from '@/lib/i18n-helpers'` when needed.
 *
 * Run: pnpm tsx scripts/codemod-isar-to-pick.ts
 */
import ts from 'typescript'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '..')
const SCAN_DIRS = ['app', 'components', 'lib', 'emails']
const EXTS = new Set(['.ts', '.tsx'])

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

function processFile(filePath: string): { changed: boolean; count: number; err?: string } {
  const source = fs.readFileSync(filePath, 'utf8')
  if (!source.includes('isAr')) return { changed: false, count: 0 }

  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits: Edit[] = []

  const isStringish = (n: ts.Node): boolean =>
    ts.isStringLiteral(n) ||
    ts.isNoSubstitutionTemplateLiteral(n) ||
    ts.isTemplateExpression(n)

  const visit = (node: ts.Node) => {
    if (ts.isConditionalExpression(node)) {
      const cond = node.condition
      const isArRef =
        (ts.isIdentifier(cond) && cond.text === 'isAr') ||
        // also match "!isEn" style? keep simple — only isAr
        false
      if (isArRef && isStringish(node.whenTrue) && isStringish(node.whenFalse)) {
        const arText = node.whenTrue.getText(sf)
        const enText = node.whenFalse.getText(sf)
        edits.push({
          start: node.getStart(sf),
          end: node.getEnd(),
          text: `pick(locale, ${arText}, ${enText})`,
        })
        return
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)

  if (edits.length === 0) return { changed: false, count: 0 }

  edits.sort((a, b) => b.start - a.start)
  let result = source
  for (const e of edits) result = result.slice(0, e.start) + e.text + result.slice(e.end)

  if (!/from\s+['"]@\/lib\/i18n-helpers['"]/.test(result)) {
    const importLine = `import { pick } from '@/lib/i18n-helpers'\n`
    const match = result.match(/^(?:(['"]use client['"];?\s*\n)?(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\n|\s*\n)*)/)
    const prefixLen = match ? match[0].length : 0
    result = result.slice(0, prefixLen) + importLine + result.slice(prefixLen)
  }

  const hasLocaleInScope =
    /\blocale\s*[:=]/.test(source) || /\buseLocale\s*\(/.test(source)

  if (!hasLocaleInScope) {
    return { changed: false, count: 0, err: 'locale not in scope — manual fix needed' }
  }

  fs.writeFileSync(filePath, result, 'utf8')
  return { changed: true, count: edits.length }
}

function main() {
  const files: string[] = []
  for (const d of SCAN_DIRS) collectFiles(path.join(ROOT, d), files)

  let totalChanged = 0
  let totalEdits = 0
  const skipped: { file: string; err: string }[] = []

  for (const f of files) {
    try {
      const { changed, count, err } = processFile(f)
      if (err) skipped.push({ file: path.relative(ROOT, f), err })
      if (changed) {
        totalChanged++
        totalEdits += count
        console.log(`✓ ${path.relative(ROOT, f)} (${count} edits)`)
      }
    } catch (e) {
      skipped.push({ file: path.relative(ROOT, f), err: (e as Error).message })
    }
  }

  console.log(`\n${totalChanged} files changed, ${totalEdits} total replacements`)
  if (skipped.length) {
    console.log(`\n${skipped.length} files skipped:`)
    skipped.forEach((s) => console.log(`  - ${s.file}: ${s.err}`))
  }
}

main()
