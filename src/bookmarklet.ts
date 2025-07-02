type Tx = {
  date: string
  description: string
  amount: string
}

function jsonToCsv(items: Tx[]): string {
  const replacer = (_key: string, value: string) => value ?? ''
  const header = Object.keys(items[0])
  const csv = [
    header.join(','),
    ...items.map(row =>
      header.map(field => JSON.stringify((row as any)[field], replacer)).join(',')
    ),
  ]
  return csv.join('\r\n')
}

function downloadCsv(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function extractTransactions(): Tx[] {
  const buttons = Array.from(document.querySelectorAll('button[aria-expanded="true"]'))

  return buttons.map(button => {
    // Description
    const description = button.querySelector('p.bebPVD')?.textContent?.trim() || ''

    // Amount
    const amount = button.querySelector('p.jYlqYr')?.textContent?.trim() || ''

    // Date – from sibling region
    const regionId = button.getAttribute('aria-controls')
    const region = regionId ? document.getElementById(regionId) : null
    const date = region?.querySelector('p.bpEUME')?.textContent?.trim() || ''

    return { date, description, amount }
  })
}


function runExport() {
  const txs = extractTransactions()
  if (txs.length === 0) return

  const csv = jsonToCsv(txs)
  downloadCsv(csv, 'wealthsimple-transactions.csv')
}

runExport()
