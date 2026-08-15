# 📦 Order Manager — Setup & Credentials Guide

## 1. Install the Script

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete any existing code in the editor
4. Copy the entire contents of `Code.gs` and paste it into the editor
5. Click **💾 Save** (or `Ctrl + S`)
6. Close the Apps Script tab
7. **Reload** your Google Sheet (refresh the browser page)

> After reload, a new menu item **📦 Order Manager** will appear in the menu bar (next to Help).

---

## 2. Set Up the Sheet

1. Click **📦 Order Manager → 🏗️ Setup Sheet**
2. If prompted, click **Continue** and authorize the script:
   - Choose your Google account
   - Click **Advanced → Go to (project name)**
   - Click **Allow**
3. The script will create the **"Orders"** sheet with:
   - 28 pre-configured column headers (A → AB)
   - Dropdown menus for STATUS, CONFIRMATION, SOCIETE, etc.
   - Color-coded conditional formatting

---

## 3. Add Shipping Provider Credentials

### Open the Settings Panel

1. Click **📦 Order Manager → 🔑 Settings (API Keys)**
2. A **sidebar panel** will open on the right side of your sheet

### Configure a Provider

3. In the sidebar, select a **Shipping Provider** from the dropdown  
   _(e.g., YALIDINE, DHD, ZR EXPRESS, MAYSTRO DELIVERY, etc.)_

4. The required credential fields will appear automatically based on the provider:

   | Provider Family | Fields Shown |
   |----------------|-------------|
   | **Yalidine / Yalitec** | `ID` + `TOKEN` |
   | **Ecotrack providers** (DHD, Areex, Conexlog, etc.) | `TOKEN` |
   | **ZR Express** | `TOKEN` + `KEY` |
   | **Maystro Delivery** | `TOKEN` |

5. Enter your API credentials in the input fields

6. Click **💾 Save Credentials**

7. A green confirmation message will appear: _"✅ Credentials saved for YALIDINE"_

### Repeat for Other Providers

If you work with multiple shipping companies, repeat steps 3–6 for each one. Each provider's credentials are stored independently.

---

## 4. Where to Find Your API Credentials

| Provider | How to Get Credentials |
|----------|----------------------|
| **Yalidine** | Log into [yalidine.app](https://yalidine.app) → Developer section → Copy your **API ID** and **API Token** |
| **Yalitec** | Log into your Yalitec dashboard → API settings → Copy **ID** and **Token** |
| **Ecotrack providers** (DHD, Areex, Packers, etc.) | Log into your Ecotrack dashboard (e.g., `dhd.ecotrack.dz`) → API section → Copy your **Bearer Token** |
| **ZR Express** | Log into [zrexpress.com](https://zrexpress.com) → Developer area → Copy your **Token** and **Key** |
| **Maystro Delivery** | Log into [maystro-delivery.com](https://maystro-delivery.com) → API Documentation → Copy your **Token** |

---

## 5. Security Notes

- ✅ Credentials are stored in **Google Apps Script Properties** (server-side), **not** in the sheet cells
- ✅ Only users with **editor access** to the Apps Script project can view or modify credentials
- ✅ Credentials are sent over **HTTPS** to provider APIs
- ⚠️ Do **not** share the spreadsheet's Apps Script project with untrusted users

---

## 6. Using the Order Manager

Once credentials are saved, you can use the menu actions:

| Menu Item | What It Does | How to Use |
|-----------|-------------|-----------|
| **🚀 Inject Orders** | Sends orders to the courier API | Set CONFIRMATION to `INJECTER` and SOCIETE to the provider name, then run |
| **💰 Fetch Delivery Rates** | Gets shipping prices for selected rows | Select rows → run |
| **🔄 Update Order Statuses** | Checks the latest status from the courier | Select rows with TRACKING numbers → run |
| **📄 Get Order Labels** | Fetches shipping labels (PDF or URL) | Select rows with TRACKING numbers → run |
| **📊 Order Summary** | Shows counts by status, provider, and confirmation | Just run it |

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| **📦 menu doesn't appear** | Reload the sheet; make sure the script is saved |
| **Authorization popup** | This is normal on first run — click Allow |
| **"No credentials configured"** error | Open Settings and save credentials for that provider |
| **API errors in RAW STATUS column** | Check that your API token is correct and not expired |
| **Dropdowns missing** | Run **Setup Sheet** again |
