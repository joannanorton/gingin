# Google Sheets Setup Template

## Inventory Sheet (Tab: "Inventory")
Create a sheet with the following columns:

| A | B | C | D | E |
|---|---|---|---|---|
| Product Name | SKU | Quantity | Price | Category |
| iPhone 15 | IPH15-001 | 50 | 999.99 | Electronics |
| MacBook Pro | MBP-001 | 25 | 1999.99 | Electronics |
| AirPods Pro | APP-001 | 100 | 249.99 | Accessories |
| Magic Mouse | MM-001 | 75 | 79.99 | Accessories |

## Invoices Sheet (Tab: "Invoices")
Create a sheet with the following columns:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Invoice Number | Customer Name | Amount | Date | Status | Notes |
| INV-001 | John Doe | 999.99 | 2024-01-15 | paid | iPhone 15 purchase |
| INV-002 | Jane Smith | 1999.99 | 2024-01-16 | pending | MacBook Pro order |
| INV-003 | Bob Johnson | 249.99 | 2024-01-17 | paid | AirPods Pro |

## Setup Instructions

1. **Create a new Google Sheet**
2. **Rename the first tab to "Inventory"**
3. **Add the column headers in row 1**
4. **Add some sample data (optional)**
5. **Create a second tab named "Invoices"**
6. **Add the invoice column headers in row 1**
7. **Add some sample invoice data (optional)**
8. **Share the sheet with your Google Service Account email**
9. **Copy the Sheet ID from the URL**

## Sheet ID Location
The Sheet ID is found in the URL:
```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit#gid=0
```

## Permissions Required
Make sure your Google Service Account has:
- **Editor** access to the spreadsheet
- **Google Sheets API** enabled in Google Cloud Console
- **Google Drive API** enabled (if needed)

## API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account
5. Download the JSON key file
6. Use the JSON content as `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable
