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
  // Each field is inside a child div
  const fieldDivs = Array.from(region.querySelectorAll('div.sc-9b4b78e7-0.ecvbWZ'))
  for (const div of fieldDivs) {
    const ps = Array.from(div.querySelectorAll('p'))
    if (ps.length >= 2) {
      const label = ps[0].textContent?.trim() || ''
      const value = ps[1].textContent?.trim() || ''
      if (label === labelText) return value
    }
  }
  return ''
}

function extractTransactions(): Tx[] {
  const buttons = Array.from(document.querySelectorAll('button[aria-expanded="true"]'))

  return buttons.map(button => {
    const regionId = button.getAttribute('aria-controls')
    const region = regionId ? document.getElementById(regionId) : null

    if (!region) return { date: '', description: '', amount: '', from: '', to: '', status: '' }

    const getPanelField = (labelText: string): string => {
      const fields = Array.from(region.querySelectorAll('div.ecvbWZ'))
      for (const field of fields) {
        const label = field.querySelector('p')?.textContent?.trim()
        if (label === labelText) {
          return field.querySelector('p.kgXkQa')?.textContent?.trim().replace(/\u2212/g, '-') || ''
        }
      }
      return ''
    }

    const description = (button.querySelector('p[data-fs-privacy-rule="unmask"]') as HTMLElement)?.textContent?.trim() || ''
    const amount = getPanelField('Amount')
    const date = getPanelField('Date')
    const from = getPanelField('From') || getPanelField('Account')
    const to = getPanelField('To')
    const status = getPanelField('Status')

    return { date, description, amount, from, to, status }
  })
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
  downloadCsv(csv, 'wealthsimple-transactions.csv')
}

// Expand all accordions first, then run export after a short delay
expandAll()
setTimeout(runExport, 1000)
