interface Tx {
  date: string
  description: string
  amount: string
  from: string
  to: string
  status: string
  type?: string
  message?: string
}

function jsonToCsv(items: Tx[]): string {
  if (items.length === 0) return ''
  const header = Object.keys(items[0])
  const replacer = (_key: string, value: any) => value ?? ''
  const csv = [
    header.join(','),
    ...items.map(row =>
      header
        .map(field =>
          JSON.stringify((row as any)[field], replacer).replace(/\u2212/g, '-')
        )
        .join(',')
    ),
  ]
  return csv.join('\r\n')
}

function downloadCsv(data: string, filename: string): void {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + data], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function normalize(text: string): string {
  return text.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
}

function getPanelField(region: HTMLElement | null, labelText: string): string {
  if (!region) return ''

  // Each field is rendered as a <dt>label</dt><dd>value</dd> pair, so once we find
  // the label node we can go straight to its dt's next sibling dd for the value \u2014
  // no need to guess how far up the tree the field's own wrapper sits.
  const nodes = Array.from(region.querySelectorAll('span, p')) as HTMLElement[]
  for (const node of nodes) {
    const label = normalize(node.textContent || '')
    if (label !== labelText) continue

    const dt = node.closest('dt')
    const dd = dt?.nextElementSibling as HTMLElement | null
    if (!dd || dd.tagName !== 'DD') continue

    // A value can be split across multiple masked elements with no whitespace
    // between them in the DOM (e.g. date + time) \u2014 join each masked element's
    // own text separately so raw textContent concatenation doesn't run them together.
    const maskedEls = Array.from(dd.querySelectorAll('[data-fs-privacy-rule="mask"]')) as HTMLElement[]
    const maskedTexts = maskedEls.map(el => normalize(el.textContent || '')).filter(Boolean)

    if (maskedTexts.length > 0) return maskedTexts.join(' ').replace(/\u2212/g, '-')

    const fallback = normalize(dd.textContent || '')
    if (fallback) return fallback.replace(/\u2212/g, '-')
  }

  return ''
}

function getDisputeMessage(region: HTMLElement): string {
  // A panel can contain multiple links (e.g. a cheque has both "Download cheque
  // image" and "Dispute this payment") — only the dispute-related one belongs here.
  const links = Array.from(region.querySelectorAll('a')) as HTMLElement[]
  const disputeLink = links.find(a => /dispute|recognize/i.test(a.textContent || ''))
  return normalize(disputeLink?.textContent || '')
}

function getDescription(button: HTMLElement): string {
  const icon = button.querySelector('span[aria-hidden="true"]')
  const infoWrapper = icon?.nextElementSibling as HTMLElement | null
  const nameSpan = infoWrapper?.firstElementChild as HTMLElement | null
  return normalize(nameSpan?.textContent || '')
}

function isPending(button: HTMLElement): boolean {
  const spans = Array.from(button.querySelectorAll('span')) as HTMLElement[]
  return spans.some(el => (el.textContent || '').trim() === 'Pending')
}

function extractTransactions(): Tx[] {
  const buttons = Array.from(document.querySelectorAll('button[aria-expanded="true"][aria-controls]')) as HTMLElement[]

  return buttons
    .map(button => {
      const regionId = button.getAttribute('aria-controls')
      const region = regionId ? document.getElementById(regionId) : null
      if (!region) return null  // skip if no panel

      if (isPending(button)) return null  // skip pending/unsettled transactions

      const description = getDescription(button)
      const amount = getPanelField(region, 'Amount') || getPanelField(region, 'Total')
      const date = getPanelField(region, 'Date') || getPanelField(region, 'Transaction date')
      const from = getPanelField(region, 'From') || getPanelField(region, 'Account')
      const to = getPanelField(region, 'To') || getPanelField(region, 'Beneficiary')
      const status = getPanelField(region, 'Status')
      const type = getPanelField(region, 'Type')
      const message = getPanelField(region, 'Message') || getDisputeMessage(region)

      // Return null if all key fields are empty (to filter out blank rows)
      if (!description && !amount && !date) return null

      return { date, description, amount, from, to, status, type, message } as Tx
    })
    .filter((tx): tx is Tx => tx !== null)  // remove nulls
}

// Transaction accordions are wrapped in a div that carries data-closed/data-open for their
// collapsed/expanded state — unlike aria-controls (only added once a panel has actually
// opened at least once, so it can't be used to find not-yet-expanded buttons), this
// attribute is present from first render and reliably excludes unrelated collapsible
// buttons elsewhere on the page (notifications, account menus, "download activities", support
// chat) that also use plain aria-expanded="false" but aren't part of this wrapper pattern.
const COLLAPSED_TRANSACTION_BUTTON_SELECTOR = '[data-closed] > button[aria-expanded="false"]'

function expandAll(): void {
  const buttons = Array.from(document.querySelectorAll(COLLAPSED_TRANSACTION_BUTTON_SELECTOR)) as HTMLButtonElement[]
  buttons.forEach(btn => btn.click())
}

function waitForExpansion(done: () => void, settleDelayMs = 300, timeoutMs = 10000, pollIntervalMs = 200): void {
  // A "more data" view can have 100+ accordions to expand at once, and each click's
  // panel content renders asynchronously — polling until none are left collapsed (rather
  // than guessing a fixed delay) avoids extracting mid-render. The settleDelayMs grace
  // period after that gives the just-expanded panels' own content a moment to finish
  // painting before we read them.
  const deadline = Date.now() + timeoutMs
  const poll = () => {
    const stillCollapsed = document.querySelectorAll(COLLAPSED_TRANSACTION_BUTTON_SELECTOR).length
    if (stillCollapsed === 0 || Date.now() > deadline) {
      setTimeout(done, settleDelayMs)
      return
    }
    setTimeout(poll, pollIntervalMs)
  }
  poll()
}

function runExport(): void {
  const txs = extractTransactions()
  if (txs.length === 0) {
    alert('No transactions found. Make sure transactions are loaded.')
    return
  }
  const csv = jsonToCsv(txs)

  // Format date and time for filename: YYYY-MM-DD_HH-MM-SS
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`

  downloadCsv(csv, `wealthsimple-transactions_${timestamp}.csv`)
}

// Expand all accordions first, then run export once they've all finished rendering
expandAll()
waitForExpansion(runExport)
