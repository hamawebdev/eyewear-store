Analytics Dashboard — Phased Implementation Plan
Upgrade the existing 
showOrderSummary()
 modal in 
Code.gs
 into a full-featured analytics dashboard served as an HTML sidebar/dialog, powered by a single getDashboardData() GAS endpoint and rendered with Chart.js.

Phase 1 — Data Layer (getDashboardData())
Goal: Replace per-widget data fetching with one server call that returns pre-aggregated JSON.

Key Tasks
Add getDashboardData(filters) to Code.gs (new function, ~lines after 
showOrderSummary
)

Accept an optional filters object: { dateFrom, dateTo, provider, status, wilaya }
Call existing 
getSheetData_(sheet)
 (line 1576) once, then loop to compute:
Bucket	Fields used
KPI totals	TOTAL PRICE, STATUS, QUANTITY
byStatus	STATUS → count map
byConfirmation	CONFIRMATION → count map
byWilaya	WILAYA → count + revenue map (top 10)
revenueOverTime	DATE × TOTAL PRICE grouped by day/week
byProvider	SOCIETE → count + delivery rate
Return a single JSON.stringify()-able object.
Derive computed KPIs server-side:

totalOrders, totalRevenue (sum of TOTAL PRICE where STATUS = LIVREE), deliveryRate (LIVREE / total), returnRate (RETOUR / total), averageOrderValue
Keep 
showOrderSummary()
 functioning during development (non-breaking).

Phase 2 — Dashboard Shell & KPI Cards
Goal: Build the HTML/CSS skeleton and render five KPI cards.

Key Tasks
Create showDashboard() in Code.gs — opens HtmlService.createHtmlOutput(buildDashboardHtml_()) as a modal dialog (setWidth(1000).setHeight(700)) or sidebar.
Build buildDashboardHtml_() — returns a self-contained HTML string containing:
CSS design system reusing existing Material palette:
Primary: #1A73E8 (header blue from 
setupSheet
)
Card backgrounds: map to STATUS_COLORS and CONFIRMATION_COLORS (lines 65–85)
Dark: #212121 (RETOUR override)
KPI card row — five <div class="kpi-card"> items:
Card	Icon	Source field
Total Orders	📦	totalOrders
Revenue	💰	totalRevenue (formatted DZD)
Delivery Rate	✅	deliveryRate (percentage)
Return Rate	🔄	returnRate (percentage)
Avg Order Value	🧾	averageOrderValue
Loading state — show a spinner/skeleton while google.script.run.getDashboardData() is in flight.
Add menu item — update 
onOpen()
 (line 1530) to add 📊 Analytics Dashboard → showDashboard.
Phase 3 — Chart.js Integration & Visual Charts
Goal: Render five interactive charts using Chart.js loaded from CDN.

Key Tasks
Include Chart.js via <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script> in the HTML head.

Implement charts:

#	Chart	Type	Data Bucket	Color Source
1	Orders by Status	Doughnut	byStatus	STATUS_COLORS values
2	Confirmation Funnel	Horizontal Bar	byConfirmation	CONFIRMATION_COLORS values
3	Top 10 Wilayas	Bar (vertical)	byWilaya	Gradient blue
4	Revenue Over Time	Line	revenueOverTime	#1A73E8 fill
5	Provider Performance	Grouped Bar	byProvider	Per-provider hue
Layout — 2-column CSS Grid below KPI cards; Revenue Over Time spans full width.

Tooltips & Legends — use Chart.js defaults + custom DZD currency formatter.

Phase 4 — Filters
Goal: Let the user slice data by date range, provider, status, and wilaya.

Key Tasks
Filter bar at the top of the dashboard HTML:
Date range: two <input type="date"> (dateFrom / dateTo)
Provider (SOCIETE): <select> populated from 
getProviderNames_()
 (line 249)
Status: <select> with options from DROPDOWNS['STATUS'] (line 58)
Wilaya: <select> populated from unique WILAYA values returned in dashboard data
Apply button (re-calls getDashboardData(filters) and re-renders all cards + charts)
Reset button (clears filters)
Server-side filtering — getDashboardData applies filters before aggregation to keep the client fast.
Persist last-used filters in sessionStorage so a re-open of the dialog restores them.
Phase 5 — UX Polish
Goal: Production-quality look and feel.

Key Tasks
Loading states — skeleton placeholders for each chart canvas + KPI card pulse animation while data loads.
Responsive layout — CSS media queries so the dialog looks usable if resized or viewed on smaller screens.
Error handling — wrap google.script.run callbacks with withFailureHandler; show a toast-style banner on error.
Empty-state messaging — "No orders match your filters" with illustration.
Number formatting — DZD currency, percentage with 1 decimal, thousands separators.
Subtle animations — card fade-in, chart entrance transitions via Chart.js animation config.
Color consistency — ensure chart segment colors exactly match existing STATUS_COLORS / CONFIRMATION_COLORS constants (pass them into the HTML via JSON injection, same pattern as 
buildSettingsHtml_()
 line 479).
Phase 6 — Integration & Cleanup
Goal: Wire everything together, test, and remove the old modal.

Key Tasks
Replace old menu entry — change 📊 Order Summary → 
showOrderSummary
 to point to showDashboard in 
onOpen()
.
Keep 
showOrderSummary()
 as a fallback (mark deprecated with a comment) so rollback is trivial.
Performance guardrails:
Cache getDashboardData result in CacheService.getScriptCache() with a 60 s TTL (invalidate on filter change).
Limit 
getSheetData_
 to 10 000 rows max with a warning banner.
Code organization — group all dashboard functions under a // 11. ANALYTICS DASHBOARD section header, following the existing numbered-section convention.
End-to-end manual test:
Open spreadsheet → 📦 Order Manager → 📊 Analytics Dashboard
Verify KPI values match manual spot-checks
Apply each filter individually and verify chart updates
Verify colors match STATUS_COLORS / CONFIRMATION_COLORS
Verification Plan
Since this is a Google Apps Script project bound to a Google Sheet, there are no automated unit test frameworks configured. Verification is manual.

Manual Verification (performed by the user)
Deploy the script to the bound Google Sheet
Reload the sheet → confirm 📊 Analytics Dashboard appears in the 📦 Order Manager menu
Open the dashboard → confirm:
Loading spinner appears, then KPI cards render with correct values
All five charts render with correct data and colors
Test filters:
Select a date range → charts and KPIs update to reflect only that range
Select a provider → only that provider's orders shown
Combine filters → intersection applied correctly
Reset → all data returns
Test error handling:
Open dashboard on an empty sheet → expect "No orders" empty state
Spot-check KPIs:
Manually count LIVREE rows in the sheet → compare to Delivery Rate card
Sum TOTAL PRICE for LIVREE rows → compare to Revenue card
IMPORTANT

All changes are confined to 
Code.gs
. No external dependencies beyond the Chart.js CDN. The existing sheet structure, triggers, webhook, and API integrations are untouched.