'use client'

import React from 'react'

/**
 * Minimal, dependency-free markdown renderer for chat output.
 *
 * Supports the subset Gemini commonly emits in chat:
 *   - paragraphs split by blank lines
 *   - unordered lists (`* item` or `- item`)
 *   - ordered lists (`1. item`)
 *   - bold (`**x**` or `__x__`)
 *   - italic (`*x*` or `_x_`)
 *   - inline code (`` `x` ``)
 *   - links (`[text](url)`)
 *
 * Not a full CommonMark implementation — kept tiny on purpose.
 */
export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text)
  return (
    <div className="space-y-3 text-[15px] leading-7 text-foreground">
      {blocks.map((block, i) => {
        if (block.type === 'ul') {
          return (
            <ul key={i} className="ms-6 list-disc space-y-1.5 marker:text-muted-foreground">
              {block.items.map((item, j) => (
                <li key={j} className="ps-1">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="ms-6 list-decimal space-y-1.5 marker:text-muted-foreground">
              {block.items.map((item, j) => (
                <li key={j} className="ps-1">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          )
        }
        if (block.type === 'table') {
          return (
            <div key={i} className="-mx-1 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {block.header.map((cell, j) => (
                      <th
                        key={j}
                        className="px-3 py-2 text-start font-bold text-foreground"
                      >
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, j) => (
                    <tr
                      key={j}
                      className="border-b border-border/40 last:border-b-0"
                    >
                      {row.map((cell, k) => (
                        <td
                          key={k}
                          className="px-3 py-2 align-top text-foreground"
                        >
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return (
          <p key={i} className="break-words">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }

/**
 * Split a logical row like `| a | b | c |` into ['a','b','c'].
 * Tolerates missing leading/trailing pipes.
 */
function splitRow(row: string): string[] {
  let s = row.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

function isTableSeparator(line: string): boolean {
  // A separator row: `| :--- | :---: | ---: |` etc. — only `:`, `-`, spaces, and pipes.
  const cells = splitRow(line)
  if (cells.length === 0) return false
  return cells.every((c) => /^:?-{3,}:?$/.test(c))
}

/**
 * The model sometimes flattens a table into a single line where rows are
 * separated by `| |` rather than `\n`. Split such a line back into rows so we
 * can parse the table properly.
 */
function expandFlattenedTable(line: string): string[] | null {
  if (!line.includes('|')) return null
  // Split on `| |` (an empty cell between two pipes — the row boundary signal).
  const parts = line.split(/\|\s*\|/g).map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return null
  const rows = parts.map((p) => {
    let r = p
    if (!r.startsWith('|')) r = '| ' + r
    if (!r.endsWith('|')) r = r + ' |'
    return r
  })
  // Require at least one row that looks like a table separator.
  if (!rows.some(isTableSeparator)) return null
  return rows
}

function parseBlocks(input: string): Block[] {
  const rawLines = input.replace(/\r\n/g, '\n').split('\n')
  // Pre-pass: expand any single line that was a flattened pipe-table.
  const lines: string[] = []
  for (const l of rawLines) {
    const expanded = expandFlattenedTable(l)
    if (expanded) lines.push(...expanded)
    else lines.push(l)
  }

  const blocks: Block[] = []
  let para: string[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join('\n').trim() })
      para = []
    }
  }
  const flushList = () => {
    if (list) {
      blocks.push(list)
      list = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trimEnd()
    if (!line.trim()) {
      flushPara()
      flushList()
      continue
    }

    // Table: header row followed by separator row.
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushPara()
      flushList()
      const header = splitRow(line)
      i += 1 // skip separator
      const rows: string[][] = []
      while (i + 1 < lines.length && lines[i + 1].includes('|')) {
        i += 1
        rows.push(splitRow(lines[i]))
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }

    const ulMatch = line.match(/^\s*[*-]\s+(.*)$/)
    const olMatch = line.match(/^\s*\d+\.\s+(.*)$/)

    if (ulMatch) {
      flushPara()
      if (!list || list.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(ulMatch[1])
      continue
    }
    if (olMatch) {
      flushPara()
      if (!list || list.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(olMatch[1])
      continue
    }

    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return blocks
}

/**
 * Tokenize inline markdown. The order of patterns matters — bold before italic
 * so `**x**` doesn't get eaten by single-asterisk italic.
 */
function renderInline(text: string): React.ReactNode {
  // Pattern order matters. Capturing group is the inner content; one slot per pattern.
  const patterns: Array<{
    re: RegExp
    render: (match: RegExpExecArray, key: number) => React.ReactNode
  }> = [
    {
      re: /`([^`]+)`/,
      render: (m, k) => (
        <code key={k} className="rounded bg-muted px-1 py-0.5 text-[0.85em] font-mono">
          {m[1]}
        </code>
      ),
    },
    {
      re: /\[([^\]]+)\]\(([^)]+)\)/,
      render: (m, k) => (
        <a
          key={k}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          {m[1]}
        </a>
      ),
    },
    {
      re: /\*\*([^*\n]+)\*\*|__([^_\n]+)__/,
      render: (m, k) => (
        <strong key={k} className="font-bold text-foreground">
          {m[1] ?? m[2]}
        </strong>
      ),
    },
    {
      re: /(?<![*\w])\*([^*\n]+)\*(?!\*)|(?<![_\w])_([^_\n]+)_(?!_)/,
      render: (m, k) => <em key={k}>{m[1] ?? m[2]}</em>,
    },
  ]

  const out: React.ReactNode[] = []
  let key = 0
  let working = text

  while (working.length > 0) {
    let earliest: { idx: number; len: number; node: React.ReactNode } | null = null

    for (const { re, render } of patterns) {
      const m = re.exec(working)
      if (!m) continue
      const idx = m.index
      if (earliest === null || idx < earliest.idx) {
        earliest = {
          idx,
          len: m[0].length,
          node: render(m, key++),
        }
      }
    }

    if (!earliest) {
      out.push(<React.Fragment key={key++}>{working}</React.Fragment>)
      break
    }
    if (earliest.idx > 0) {
      out.push(
        <React.Fragment key={key++}>{working.slice(0, earliest.idx)}</React.Fragment>
      )
    }
    out.push(earliest.node)
    working = working.slice(earliest.idx + earliest.len)
  }

  return out
}
