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

  // Look for all direct child divs containing labels + values
  const fieldDivs = Array.from(region.querySelectorAll('div'))
  for (const div of fieldDivs) {
    const ps = Array.from(div.querySelectorAll('p'))
    if (ps.length >= 2) {
      const label = ps[0].textContent?.trim() || ''
      const value = ps[1].textContent?.trim() || ''
      if (label === labelText) return value.replace(/\u2212/g, '-') // Unicode minus → dash
    }
  }

  return ''
}

function extractTransactions(): Tx[] {
  const buttons = Array.from(document.querySelectorAll('button[aria-expanded="true"]'))

  return buttons
    .map(button => {
      const regionId = button.getAttribute('aria-controls')
      const region = regionId ? document.getElementById(regionId) : null
      if (!region) return null  // skip if no panel

      const description = (button.querySelector('p[data-fs-privacy-rule="unmask"]') as HTMLElement)?.textContent?.trim() || ''
      const amount = getPanelField(region, 'Amount')
      const date = getPanelField(region, 'Date')
      const from = getPanelField(region, 'From') || getPanelField(region, 'Account')
      const to = getPanelField(region, 'To')
      const status = getPanelField(region, 'Status')
      const type = getPanelField(region, 'Type')
      const messageLink = region.querySelector('a')?.textContent?.trim() || ''

      // Return null if all key fields are empty (to filter out blank rows)
      if (!description && !amount && !date) return null

      return { date, description, amount, from, to, status, type, message: messageLink } as Tx
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
