# Wealthsimple Transaction Exporter Bookmarklet

A simple bookmarklet that extracts transaction data from Wealthsimple and exports it to CSV format for easy import into accounting/budgeting software.

## What it does

This bookmarklet automatically:
- Expands all transaction accordions on the Wealthsimple transactions page
- Extracts transaction details (date, description, amount, from/to accounts, status, type, and messages)
- Downloads the data as a timestamped CSV file

## Installation

1. **Build the bookmarklet:**
   ```bash
   npm install
   npm run build
   npm run wrap
   ```

2. **Install the bookmarklet:**
   - Open `dist/bookmarklet.wrapped.js`
   - Copy the entire content (it starts with `javascript:(()=>{...`)
   - Create a new bookmark in your browser
   - Paste the copied code as the URL
   - Name it something like "Export WS Transactions"

## Usage

1. Navigate to your Wealthsimple transactions page
2. Scroll down (or click "View all") until every transaction you want to export has been loaded onto the page — the bookmarklet expands and reads whatever is already in the page, but won't load additional pages for you
3. Click your bookmarklet
4. The script will automatically expand all transaction details and download a CSV file. On a page with a lot of transactions, it waits for every accordion to finish expanding before downloading, so there may be a short delay

## Output

The exported CSV file includes the following columns:
- `date` - Transaction date
- `description` - Transaction description
- `amount` - Transaction amount
- `from` - Source account
- `to` - Destination account
- `status` - Transaction status
- `type` - Transaction type
- `message` - Any associated messages

Files are named with a timestamp: `wealthsimple-transactions_YYYY-MM-DD_HH-MM-SS.csv`

Pending/unsettled transactions (marked with a "Pending" badge on Wealthsimple) are excluded from the export, so totals reflect posted/settled activity only.

## Development

### Project Structure
```
├── src/
│   └── bookmarklet.ts    # Main TypeScript source
├── dist/
│   ├── bookmarklet.js    # Compiled JavaScript
│   └── bookmarklet.wrapped.js  # Bookmarklet-ready version
├── tools/
│   └── wrap-bookmarklet.js  # Wrapper script
└── package.json
```

### Build Commands
- `npm run build` - Compile TypeScript to JavaScript
- `npm run wrap` - Wrap the compiled JS into bookmarklet format

### Requirements
- Node.js
- TypeScript 5.0+
- Modern web browser

## Notes

- The bookmarklet works by parsing the DOM structure of Wealthsimple's transaction page
- It automatically handles Unicode minus signs (converting them to regular dashes)
- The CSV includes a BOM (Byte Order Mark) for proper Excel compatibility
- Make sure you're logged into Wealthsimple and have transactions loaded before running the bookmarklet

## License

This project is provided as-is for personal use. Please respect Wealthsimple's terms of service when using this tool.
