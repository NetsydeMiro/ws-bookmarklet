interface Tx {
  date: string
  description: string
  amount: string
  from: string
  to: string
  status: string
}

function jsonToCsv(items: Tx[]): string {
  if (items.length === 0) return ''
  const header = Object.keys(items[0])
  const replacer = (_key: string, value: any) => value ?? ''
  const csv = [
    header.join(','),
    ...items.map(row => header.map(field => JSON.stringify((row as any)[field], replacer)).join(',')),
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
  const labels = Array.from(region.querySelectorAll('p.eRvzab'))
  for (const label of labels) {
    if (label.textContent?.trim() === labelText) {
      const valP = label.nextElementSibling?.querySelector('p.bpEUME')
      return valP?.textContent?.trim() || ''
    }
  }
  return ''
}

function extractTransactions(): Tx[] {
  const buttons = Array.from(document.querySelectorAll('button[aria-expanded="true"]'))

  return buttons.map(button => {
    const description = (button.querySelector('p.bebPVD') as HTMLElement)?.textContent?.trim() || ''
    const amount = (button.querySelector('p.jYlqYr') as HTMLElement)?.textContent?.trim() || ''
    const regionId = button.getAttribute('aria-controls')
    const region = regionId ? document.getElementById(regionId) : null
    const date = getPanelField(region, 'Date')
    const from = getPanelField(region, 'From')
    const to = getPanelField(region, 'To')
    const status = getPanelField(region, 'Status')

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

expandAll()
setTimeout(runExport, 1000)
