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

function getPanelField(region: HTMLElement | null, labelText: string): string {
  if (!region) return ''

  const normalize = (text: string): string => text.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()

  // New and old layouts both render a distinct label node; find the row by label text.
  const nodes = Array.from(region.querySelectorAll('span, p')) as HTMLElement[]
  for (const node of nodes) {
    const label = normalize(node.textContent || '')
    if (label !== labelText) continue

    // The label is often inside a nested label-only div; walk up until we hit
    // the transaction detail row that also contains the masked value container.
    let row: HTMLElement | null = node.parentElement
    while (row && row !== region && !row.querySelector('[data-fs-privacy-rule="mask"]')) {
      row = row.parentElement
    }

    if (!row || row === region) continue

    // Prefer common value nodes first, then fall back to any non-label text in the row.
    const preferredValues = Array.from(
      row.querySelectorAll('[data-fs-privacy-rule="mask"] span, [data-fs-privacy-rule="mask"] p, p')
    ) as HTMLElement[]

    const fromPreferred = preferredValues
      .map(el => normalize(el.textContent || ''))
      .find(text => text && text !== labelText)

    if (fromPreferred) return fromPreferred.replace(/\u2212/g, '-')

    const fallback = normalize((row.textContent || '').replace(labelText, ''))

    if (fallback) return fallback.replace(/\u2212/g, '-')
  }

  return ''
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

      const description = (button.querySelector('[data-fs-privacy-rule="unmask"]') as HTMLElement)?.textContent?.trim() || ''
      const amount = getPanelField(region, 'Amount') || getPanelField(region, 'Total')
      const date = getPanelField(region, 'Date') || getPanelField(region, 'Transaction date')
      const from = getPanelField(region, 'From') || getPanelField(region, 'Account')
      const to = getPanelField(region, 'To')
      const status = getPanelField(region, 'Status')
      const type = getPanelField(region, 'Type')
      const message = getPanelField(region, 'Message') || region.querySelector('a')?.textContent?.trim() || ''

      // Return null if all key fields are empty (to filter out blank rows)
      if (!description && !amount && !date) return null

      return { date, description, amount, from, to, status, type, message } as Tx
    })
    .filter((tx): tx is Tx => tx !== null)  // remove nulls
}

function expandAll(): void {
  const buttons = Array.from(document.querySelectorAll('button[aria-expanded="false"]')) as HTMLButtonElement[]
  buttons.forEach(btn => btn.click())
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

// Expand all accordions first, then run export after a short delay
expandAll()
setTimeout(runExport, 1000)
