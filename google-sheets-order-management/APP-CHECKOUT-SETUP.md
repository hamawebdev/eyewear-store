# Google Sheets Checkout Integration Guide

This guide explains how to connect this app's checkout flow to Google Sheets using the Apps Script project in this repository.

After setup:

- the checkout page will submit to `POST /api/orders`
- the app will build the order row on the server
- the app will send the row to your Google Sheet through an Apps Script webhook
- the sheet will receive only the approved columns for this fast integration

## What This Integration Sends

The app sends only these columns:

- `DATE`
- `NAME`
- `PHONE`
- `CODE WILAYA`
- `WILAYA`
- `ADRESSE`
- `PRODUCT`
- `PRODUCT Option`
- `QUANTITY`
- `DELIVERY PRICE`
- `TOTAL PRICE`
- `DELIVERY MODE`

Important behavior:

- `ORDER ID` is intentionally left blank
- all other sheet columns stay blank
- `DELIVERY MODE` is normalized automatically:
  - `home -> Door Delivery`
  - `office -> Stop Desk`

## Before You Start

Make sure you already have:

1. a working copy of this app
2. a Google account that can create and edit Google Sheets
3. products seeded in Payload with valid prices
4. wilayas created in Payload with:
   - `name`
   - `code`
   - `homeDeliveryPrice`
   - `officeDeliveryPrice`

This integration does **not** save local order records. The Google Sheet is the order destination for this flow.

## Step 1: Create the Google Sheet

1. Open [Google Sheets](https://sheets.google.com).
2. Create a new spreadsheet.
3. Rename it if you want, for example: `Honey Store Orders`.

You do not need to create columns manually. The Apps Script will generate the `Orders` sheet structure for you.

## Step 2: Install the Apps Script

1. Open the spreadsheet you created.
2. Go to **Extensions -> Apps Script**.
3. In the Apps Script editor:
   - if a default `Code.gs` file exists, select all of its contents and delete them
   - open this repository file: [Code.gs](/home/hamawebdev/honeystore/google-sheets-order-management/Code.gs)
   - copy the full contents of that file
   - paste everything into the Apps Script editor
4. Click **Save**.
5. Give the Apps Script project a name if Google asks.

## Step 3: Create the Orders Sheet Structure

1. Return to the spreadsheet tab.
2. Refresh the page.
3. After reload, a custom menu named **Order Manager** should appear.
4. Click **Order Manager -> Setup Sheet**.
5. If Google asks for authorization:
   - click **Continue**
   - choose your Google account
   - click **Advanced**
   - click **Go to <project name>**
   - click **Allow**

What this does:

- creates the `Orders` sheet
- adds all expected columns
- adds dropdowns and formatting
- prepares the sheet to receive webhook rows

## Step 4: Configure the Webhook Secret in Apps Script

The app and the sheet must share the same secret.

### In Apps Script

1. Go back to the Apps Script editor.
2. Click the **Project Settings** gear icon in the left sidebar.
3. Scroll to **Script Properties**.
4. Click **Add script property**.
5. Add this property:

| Key | Value |
| --- | --- |
| `WEBHOOK_SECRET` | your secret string |

Choose a long random value, for example:

```text
honey-store-prod-9f2b3f0c6d1a4e5f
```

Keep this value. You will use the exact same value in the app environment variables.

## Step 5: Deploy the Apps Script as a Web App

The Next.js app will call the Apps Script over HTTPS, so the script must be deployed as a web app.

1. In Apps Script, click **Deploy -> New deployment**.
2. Click the gear icon next to **Select type**.
3. Choose **Web app**.
4. Fill the deployment form like this:

| Setting | Value |
| --- | --- |
| Description | `Checkout webhook` |
| Execute as | `Me` |
| Who has access | `Anyone` |

Why `Anyone` is needed:

- your app server posts to the webhook without signing into Google
- access is protected by the shared secret you added in Step 4

5. Click **Deploy**.
6. If Google asks for permissions, approve them.
7. Copy the **Web app URL**.

Important:

- use the URL that ends with `/exec`
- this is the value for `GOOGLE_SHEETS_WEBHOOK_URL`

## Step 6: Configure the App Environment Variables

Open your app environment file and set these values:

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/REPLACE_THIS/exec
GOOGLE_SHEETS_WEBHOOK_SECRET=REPLACE_WITH_THE_SAME_SECRET
```

The secret must match the Apps Script `WEBHOOK_SECRET` exactly.

You can see the expected env names in [.env.example](/home/hamawebdev/honeystore/.env.example).

### Local development

If you run locally, add the variables to your local env file, for example `.env` or `.env.local`, depending on your setup.

### Production hosting

If you deploy the app to a host like Vercel or another platform:

1. open your hosting dashboard
2. add both env vars there
3. redeploy or restart the app

## Step 7: Restart the App

If your app server was already running when you added the env vars, restart it.

Example:

```bash
npm run dev
```

If it was already running, stop it and start it again so the new env vars are loaded.

## Step 8: Understand How Checkout Builds the Sheet Row

When a customer submits checkout:

1. the frontend sends the checkout form to `POST /api/orders`
2. the server validates the request
3. the server loads:
   - the selected wilaya from Payload
   - each selected product from Payload
4. the server calculates:
   - delivery price
   - total price
   - quantity
   - product names
   - option labels
5. the server normalizes delivery mode
6. the server posts the row to the Apps Script webhook
7. the webhook appends the row to the `Orders` sheet

This means:

- checkout prices come from server-side product and wilaya data
- the app does not trust browser totals
- the sheet write must succeed or checkout returns an error

## Step 9: Test the Integration

### Test A: Home delivery

1. Start the app.
2. Add a product to cart.
3. Open checkout.
4. Fill:
   - full name
   - phone number
   - wilaya
   - shipping method = `Home delivery`
   - address
5. Submit the order.
6. Open the Google Sheet.
7. Confirm a new row was added.

Expected result:

- `DATE` is filled
- `NAME` is filled
- `PHONE` is filled
- `CODE WILAYA` matches the selected wilaya code
- `WILAYA` matches the selected wilaya name
- `ADRESSE` contains the checkout address
- `PRODUCT` contains the product name or comma-separated product names
- `PRODUCT Option` contains the selected option labels if any
- `QUANTITY` is the sum of ordered quantities
- `DELIVERY PRICE` matches `homeDeliveryPrice`
- `TOTAL PRICE` is subtotal plus delivery
- `DELIVERY MODE` is `Door Delivery`
- `ORDER ID` is blank
- all other ignored columns are blank

### Test B: Office pickup

1. Submit another order.
2. Select shipping method = `Office pickup`.
3. Complete checkout.
4. Open the new row in the sheet.

Expected result:

- `DELIVERY MODE` is `Stop Desk`
- `DELIVERY PRICE` uses `officeDeliveryPrice`
- `ADRESSE` may be blank if the checkout did not collect one

### Test C: Multi-item cart

1. Add multiple products to the cart.
2. Submit checkout.
3. Check the row.

Expected result:

- `PRODUCT` joins product names with commas
- `PRODUCT Option` joins non-empty option labels with commas
- `QUANTITY` is the sum of all item quantities

## Step 10: Troubleshooting

### The sheet does not receive rows

Check all of the following:

1. the Apps Script is deployed as a web app
2. you copied the `/exec` URL, not another URL
3. `GOOGLE_SHEETS_WEBHOOK_URL` is correct
4. `GOOGLE_SHEETS_WEBHOOK_SECRET` matches Apps Script `WEBHOOK_SECRET`
5. the app server was restarted after env changes
6. the `Orders` sheet exists

### Checkout shows "Checkout is temporarily unavailable."

Usually this means app env config is missing.

Check:

- `GOOGLE_SHEETS_WEBHOOK_URL`
- `GOOGLE_SHEETS_WEBHOOK_SECRET`

### Checkout shows "Unable to submit your order right now. Please try again."

Usually this means the webhook call failed or the Apps Script returned an error.

Check:

1. web app deployment is still active
2. webhook URL is correct
3. secret matches on both sides
4. the sheet still has the `Orders` tab
5. the Apps Script has the latest `Code.gs` content

### The selected wilaya is rejected

This app requires the wilaya record in Payload to exist and include:

- `name`
- `code`
- `homeDeliveryPrice`
- `officeDeliveryPrice`

If any of these are missing, checkout will fail.

### A product is rejected during checkout

This usually means:

- the product no longer exists
- the selected option was removed
- the product price is invalid

Update the product record in Payload and try again.

### I changed the Apps Script code but the webhook still behaves like the old version

Apps Script web apps need a new deployment version after code changes.

After editing `Code.gs`:

1. click **Deploy -> Manage deployments**
2. edit the web app deployment
3. create a new version
4. deploy again

If Google gives you a new URL, update `GOOGLE_SHEETS_WEBHOOK_URL` in the app and restart the app.

## Step 11: Security Notes

Use these rules in production:

1. keep `GOOGLE_SHEETS_WEBHOOK_SECRET` private
2. never commit your real secret to the repository
3. do not share the Apps Script project with untrusted users
4. if you think the secret leaked:
   - generate a new secret
   - update Apps Script `WEBHOOK_SECRET`
   - update app `GOOGLE_SHEETS_WEBHOOK_SECRET`
   - redeploy or restart the app

## Quick Checklist

Use this checklist before going live:

- Apps Script installed from [Code.gs](/home/hamawebdev/honeystore/google-sheets-order-management/Code.gs)
- `Order Manager -> Setup Sheet` has been run
- Apps Script script property `WEBHOOK_SECRET` is set
- Apps Script deployed as **Web app**
- Web app access is set to **Anyone**
- `GOOGLE_SHEETS_WEBHOOK_URL` is set in the app
- `GOOGLE_SHEETS_WEBHOOK_SECRET` is set in the app
- app server restarted
- one successful test order appears in the sheet
