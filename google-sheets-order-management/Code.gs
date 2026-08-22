// ============================================================
// Google Sheets Order Management System
// ============================================================
// A Google Apps Script that turns a Google Sheet into a
// fully-featured order management dashboard with multi-provider
// courier API integration (CourierDZ-compatible).
// ============================================================

// ──────────────────────────────────────────────────────────────
// 1. CONFIGURATION & CONSTANTS
// ──────────────────────────────────────────────────────────────

const SHEET_NAME = 'Orders';
const PRODUCTS_SHEET_NAME = 'Products';
const STOCK_SYNC_SHEET_NAME = '_StockSync';

/**
 * Column headers exactly matching the order-table.md schema.
 * The array index is used to map columns (A=0, B=1, …).
 */
const COLUMNS = [
  'DATE',              // A
  'ORDER ID',          // B
  'NAME',              // C
  'PHONE',             // D
  'CODE WILAYA',       // E
  'WILAYA',            // F
  'COMMUNE',           // G
  'ADRESSE',           // H
  'STATION',           // I
  'PRODUCT',           // J
  'PRODUCT Option',    // K
  'QUANTITY',          // L
  'PRODUCT PRICE',     // M
  'DELIVERY PRICE',    // N
  'TOTAL PRICE',       // O
  'DELIVERY MODE',     // P
  'NOTE',              // Q
  'STOCK TYPE',        // R
  'PRODUCT TO CHANGE', // S
  'FRAGILE',           // T
  'WEIGHT',            // U
  'INSURANCE',         // V
  'EXCHANGE',          // W
  'SOCIETE',           // X
  'CONFIRMATION',      // Y
  'TRACKING',          // Z
  'STATUS',            // AA
  'RAW STATUS',        // AB
];

const DEPRECATED_ORDER_STOCK_SYNC_COLUMNS = [
  'STOCK SYNC STATUS',
  'STOCK SYNC PRODUCT',
  'STOCK SYNC QTY',
  'STOCK SYNC AT',
];

const PRODUCT_CATALOG_COLUMNS = [
  'PRODUCT NAME',
  'CURRENT STOCK',
  'ACTIVE',
  'SOURCE',
  'CATALOG STATUS',
  'LAST SEEN IN ORDER',
  'UPDATED AT',
];

const PRODUCT_CATALOG_STATUS = {
  DUPLICATE: 'DUPLICATE',
  OK: 'OK',
};

const PRODUCT_CATALOG_SOURCE = {
  AUTO: 'AUTO',
  MANUAL: 'MANUAL',
};

const ORDER_STOCK_SYNC_STATUS = {
  DEDUCTED: 'DEDUCTED',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  RESTORED: 'RESTORED',
  SKIPPED_CATALOG_REVIEW: 'SKIPPED_CATALOG_REVIEW',
  SKIPPED_INVALID_QUANTITY: 'SKIPPED_INVALID_QUANTITY',
  SKIPPED_MULTI_PRODUCT: 'SKIPPED_MULTI_PRODUCT',
};

const STOCK_SYNC_COLUMNS = [
  'SYNC STATUS',
  'SYNC PRODUCT',
  'SYNC QTY',
  'SYNC AT',
];

/** Dropdown options per column (only columns that have them). */
const DROPDOWNS = {
  'DELIVERY MODE': ['Stop Desk', 'Door Delivery'],
  'STOCK TYPE':    ['STOCK', 'NORMAL'],
  'FRAGILE':       ['fragile', 'NO'],
  'INSURANCE':     ['OUI', 'NO'],
  'EXCHANGE':      ['EXCHANGE', 'NO'],
  'CONFIRMATION':  ['INJECTER', 'CONFIRME', 'INJOIGNABLE', 'TENT 1', 'TENT 2', 'TENT 3', 'PROGRAME', 'ANNULE'],
  'STATUS':        ['EN LIVRAISON', 'LIVREE', 'ANNULE', 'RETOUR'],
  // SOCIETE dropdown is built dynamically from the provider registry
};

/**
 * Status → background colour map (used for the STATUS cell only).
 */
const STATUS_COLORS = {
  'EN LIVRAISON': '#FFF3CD', // amber
  'LIVREE':       '#D4EDDA', // green
  'ANNULE':       '#F8D7DA', // red
  'RETOUR':       '#212121', // dark – overridden at row level too
};

/**
 * CONFIRMATION value → **full-row** background colour.
 * This is the primary driver for row colouring.
 */
const CONFIRMATION_COLORS = {
  'INJECTER':     '#C8E6C9', // green  (Material Green 100)
  'CONFIRME':     '#A5D6A7', // green  (Material Green 200)
  'ANNULE':       '#EF9A9A', // red    (Material Red 200)
  'INJOIGNABLE':  '#FFF9C4', // amber  (Material Yellow 100)
  'TENT 1':       '#FFE0B2', // orange (Material Orange 100)
  'TENT 2':       '#FFCC80', // orange (Material Orange 200)
  'TENT 3':       '#FFB74D', // orange (Material Orange 300)
  'PROGRAME':     '#E1BEE7', // purple (Material Purple 100)
};

/** STATUS overrides – these take priority over CONFIRMATION colours. */
const STATUS_ROW_OVERRIDES = {
  'RETOUR': { bg: '#212121', font: '#FFFFFF' }, // black row, white text
};

/** Name of the blacklist sheet for RETOUR orders. */
const BLACKLIST_SHEET_NAME = 'Blacklist';

/** Row highlight colour when API call fails. */
const ERROR_ROW_COLOR = '#FFCDD2'; // Material Red 100

/** Duplicate phone highlight colours (applied to the PHONE cell). */
const PHONE_DUP_SAME_DAY  = '#FF9800'; // Orange — same phone + same date
const PHONE_DUP_DIFF_DAY  = '#FFF176'; // Yellow — same phone, different date

/** Script property used to validate incoming checkout webhook requests. */
const WEBHOOK_SECRET_PROPERTY = 'WEBHOOK_SECRET';

/** Minimal columns accepted from the storefront checkout webhook. */
const WEBHOOK_ALLOWED_COLUMNS = [
  'DATE',
  'NAME',
  'PHONE',
  'CODE WILAYA',
  'WILAYA',
  'ADRESSE',
  'PRODUCT',
  'PRODUCT Option',
  'QUANTITY',
  'DELIVERY PRICE',
  'TOTAL PRICE',
  'DELIVERY MODE',
];

/** Dashboard performance guardrail: only scan the latest N rows. */
const ANALYTICS_DASHBOARD_MAX_ROWS = 10000;

/** Cache dashboard payloads briefly to keep the UI snappy. */
const ANALYTICS_CACHE_TTL_SECONDS = 60;

/** User property key used to persist the current order filter state. */
const ORDER_FILTER_STATE_PROPERTY = 'ORDER_FILTER_STATE_V1';

/** Searchable columns for the sidebar filter's free-text query. */
const ORDER_FILTER_SEARCH_COLUMNS = ['ORDER ID', 'NAME', 'PHONE'];

/** Orders use a visible header row, so data starts on row 2. */
const ORDERS_DATA_START_ROW = 2;

// ──────────────────────────────────────────────────────────────
// 2. PROVIDER REGISTRY
// ──────────────────────────────────────────────────────────────
// Every provider from CourierDZ is registered with its family,
// API domain, credential keys, and endpoint templates.
// ──────────────────────────────────────────────────────────────

const PROVIDER_FAMILIES = {
  ECOTRACK: 'ecotrack',
  YALIDINE: 'yalidine',
  PROCOLIS: 'procolis',
  MAYSTRO:  'maystro',
};

/**
 * Build the full registry.  Ecotrack providers share the same
 * endpoint layout – only the domain differs.
 */
function buildProviderRegistry_() {
  const ecotrackEndpoints = {
    rates:         'api/v1/get/fees',
    createOrder:   'api/v1/create/order',
    createOrders:  'api/v1/create/orders',
    getOrder:      'api/v1/get/orders',
    updateOrder:   'api/v1/update/order',
    deleteOrder:   'api/v1/delete/order',
    validateOrder: 'api/v1/valid/order',
    orderLabel:    'api/v1/get/order/label',
    trackingInfo:  'api/v1/get/tracking/info',
    ordersStatus:  'api/v1/get/orders/status',
    wilayas:       'api/v1/get/wilayas',
  };

  const ecotrackProvider = (name, title, domain) => ({
    name, title, family: PROVIDER_FAMILIES.ECOTRACK,
    domain, credentialKeys: ['token'],
    endpoints: ecotrackEndpoints,
  });

  return {
    // ── Ecotrack family (22 providers) ──────────────────────
    'ANDERSON DELIVERY': ecotrackProvider('AndersonDelivery', 'Anderson Delivery', 'https://anderson.ecotrack.dz/'),
    'AREEX':             ecotrackProvider('Areex', 'Areex', 'https://areex.ecotrack.dz/'),
    'BA CONSULT':        ecotrackProvider('BaConsult', 'BA Consult', 'https://baconsult.ecotrack.dz/'),
    'CONEXLOG':          ecotrackProvider('Conexlog', 'Conexlog', 'https://conexlog.ecotrack.dz/'),
    'COYOTE EXPRESS':    ecotrackProvider('CoyoteExpress', 'Coyote Express', 'https://coyoteexpress.ecotrack.dz/'),
    'DHD':               ecotrackProvider('Dhd', 'DHD', 'https://dhd.ecotrack.dz/'),
    'DISTAZERO':         ecotrackProvider('Distazero', 'Distazero', 'https://distazero.ecotrack.dz/'),
    '48HR LIVRAISON':    ecotrackProvider('E48hrLivraison', '48Hr Livraison', 'https://48hrlivraison.ecotrack.dz/'),
    'FRETDIRECT':        ecotrackProvider('Fretdirect', 'FRET.Direct', 'https://fretdirect.ecotrack.dz/'),
    'GOLIVRI':           ecotrackProvider('Golivri', 'GOLIVRI', 'https://golivri.ecotrack.dz/'),
    'MONO HUB':          ecotrackProvider('MonoHub', 'Mono Hub', 'https://monohub.ecotrack.dz/'),
    'MSM GO':            ecotrackProvider('MsmGo', 'MSM Go', 'https://msmgo.ecotrack.dz/'),
    'NEGMAR EXPRESS':    ecotrackProvider('NegmarExpress', 'Negmar Express', 'https://negmarexpress.ecotrack.dz/'),
    'PACKERS':           ecotrackProvider('Packers', 'Packers', 'https://packers.ecotrack.dz/'),
    'PREST':             ecotrackProvider('Prest', 'Prest', 'https://prest.ecotrack.dz/'),
    'RB LIVRAISON':      ecotrackProvider('RbLivraison', 'RB Livraison', 'https://rblivraison.ecotrack.dz/'),
    'REX LIVRAISON':     ecotrackProvider('RexLivraison', 'Rex Livraison', 'https://rexlivraison.ecotrack.dz/'),
    'ROCKET DELIVERY':   ecotrackProvider('RocketDelivery', 'Rocket Delivery', 'https://rocketdelivery.ecotrack.dz/'),
    'SALVA DELIVERY':    ecotrackProvider('SalvaDelivery', 'Salva Delivery', 'https://salvadelivery.ecotrack.dz/'),
    'SPEED DELIVERY':    ecotrackProvider('SpeedDelivery', 'Speed Delivery', 'https://speeddelivery.ecotrack.dz/'),
    'TSL EXPRESS':       ecotrackProvider('TslExpress', 'TSL Express', 'https://tslexpress.ecotrack.dz/'),
    'WORLDEXPRESS':      ecotrackProvider('Worldexpress', 'WorldExpress', 'https://world-express.ecotrack.dz/'),

    // ── Yalidine family (2 providers) ───────────────────────
    'YALIDINE': {
      name: 'Yalidine', title: 'Yalidine',
      family: PROVIDER_FAMILIES.YALIDINE,
      domain: 'https://api.yalidine.app',
      credentialKeys: ['id', 'token'],
      endpoints: {
        rates:       'v1/fees/',
        createOrder: 'v1/parcels/',
        getOrder:    'v1/parcels/',
        orderLabel:  null, // derived from getOrder → label field
        wilayas:     'v1/wilayas/',
      },
    },
    'YALITEC': {
      name: 'Yalitec', title: 'Yalitec',
      family: PROVIDER_FAMILIES.YALIDINE,
      domain: 'https://api.yalitec.app',
      credentialKeys: ['id', 'token'],
      endpoints: {
        rates:       'v1/fees/',
        createOrder: 'v1/parcels/',
        getOrder:    'v1/parcels/',
        orderLabel:  null,
        wilayas:     'v1/wilayas/',
      },
    },

    // ── Procolis / ZR Express family (1 provider) ───────────
    'ZR EXPRESS': {
      name: 'ZRExpress', title: 'ZR Express',
      family: PROVIDER_FAMILIES.PROCOLIS,
      domain: 'https://procolis.com',
      credentialKeys: ['token', 'key'],
      endpoints: {
        rates:       'api_v1/tarification',
        createOrder: 'api_v1/add_colis',
        getOrder:    'api_v1/lire',
        orderLabel:  null, // not supported
        wilayas:     'api_v1/token',
      },
    },

    // ── Maystro Delivery (standalone) ───────────────────────
    'MAYSTRO DELIVERY': {
      name: 'MaystroDelivery', title: 'Maystro Delivery',
      family: PROVIDER_FAMILIES.MAYSTRO,
      domain: 'https://backend.maystro-delivery.com/api',
      credentialKeys: ['token'],
      endpoints: {
        rates:       null, // not implemented
        createOrder: 'stores/orders/',
        getOrder:    'stores/orders/',
        orderLabel:  'delivery/starter/starter_bordureau/',
        wilayas:     'base/wilayas/?country=1',
      },
    },
  };
}

/** Lazily-initialised registry singleton. */
let _providerRegistryCache = null;
function getProviderRegistry_() {
  if (!_providerRegistryCache) {
    _providerRegistryCache = buildProviderRegistry_();
  }
  return _providerRegistryCache;
}

/** Return a flat array of provider display names for the SOCIETE dropdown. */
function getProviderNames_() {
  return Object.keys(getProviderRegistry_());
}

function ordersSheetHasVisibleHeader_(sheet) {
  const targetSheet = sheet || getOrdersSheet_();
  if (targetSheet.getLastRow() < 1 || targetSheet.getLastColumn() < COLUMNS.length) {
    return false;
  }

  const values = targetSheet.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  return COLUMNS.every((column, index) => String(values[index] || '').trim() === column);
}

function getOrdersDataStartRow_(sheet) {
  return ordersSheetHasVisibleHeader_(sheet) ? 2 : ORDERS_DATA_START_ROW;
}

function getOrdersDataRowCount_(sheet) {
  const targetSheet = sheet || getOrdersSheet_();
  const startRow = getOrdersDataStartRow_(targetSheet);
  return Math.max(targetSheet.getLastRow() - startRow + 1, 0);
}

function getOrdersSheetRowFromDataIndex_(sheet, index) {
  return getOrdersDataStartRow_(sheet) + index;
}

function getStockSyncRowNumberForOrderRow_(orderRow, ordersSheet) {
  return orderRow + (getOrdersDataStartRow_(ordersSheet) === 1 ? 1 : 0);
}

function orderRowMatchesColumns_(sheet, rowNumber) {
  const targetSheet = sheet || getOrdersSheet_();
  if (rowNumber < 1 || targetSheet.getLastRow() < rowNumber) return false;

  const values = targetSheet.getRange(rowNumber, 1, 1, COLUMNS.length).getValues()[0];
  return COLUMNS.every((column, index) => String(values[index] || '').trim() === column);
}

function normalizeOrdersTopRows_(sheet) {
  const targetSheet = sheet || getOrdersSheet_();
  const lastRow = targetSheet.getLastRow();
  if (lastRow < 2 || !orderRowMatchesColumns_(targetSheet, 2)) return;

  let hasContentBelow = false;
  if (lastRow > 2) {
    const valuesBelow = targetSheet.getRange(3, 1, lastRow - 2, COLUMNS.length).getValues();
    hasContentBelow = valuesBelow.some((row) =>
      row.some((value) => String(value || '').trim() !== '')
    );
  }

  if (hasContentBelow) {
    targetSheet.deleteRow(2);
    return;
  }

  const duplicateHeaderRange = targetSheet.getRange(2, 1, 1, COLUMNS.length);
  duplicateHeaderRange.clearContent();
  duplicateHeaderRange.clearDataValidations();
  duplicateHeaderRange.clearFormat();
}

function ensureOrdersHeaderRow_(sheet) {
  const targetSheet = sheet || getOrdersSheet_();
  if (!ordersSheetHasVisibleHeader_(targetSheet)) {
    if (targetSheet.getLastRow() >= 1) {
      targetSheet.insertRowBefore(1);
    }
  }

  const headerRange = targetSheet.getRange(1, 1, 1, COLUMNS.length);
  headerRange.clearDataValidations();
  headerRange.setValues([COLUMNS]);
  headerRange
    .setFontWeight('bold')
    .setBackground('#1A73E8')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  return true;
}

// ──────────────────────────────────────────────────────────────
// 3. SHEET SCAFFOLDING
// ──────────────────────────────────────────────────────────────

/**
 * Create (or reset) the Orders sheet with headers, dropdowns,
 * formatting, and conditional-formatting rules.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  ss.setActiveSheet(sheet);
  const maxColumns = sheet.getMaxColumns();
  if (maxColumns < COLUMNS.length) {
    sheet.insertColumnsAfter(maxColumns, COLUMNS.length - maxColumns);
  }
  migrateLegacyOrderStockSyncColumns_(sheet);
  ensureOrdersHeaderRow_(sheet);
  normalizeOrdersTopRows_(sheet);
  sheet.setFrozenRows(1);
  const existingFilter = sheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }

  // ── Column widths ─────────────────────────────────────────
  const widths = {
    'DATE': 110, 'ORDER ID': 120, 'NAME': 160, 'PHONE': 130,
    'CODE WILAYA': 85, 'WILAYA': 120, 'COMMUNE': 130,
    'ADRESSE': 200, 'STATION': 120, 'PRODUCT': 180,
    'PRODUCT Option': 130, 'QUANTITY': 70, 'PRODUCT PRICE': 100,
    'DELIVERY PRICE': 100, 'TOTAL PRICE': 100, 'DELIVERY MODE': 120,
    'NOTE': 180, 'STOCK TYPE': 90, 'PRODUCT TO CHANGE': 140,
    'FRAGILE': 70, 'WEIGHT': 70, 'INSURANCE': 80, 'EXCHANGE': 90,
    'SOCIETE': 140, 'CONFIRMATION': 130, 'TRACKING': 180,
    'STATUS': 120, 'RAW STATUS': 200,
  };
  COLUMNS.forEach((col, i) => {
    if (widths[col]) sheet.setColumnWidth(i + 1, widths[col]);
  });

  // ── Data-validation dropdowns ────────────────────────────
  const startRow = getOrdersDataStartRow_(sheet);
  const validationDepth = Math.max(sheet.getMaxRows(), 1000);
  const allDropdowns = Object.assign({}, DROPDOWNS, {
    'SOCIETE': getProviderNames_(),
  });

  for (const [colName, options] of Object.entries(allDropdowns)) {
    const colIdx = COLUMNS.indexOf(colName);
    if (colIdx === -1) continue;
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(options, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(startRow, colIdx + 1, validationDepth, 1).setDataValidation(rule);
  }

  // ── Conditional formatting for STATUS cell ────────────────
  const statusColIdx = COLUMNS.indexOf('STATUS') + 1;
  const rules = [];
  for (const [status, color] of Object.entries(STATUS_COLORS)) {
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status)
      .setBackground(color)
      .setFontColor(status === 'RETOUR' ? '#FFFFFF' : '#000000')
      .setRanges([sheet.getRange(startRow, statusColIdx, validationDepth, 1)])
      .build();
    rules.push(rule);
  }

  // ── Full-row conditional formatting for CONFIRMATION ──────
  // Uses a formula so the entire row is coloured, not just the cell.
  const confColLetter = columnToLetter_(COLUMNS.indexOf('CONFIRMATION') + 1);
  for (const [conf, color] of Object.entries(CONFIRMATION_COLORS)) {
    const formula = '=$' + confColLetter + startRow + '="' + conf + '"';
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(formula)
      .setBackground(color)
      .setRanges([sheet.getRange(startRow, 1, validationDepth, COLUMNS.length)])
      .build();
    rules.push(rule);
  }

  // ── Full-row override: STATUS = RETOUR → black row ───────
  const statusColLetter = columnToLetter_(statusColIdx);
  const retourRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + statusColLetter + startRow + '="RETOUR"')
    .setBackground('#212121')
    .setFontColor('#FFFFFF')
    .setRanges([sheet.getRange(startRow, 1, validationDepth, COLUMNS.length)])
    .build();
  // RETOUR rule must be first so it overrides everything
  rules.unshift(retourRule);

  // ── Full-row override: BLACKLIST (If phone is in Blacklist sheet) ──
  const phoneColIdx = COLUMNS.indexOf('PHONE') + 1;
  const phoneColLetter = columnToLetter_(phoneColIdx);
  const blacklistRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND($${phoneColLetter}${startRow}<>"", COUNTIF(INDIRECT("'${BLACKLIST_SHEET_NAME}'!$${phoneColLetter}:$${phoneColLetter}"), $${phoneColLetter}${startRow}) > 0)`)
    .setBackground('#000000')   // completely black
    .setFontColor('#FFFFFF')    // white text
    .setRanges([sheet.getRange(startRow, 1, validationDepth, COLUMNS.length)])
    .build();
  rules.unshift(blacklistRule);

  // ── Conditional formatting for PHONE column (Duplicates) ──
  // Rule 1: Same phone + same date -> ORANGE
  // Rule 2: Same phone + different date -> YELLOW
  const dateColLetter = columnToLetter_(COLUMNS.indexOf('DATE') + 1);
  const phoneRange = sheet.getRange(startRow, phoneColIdx, validationDepth, 1);

  const phoneDiffDayRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND($${phoneColLetter}${startRow}<>"", COUNTIFS($${phoneColLetter}:$${phoneColLetter}, $${phoneColLetter}${startRow}) > 1)`)
    .setBackground(PHONE_DUP_DIFF_DAY)
    .setRanges([phoneRange])
    .build();

  const phoneSameDayRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND($${phoneColLetter}${startRow}<>"", COUNTIFS($${phoneColLetter}:$${phoneColLetter}, $${phoneColLetter}${startRow}, $${dateColLetter}:$${dateColLetter}, $${dateColLetter}${startRow}) > 1)`)
    .setBackground(PHONE_DUP_SAME_DAY)
    .setRanges([phoneRange])
    .build();

  // Insert phone duplicate detection before the row overrides so it highlights the specific cell
  rules.unshift(phoneDiffDayRule);
  rules.unshift(phoneSameDayRule);

  sheet.setConditionalFormatRules(rules);

  // ── Create Blacklist sheet if it doesn't exist ────────────
  if (!ss.getSheetByName(BLACKLIST_SHEET_NAME)) {
    const bl = ss.insertSheet(BLACKLIST_SHEET_NAME);
    const blHeader = bl.getRange(1, 1, 1, COLUMNS.length);
    blHeader.setValues([COLUMNS]);
    blHeader.setFontWeight('bold').setBackground('#212121')
            .setFontColor('#FFFFFF').setHorizontalAlignment('center');
    bl.setFrozenRows(1);
  }

  // ── Date format for DATE column ──────────────────────────
  sheet.getRange(startRow, 1, validationDepth, 1).setNumberFormat('yyyy-mm-dd');

  // ── Product catalog sheet ────────────────────────────────
  ensureProductsSheet_();
  ensureStockSyncSheet_();
  syncProductsCatalogFromOrders_({ silent: true });

  // ── Auto-install the edit trigger silently ────────────────
  ensureEditTrigger_();

  SpreadsheetApp.getActive().toast('✅ Sheet setup complete!', '📦 Order Manager', 5);
}

// ──────────────────────────────────────────────────────────────
// 4. SETTINGS / CREDENTIAL MANAGEMENT
// ──────────────────────────────────────────────────────────────

/**
 * Open an HTML sidebar so the user can enter API credentials
 * per shipping provider.
 */
function openSettingsDialog() {
  const html = HtmlService.createHtmlOutput(buildSettingsHtml_())
    .setTitle('📦 Provider API Settings');
  SpreadsheetApp.getUi().showSidebar(html);
}

/** Save credentials for a provider into Script Properties. */
function saveProviderCredentials(providerName, credentials) {
  const props = PropertiesService.getScriptProperties();
  for (const [key, value] of Object.entries(credentials)) {
    props.setProperty('CRED_' + providerName.replace(/\s+/g, '_') + '_' + key, value);
  }
  return true;
}

/** Retrieve stored credentials for a provider. */
function getProviderCredentials_(providerName) {
  const registry = getProviderRegistry_();
  const config = registry[providerName];
  if (!config) throw new Error('Unknown provider: ' + providerName);

  const props = PropertiesService.getScriptProperties();
  const prefix = 'CRED_' + providerName.replace(/\s+/g, '_') + '_';
  const creds = {};
  let hasAny = false;
  for (const key of config.credentialKeys) {
    const val = props.getProperty(prefix + key);
    creds[key] = val || '';
    if (val) hasAny = true;
  }
  return hasAny ? creds : null;
}

/** Build a simple HTML form for the settings sidebar. */
function buildSettingsHtml_() {
  const registry = getProviderRegistry_();
  const providerNames = Object.keys(registry);

  let optionsHtml = providerNames.map(p =>
    '<option value="' + p + '">' + p + '</option>'
  ).join('');

  return `
  <style>
    body { font-family: 'Google Sans', Arial, sans-serif; padding: 16px; background: #f8f9fa; }
    h3 { color: #1A73E8; margin-bottom: 16px; }
    label { display: block; font-weight: 500; margin: 10px 0 4px; color: #333; }
    select, input { width: 100%; padding: 8px 10px; border: 1px solid #dadce0; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
    select:focus, input:focus { outline: none; border-color: #1A73E8; box-shadow: 0 0 0 2px rgba(26,115,232,0.15); }
    button { margin-top: 16px; width: 100%; padding: 10px; background: #1A73E8; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
    button:hover { background: #1557B0; }
    #fields { margin-top: 12px; }
    .field-row { margin-bottom: 8px; }
    .status { margin-top: 12px; padding: 8px; border-radius: 6px; text-align: center; font-size: 13px; display: none; }
    .status.success { display: block; background: #D4EDDA; color: #155724; }
    .status.error { display: block; background: #F8D7DA; color: #721c24; }
  </style>
  <h3>🔑 API Credentials</h3>
  <label for="provider">Shipping Provider</label>
  <select id="provider" onchange="onProviderChange()">
    <option value="">-- Select Provider --</option>
    ${optionsHtml}
  </select>
  <div id="fields"></div>
  <div id="status" class="status"></div>

  <script>
    var registry = ${JSON.stringify(registry)};

    function onProviderChange() {
      var name = document.getElementById('provider').value;
      var container = document.getElementById('fields');
      document.getElementById('status').className = 'status';
      container.innerHTML = '';
      if (!name || !registry[name]) return;

      var keys = registry[name].credentialKeys;
      keys.forEach(function(k) {
        container.innerHTML +=
          '<div class="field-row">' +
          '<label for="field_' + k + '">' + k.toUpperCase() + '</label>' +
          '<input id="field_' + k + '" type="text" placeholder="Enter ' + k + '">' +
          '</div>';
      });
      container.innerHTML += '<button onclick="save()">💾 Save Credentials</button>';
    }

    function save() {
      var name = document.getElementById('provider').value;
      if (!name || !registry[name]) return;
      var creds = {};
      registry[name].credentialKeys.forEach(function(k) {
        creds[k] = document.getElementById('field_' + k).value;
      });
      google.script.run
        .withSuccessHandler(function() {
          var s = document.getElementById('status');
          s.textContent = '✅ Credentials saved for ' + name;
          s.className = 'status success';
        })
        .withFailureHandler(function(e) {
          var s = document.getElementById('status');
          s.textContent = '❌ Error: ' + e.message;
          s.className = 'status error';
        })
        .saveProviderCredentials(name, creds);
    }
  </script>`;
}

// ──────────────────────────────────────────────────────────────
// 5. API COMMUNICATION FRAMEWORK
// ──────────────────────────────────────────────────────────────

/**
 * Build authentication headers for a given provider config and
 * its stored credentials.
 */
function buildAuthHeaders_(providerConfig, credentials) {
  const headers = { 'Content-Type': 'application/json' };

  switch (providerConfig.family) {
    case PROVIDER_FAMILIES.ECOTRACK:
      headers['Authorization'] = 'Bearer ' + credentials.token;
      break;

    case PROVIDER_FAMILIES.YALIDINE:
      headers['X-API-ID'] = credentials.id;
      headers['X-API-TOKEN'] = credentials.token;
      break;

    case PROVIDER_FAMILIES.PROCOLIS:
      headers['token'] = credentials.token;
      headers['key'] = credentials.key;
      break;

    case PROVIDER_FAMILIES.MAYSTRO:
      headers['Authorization'] = 'Token ' + credentials.token;
      break;

    default:
      throw new Error('Unknown provider family: ' + providerConfig.family);
  }
  return headers;
}

/**
 * Generic API request wrapper around UrlFetchApp.
 *
 * @param {string} method  - 'get' or 'post'
 * @param {string} url     - Full URL
 * @param {Object} headers - HTTP headers
 * @param {Object|null} payload - Request body (for POST)
 * @returns {Object} Parsed JSON response
 */
function apiRequest_(method, url, headers, payload) {
  const options = {
    method: method.toLowerCase(),
    headers: headers,
    muteHttpExceptions: true,
    contentType: 'application/json',
  };

  if (payload !== null && payload !== undefined) {
    options.payload = JSON.stringify(payload);
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const body = response.getContentText();

    if (code >= 400) {
      throw new Error(
        'HTTP ' + code + ' from ' + url + ': ' + body.substring(0, 500)
      );
    }
    return body ? JSON.parse(body) : {};
  } catch (e) {
    logApiError_('API', url, e);
    throw e;
  }
}

/**
 * High-level helper: resolve provider, load credentials, call the
 * specified endpoint, and return the parsed response.
 */
function callProviderEndpoint_(providerName, endpointKey, method, pathSuffix, payload) {
  const registry = getProviderRegistry_();
  const config = registry[providerName];
  if (!config) throw new Error('Unknown provider: ' + providerName);

  const credentials = getProviderCredentials_(providerName);
  if (!credentials) {
    throw new Error('No credentials configured for ' + providerName +
      '. Go to 📦 Order Manager → Settings to add them.');
  }

  const headers = buildAuthHeaders_(config, credentials);
  const basePath = config.endpoints[endpointKey];
  if (basePath === null && !pathSuffix) {
    throw new Error(endpointKey + ' is not supported for ' + providerName);
  }

  let url = config.domain;
  if (!url.endsWith('/')) url += '/';
  if (basePath) url += basePath;
  if (pathSuffix) url += pathSuffix;

  return apiRequest_(method, url, headers, payload);
}

// ──────────────────────────────────────────────────────────────
// 6. PAYLOAD MAPPERS  (sheet row → provider API payload)
// ──────────────────────────────────────────────────────────────

/**
 * Reads a sheet row object and returns the correct API payload
 * for the provider family indicated by the SOCIETE column.
 */
function mapRowToPayload_(rowData, providerConfig) {
  switch (providerConfig.family) {
    case PROVIDER_FAMILIES.YALIDINE:
      return mapToYalidinePayload_(rowData);
    case PROVIDER_FAMILIES.ECOTRACK:
      return mapToEcotrackPayload_(rowData);
    case PROVIDER_FAMILIES.PROCOLIS:
      return mapToProcolisPayload_(rowData);
    case PROVIDER_FAMILIES.MAYSTRO:
      return mapToMaystroPayload_(rowData);
    default:
      throw new Error('No payload mapper for family: ' + providerConfig.family);
  }
}

/** Yalidine / Yalitec payload. */
function mapToYalidinePayload_(r) {
  const nameParts = (r['NAME'] || '').trim().split(/\s+/);
  const firstname = nameParts[0] || '';
  const familyname = nameParts.slice(1).join(' ') || firstname;

  return {
    order_id:          r['ORDER ID'] || '',
    from_wilaya_name:  '', // set by user or origin wilaya in settings
    firstname:         firstname,
    familyname:        familyname,
    contact_phone:     String(r['PHONE'] || ''),
    address:           r['ADRESSE'] || '',
    to_commune_name:   r['COMMUNE'] || '',
    to_wilaya_name:    r['WILAYA'] || '',
    product_list:      r['PRODUCT'] || '',
    price:             Number(r['TOTAL PRICE']) || 0,
    do_insurance:      (r['INSURANCE'] || '').toUpperCase() === 'OUI',
    declared_value:    Number(r['TOTAL PRICE']) || 0,
    length:            1,
    width:             1,
    height:            1,
    weight:            Number(r['WEIGHT']) || 1,
    freeshipping:      false,
    is_stopdesk:       (r['DELIVERY MODE'] || '').toLowerCase() === 'stop desk',
    stopdesk_id:       r['STATION'] || '',
    has_exchange:      (r['EXCHANGE'] || '').toUpperCase() === 'EXCHANGE',
    product_to_collect: r['PRODUCT TO CHANGE'] || null,
  };
}

/** Ecotrack family payload (22 providers). */
function mapToEcotrackPayload_(r) {
  // Delivery type mapping: 1=Livraison, 2=Echange, 3=PICKUP, 4=Recouvrement
  let type = 1; // default: livraison
  if ((r['EXCHANGE'] || '').toUpperCase() === 'EXCHANGE') type = 2;

  return {
    reference:            r['ORDER ID'] || '',
    nom_client:           r['NAME'] || '',
    telephone:            String(r['PHONE'] || ''),
    telephone_2:          '',
    adresse:              (r['ADRESSE'] || r['STATION'] || r['WILAYA'] || 'Bureau').trim(),
    code_postal:          '',
    commune:              (r['COMMUNE'] || r['WILAYA'] || 'Commune').trim(),
    code_wilaya:          String(Number(r['CODE WILAYA']) || 0),
    montant:              String(Number(r['TOTAL PRICE']) || 0),
    remarque:             r['NOTE'] || '',
    produit:              r['PRODUCT'] || '',
    stock:                (r['STOCK TYPE'] || '').toUpperCase() === 'STOCK' ? 1 : 0,
    quantite:             String(Number(r['QUANTITY']) || 1),
    produit_a_recuperer:  r['PRODUCT TO CHANGE'] || '',
    boutique:             '',
    type:                 String(type),
    stop_desk:            (r['DELIVERY MODE'] || '').toLowerCase() === 'stop desk' ? 1 : 0,
    weight:               String(Number(r['WEIGHT']) || ''),
    fragile:              (r['FRAGILE'] || '').toLowerCase() === 'fragile' ? 1 : 0,
    gps_link:             '',
  };
}

/** Procolis / ZR Express payload. */
function mapToProcolisPayload_(r) {
  return {
    Tracking:       r['TRACKING'] || '',
    TypeLivraison:  (r['DELIVERY MODE'] || '').toLowerCase() === 'stop desk' ? 1 : 0,
    TypeColis:      (r['EXCHANGE'] || '').toUpperCase() === 'EXCHANGE' ? 1 : 0,
    Confrimee:      1,
    Client:         r['NAME'] || '',
    MobileA:        String(r['PHONE'] || ''),
    MobileB:        '',
    Adresse:        r['ADRESSE'] || '',
    IDWilaya:       Number(r['CODE WILAYA']) || 0,
    Commune:        r['COMMUNE'] || '',
    Total:          Number(r['TOTAL PRICE']) || 0,
    Note:           r['NOTE'] || '',
    TProduit:       r['PRODUCT'] || '',
    id_Externe:     r['ORDER ID'] || '',
    Source:         '',
  };
}

/** Maystro Delivery payload. */
function mapToMaystroPayload_(r) {
  return {
    wilaya:            Number(r['CODE WILAYA']) || 0,
    commune:           Number(r['CODE WILAYA']) || 0, // commune ID needed; fallback
    destination_text:  r['ADRESSE'] || '',
    customer_phone:    String(r['PHONE'] || ''),
    customer_name:     r['NAME'] || '',
    product_price:     Number(r['TOTAL PRICE']) || 0,
    delivery_type:     (r['DELIVERY MODE'] || '').toLowerCase() === 'stop desk' ? 1 : 0,
    express:           false,
    note_to_driver:    r['NOTE'] || '',
    products:          [{ name: r['PRODUCT'] || 'Product' }],
    source:            4,
    external_order_id: r['ORDER ID'] || '',
  };
}

// ──────────────────────────────────────────────────────────────
// 7. CORE OPERATIONS  (Menu actions + auto-injection)
// ──────────────────────────────────────────────────────────────

/**
 * Installable edit trigger — handles two columns:
 *
 * 1. CONFIRMATION  → colours the entire row to match the
 *    selected value; if "INJECTER" also auto-injects the order.
 * 2. STATUS        → if changed to "RETOUR", overrides the row
 *    to black and copies the order into the Blacklist sheet.
 *
 * Installed silently by setupSheet() → ensureEditTrigger_().
 */
function onEditTrigger(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();

  if (sheetName === PRODUCTS_SHEET_NAME) {
    handleProductsSheetEdit_(sheet, e.range.getRow(), e.range.getColumn());
    return;
  }

  if (sheetName !== SHEET_NAME) return;

  const editedRow = e.range.getRow();
  const editedCol = e.range.getColumn();
  if (editedRow < getOrdersDataStartRow_(sheet)) return;

  const confirmColIdx = COLUMNS.indexOf('CONFIRMATION') + 1;
  const statusColIdx  = COLUMNS.indexOf('STATUS') + 1;
  const productColIdx = COLUMNS.indexOf('PRODUCT') + 1;
  const qtyColIdx = COLUMNS.indexOf('QUANTITY') + 1;

  // ── CONFIRMATION column changed ───────────────────────────
  if (editedCol === confirmColIdx) {
    const newValue = String(e.value || '').toUpperCase().trim();

    // Colour the entire row based on the CONFIRMATION value
    colorizeRow_(sheet, editedRow);

    // Auto-inject when INJECTER is selected
    if (newValue === 'INJECTER') {
      injectSingleRow_(sheet, editedRow);
    } else {
      reconcileOrderStock_(sheet, editedRow);
    }
    return;
  }

  // ── STATUS column changed ────────────────────────────────
  if (editedCol === statusColIdx) {
    const newStatus = String(e.value || '').toUpperCase().trim();
    if (newStatus === 'RETOUR') {
      applyRetourOverride_(sheet, editedRow);
    } else {
      // Re-apply the normal CONFIRMATION-based row colour
      colorizeRow_(sheet, editedRow);
    }
    reconcileOrderStock_(sheet, editedRow);
    return;
  }

  // ── Auto-calculate TOTAL PRICE ───────────────────────────
  // Re-calculate Total Price if Quantity, Product Price, or Delivery Price changes
  const prodPriceColIdx = COLUMNS.indexOf('PRODUCT PRICE') + 1;
  const delivPriceColIdx = COLUMNS.indexOf('DELIVERY PRICE') + 1;

  if (editedCol === qtyColIdx || editedCol === prodPriceColIdx || editedCol === delivPriceColIdx) {
    autoCalculateTotalPrice_(sheet, editedRow);
  }

  if (editedCol === productColIdx || editedCol === qtyColIdx) {
    reconcileOrderStock_(sheet, editedRow);
  }
}

// ──────────────────────────────────────────────────────────────
// 7a. PRICE AUTO-CALCULATION
// ──────────────────────────────────────────────────────────────

/**
 * Auto-calculates the TOTAL PRICE for a specific row:
 * Formula: (PRODUCT PRICE * QUANTITY) + DELIVERY PRICE
 */
function autoCalculateTotalPrice_(sheet, row) {
  const rowData = getRowDataAt_(sheet, row);
  const qtyRaw = rowData['QUANTITY'];
  const prodPrice = Number(rowData['PRODUCT PRICE']) || 0;
  const delivPrice = Number(rowData['DELIVERY PRICE']) || 0;
  
  // If QUANTITY is empty, assume 1, otherwise strictly interpret it as a number 
  const qty = (qtyRaw === '' || qtyRaw === undefined) ? 1 : (Number(qtyRaw) || 0);

  const totalPrice = (prodPrice * qty) + delivPrice;

  const totalColIdx = COLUMNS.indexOf('TOTAL PRICE') + 1;
  sheet.getRange(row, totalColIdx).setValue(totalPrice);
}

// ──────────────────────────────────────────────────────────────
// 7b. ROW COLOURING HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * Set the entire row background based on its CONFIRMATION value.
 * If STATUS is RETOUR, the black override takes precedence.
 */
function colorizeRow_(sheet, sheetRow) {
  const numCols = COLUMNS.length;
  const rowData = getRowDataAt_(sheet, sheetRow);
  const fullRow = sheet.getRange(sheetRow, 1, 1, numCols);

  // RETOUR always wins
  const status = String(rowData['STATUS'] || '').toUpperCase().trim();
  if (status === 'RETOUR') {
    applyRetourOverride_(sheet, sheetRow);
    return;
  }

  const confirmation = String(rowData['CONFIRMATION'] || '').toUpperCase().trim();
  const color = CONFIRMATION_COLORS[confirmation] || null;

  if (color) {
    fullRow.setBackground(color).setFontColor('#000000');
  } else {
    // Reset to white if no matching confirmation value
    fullRow.setBackground(null).setFontColor(null);
  }
}

/**
 * Override the entire row to black with white text.
 * Also copies the order to the Blacklist sheet.
 */
function applyRetourOverride_(sheet, sheetRow) {
  const numCols = COLUMNS.length;
  const fullRow = sheet.getRange(sheetRow, 1, 1, numCols);
  fullRow.setBackground('#212121').setFontColor('#FFFFFF');

  // Copy to Blacklist
  copyToBlacklist_(sheet, sheetRow);
}

/**
 * Copy a row to the Blacklist sheet (if not already there).
 * De-duplicates by ORDER ID to avoid double-entries.
 */
function copyToBlacklist_(sourceSheet, sheetRow) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let bl = ss.getSheetByName(BLACKLIST_SHEET_NAME);
  if (!bl) {
    bl = ss.insertSheet(BLACKLIST_SHEET_NAME);
    const header = bl.getRange(1, 1, 1, COLUMNS.length);
    header.setValues([COLUMNS]);
    header.setFontWeight('bold').setBackground('#212121')
          .setFontColor('#FFFFFF').setHorizontalAlignment('center');
    bl.setFrozenRows(1);
  }

  const rowValues = sourceSheet.getRange(sheetRow, 1, 1, COLUMNS.length).getValues()[0];
  const orderId = rowValues[COLUMNS.indexOf('ORDER ID')];

  // Check for duplicate by ORDER ID
  if (orderId) {
    const blData = bl.getDataRange().getValues();
    const orderIdCol = COLUMNS.indexOf('ORDER ID');
    for (let i = 1; i < blData.length; i++) {
      if (String(blData[i][orderIdCol]) === String(orderId)) {
        return; // already in blacklist
      }
    }
  }

  // Append the row and style it black
  bl.appendRow(rowValues);
  const newRow = bl.getLastRow();
  bl.getRange(newRow, 1, 1, COLUMNS.length)
    .setBackground('#212121').setFontColor('#FFFFFF');
}

/**
 * Inject a single row – used by both the onEdit trigger and the
 * bulk menu action.  On success the **entire row turns green**,
 * TRACKING / STATUS / RAW STATUS are filled from the API response,
 * and CONFIRMATION is changed to CONFIRME.
 */
function injectSingleRow_(sheet, sheetRow) {
  const registry = getProviderRegistry_();
  const trackingColIdx  = COLUMNS.indexOf('TRACKING') + 1;
  const statusColIdx    = COLUMNS.indexOf('STATUS') + 1;
  const rawStatusColIdx = COLUMNS.indexOf('RAW STATUS') + 1;
  const confirmColIdx   = COLUMNS.indexOf('CONFIRMATION') + 1;
  const numCols = COLUMNS.length;

  const rowData = getRowDataAt_(sheet, sheetRow);
  const fullRowRange = sheet.getRange(sheetRow, 1, 1, numCols);

  // ── Resolve provider ────────────────────────────────────
  const matchedProvider = findProviderKey_(rowData['SOCIETE']);
  if (!matchedProvider) {
    sheet.getRange(sheetRow, rawStatusColIdx)
         .setValue('ERROR: Unknown provider "' + (rowData['SOCIETE'] || '') + '"');
    fullRowRange.setBackground(ERROR_ROW_COLOR).setFontColor('#000000');
    return { success: false, error: 'Unknown provider' };
  }

  const config = registry[matchedProvider];

  try {
    // ── Build & send payload ────────────────────────────────
    const payload = mapRowToPayload_(rowData, config);
    let response;

    if (config.family === PROVIDER_FAMILIES.YALIDINE) {
      response = callProviderEndpoint_(matchedProvider, 'createOrder', 'post', '', [payload]);
    } else if (config.family === PROVIDER_FAMILIES.PROCOLIS) {
      response = callProviderEndpoint_(matchedProvider, 'createOrder', 'post', '', { Colis: [payload] });
    } else if (config.family === PROVIDER_FAMILIES.ECOTRACK) {
      const queryString = '?' + Object.keys(payload).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(payload[k] !== undefined && payload[k] !== null ? payload[k] : '')).join('&');
      response = callProviderEndpoint_(matchedProvider, 'createOrder', 'post', queryString, null);
    } else {
      response = callProviderEndpoint_(matchedProvider, 'createOrder', 'post', '', payload);
    }

    // ── Extract tracking number ─────────────────────────────
    const tracking = extractTracking_(response, config, rowData);
    if (tracking) {
      sheet.getRange(sheetRow, trackingColIdx).setValue(tracking);
    }

    // ── Extract & write STATUS and RAW STATUS ───────────────
    const rawStatusStr = JSON.stringify(response).substring(0, 500);
    sheet.getRange(sheetRow, rawStatusColIdx).setValue(rawStatusStr);

    const initialStatus = extractInitialStatus_(response, config, rowData);
    if (initialStatus) {
      sheet.getRange(sheetRow, statusColIdx).setValue(initialStatus);
    }

    // ── Mark as confirmed + re-colour row ───────────────────
    sheet.getRange(sheetRow, confirmColIdx).setValue('CONFIRME');
    colorizeRow_(sheet, sheetRow);

    // If the initial status came back as RETOUR, override
    if (initialStatus === 'RETOUR') {
      applyRetourOverride_(sheet, sheetRow);
    }

    reconcileOrderStock_(sheet, sheetRow);

    return { success: true, tracking: tracking };

  } catch (e) {
    sheet.getRange(sheetRow, rawStatusColIdx)
         .setValue('ERROR: ' + e.message.substring(0, 400));
    fullRowRange.setBackground(ERROR_ROW_COLOR).setFontColor('#000000');
    logApiError_(matchedProvider, 'createOrder', e);
    return { success: false, error: e.message };
  }
}

/**
 * Bulk inject: scans all rows with CONFIRMATION == "INJECTER"
 * and sends each to the provider API.
 */
function injectOrders() {
  const sheet = getOrdersSheet_();
  const data = getSheetData_(sheet);

  if (data.length === 0) {
    SpreadsheetApp.getUi().alert('No data rows found.');
    return;
  }

  let injected = 0;
  let errors = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if ((row['CONFIRMATION'] || '').toUpperCase() !== 'INJECTER') continue;

    const sheetRow = getOrdersSheetRowFromDataIndex_(sheet, i);
    const result = injectSingleRow_(sheet, sheetRow);

    if (result.success) {
      injected++;
    } else {
      errors.push('Row ' + sheetRow + ': ' + result.error);
    }
  }

  let msg = '✅ Injected ' + injected + ' order(s).';
  if (errors.length > 0) {
    msg += '\n\n⚠️ Errors:\n' + errors.join('\n');
  }
  SpreadsheetApp.getUi().alert(msg);
}

/**
 * Extract the tracking number from each provider family's
 * createOrder response.
 *
 * Response shapes per family (from CourierDZ docs):
 *
 * Yalidine:  { "ORDER-123": { success, tracking, label, ... } }
 * Ecotrack:  { success, message, tracking, ... }
 * Procolis:  { Colis: [{ Tracking, MessageRetour, ... }] }
 * Maystro:   { id, tracking, ... }
 */
function extractTracking_(response, config, rowData) {
  if (!response) return null;

  switch (config.family) {
    case PROVIDER_FAMILIES.YALIDINE: {
      // Response keyed by order_id
      const orderId = String(rowData['ORDER ID'] || '');
      const entry = response[orderId]
        || response[Object.keys(response)[0]]
        || {};
      return entry.tracking || entry.Tracking
        || entry.label || entry.tracking_id || null;
    }

    case PROVIDER_FAMILIES.ECOTRACK:
      // Ecotrack returns { success, message, tracking?, ... }
      return response.tracking || response.Tracking
        || response.reference || response.tracking_code || null;

    case PROVIDER_FAMILIES.PROCOLIS: {
      // Procolis returns { Colis: [{ Tracking, ... }] }
      const colis = (response.Colis || [])[0] || {};
      return colis.Tracking || colis.tracking || null;
    }

    case PROVIDER_FAMILIES.MAYSTRO:
      return response.tracking || response.tracking_code
        || String(response.id || '') || null;

    default:
      return null;
  }
}

/**
 * Derive an initial STATUS value from the createOrder response.
 * Most providers return a status or state field; if none is found
 * we default to "EN LIVRAISON" (the order has been accepted).
 */
function extractInitialStatus_(response, config, rowData) {
  if (!response) return 'EN LIVRAISON';

  let rawStatus = '';

  switch (config.family) {
    case PROVIDER_FAMILIES.YALIDINE: {
      const orderId = String(rowData['ORDER ID'] || '');
      const entry = response[orderId]
        || response[Object.keys(response)[0]]
        || {};
      // Check if success field exists
      if (entry.success === 'true' || entry.success === true) {
        rawStatus = entry.status || entry.state || '';
      } else if (entry.success === 'false' || entry.success === false) {
        return 'ANNULE'; // provider rejected the order
      }
      break;
    }

    case PROVIDER_FAMILIES.ECOTRACK:
      if (response.success === true) {
        rawStatus = response.status || response.state || '';
      } else if (response.success === false) {
        return 'ANNULE';
      }
      break;

    case PROVIDER_FAMILIES.PROCOLIS: {
      const colis = (response.Colis || [])[0] || {};
      if (colis.MessageRetour === 'Good' || colis.message_retour === 'Good') {
        rawStatus = colis.Statut || colis.statut || '';
      } else {
        return 'ANNULE';
      }
      break;
    }

    case PROVIDER_FAMILIES.MAYSTRO:
      rawStatus = response.status || response.state || '';
      break;
  }

  // If the provider returned a status, normalise it
  if (rawStatus) {
    const mapped = mapRawStatus_(rawStatus);
    return mapped || 'EN LIVRAISON';
  }

  // Default for a freshly accepted order
  return 'EN LIVRAISON';
}

/**
 * Fetch delivery rates for the selected row's provider and wilaya,
 * then write the delivery price back.
 */
function fetchDeliveryRates() {
  const sheet = getOrdersSheet_();
  const activeRange = sheet.getActiveRange();
  if (!activeRange) {
    SpreadsheetApp.getUi().alert('Please select one or more rows first.');
    return;
  }

  const startRow = activeRange.getRow();
  const numRows = activeRange.getNumRows();
  const deliveryPriceColIdx = COLUMNS.indexOf('DELIVERY PRICE') + 1;
  const dataStartRow = getOrdersDataStartRow_(sheet);
  let updated = 0;

  for (let r = startRow; r < startRow + numRows; r++) {
    if (r < dataStartRow) continue;
    const rowData = getRowDataAt_(sheet, r);
    const providerName = findProviderKey_(rowData['SOCIETE']);
    if (!providerName) continue;

    const config = getProviderRegistry_()[providerName];
    if (!config.endpoints.rates) continue;

    try {
      const codeWilaya = Number(rowData['CODE WILAYA']) || null;
      let suffix = '';

      if (config.family === PROVIDER_FAMILIES.YALIDINE) {
        const params = [];
        if (codeWilaya) params.push('to_wilaya_id=' + codeWilaya);
        if (params.length > 0) suffix = '?' + params.join('&');
        const rates = callProviderEndpoint_(providerName, 'rates', 'get', suffix, null);
        // rates is an array; find the matching wilaya entry
        const entry = Array.isArray(rates)
          ? rates.find(e => e.wilaya_id === codeWilaya) || rates[0]
          : rates;
        const price = entry ? (entry.home_fee || entry.desk_fee || entry.price || '') : '';
        sheet.getRange(r, deliveryPriceColIdx).setValue(price);
        updated++;
      } else if (config.family === PROVIDER_FAMILIES.ECOTRACK) {
        const rates = callProviderEndpoint_(providerName, 'rates', 'get', '', null);
        const livraison = rates.livraison || rates;
        const entry = Array.isArray(livraison)
          ? livraison.find(e => e.wilaya_id === codeWilaya || e.code_wilaya === codeWilaya) || livraison[0]
          : livraison;
        const price = entry ? (entry.price || entry.tarif || '') : '';
        sheet.getRange(r, deliveryPriceColIdx).setValue(price);
        updated++;
      } else if (config.family === PROVIDER_FAMILIES.PROCOLIS) {
        const rates = callProviderEndpoint_(providerName, 'rates', 'post', '', {});
        const entry = Array.isArray(rates)
          ? rates.find(e => Number(e.IDWilaya) === codeWilaya) || rates[0]
          : rates;
        const price = entry ? (entry.Tarif || entry.tarif || '') : '';
        sheet.getRange(r, deliveryPriceColIdx).setValue(price);
        updated++;
      }
    } catch (e) {
      logApiError_(providerName, 'getRates', e);
    }
  }

  SpreadsheetApp.getActive().toast('Updated rates for ' + updated + ' row(s).', '📦 Rates', 5);
}

/**
 * Update order statuses by calling getOrder on the provider for
 * each row that has a TRACKING value.
 */
function updateOrderStatuses() {
  const sheet = getOrdersSheet_();
  const activeRange = sheet.getActiveRange();
  if (!activeRange) {
    SpreadsheetApp.getUi().alert('Please select one or more rows first.');
    return;
  }

  const startRow = activeRange.getRow();
  const numRows = activeRange.getNumRows();
  const statusColIdx = COLUMNS.indexOf('STATUS') + 1;
  const rawStatusColIdx = COLUMNS.indexOf('RAW STATUS') + 1;
  const dataStartRow = getOrdersDataStartRow_(sheet);
  let updated = 0;

  for (let r = startRow; r < startRow + numRows; r++) {
    if (r < dataStartRow) continue;
    const rowData = getRowDataAt_(sheet, r);
    const tracking = rowData['TRACKING'];
    if (!tracking) continue;

    const providerName = findProviderKey_(rowData['SOCIETE']);
    if (!providerName) continue;

    const config = getProviderRegistry_()[providerName];
    if (!config.endpoints.getOrder) continue;

    try {
      let response;
      if (config.family === PROVIDER_FAMILIES.PROCOLIS) {
        response = callProviderEndpoint_(providerName, 'getOrder', 'post', '', {
          Colis: [{ Tracking: tracking }],
        });
        const colis = (response.Colis || [])[0] || {};
        sheet.getRange(r, rawStatusColIdx).setValue(JSON.stringify(colis).substring(0, 500));
        const status = mapRawStatus_(colis.Statut || colis.statut || '');
        if (status) sheet.getRange(r, statusColIdx).setValue(status);
      } else if (config.family === PROVIDER_FAMILIES.ECOTRACK) {
        response = callProviderEndpoint_(providerName, 'trackingInfo', 'get', '?tracking=' + tracking, null);
        sheet.getRange(r, rawStatusColIdx).setValue(JSON.stringify(response).substring(0, 500));
        let rawStatus = '';
        if (response && response.activity && response.activity.length > 0) {
          const latestActivity = response.activity[response.activity.length - 1];
          rawStatus = latestActivity.status || '';
        }
        const status = mapRawStatus_(rawStatus);
        if (status) sheet.getRange(r, statusColIdx).setValue(status);
      } else {
        // Yalidine: GET .../v1/parcels/{trackingId}
        // Maystro:  GET .../stores/orders/{trackingId}/
        const suffix = tracking + (config.family === PROVIDER_FAMILIES.MAYSTRO ? '/' : '');
        response = callProviderEndpoint_(providerName, 'getOrder', 'get', suffix, null);

        const data = response.data ? (Array.isArray(response.data) ? response.data[0] : response.data) : response;
        sheet.getRange(r, rawStatusColIdx).setValue(JSON.stringify(data).substring(0, 500));
        const rawStatus = data.status || data.state || data.Statut || '';
        const status = mapRawStatus_(rawStatus);
        if (status) sheet.getRange(r, statusColIdx).setValue(status);
      }
      updated++;
    } catch (e) {
      sheet.getRange(r, rawStatusColIdx).setValue('ERROR: ' + e.message.substring(0, 400));
      logApiError_(providerName, 'getOrder', e);
    }
  }

  SpreadsheetApp.getActive().toast('Updated status for ' + updated + ' row(s).', '📦 Status', 5);
}

/**
 * Get shipping labels for selected rows.
 */
function getOrderLabels() {
  const sheet = getOrdersSheet_();
  const activeRange = sheet.getActiveRange();
  if (!activeRange) {
    SpreadsheetApp.getUi().alert('Please select one or more rows first.');
    return;
  }

  const startRow = activeRange.getRow();
  const numRows = activeRange.getNumRows();
  const dataStartRow = getOrdersDataStartRow_(sheet);
  let fetched = 0;
  const labels = [];

  for (let r = startRow; r < startRow + numRows; r++) {
    if (r < dataStartRow) continue;
    const rowData = getRowDataAt_(sheet, r);
    const tracking = rowData['TRACKING'];
    if (!tracking) continue;

    const providerName = findProviderKey_(rowData['SOCIETE']);
    if (!providerName) continue;

    const config = getProviderRegistry_()[providerName];

    try {
      if (config.family === PROVIDER_FAMILIES.YALIDINE) {
        // Get label URL from getOrder response
        const response = callProviderEndpoint_(providerName, 'getOrder', 'get', tracking, null);
        const data = response.data ? (Array.isArray(response.data) ? response.data[0] : response.data) : response;
        if (data.label) {
          labels.push({ type: 'url', data: data.label, row: r, tracking: tracking });
          fetched++;
        }
      } else if (config.family === PROVIDER_FAMILIES.ECOTRACK) {
        const response = callProviderEndpoint_(providerName, 'orderLabel', 'get', '?tracking=' + tracking, null);
        labels.push({ type: 'pdf', data: response, row: r, tracking: tracking });
        fetched++;
      } else if (config.family === PROVIDER_FAMILIES.MAYSTRO) {
        const response = callProviderEndpoint_(providerName, 'orderLabel', 'post', '', {
          orders: [tracking],
        });
        labels.push({ type: 'pdf', data: response, row: r, tracking: tracking });
        fetched++;
      }
      // Procolis: orderLabel not supported
    } catch (e) {
      logApiError_(providerName, 'orderLabel', e);
    }
  }

  if (labels.length === 0) {
    SpreadsheetApp.getUi().alert('No labels could be fetched.');
    return;
  }

  // Show label URLs / download links
  let html = '<html><head><style>body{font-family:Arial;padding:16px}a{color:#1A73E8;display:block;margin:8px 0}</style></head><body>';
  html += '<h3>📄 Order Labels (' + fetched + ')</h3>';
  for (const label of labels) {
    if (label.type === 'url') {
      html += '<a href="' + label.data + '" target="_blank">🏷️ Label for ' + label.tracking + '</a>';
    } else {
      html += '<p>🏷️ PDF label for ' + label.tracking + ' (check RAW STATUS column for base64 data)</p>';
    }
  }
  html += '</body></html>';

  const dialog = HtmlService.createHtmlOutput(html)
    .setTitle('📄 Labels')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(dialog, '📄 Order Labels');
}

/**
 * Map a raw provider status string to a normalised STATUS value.
 */
function mapRawStatus_(rawStatus) {
  if (!rawStatus) return '';
  const s = String(rawStatus).toUpperCase().trim();

  // EcoTrack specific statuses
  if (s === 'ORDER_INFORMATION_RECEIVED_BY_CARRIER' || s === 'PICKED' || 
      s === 'ACCEPTED_BY_CARRIER' || s === 'DISPATCHED_TO_DRIVER' || 
      s === 'ATTEMPT_DELIVERY' || s.includes('PRÊT À EXPÉDIER') || 
      s.includes('PRÊT À PRÉPARER') || s.includes('EN RAMASSAGE') || 
      s.includes('STOCK EN PRÉPARATION') || s.includes('VERS HUB') || 
      s.includes('EN HUB') || s.includes('VERS WILAYA') || 
      s.includes('EN PRÉPARATION')) return 'EN LIVRAISON';
  if (s === 'RETURN_ASKED' || s === 'RETURN_IN_TRANSIT' || s === 'RETURN_RECEIVED') return 'RETOUR';
  if (s === 'LIVRED' || s === 'ENCAISSED' || s === 'PAYED') return 'LIVREE';
  if (s === 'SUSPENDUS') return 'ANNULE';

  // Livré / delivered
  if (s.includes('LIVR') || s.includes('DELIVER') || s === 'LIVREE') return 'LIVREE';
  // En cours / in transit
  if (s.includes('EN COURS') || s.includes('TRANSIT') || s.includes('EXPEDI')
      || s.includes('EN LIVRAISON') || s.includes('ENLEV')) return 'EN LIVRAISON';
  // Annulé / cancelled
  if (s.includes('ANNUL') || s.includes('CANCEL') || s.includes('REFUSE')) return 'ANNULE';
  // Retour / returned
  if (s.includes('RETOUR') || s.includes('RETURN') || s.includes('RETIR')) return 'RETOUR';

  return ''; // leave empty for unknown statuses so RAW STATUS can be inspected
}

// ──────────────────────────────────────────────────────────────
// 8. WEBHOOK ENDPOINT
// ──────────────────────────────────────────────────────────────

/**
 * Minimal webhook used by the storefront app to append checkout rows.
 *
 * Expected JSON body:
 * {
 *   "secret": "shared-secret",
 *   "row": {
 *     "DATE": "...",
 *     "NAME": "...",
 *     ...
 *   }
 * }
 *
 * Before first use, set the Apps Script project property WEBHOOK_SECRET
 * to match the app server's GOOGLE_SHEETS_WEBHOOK_SECRET value.
 */
function doPost(e) {
  try {
    const payload = parseWebhookPayload_(e);
    const expectedSecret = PropertiesService.getScriptProperties()
      .getProperty(WEBHOOK_SECRET_PROPERTY);

    if (!expectedSecret) {
      throw new Error(
        'Missing script property "' + WEBHOOK_SECRET_PROPERTY + '".'
      );
    }

    if (String(payload.secret || '') !== String(expectedSecret)) {
      return jsonResponse_({
        ok: false,
        error: 'Unauthorized webhook request.',
      });
    }

    const sheet = getOrdersSheet_();
    const values = buildWebhookRowValues_(payload.row);
    sheet.appendRow(values);

    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, COLUMNS.indexOf('DATE') + 1)
      .setNumberFormat('yyyy-mm-dd');
    const warnings = runWebhookPostAppendTasks_(sheet, newRow);

    return jsonResponse_({
      ok: true,
      rowNumber: newRow,
      warnings: warnings,
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : 'Webhook failed.',
    });
  }
}

function runWebhookPostAppendTasks_(sheet, rowNumber) {
  const warnings = [];

  try {
    syncProductsCatalogFromOrderRow_(sheet, rowNumber);
  } catch (error) {
    const message = error && error.message
      ? error.message
      : 'Catalog sync failed after appending the order row.';
    warnings.push('Catalog sync: ' + message);
    console.error('[OrderManager] webhook catalog sync failed:', error);
  }

  try {
    reconcileOrderStock_(sheet, rowNumber, { skipCatalogSync: true });
  } catch (error) {
    const message = error && error.message
      ? error.message
      : 'Stock reconciliation failed after appending the order row.';
    warnings.push('Stock sync: ' + message);
    console.error('[OrderManager] webhook stock reconciliation failed:', error);
  }

  return warnings;
}

function parseWebhookPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body.');
  }

  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('Invalid JSON payload.');
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a JSON object.');
  }

  if (!payload.row || typeof payload.row !== 'object') {
    throw new Error('Missing row payload.');
  }

  return payload;
}

function buildWebhookRowValues_(row) {
  const valuesByColumn = {};
  COLUMNS.forEach((column) => {
    valuesByColumn[column] = '';
  });

  WEBHOOK_ALLOWED_COLUMNS.forEach((column) => {
    if (!(column in row)) {
      return;
    }

    valuesByColumn[column] = row[column];
  });

  const dateValue = new Date(String(valuesByColumn['DATE'] || ''));
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error('Invalid DATE value.');
  }

  const deliveryMode = String(valuesByColumn['DELIVERY MODE'] || '').trim();
  if (!DROPDOWNS['DELIVERY MODE'].includes(deliveryMode)) {
    throw new Error('Invalid DELIVERY MODE value.');
  }

  valuesByColumn['DATE'] = dateValue;
  valuesByColumn['NAME'] = requireWebhookString_(valuesByColumn['NAME'], 'NAME');
  valuesByColumn['PHONE'] = requireWebhookString_(valuesByColumn['PHONE'], 'PHONE');
  valuesByColumn['CODE WILAYA'] = requireWebhookString_(
    valuesByColumn['CODE WILAYA'],
    'CODE WILAYA'
  );
  valuesByColumn['WILAYA'] = requireWebhookString_(valuesByColumn['WILAYA'], 'WILAYA');
  valuesByColumn['ADRESSE'] = optionalWebhookString_(valuesByColumn['ADRESSE']);
  valuesByColumn['PRODUCT'] = requireWebhookString_(valuesByColumn['PRODUCT'], 'PRODUCT');
  valuesByColumn['PRODUCT Option'] = optionalWebhookString_(
    valuesByColumn['PRODUCT Option']
  );
  valuesByColumn['QUANTITY'] = requireWebhookNumber_(valuesByColumn['QUANTITY'], 'QUANTITY');
  valuesByColumn['DELIVERY PRICE'] = requireWebhookNumber_(
    valuesByColumn['DELIVERY PRICE'],
    'DELIVERY PRICE'
  );
  valuesByColumn['TOTAL PRICE'] = requireWebhookNumber_(
    valuesByColumn['TOTAL PRICE'],
    'TOTAL PRICE'
  );
  valuesByColumn['DELIVERY MODE'] = deliveryMode;

  return COLUMNS.map((column) => valuesByColumn[column]);
}

function requireWebhookString_(value, fieldName) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new Error(fieldName + ' is required.');
  }
  return normalized;
}

function optionalWebhookString_(value) {
  return String(value || '').trim();
}

function requireWebhookNumber_(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(fieldName + ' must be a valid non-negative number.');
  }
  return parsed;
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

// ──────────────────────────────────────────────────────────────
// 9. CUSTOM MENU
// ──────────────────────────────────────────────────────────────

/**
 * Automatically called when the spreadsheet is opened.
 * Adds the "📦 Order Manager" custom menu.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📦 Order Manager')
    .addItem('🏗️ Setup Sheet', 'setupSheet')
    .addItem('🔑 Settings (API Keys)', 'openSettingsDialog')
    .addItem('🔎 Order Filters', 'openOrderFiltersDialog')
    .addSeparator()
    .addItem('🔄 Sync Products Catalog', 'syncProductsCatalog')
    .addItem('♻️ Rebuild Stock State', 'rebuildStockState')
    .addSeparator()
    .addItem('🚀 Inject All Orders', 'injectOrders')
    .addItem('💰 Fetch Delivery Rates', 'fetchDeliveryRates')
    .addItem('🔄 Update Order Statuses', 'updateOrderStatuses')
    .addItem('📄 Get Order Labels', 'getOrderLabels')
    .addSeparator()
    .addItem('🗑️ Remove Blacklist Orders', 'removeBlacklistOrders')
    .addItem('📊 Analytics Dashboard', 'showDashboard')
    .addToUi();
}

/**
 * Silently ensures the installable onEdit trigger exists.
 * Called automatically by setupSheet() — the user never
 * needs to install anything manually.
 */
function ensureEditTrigger_() {
  const existing = ScriptApp.getProjectTriggers();
  for (const t of existing) {
    if (t.getHandlerFunction() === 'onEditTrigger') return; // already installed
  }
  ScriptApp.newTrigger('onEditTrigger')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
}

// ──────────────────────────────────────────────────────────────
// 10. UTILITY FUNCTIONS
// ──────────────────────────────────────────────────────────────

/** Get the Orders sheet or throw. */
function getOrdersSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found. Run Setup Sheet first.');
  }
  return sheet;
}

/** Get the Products sheet or throw. */
function getProductsSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRODUCTS_SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + PRODUCTS_SHEET_NAME + '" not found. Run Setup Sheet first.');
  }
  return sheet;
}

function getOrCreateProductsSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRODUCTS_SHEET_NAME);
  return sheet || ensureProductsSheet_();
}

function getStockSyncSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STOCK_SYNC_SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + STOCK_SYNC_SHEET_NAME + '" not found. Run Setup Sheet first.');
  }
  return sheet;
}

function getOrCreateStockSyncSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STOCK_SYNC_SHEET_NAME);
  return sheet || ensureStockSyncSheet_();
}

function ensureSheetCapacity_(sheet, requiredRow) {
  const maxRows = sheet.getMaxRows();
  if (requiredRow > maxRows) {
    sheet.insertRowsAfter(maxRows, requiredRow - maxRows);
  }
}

/** Create or reset the Products sheet structure. */
function ensureProductsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PRODUCTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PRODUCTS_SHEET_NAME);
  }

  const headerRange = sheet.getRange(1, 1, 1, PRODUCT_CATALOG_COLUMNS.length);
  headerRange.setValues([PRODUCT_CATALOG_COLUMNS]);
  headerRange
    .setFontWeight('bold')
    .setBackground('#2E7D32')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setFrozenRows(1);

  const widths = {
    'PRODUCT NAME': 220,
    'CURRENT STOCK': 120,
    'ACTIVE': 80,
    'SOURCE': 100,
    'CATALOG STATUS': 140,
    'LAST SEEN IN ORDER': 150,
    'UPDATED AT': 160,
  };

  PRODUCT_CATALOG_COLUMNS.forEach((col, i) => {
    if (widths[col]) sheet.setColumnWidth(i + 1, widths[col]);
  });

  const validationDepth = 1000;
  const activeColIdx = PRODUCT_CATALOG_COLUMNS.indexOf('ACTIVE') + 1;
  sheet.getRange(2, activeColIdx, validationDepth, 1).insertCheckboxes();
  sheet.getRange(2, PRODUCT_CATALOG_COLUMNS.indexOf('CURRENT STOCK') + 1, validationDepth, 1)
    .setNumberFormat('0.##');
  sheet.getRange(2, PRODUCT_CATALOG_COLUMNS.indexOf('UPDATED AT') + 1, validationDepth, 1)
    .setNumberFormat('yyyy-mm-dd hh:mm');

  const stockColIdx = PRODUCT_CATALOG_COLUMNS.indexOf('CURRENT STOCK') + 1;
  const negativeStockRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#F8D7DA')
    .setFontColor('#721C24')
    .setRanges([sheet.getRange(2, stockColIdx, validationDepth, 1)])
    .build();
  sheet.setConditionalFormatRules([negativeStockRule]);

  refreshProductCatalogStatuses_(sheet);
  return sheet;
}

function ensureStockSyncSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STOCK_SYNC_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(STOCK_SYNC_SHEET_NAME);
  }

  const headerRange = sheet.getRange(1, 1, 1, STOCK_SYNC_COLUMNS.length);
  headerRange.setValues([STOCK_SYNC_COLUMNS]);
  headerRange
    .setFontWeight('bold')
    .setBackground('#455A64')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setFrozenRows(1);

  const widths = {
    'SYNC STATUS': 160,
    'SYNC PRODUCT': 180,
    'SYNC QTY': 100,
    'SYNC AT': 160,
  };
  STOCK_SYNC_COLUMNS.forEach((col, i) => {
    if (widths[col]) sheet.setColumnWidth(i + 1, widths[col]);
  });

  sheet.getRange(2, STOCK_SYNC_COLUMNS.indexOf('SYNC QTY') + 1, sheet.getMaxRows() - 1, 1)
    .setNumberFormat('0.##');
  sheet.getRange(2, STOCK_SYNC_COLUMNS.indexOf('SYNC AT') + 1, sheet.getMaxRows() - 1, 1)
    .setNumberFormat('yyyy-mm-dd hh:mm');

  if (!sheet.isSheetHidden()) {
    sheet.hideSheet();
  }

  return sheet;
}

function migrateLegacyOrderStockSyncColumns_(ordersSheet) {
  const sheet = ordersSheet || getOrdersSheet_();
  if (!ordersSheetHasVisibleHeader_(sheet)) return;

  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return;

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const legacyIndexes = DEPRECATED_ORDER_STOCK_SYNC_COLUMNS
    .map(name => headers.indexOf(name))
    .filter(index => index !== -1);

  if (!legacyIndexes.length) return;

  const syncSheet = getOrCreateStockSyncSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    ensureSheetCapacity_(syncSheet, lastRow);
  }

  for (let row = 2; row <= lastRow; row++) {
    const statusIdx = headers.indexOf('STOCK SYNC STATUS');
    const productIdx = headers.indexOf('STOCK SYNC PRODUCT');
    const qtyIdx = headers.indexOf('STOCK SYNC QTY');
    const atIdx = headers.indexOf('STOCK SYNC AT');

    const values = [
      statusIdx === -1 ? '' : sheet.getRange(row, statusIdx + 1).getValue(),
      productIdx === -1 ? '' : sheet.getRange(row, productIdx + 1).getValue(),
      qtyIdx === -1 ? '' : sheet.getRange(row, qtyIdx + 1).getValue(),
      atIdx === -1 ? '' : sheet.getRange(row, atIdx + 1).getValue(),
    ];

    if (values.some(value => value !== '' && value !== null)) {
      syncSheet.getRange(row, 1, 1, STOCK_SYNC_COLUMNS.length).setValues([values]);
    }
  }

  legacyIndexes
    .map(index => index + 1)
    .sort((a, b) => b - a)
    .forEach(columnNumber => {
      sheet.deleteColumn(columnNumber);
    });
}

function buildRowObjectFromColumns_(columns, values) {
  const obj = {};
  columns.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj;
}

function normalizeProductName_(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

function parseProductNames_(value) {
  const parts = String(value || '')
    .split(/\s*,\s*/)
    .map(part => part.trim())
    .filter(Boolean);

  const seen = {};
  return parts.filter(part => {
    const normalized = normalizeProductName_(part);
    if (!normalized || seen[normalized]) return false;
    seen[normalized] = true;
    return true;
  });
}

function getProductCatalogRows_(sheet) {
  const targetSheet = sheet || getProductsSheet_();
  const lastRow = targetSheet.getLastRow();
  if (lastRow < 2) return [];

  const values = targetSheet.getRange(2, 1, lastRow - 1, PRODUCT_CATALOG_COLUMNS.length).getValues();
  return values.map((row, index) => ({
    rowNumber: index + 2,
    data: buildRowObjectFromColumns_(PRODUCT_CATALOG_COLUMNS, row),
  }));
}

function isCatalogRowOperational_(rowData) {
  if (!normalizeProductName_(rowData['PRODUCT NAME'])) return false;

  const status = String(rowData['CATALOG STATUS'] || '').toUpperCase().trim();
  if (status === PRODUCT_CATALOG_STATUS.DUPLICATE) return false;

  const active = rowData['ACTIVE'];
  if (active === false) return false;
  if (typeof active === 'string' && active.trim().toUpperCase() === 'FALSE') return false;

  return true;
}

function findCatalogProductRow_(productName, options) {
  const targetSheet = options && options.sheet ? options.sheet : getProductsSheet_();
  const includeNonOperational = !!(options && options.includeNonOperational);
  const targetName = normalizeProductName_(productName);
  if (!targetName) return null;

  let fallback = null;
  const rows = getProductCatalogRows_(targetSheet);
  for (const row of rows) {
    if (normalizeProductName_(row.data['PRODUCT NAME']) !== targetName) continue;

    if (!fallback) fallback = row;
    if (includeNonOperational || isCatalogRowOperational_(row.data)) {
      return row;
    }
  }

  return includeNonOperational ? fallback : null;
}

function refreshProductCatalogStatuses_(sheet) {
  const targetSheet = sheet || getProductsSheet_();
  const rows = getProductCatalogRows_(targetSheet);
  if (!rows.length) return { duplicates: 0, total: 0 };

  const counts = {};
  rows.forEach((row) => {
    const normalized = normalizeProductName_(row.data['PRODUCT NAME']);
    if (!normalized) return;
    counts[normalized] = (counts[normalized] || 0) + 1;
  });

  const activeValues = [];
  const sourceValues = [];
  const statusValues = [];
  let duplicates = 0;

  rows.forEach((row) => {
    const normalized = normalizeProductName_(row.data['PRODUCT NAME']);
    if (!normalized) {
      activeValues.push(['']);
      sourceValues.push(['']);
      statusValues.push(['']);
      return;
    }

    const active = row.data['ACTIVE'] === '' || row.data['ACTIVE'] === null
      ? true
      : row.data['ACTIVE'];
    const source = String(row.data['SOURCE'] || '').trim() || PRODUCT_CATALOG_SOURCE.MANUAL;
    const status = counts[normalized] > 1
      ? PRODUCT_CATALOG_STATUS.DUPLICATE
      : PRODUCT_CATALOG_STATUS.OK;

    if (status === PRODUCT_CATALOG_STATUS.DUPLICATE) duplicates++;

    activeValues.push([active]);
    sourceValues.push([source]);
    statusValues.push([status]);
  });

  targetSheet.getRange(2, PRODUCT_CATALOG_COLUMNS.indexOf('ACTIVE') + 1, rows.length, 1)
    .setValues(activeValues);
  targetSheet.getRange(2, PRODUCT_CATALOG_COLUMNS.indexOf('SOURCE') + 1, rows.length, 1)
    .setValues(sourceValues);
  targetSheet.getRange(2, PRODUCT_CATALOG_COLUMNS.indexOf('CATALOG STATUS') + 1, rows.length, 1)
    .setValues(statusValues);

  return { duplicates: duplicates, total: rows.length };
}

function appendCatalogProductRow_(sheet, productName, options) {
  const targetSheet = sheet || getProductsSheet_();
  const now = options && options.updatedAt ? options.updatedAt : new Date();
  const row = [
    String(productName || '').trim(),
    options && Number.isFinite(Number(options.currentStock)) ? Number(options.currentStock) : 0,
    options && Object.prototype.hasOwnProperty.call(options, 'active') ? options.active : true,
    options && options.source ? options.source : PRODUCT_CATALOG_SOURCE.AUTO,
    options && options.catalogStatus ? options.catalogStatus : PRODUCT_CATALOG_STATUS.OK,
    options && options.lastSeenInOrder ? options.lastSeenInOrder : '',
    now,
  ];

  targetSheet.appendRow(row);
  const newRow = targetSheet.getLastRow();
  targetSheet.getRange(newRow, PRODUCT_CATALOG_COLUMNS.indexOf('CURRENT STOCK') + 1)
    .setNumberFormat('0.##');
  targetSheet.getRange(newRow, PRODUCT_CATALOG_COLUMNS.indexOf('UPDATED AT') + 1)
    .setNumberFormat('yyyy-mm-dd hh:mm');
  return newRow;
}

function syncProductsCatalogFromOrderRow_(ordersSheet, orderRow, options) {
  const sheet = ordersSheet || getOrdersSheet_();
  const productSheet = getOrCreateProductsSheet_();
  const rowData = getRowDataAt_(sheet, orderRow);
  const productNames = parseProductNames_(rowData['PRODUCT']);
  if (!productNames.length) {
    return { added: 0, touched: 0 };
  }

  const now = new Date();
  const lastSeenInOrder = String(rowData['ORDER ID'] || ('Row ' + orderRow));
  const lastSeenColIdx = PRODUCT_CATALOG_COLUMNS.indexOf('LAST SEEN IN ORDER') + 1;
  let added = 0;
  let touched = 0;

  productNames.forEach((productName) => {
    const existing = findCatalogProductRow_(productName, {
      includeNonOperational: true,
      sheet: productSheet,
    });

    if (existing) {
      productSheet.getRange(existing.rowNumber, lastSeenColIdx, 1, 2)
        .setValues([[lastSeenInOrder, now]]);
      touched++;
      return;
    }

    appendCatalogProductRow_(productSheet, productName, {
      active: true,
      currentStock: 0,
      lastSeenInOrder: lastSeenInOrder,
      source: PRODUCT_CATALOG_SOURCE.AUTO,
      updatedAt: now,
    });
    added++;
  });

  if (!(options && options.skipRefresh)) {
    refreshProductCatalogStatuses_(productSheet);
  }

  return { added: added, touched: touched };
}

function syncProductsCatalogFromOrders_(options) {
  const sheet = getOrdersSheet_();
  getOrCreateProductsSheet_();

  const lastRow = sheet.getLastRow();
  const startRow = getOrdersDataStartRow_(sheet);
  if (lastRow < startRow) {
    if (!(options && options.silent)) {
      SpreadsheetApp.getActive().toast('No orders to scan yet.', '📦 Products', 4);
    }
    return { added: 0, touched: 0 };
  }

  let added = 0;
  let touched = 0;
  for (let row = startRow; row <= lastRow; row++) {
    const result = syncProductsCatalogFromOrderRow_(sheet, row, { skipRefresh: true });
    added += result.added;
    touched += result.touched;
  }

  refreshProductCatalogStatuses_();

  if (!(options && options.silent)) {
    SpreadsheetApp.getActive().toast(
      'Catalog sync complete: ' + added + ' added, ' + touched + ' updated.',
      '📦 Products',
      5
    );
  }

  return { added: added, touched: touched };
}

function updateCatalogProductTimestamp_(sheet, rowNumber) {
  const targetSheet = sheet || getProductsSheet_();
  targetSheet.getRange(rowNumber, PRODUCT_CATALOG_COLUMNS.indexOf('UPDATED AT') + 1)
    .setValue(new Date());
}

function adjustCatalogStockByName_(productName, delta, options) {
  const targetSheet = options && options.sheet ? options.sheet : getProductsSheet_();
  let row = findCatalogProductRow_(productName, {
    includeNonOperational: true,
    sheet: targetSheet,
  });

  if (!row && options && options.createIfMissing) {
    appendCatalogProductRow_(targetSheet, productName, {
      active: true,
      currentStock: 0,
      source: PRODUCT_CATALOG_SOURCE.AUTO,
    });
    refreshProductCatalogStatuses_(targetSheet);
    row = findCatalogProductRow_(productName, {
      includeNonOperational: true,
      sheet: targetSheet,
    });
  }

  if (!row) {
    throw new Error('Catalog product not found for stock update: ' + productName);
  }

  const currentStock = Number(row.data['CURRENT STOCK']);
  const normalizedCurrentStock = Number.isFinite(currentStock) ? currentStock : 0;
  const nextStock = normalizedCurrentStock + Number(delta || 0);
  targetSheet.getRange(row.rowNumber, PRODUCT_CATALOG_COLUMNS.indexOf('CURRENT STOCK') + 1)
    .setValue(nextStock);
  updateCatalogProductTimestamp_(targetSheet, row.rowNumber);

  return { newStock: nextStock, rowNumber: row.rowNumber };
}

function getOrderStockSyncSnapshot_(rowNumber) {
  const syncRow = getStockSyncRowNumberForOrderRow_(rowNumber);
  const syncSheet = getOrCreateStockSyncSheet_();
  ensureSheetCapacity_(syncSheet, syncRow);
  const values = syncSheet.getRange(syncRow, 1, 1, STOCK_SYNC_COLUMNS.length).getValues()[0];
  const rowData = buildRowObjectFromColumns_(STOCK_SYNC_COLUMNS, values);
  const qty = Number(rowData['SYNC QTY']);
  return {
    status: String(rowData['SYNC STATUS'] || '').trim(),
    at: rowData['SYNC AT'] || '',
    productName: String(rowData['SYNC PRODUCT'] || '').trim(),
    quantity: Number.isFinite(qty) && qty > 0 ? qty : 0,
  };
}

function setOrderStockSyncState_(rowNumber, state) {
  const syncRow = getStockSyncRowNumberForOrderRow_(rowNumber);
  const syncSheet = getOrCreateStockSyncSheet_();
  ensureSheetCapacity_(syncSheet, syncRow);
  syncSheet.getRange(syncRow, 1, 1, STOCK_SYNC_COLUMNS.length).setValues([[
    state.status || '',
    state.productName || '',
    state.quantity || '',
    state.at || '',
  ]]);
}

function deleteOrderStockSyncRow_(rowNumber) {
  const syncRow = getStockSyncRowNumberForOrderRow_(rowNumber);
  const syncSheet = getOrCreateStockSyncSheet_();
  if (syncRow <= 1) return;

  ensureSheetCapacity_(syncSheet, syncRow);
  syncSheet.deleteRow(syncRow);
  if (!syncSheet.isSheetHidden()) {
    syncSheet.hideSheet();
  }
}

function buildOrderStockTarget_(rowData, productSheet) {
  const productNames = parseProductNames_(rowData['PRODUCT']);
  if (productNames.length > 1) {
    return { shouldApply: false, status: ORDER_STOCK_SYNC_STATUS.SKIPPED_MULTI_PRODUCT };
  }

  const quantity = Number(rowData['QUANTITY']);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { shouldApply: false, status: ORDER_STOCK_SYNC_STATUS.SKIPPED_INVALID_QUANTITY };
  }

  const confirmation = String(rowData['CONFIRMATION'] || '').toUpperCase().trim();
  if (confirmation !== 'CONFIRME') {
    return { shouldApply: false, status: ORDER_STOCK_SYNC_STATUS.PENDING_CONFIRMATION };
  }

  const orderStatus = String(rowData['STATUS'] || '').toUpperCase().trim();
  if (orderStatus === 'ANNULE' || orderStatus === 'RETOUR') {
    return { shouldApply: false, status: ORDER_STOCK_SYNC_STATUS.RESTORED };
  }

  const productName = productNames[0] || '';
  const catalogRow = findCatalogProductRow_(productName, { sheet: productSheet });
  if (!catalogRow) {
    return { shouldApply: false, status: ORDER_STOCK_SYNC_STATUS.SKIPPED_CATALOG_REVIEW };
  }

  return {
    catalogRow: catalogRow,
    productName: String(catalogRow.data['PRODUCT NAME'] || productName).trim(),
    quantity: quantity,
    shouldApply: true,
    status: ORDER_STOCK_SYNC_STATUS.DEDUCTED,
  };
}

function reconcileOrderStock_(sheet, rowNumber, options) {
  const orderSheet = sheet || getOrdersSheet_();
  const productSheet = getOrCreateProductsSheet_();

  if (!(options && options.skipCatalogSync)) {
    syncProductsCatalogFromOrderRow_(orderSheet, rowNumber);
  }

  const rowData = getRowDataAt_(orderSheet, rowNumber);
  const previous = getOrderStockSyncSnapshot_(rowNumber);
  const target = buildOrderStockTarget_(rowData, productSheet);
  const now = new Date();

  const previousNormalized = normalizeProductName_(previous.productName);
  const targetNormalized = normalizeProductName_(target.productName);
  const snapshotChanged = previous.quantity > 0 && (
    !target.shouldApply ||
    previous.quantity !== target.quantity ||
    previousNormalized !== targetNormalized
  );
  const targetNeedsApply = target.shouldApply && (
    previous.quantity === 0 ||
    previous.quantity !== target.quantity ||
    previousNormalized !== targetNormalized
  );

  if (snapshotChanged) {
    adjustCatalogStockByName_(previous.productName, previous.quantity, {
      createIfMissing: true,
      sheet: productSheet,
    });
  }

  if (targetNeedsApply) {
    adjustCatalogStockByName_(target.productName, -target.quantity, {
      createIfMissing: true,
      sheet: productSheet,
    });
  }

  if (target.shouldApply) {
    setOrderStockSyncState_(rowNumber, {
      at: now,
      productName: target.productName,
      quantity: target.quantity,
      status: ORDER_STOCK_SYNC_STATUS.DEDUCTED,
    });
    return { status: ORDER_STOCK_SYNC_STATUS.DEDUCTED };
  }

  setOrderStockSyncState_(rowNumber, {
    at: now,
    productName: '',
    quantity: '',
    status: snapshotChanged ? ORDER_STOCK_SYNC_STATUS.RESTORED : target.status,
  });
  return { status: snapshotChanged ? ORDER_STOCK_SYNC_STATUS.RESTORED : target.status };
}

function handleProductsSheetEdit_(sheet, rowNumber, columnNumber) {
  if (rowNumber < 2) return;

  const productNameColIdx = PRODUCT_CATALOG_COLUMNS.indexOf('PRODUCT NAME') + 1;
  const stockColIdx = PRODUCT_CATALOG_COLUMNS.indexOf('CURRENT STOCK') + 1;
  const activeColIdx = PRODUCT_CATALOG_COLUMNS.indexOf('ACTIVE') + 1;
  const sourceColIdx = PRODUCT_CATALOG_COLUMNS.indexOf('SOURCE') + 1;

  if (
    columnNumber !== productNameColIdx &&
    columnNumber !== stockColIdx &&
    columnNumber !== activeColIdx
  ) {
    return;
  }

  const productName = String(sheet.getRange(rowNumber, productNameColIdx).getValue() || '').trim();
  if (productName) {
    const sourceCell = sheet.getRange(rowNumber, sourceColIdx);
    if (!String(sourceCell.getValue() || '').trim()) {
      sourceCell.setValue(PRODUCT_CATALOG_SOURCE.MANUAL);
    }

    if (columnNumber === productNameColIdx) {
      const activeCell = sheet.getRange(rowNumber, activeColIdx);
      if (activeCell.getValue() === '' || activeCell.getValue() === false) {
        activeCell.setValue(true);
      }

      const stockCell = sheet.getRange(rowNumber, stockColIdx);
      if (stockCell.getValue() === '') {
        stockCell.setValue(0);
      }
    }
  }

  updateCatalogProductTimestamp_(sheet, rowNumber);
  refreshProductCatalogStatuses_(sheet);
}

function syncProductsCatalog() {
  syncProductsCatalogFromOrders_();
}

function rebuildStockState() {
  const orderSheet = getOrdersSheet_();
  const productSheet = getOrCreateProductsSheet_();
  const lastRow = orderSheet.getLastRow();
  const startRow = getOrdersDataStartRow_(orderSheet);
  const totalOrders = getOrdersDataRowCount_(orderSheet);

  if (lastRow < startRow) {
    SpreadsheetApp.getActive().toast('No orders to rebuild.', '📦 Stock', 4);
    return;
  }

  syncProductsCatalogFromOrders_({ silent: true });

  let restored = 0;
  for (let row = startRow; row <= lastRow; row++) {
    const snapshot = getOrderStockSyncSnapshot_(row);
    if (!snapshot.productName || snapshot.quantity <= 0) continue;

    adjustCatalogStockByName_(snapshot.productName, snapshot.quantity, {
      createIfMissing: true,
      sheet: productSheet,
    });
    restored++;
  }

  const syncSheet = getOrCreateStockSyncSheet_();
  const lastSyncRow = getStockSyncRowNumberForOrderRow_(lastRow, orderSheet);
  ensureSheetCapacity_(syncSheet, lastSyncRow);
  const clearValues = Array.from({ length: totalOrders }, () => ['', '', '', '']);
  if (clearValues.length > 0) {
    syncSheet.getRange(2, 1, clearValues.length, STOCK_SYNC_COLUMNS.length)
      .setValues(clearValues);
  }

  syncProductsCatalogFromOrders_({ silent: true });

  let reconciled = 0;
  for (let row = startRow; row <= lastRow; row++) {
    const result = reconcileOrderStock_(orderSheet, row, { skipCatalogSync: true });
    if (result.status === ORDER_STOCK_SYNC_STATUS.DEDUCTED) {
      reconciled++;
    }
  }

  SpreadsheetApp.getActive().toast(
    'Stock rebuild complete: ' + restored + ' restored, ' + reconciled + ' active deductions.',
    '📦 Stock',
    6
  );
}

/**
 * Read keyed sheet rows from the Orders sheet.
 * When a limit is provided, the latest rows are returned.
 */
function getSheetData_(sheet, options) {
  const lastRow = sheet.getLastRow();
  const startRow = getOrdersDataStartRow_(sheet);
  if (lastRow < startRow) return [];

  const rowCount = lastRow - startRow + 1;
  const limit = options && Number(options.limit) > 0
    ? Math.floor(Number(options.limit))
    : 0;
  const numRows = limit ? Math.min(rowCount, limit) : rowCount;
  const rangeStartRow = limit && rowCount > limit
    ? lastRow - numRows + 1
    : startRow;
  const numCols = COLUMNS.length;
  const values = sheet.getRange(rangeStartRow, 1, numRows, numCols).getValues();
  return values.map(row => buildRowObjectFromColumns_(COLUMNS, row));
}

/** Read a single row by row number into a keyed object. */
function getRowDataAt_(sheet, rowNum) {
  const values = sheet.getRange(rowNum, 1, 1, COLUMNS.length).getValues()[0];
  return buildRowObjectFromColumns_(COLUMNS, values);
}

/** Find a provider key in the registry (case-insensitive match). */
function findProviderKey_(societeName) {
  if (!societeName) return null;
  const upper = String(societeName).toUpperCase().trim();
  const registry = getProviderRegistry_();
  return Object.keys(registry).find(k => k.toUpperCase() === upper) || null;
}

/** Structured error logger. */
function logApiError_(provider, endpoint, error) {
  console.error('[OrderManager] ' + provider + ' → ' + endpoint + ': ' + error.message);
}

/**
 * Scans Orders sheet and deletes any row where the phone number is
 * found in the Blacklist sheet.
 */
function removeBlacklistOrders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrdersSheet_();
  const blSheet = ss.getSheetByName(BLACKLIST_SHEET_NAME);
  
  if (!blSheet) {
    SpreadsheetApp.getUi().alert('Blacklist sheet not found.');
    return;
  }

  const blLastRow = blSheet.getLastRow();
  const blPhoneColIdx = COLUMNS.indexOf('PHONE');
  
  // Collect all blacklisted phones
  const blacklistedPhones = new Set();
  if (blLastRow >= 2) {
    const blValues = blSheet.getRange(2, 1, blLastRow - 1, COLUMNS.length).getValues();
    for (const row of blValues) {
      const rawPhone = String(row[blPhoneColIdx] || '').trim();
      if (rawPhone) {
        // Normalise just like in duplicate check
        const phone = rawPhone.replace(/[\s\-\.\+]/g, '');
        if (phone) blacklistedPhones.add(phone);
      }
    }
  }

  if (blacklistedPhones.size === 0) {
    SpreadsheetApp.getActive().toast('Blacklist is empty.', '📦 Blacklist', 3);
    return;
  }

  const lastRow = sheet.getLastRow();
  const startRow = getOrdersDataStartRow_(sheet);
  if (lastRow < startRow) {
    SpreadsheetApp.getActive().toast('No orders to process.', '📦 Blacklist', 3);
    return;
  }

  const phoneColIdx = COLUMNS.indexOf('PHONE');
  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, COLUMNS.length).getValues();
  
  let deletedCount = 0;
  
  // Iterate backwards so deleting rows doesn't mess up indices
  for (let i = values.length - 1; i >= 0; i--) {
    const rawPhone = String(values[i][phoneColIdx] || '').trim();
    if (rawPhone) {
      const phone = rawPhone.replace(/[\s\-\.\+]/g, '');
      if (blacklistedPhones.has(phone)) {
        const sheetRow = startRow + i;
        deleteOrderStockSyncRow_(sheetRow);
        sheet.deleteRow(sheetRow);
        deletedCount++;
      }
    }
  }

  SpreadsheetApp.getActive().toast(
    'Removed ' + deletedCount + ' blacklisted order(s).', '📦 Blacklist', 5);
}

/**
 * Deprecated fallback summary dialog kept for easy rollback.
 */
function showOrderSummary() {
  const sheet = getOrdersSheet_();
  const data = getSheetData_(sheet);
  const total = data.length;

  const byStatus = {};
  const byProvider = {};
  const byConfirmation = {};

  for (const row of data) {
    const status = row['STATUS'] || 'UNKNOWN';
    const provider = row['SOCIETE'] || 'UNKNOWN';
    const conf = row['CONFIRMATION'] || 'UNKNOWN';

    byStatus[status] = (byStatus[status] || 0) + 1;
    byProvider[provider] = (byProvider[provider] || 0) + 1;
    byConfirmation[conf] = (byConfirmation[conf] || 0) + 1;
  }

  const tableRows = (obj) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => '<tr><td style="padding:4px 10px">' + k + '</td><td style="padding:4px 10px;text-align:right"><b>' + v + '</b></td></tr>')
      .join('');

  const html = `
  <html><head><style>
    body { font-family: 'Google Sans', Arial; padding: 20px; background: #f8f9fa; }
    h2 { color: #1A73E8; margin: 0 0 20px; }
    .stat { font-size: 32px; font-weight: bold; color: #1A73E8; }
    .section { background: white; border-radius: 8px; padding: 16px; margin: 12px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h4 { margin: 0 0 8px; color: #333; }
    table { width: 100%; border-collapse: collapse; }
    tr:nth-child(even) { background: #f0f4ff; }
  </style></head><body>
    <h2>📊 Order Summary</h2>
    <div class="section"><span class="stat">${total}</span> total orders</div>
    <div class="section"><h4>By Status</h4><table>${tableRows(byStatus)}</table></div>
    <div class="section"><h4>By Provider</h4><table>${tableRows(byProvider)}</table></div>
    <div class="section"><h4>By Confirmation</h4><table>${tableRows(byConfirmation)}</table></div>
  </body></html>`;

  const dialog = HtmlService.createHtmlOutput(html).setWidth(400).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(dialog, '📊 Order Summary');
}

/**
 * Convert a 1-based column index to a letter (1→A, 26→Z, 27→AA).
 * Used to build formula references for conditional formatting.
 */
function columnToLetter_(col) {
  let letter = '';
  let temp = col;
  while (temp > 0) {
    temp--;
    letter = String.fromCharCode(65 + (temp % 26)) + letter;
    temp = Math.floor(temp / 26);
  }
  return letter;
}

// ──────────────────────────────────────────────────────────────
// 11. ORDER FILTER SIDEBAR
// ──────────────────────────────────────────────────────────────

/** Open the order filter sidebar. */
function openOrderFiltersDialog() {
  const html = HtmlService.createHtmlOutput(buildOrderFiltersHtml_())
    .setTitle('🔎 Order Filters');
  SpreadsheetApp.getUi().showSidebar(html);
}

/** Load the sidebar bootstrap payload. */
function getOrderFiltersSidebarData() {
  const sheet = getOrdersSheet_();
  const context = buildOrderFilterContext_(sheet);
  return {
    filters: getSavedOrderFilterState_(),
    filterOptions: context.filterOptions,
    totalOrders: context.totalOrders,
    countLabel: formatOrderFilterCountLabel_(context.totalOrders, context.totalOrders),
    statusColors: STATUS_COLORS,
    confirmationColors: CONFIRMATION_COLORS,
  };
}

/**
 * Apply sidebar filters by hiding non-matching rows and showing matches.
 * A second optional options object can suppress toast messages for silent syncs.
 */
function applyOrderFilters(filters, options) {
  const settings = options && typeof options === 'object' ? options : {};
  const normalizedFilters = normalizeOrderFilters_(filters);
  const sheet = getOrdersSheet_();
  const context = buildOrderFilterContext_(sheet);
  const rowsToHide = [];
  const indexes = buildOrderFilterFieldIndexes_();

  context.rows.forEach((row, index) => {
    if (!matchesOrderFilterRow_(row, indexes, normalizedFilters)) {
      rowsToHide.push(getOrdersSheetRowFromDataIndex_(sheet, index));
    }
  });

  if (context.totalOrders > 0) {
    sheet.showRows(getOrdersDataStartRow_(sheet), context.totalOrders);
    buildOrderFilterHiddenRanges_(rowsToHide).forEach((range) => {
      sheet.hideRows(range.start, range.count);
    });
  }

  SpreadsheetApp.flush();
  saveOrderFilterState_(normalizedFilters);

  const shownOrders = context.totalOrders - rowsToHide.length;
  const payload = {
    filters: normalizedFilters,
    filterOptions: context.filterOptions,
    totalOrders: context.totalOrders,
    shownOrders: shownOrders,
    countLabel: formatOrderFilterCountLabel_(shownOrders, context.totalOrders),
  };

  if (!settings.silent) {
    SpreadsheetApp.getActive().toast(
      payload.countLabel,
      '🔎 Order Filters',
      4
    );
  }

  return payload;
}

/** Build the sidebar HTML shell and client-side behaviour. */
function buildOrderFiltersHtml_() {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        :root {
          --accent: #1A73E8;
          --accent-dark: #1557B0;
          --accent-soft: #E8F0FE;
          --accent-border: #D2E3FC;
          --surface: #F7F9FC;
          --card: #FFFFFF;
          --text: #1F2937;
          --muted: #5F6368;
          --border: #DADCE0;
          --success: #188038;
          --success-soft: #E6F4EA;
          --error: #C5221F;
          --error-soft: #FCE8E6;
          --shadow: 0 14px 32px rgba(26, 115, 232, 0.12);
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Google Sans', Arial, sans-serif;
          background:
            radial-gradient(circle at top right, rgba(26, 115, 232, 0.10), transparent 32%),
            linear-gradient(180deg, #F8FBFF 0%, #F3F7FD 100%);
          color: var(--text);
        }

        .shell {
          padding: 16px;
        }

        .hero {
          background: linear-gradient(135deg, #1A73E8 0%, #3B8CFF 100%);
          color: #FFFFFF;
          border-radius: 18px;
          padding: 18px;
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
        }

        .hero::after {
          content: '';
          position: absolute;
          inset: auto -18px -28px auto;
          width: 92px;
          height: 92px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.14);
          transform: rotate(16deg);
        }

        .hero h1 {
          margin: 0;
          font-size: 20px;
          line-height: 1.2;
        }

        .hero p {
          margin: 8px 0 0;
          font-size: 12px;
          line-height: 1.5;
          opacity: 0.92;
          max-width: 220px;
        }

        .count-pill {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(10px);
          font-size: 12px;
          font-weight: 600;
        }

        .count-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.18);
        }

        .card {
          margin-top: 14px;
          background: var(--card);
          border: 1px solid rgba(210, 227, 252, 0.9);
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 10px 24px rgba(31, 41, 55, 0.06);
        }

        .section-title {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 700;
          color: #183153;
        }

        .section-copy {
          margin: 0 0 14px;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .field {
          margin-bottom: 14px;
        }

        .field:last-child {
          margin-bottom: 0;
        }

        .field label {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #24436B;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        input[type="text"],
        input[type="date"],
        select {
          width: 100%;
          min-height: 42px;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--text);
          background: #FFFFFF;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        }

        input[type="text"]:focus,
        input[type="date"]:focus,
        select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.12);
          transform: translateY(-1px);
        }

        .select-shell {
          position: relative;
        }

        .status-swatch {
          position: absolute;
          top: 50%;
          right: 12px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transform: translateY(-50%);
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 0 1px rgba(31, 41, 55, 0.12);
          pointer-events: none;
          background: linear-gradient(135deg, #DADCE0, #F1F3F4);
        }

        .legend,
        .confirmation-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .legend-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 999px;
          background: var(--surface);
          border: 1px solid #E2E8F0;
          font-size: 11px;
          font-weight: 600;
          color: #29445F;
        }

        .legend-chip .legend-color {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
        }

        .confirmation-chip {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 14px;
          border: 1px solid transparent;
          color: #183153;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .confirmation-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(31, 41, 55, 0.10);
        }

        .confirmation-chip.is-active {
          border-color: rgba(26, 115, 232, 0.65);
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.10);
        }

        .confirmation-chip input {
          margin: 0;
        }

        .action-row {
          display: flex;
          gap: 10px;
        }

        .action-row button {
          flex: 1;
        }

        button {
          min-height: 42px;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(26, 115, 232, 0.16);
        }

        button:disabled {
          opacity: 0.6;
          cursor: wait;
          box-shadow: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #1A73E8 0%, #4285F4 100%);
          color: #FFFFFF;
        }

        .btn-secondary {
          background: #FFFFFF;
          color: var(--accent);
          border: 1px solid var(--accent-border);
        }

        .btn-ghost {
          background: var(--accent-soft);
          color: var(--accent);
        }

        .notice {
          display: none;
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          font-size: 12px;
          line-height: 1.5;
          border: 1px solid transparent;
        }

        .notice.is-visible {
          display: block;
        }

        .notice.success {
          background: var(--success-soft);
          color: var(--success);
          border-color: rgba(24, 128, 56, 0.14);
        }

        .notice.error {
          background: var(--error-soft);
          color: var(--error);
          border-color: rgba(197, 34, 31, 0.14);
        }

        .loading {
          display: none;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
        }

        .loading.is-visible {
          display: flex;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(26, 115, 232, 0.18);
          border-top-color: var(--accent);
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 360px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .action-row {
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      <div class="shell">
        <section class="hero">
          <h1>Order Filters</h1>
          <p>Slice the orders sheet by date, delivery state, provider, wilaya, and confirmation outcome.</p>
          <div class="count-pill" id="rowCount" aria-live="polite">
            <span class="count-dot"></span>
            <span>Loading order count...</span>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">Search & Dates</h2>
          <p class="section-copy">Search by order ID, customer name, or phone number, then narrow by a date range.</p>

          <div class="field">
            <label for="search">Search Orders</label>
            <input id="search" type="text" placeholder="Order ID, customer, or phone">
          </div>

          <div class="grid">
            <div class="field">
              <label for="dateFrom">From</label>
              <input id="dateFrom" type="date">
            </div>
            <div class="field">
              <label for="dateTo">To</label>
              <input id="dateTo" type="date">
            </div>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">Status & Routing</h2>
          <p class="section-copy">Use the same courier, status, and confirmation labels already defined in the sheet.</p>

          <div class="field">
            <label for="status">Status</label>
            <div class="select-shell">
              <select id="status"></select>
              <span class="status-swatch" id="statusSwatch"></span>
            </div>
          </div>

          <div class="field">
            <div class="legend" id="statusLegend"></div>
          </div>

          <div class="field">
            <label>Confirmation</label>
            <div class="confirmation-grid" id="confirmationOptions"></div>
          </div>

          <div class="field">
            <label for="provider">Provider</label>
            <select id="provider"></select>
          </div>

          <div class="field">
            <label for="wilaya">Wilaya</label>
            <select id="wilaya"></select>
          </div>
        </section>

        <section class="card">
          <div class="action-row">
            <button class="btn-primary" id="applyFilters" type="button">Apply Filters</button>
            <button class="btn-secondary" id="resetFilters" type="button">Reset Filters</button>
          </div>
          <div class="notice" id="notice"></div>
          <div class="loading" id="loadingState">
            <span class="spinner"></span>
            <span>Updating row visibility in the sheet...</span>
          </div>
        </section>
      </div>

      <script>
        var sidebarState = {
          filterOptions: {
            providers: [],
            statuses: [],
            confirmations: [],
            wilayas: []
          },
          statusColors: {},
          confirmationColors: {},
          filters: emptyFilters()
        };

        window.addEventListener('load', function() {
          bindSidebarEvents();
          loadSidebarData();
        });

        function bindSidebarEvents() {
          document.getElementById('applyFilters').addEventListener('click', function() {
            runApply(readFiltersFromControls(), false);
          });

          document.getElementById('resetFilters').addEventListener('click', function() {
            var filters = emptyFilters();
            applyFiltersToControls(filters);
            runApply(filters, false);
          });

          document.getElementById('search').addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
              runApply(readFiltersFromControls(), false);
            }
          });

          document.getElementById('status').addEventListener('change', updateStatusSwatch);

          document.getElementById('confirmationOptions').addEventListener('change', function(event) {
            var target = event.target;
            if (target && target.type === 'checkbox') {
              syncConfirmationChipState(target);
            }
          });

        }

        function loadSidebarData() {
          setBusy(true);
          renderNotice('', '');

          google.script.run
            .withSuccessHandler(function(data) {
              var safeData = data || {};
              sidebarState.filterOptions = safeData.filterOptions || sidebarState.filterOptions;
              sidebarState.statusColors = safeData.statusColors || {};
              sidebarState.confirmationColors = safeData.confirmationColors || {};
              sidebarState.filters = sanitizeFilters(safeData.filters || {});

              renderSelectOptions('status', sidebarState.filterOptions.statuses, 'All statuses', sidebarState.filters.status);
              renderSelectOptions('provider', sidebarState.filterOptions.providers, 'All providers', sidebarState.filters.provider);
              renderSelectOptions('wilaya', sidebarState.filterOptions.wilayas, 'All wilayas', sidebarState.filters.wilaya);
              renderStatusLegend();
              renderConfirmationOptions();
              applyFiltersToControls(sidebarState.filters);
              updateCountLabel(safeData.countLabel || 'Showing 0 of 0 orders');

              runApply(sidebarState.filters, true);
            })
            .withFailureHandler(handleFailure)
            .getOrderFiltersSidebarData();
        }

        function runApply(filters, silent) {
          var safeFilters = sanitizeFilters(filters || {});
          setBusy(true);
          if (!silent) {
            renderNotice('', '');
          }

          google.script.run
            .withSuccessHandler(function(result) {
              setBusy(false);
              var data = result || {};
              sidebarState.filters = sanitizeFilters(data.filters || safeFilters);
              sidebarState.filterOptions = data.filterOptions || sidebarState.filterOptions;

              renderSelectOptions('status', sidebarState.filterOptions.statuses, 'All statuses', sidebarState.filters.status);
              renderSelectOptions('provider', sidebarState.filterOptions.providers, 'All providers', sidebarState.filters.provider);
              renderSelectOptions('wilaya', sidebarState.filterOptions.wilayas, 'All wilayas', sidebarState.filters.wilaya);
              renderConfirmationOptions();
              applyFiltersToControls(sidebarState.filters);
              updateCountLabel(data.countLabel || 'Showing 0 of 0 orders');

              if (!silent) {
                renderNotice('success', data.countLabel || 'Filters applied.');
              }
            })
            .withFailureHandler(handleFailure)
            .applyOrderFilters(safeFilters, { silent: !!silent });
        }

        function readFiltersFromControls() {
          var confirmations = Array.prototype.slice.call(
            document.querySelectorAll('#confirmationOptions input[type="checkbox"]:checked')
          ).map(function(input) {
            return sanitizeText(input.value);
          }).filter(Boolean);

          return sanitizeFilters({
            search: document.getElementById('search').value,
            dateFrom: document.getElementById('dateFrom').value,
            dateTo: document.getElementById('dateTo').value,
            status: document.getElementById('status').value,
            confirmations: confirmations,
            provider: document.getElementById('provider').value,
            wilaya: document.getElementById('wilaya').value
          });
        }

        function applyFiltersToControls(filters) {
          var safe = sanitizeFilters(filters || {});
          document.getElementById('search').value = safe.search;
          document.getElementById('dateFrom').value = safe.dateFrom;
          document.getElementById('dateTo').value = safe.dateTo;
          setSelectValue('status', safe.status);
          setSelectValue('provider', safe.provider);
          setSelectValue('wilaya', safe.wilaya);

          Array.prototype.forEach.call(
            document.querySelectorAll('#confirmationOptions input[type="checkbox"]'),
            function(input) {
              input.checked = safe.confirmations.indexOf(input.value) !== -1;
              syncConfirmationChipState(input);
            }
          );

          updateStatusSwatch();
        }

        function sanitizeFilters(filters) {
          var safe = {
            search: sanitizeText(filters && filters.search),
            dateFrom: sanitizeDateString(filters && filters.dateFrom),
            dateTo: sanitizeDateString(filters && filters.dateTo),
            status: sanitizeText(filters && filters.status),
            confirmations: sanitizeArray(filters && filters.confirmations),
            provider: sanitizeText(filters && filters.provider),
            wilaya: sanitizeText(filters && filters.wilaya)
          };

          if (safe.dateFrom && safe.dateTo && safe.dateFrom > safe.dateTo) {
            var temp = safe.dateFrom;
            safe.dateFrom = safe.dateTo;
            safe.dateTo = temp;
          }

          return safe;
        }

        function emptyFilters() {
          return {
            search: '',
            dateFrom: '',
            dateTo: '',
            status: '',
            confirmations: [],
            provider: '',
            wilaya: ''
          };
        }

        function sanitizeArray(values) {
          var list = Array.isArray(values) ? values : [];
          var seen = {};
          return list.map(sanitizeText).filter(function(value) {
            var key = value.toUpperCase();
            if (!value || seen[key]) return false;
            seen[key] = true;
            return true;
          });
        }

        function sanitizeDateString(value) {
          var text = sanitizeText(value);
          return /^\\d{4}-\\d{2}-\\d{2}$/.test(text) ? text : '';
        }

        function sanitizeText(value) {
          return String(value || '').trim();
        }

        function renderSelectOptions(selectId, options, placeholder, selectedValue) {
          var select = document.getElementById(selectId);
          if (!select) return;

          select.innerHTML = '';

          var blank = document.createElement('option');
          blank.value = '';
          blank.textContent = placeholder;
          select.appendChild(blank);

          (options || []).forEach(function(optionValue) {
            var option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            select.appendChild(option);
          });

          setSelectValue(selectId, selectedValue);
        }

        function setSelectValue(selectId, value) {
          var select = document.getElementById(selectId);
          if (!select) return;

          if (value && !Array.prototype.some.call(select.options, function(option) {
            return option.value === value;
          })) {
            var extra = document.createElement('option');
            extra.value = value;
            extra.textContent = value;
            select.appendChild(extra);
          }

          select.value = value || '';
        }

        function renderStatusLegend() {
          var container = document.getElementById('statusLegend');
          container.innerHTML = '';

          Object.keys(sidebarState.statusColors || {}).forEach(function(statusKey) {
            var chip = document.createElement('div');
            chip.className = 'legend-chip';
            chip.innerHTML =
              '<span class="legend-color" style="background:' + sidebarState.statusColors[statusKey] + ';"></span>' +
              '<span>' + escapeHtml(statusKey) + '</span>';
            container.appendChild(chip);
          });

          updateStatusSwatch();
        }

        function renderConfirmationOptions() {
          var container = document.getElementById('confirmationOptions');
          var selected = sanitizeFilters(readFiltersFromControls()).confirmations;
          container.innerHTML = '';

          (sidebarState.filterOptions.confirmations || []).forEach(function(optionValue) {
            var color = (sidebarState.confirmationColors || {})[optionValue] || '#E8F0FE';
            var label = document.createElement('label');
            label.className = 'confirmation-chip';
            label.style.background = color;
            label.style.borderColor = 'rgba(255,255,255,0.7)';
            label.innerHTML =
              '<input type="checkbox" value="' + escapeAttribute(optionValue) + '">' +
              '<span>' + escapeHtml(optionValue) + '</span>';

            container.appendChild(label);

            var checkbox = label.querySelector('input');
            checkbox.checked = selected.indexOf(optionValue) !== -1;
            syncConfirmationChipState(checkbox);
          });
        }

        function syncConfirmationChipState(input) {
          if (!input) return;
          var chip = input.closest('.confirmation-chip');
          if (!chip) return;
          chip.classList.toggle('is-active', !!input.checked);
        }

        function updateStatusSwatch() {
          var statusValue = sanitizeText(document.getElementById('status').value);
          var swatch = document.getElementById('statusSwatch');
          if (!statusValue || !sidebarState.statusColors[statusValue]) {
            swatch.style.background = 'linear-gradient(135deg, #DADCE0, #F1F3F4)';
            return;
          }
          swatch.style.background = sidebarState.statusColors[statusValue];
        }

        function updateCountLabel(text) {
          document.getElementById('rowCount').lastElementChild.textContent = text;
        }

        function setBusy(isBusy) {
          ['applyFilters', 'resetFilters'].forEach(function(id) {
            var button = document.getElementById(id);
            if (button) button.disabled = !!isBusy;
          });

          document.getElementById('loadingState').classList.toggle('is-visible', !!isBusy);
        }

        function renderNotice(type, text) {
          var notice = document.getElementById('notice');
          notice.className = 'notice';
          notice.textContent = '';

          if (!type || !text) return;

          notice.textContent = text;
          notice.classList.add('is-visible');
          notice.classList.add(type);
        }

        function handleFailure(error) {
          setBusy(false);
          renderNotice('error', extractErrorMessage(error));
        }

        function extractErrorMessage(error) {
          if (!error) return 'Something went wrong while updating the filters.';
          return error.message || String(error);
        }

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function escapeAttribute(value) {
          return escapeHtml(value);
        }
      </script>
    </body>
  </html>`;
}

function buildOrderFilterContext_(sheet) {
  const totalOrders = getOrdersDataRowCount_(sheet);
  const startRow = getOrdersDataStartRow_(sheet);
  const rows = totalOrders > 0
    ? sheet.getRange(startRow, 1, totalOrders, COLUMNS.length).getValues()
    : [];

  return {
    totalOrders: totalOrders,
    rows: rows,
    filterOptions: buildOrderFilterOptions_(rows),
  };
}

function buildOrderFilterOptions_(rows) {
  const wilayas = {};

  rows.forEach((row) => {
    const wilaya = normalizeDashboardLabel_(row[COLUMNS.indexOf('WILAYA')], '');
    if (wilaya) wilayas[wilaya] = true;
  });

  return {
    providers: getProviderNames_(),
    statuses: Object.keys(STATUS_COLORS),
    confirmations: Object.keys(CONFIRMATION_COLORS),
    wilayas: Object.keys(wilayas).sort((a, b) => a.localeCompare(b)),
  };
}

function getSavedOrderFilterState_() {
  const props = PropertiesService.getUserProperties();
  const raw = props.getProperty(ORDER_FILTER_STATE_PROPERTY);
  if (!raw) return normalizeOrderFilters_({});

  try {
    return normalizeOrderFilters_(JSON.parse(raw));
  } catch (error) {
    return normalizeOrderFilters_({});
  }
}

function saveOrderFilterState_(filters) {
  const props = PropertiesService.getUserProperties();
  const normalized = normalizeOrderFilters_(filters);

  if (!hasActiveOrderFilters_(normalized)) {
    props.deleteProperty(ORDER_FILTER_STATE_PROPERTY);
    return;
  }

  props.setProperty(ORDER_FILTER_STATE_PROPERTY, JSON.stringify(normalized));
}

function hasActiveOrderFilters_(filters) {
  const normalized = normalizeOrderFilters_(filters);
  return Boolean(
    normalized.search
    || normalized.dateFrom
    || normalized.dateTo
    || normalized.status
    || normalized.confirmations.length
    || normalized.provider
    || normalized.wilaya
  );
}

function normalizeOrderFilters_(filters) {
  const input = filters && typeof filters === 'object' ? filters : {};
  const normalized = {
    search: normalizeDashboardTextFilter_(input.search),
    dateFrom: normalizeDashboardDateString_(input.dateFrom),
    dateTo: normalizeDashboardDateString_(input.dateTo),
    status: normalizeDashboardTextFilter_(input.status),
    confirmations: normalizeOrderFilterMultiValue_(input.confirmations),
    provider: normalizeDashboardTextFilter_(input.provider),
    wilaya: normalizeDashboardTextFilter_(input.wilaya),
  };

  if (normalized.dateFrom && normalized.dateTo && normalized.dateFrom > normalized.dateTo) {
    const temp = normalized.dateFrom;
    normalized.dateFrom = normalized.dateTo;
    normalized.dateTo = temp;
  }

  return normalized;
}

function normalizeOrderFilterMultiValue_(value) {
  const source = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  const seen = {};
  const result = [];
  source.forEach((item) => {
    const text = normalizeDashboardTextFilter_(item);
    const key = text.toUpperCase();
    if (!text || seen[key]) return;
    seen[key] = true;
    result.push(text);
  });

  return result;
}

function buildOrderFilterFieldIndexes_() {
  return {
    date: COLUMNS.indexOf('DATE'),
    orderId: COLUMNS.indexOf('ORDER ID'),
    name: COLUMNS.indexOf('NAME'),
    phone: COLUMNS.indexOf('PHONE'),
    wilaya: COLUMNS.indexOf('WILAYA'),
    provider: COLUMNS.indexOf('SOCIETE'),
    confirmation: COLUMNS.indexOf('CONFIRMATION'),
    status: COLUMNS.indexOf('STATUS'),
    search: ORDER_FILTER_SEARCH_COLUMNS
      .map((column) => COLUMNS.indexOf(column))
      .filter((index) => index > -1),
  };
}

function matchesOrderFilterRow_(row, indexes, filters) {
  if (!matchesDashboardDateFilters_(row[indexes.date], filters)) {
    return false;
  }
  if (!matchesOrderFilterSearch_(row, indexes, filters.search)) {
    return false;
  }
  if (!matchesDashboardTextValue_(row[indexes.status], filters.status)) {
    return false;
  }
  if (!matchesOrderFilterConfirmations_(row[indexes.confirmation], filters.confirmations)) {
    return false;
  }
  if (!matchesDashboardTextValue_(row[indexes.provider], filters.provider)) {
    return false;
  }
  if (!matchesDashboardTextValue_(row[indexes.wilaya], filters.wilaya)) {
    return false;
  }
  return true;
}

function matchesOrderFilterSearch_(row, indexes, searchTerm) {
  if (!searchTerm) return true;

  const normalizedSearch = String(searchTerm || '').toLowerCase();
  return indexes.search.some((index) =>
    String(row[index] || '').toLowerCase().indexOf(normalizedSearch) !== -1
  );
}

function matchesOrderFilterConfirmations_(value, selectedConfirmations) {
  if (!selectedConfirmations || !selectedConfirmations.length) return true;
  return selectedConfirmations.some((filterValue) =>
    matchesDashboardTextValue_(value, filterValue)
  );
}

function buildOrderFilterHiddenRanges_(rowNumbers) {
  if (!rowNumbers.length) return [];

  const ranges = [];
  let start = rowNumbers[0];
  let previous = rowNumbers[0];

  for (let i = 1; i < rowNumbers.length; i++) {
    const current = rowNumbers[i];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push({
      start: start,
      count: previous - start + 1,
    });

    start = current;
    previous = current;
  }

  ranges.push({
    start: start,
    count: previous - start + 1,
  });

  return ranges;
}

function formatOrderFilterCountLabel_(shownOrders, totalOrders) {
  return 'Showing '
    + formatDashboardInteger_(shownOrders)
    + ' of '
    + formatDashboardInteger_(totalOrders)
    + ' orders';
}

// ──────────────────────────────────────────────────────────────
// 12. ANALYTICS DASHBOARD
// ──────────────────────────────────────────────────────────────

/** Open the full analytics dashboard dialog. */
function showDashboard() {
  const dialog = HtmlService.createHtmlOutput(buildDashboardHtml_())
    .setWidth(1000)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(dialog, '📊 Analytics Dashboard');
}

/**
 * Return a fully aggregated dashboard payload for the analytics UI.
 * The latest rows are cached briefly and filtered server-side.
 */
function getDashboardData(filters) {
  const normalizedFilters = normalizeDashboardFilters_(filters);
  const cache = CacheService.getScriptCache();
  const cacheKey = buildDashboardCacheKey_(normalizedFilters);

  try {
    const cached = cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    // Cache misses or deserialisation issues should not block the dashboard.
  }

  const sheet = getOrdersSheet_();
  const totalRowsInSheet = getOrdersDataRowCount_(sheet);
  const truncated = totalRowsInSheet > ANALYTICS_DASHBOARD_MAX_ROWS;
  const rows = getSheetData_(sheet, { limit: ANALYTICS_DASHBOARD_MAX_ROWS });
  const payload = buildDashboardPayload_(rows, normalizedFilters, {
    totalRowsInSheet: totalRowsInSheet,
    truncated: truncated,
  });

  try {
    cache.put(cacheKey, JSON.stringify(payload), ANALYTICS_CACHE_TTL_SECONDS);
  } catch (error) {
    // Cache payload size limits vary; returning fresh data is fine.
  }

  return payload;
}

function normalizeDashboardFilters_(filters) {
  const input = filters && typeof filters === 'object' ? filters : {};
  const normalized = {
    dateFrom: normalizeDashboardDateString_(input.dateFrom),
    dateTo: normalizeDashboardDateString_(input.dateTo),
    provider: normalizeDashboardTextFilter_(input.provider),
    status: normalizeDashboardTextFilter_(input.status),
    wilaya: normalizeDashboardTextFilter_(input.wilaya),
  };

  if (normalized.dateFrom && normalized.dateTo && normalized.dateFrom > normalized.dateTo) {
    const tmp = normalized.dateFrom;
    normalized.dateFrom = normalized.dateTo;
    normalized.dateTo = tmp;
  }

  return normalized;
}

function normalizeDashboardDateString_(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]'
      && !Number.isNaN(value.getTime())) {
    return formatDashboardDateKey_(value);
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (Number.isNaN(date.getTime())
      || date.getFullYear() !== year
      || date.getMonth() !== month
      || date.getDate() !== day) {
    return '';
  }

  return formatDashboardDateKey_(date);
}

function normalizeDashboardTextFilter_(value) {
  return String(value || '').trim();
}

function buildDashboardCacheKey_(filters) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    JSON.stringify(filters)
  );

  let hex = '';
  for (let i = 0; i < digest.length; i++) {
    const byteValue = digest[i] < 0 ? digest[i] + 256 : digest[i];
    hex += ('0' + byteValue.toString(16)).slice(-2);
  }

  return 'analytics-dashboard:' + hex;
}

function buildDashboardPayload_(rows, filters, meta) {
  const uniqueWilayas = {};
  rows.forEach((row) => {
    const wilaya = normalizeDashboardLabel_(row['WILAYA'], '');
    if (wilaya) uniqueWilayas[wilaya] = true;
  });

  const filteredRows = rows.filter((row) => matchesDashboardFilters_(row, filters));
  const byStatus = {};
  const byConfirmation = {};
  const wilayaMetrics = {};
  const providerMetrics = {};
  const revenueEntries = [];

  let deliveredOrders = 0;
  let returnedOrders = 0;
  let totalRevenue = 0;

  filteredRows.forEach((row) => {
    const status = normalizeDashboardLabel_(row['STATUS'], 'UNKNOWN');
    const confirmation = normalizeDashboardLabel_(row['CONFIRMATION'], 'UNKNOWN');
    const wilaya = normalizeDashboardLabel_(row['WILAYA'], 'UNKNOWN');
    const provider = normalizeDashboardLabel_(row['SOCIETE'], 'UNKNOWN');
    const totalPrice = toDashboardNumber_(row['TOTAL PRICE']);
    const rowDate = parseDashboardDate_(row['DATE']);

    byStatus[status] = (byStatus[status] || 0) + 1;
    byConfirmation[confirmation] = (byConfirmation[confirmation] || 0) + 1;

    if (!wilayaMetrics[wilaya]) {
      wilayaMetrics[wilaya] = { count: 0, revenue: 0 };
    }
    wilayaMetrics[wilaya].count++;

    if (!providerMetrics[provider]) {
      providerMetrics[provider] = { count: 0, deliveredCount: 0, revenue: 0 };
    }
    providerMetrics[provider].count++;

    if (status === 'LIVREE') {
      deliveredOrders++;
      totalRevenue += totalPrice;
      wilayaMetrics[wilaya].revenue += totalPrice;
      providerMetrics[provider].deliveredCount++;
      providerMetrics[provider].revenue += totalPrice;

      if (rowDate) {
        revenueEntries.push({
          date: rowDate,
          revenue: totalPrice,
        });
      }
    }

    if (status === 'RETOUR') {
      returnedOrders++;
    }
  });

  const totalOrders = filteredRows.length;
  const revenueGrouping = determineDashboardRevenueGrouping_(revenueEntries);
  const payload = {
    filters: filters,
    generatedAt: new Date().toISOString(),
    totalRowsInSheet: meta.totalRowsInSheet,
    rowsConsidered: rows.length,
    filteredRows: totalOrders,
    truncated: meta.truncated,
    warning: meta.truncated
      ? 'Showing the latest '
        + formatDashboardInteger_(ANALYTICS_DASHBOARD_MAX_ROWS)
        + ' orders out of '
        + formatDashboardInteger_(meta.totalRowsInSheet)
        + ' total rows for faster loading.'
      : '',
    empty: totalOrders === 0,
    kpis: {
      totalOrders: totalOrders,
      totalRevenue: roundDashboardNumber_(totalRevenue),
      deliveryRate: totalOrders ? deliveredOrders / totalOrders : 0,
      returnRate: totalOrders ? returnedOrders / totalOrders : 0,
      averageOrderValue: deliveredOrders ? roundDashboardNumber_(totalRevenue / deliveredOrders) : 0,
      deliveredOrders: deliveredOrders,
      returnedOrders: returnedOrders,
    },
    byStatus: byStatus,
    byConfirmation: byConfirmation,
    byWilaya: Object.keys(wilayaMetrics)
      .map((wilaya) => ({
        wilaya: wilaya,
        count: wilayaMetrics[wilaya].count,
        revenue: roundDashboardNumber_(wilayaMetrics[wilaya].revenue),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
        return a.wilaya.localeCompare(b.wilaya);
      })
      .slice(0, 10),
    revenueGrouping: revenueGrouping,
    revenueOverTime: buildDashboardRevenueSeries_(revenueEntries, revenueGrouping),
    byProvider: Object.keys(providerMetrics)
      .map((provider) => ({
        provider: provider,
        count: providerMetrics[provider].count,
        deliveredCount: providerMetrics[provider].deliveredCount,
        revenue: roundDashboardNumber_(providerMetrics[provider].revenue),
        deliveryRate: providerMetrics[provider].count
          ? providerMetrics[provider].deliveredCount / providerMetrics[provider].count
          : 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.deliveryRate !== a.deliveryRate) return b.deliveryRate - a.deliveryRate;
        return a.provider.localeCompare(b.provider);
      }),
    filterOptions: {
      providers: getProviderNames_(),
      statuses: DROPDOWNS['STATUS'].slice(),
      wilayas: Object.keys(uniqueWilayas).sort((a, b) => a.localeCompare(b)),
    },
  };

  return payload;
}

function matchesDashboardFilters_(row, filters) {
  if (!matchesDashboardDateFilters_(row['DATE'], filters)) {
    return false;
  }
  if (!matchesDashboardTextValue_(row['SOCIETE'], filters.provider)) {
    return false;
  }
  if (!matchesDashboardTextValue_(row['STATUS'], filters.status)) {
    return false;
  }
  if (!matchesDashboardTextValue_(row['WILAYA'], filters.wilaya)) {
    return false;
  }
  return true;
}

function matchesDashboardDateFilters_(value, filters) {
  if (!filters.dateFrom && !filters.dateTo) return true;

  const date = parseDashboardDate_(value);
  if (!date) return false;

  const dateKey = formatDashboardDateKey_(date);
  if (filters.dateFrom && dateKey < filters.dateFrom) return false;
  if (filters.dateTo && dateKey > filters.dateTo) return false;
  return true;
}

function matchesDashboardTextValue_(value, filterValue) {
  if (!filterValue) return true;
  return String(value || '').trim().toUpperCase() === filterValue.toUpperCase();
}

function normalizeDashboardLabel_(value, fallback) {
  const text = String(value || '').trim();
  return text || (fallback || 'UNKNOWN');
}

function toDashboardNumber_(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundDashboardNumber_(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatDashboardInteger_(value) {
  return String(Math.round(Number(value) || 0))
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseDashboardDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]'
      && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const numberDate = new Date(value);
    if (!Number.isNaN(numberDate.getTime())) {
      return new Date(
        numberDate.getFullYear(),
        numberDate.getMonth(),
        numberDate.getDate()
      );
    }
  }

  const text = String(value || '').trim();
  if (!text) return null;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function formatDashboardDateKey_(date) {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

function determineDashboardRevenueGrouping_(revenueEntries) {
  if (!revenueEntries || revenueEntries.length < 2) return 'day';

  let minTime = revenueEntries[0].date.getTime();
  let maxTime = revenueEntries[0].date.getTime();

  for (let i = 1; i < revenueEntries.length; i++) {
    const time = revenueEntries[i].date.getTime();
    if (time < minTime) minTime = time;
    if (time > maxTime) maxTime = time;
  }

  const spanDays = Math.round((maxTime - minTime) / 86400000);
  return spanDays > 45 ? 'week' : 'day';
}

function buildDashboardRevenueSeries_(revenueEntries, grouping) {
  const buckets = {};

  revenueEntries.forEach((entry) => {
    const key = grouping === 'week'
      ? getDashboardWeekStartKey_(entry.date)
      : formatDashboardDateKey_(entry.date);
    buckets[key] = roundDashboardNumber_((buckets[key] || 0) + entry.revenue);
  });

  return Object.keys(buckets)
    .sort()
    .map((key) => ({
      key: key,
      label: key,
      revenue: roundDashboardNumber_(buckets[key]),
    }));
}

function getDashboardWeekStartKey_(date) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  return formatDashboardDateKey_(weekStart);
}

function buildDashboardHtml_() {
  const bootstrap = {
    providerNames: getProviderNames_(),
    statusOptions: DROPDOWNS['STATUS'].slice(),
    confirmationOptions: Object.keys(CONFIRMATION_COLORS),
    statusColors: STATUS_COLORS,
    confirmationColors: CONFIRMATION_COLORS,
    maxRows: ANALYTICS_DASHBOARD_MAX_ROWS,
  };

  const kpiCards = [
    {
      key: 'totalOrders',
      label: 'Total Orders',
      icon: '📦',
      accent: '#1A73E8',
      surface: '#E8F0FE',
      note: 'Orders in the current view',
      dark: false,
    },
    {
      key: 'totalRevenue',
      label: 'Revenue',
      icon: '💰',
      accent: '#34A853',
      surface: '#ECF7EF',
      note: 'Delivered orders only',
      dark: false,
    },
    {
      key: 'deliveryRate',
      label: 'Delivery Rate',
      icon: '✅',
      accent: CONFIRMATION_COLORS.CONFIRME,
      surface: '#EDF7EE',
      note: 'Delivered vs total orders',
      dark: false,
    },
    {
      key: 'returnRate',
      label: 'Return Rate',
      icon: '🔄',
      accent: STATUS_COLORS.RETOUR,
      surface: STATUS_COLORS.RETOUR,
      note: 'Returned vs total orders',
      dark: true,
    },
    {
      key: 'averageOrderValue',
      label: 'Avg Order Value',
      icon: '🧾',
      accent: CONFIRMATION_COLORS.INJOIGNABLE,
      surface: '#FFF7D8',
      note: 'Average delivered basket',
      dark: false,
    },
  ];

  const chartCards = [
    {
      id: 'statusChart',
      title: 'Orders by Status',
      subtitle: 'Doughnut split using the existing status palette.',
      emptyMessage: 'No status data for the current filters.',
      wide: false,
    },
    {
      id: 'confirmationChart',
      title: 'Confirmation Funnel',
      subtitle: 'Horizontal bar view of confirmation outcomes.',
      emptyMessage: 'No confirmation data for the current filters.',
      wide: false,
    },
    {
      id: 'wilayaChart',
      title: 'Top 10 Wilayas',
      subtitle: 'Order volume with delivered revenue in tooltips.',
      emptyMessage: 'No wilaya data for the current filters.',
      wide: false,
    },
    {
      id: 'providerChart',
      title: 'Provider Performance',
      subtitle: 'Orders and delivery rate by courier provider.',
      emptyMessage: 'No provider data for the current filters.',
      wide: false,
    },
    {
      id: 'revenueChart',
      title: 'Revenue Over Time',
      subtitle: 'Delivered revenue grouped by day or week.',
      emptyMessage: 'No delivered revenue available for the current filters.',
      wide: true,
    },
  ];

  const kpiCardsHtml = kpiCards.map((card) => (
    '<article class="kpi-card'
      + (card.dark ? ' is-dark' : '')
      + '" data-kpi="' + card.key + '"'
      + ' style="--card-accent:' + card.accent + ';--card-surface:' + card.surface + ';">'
      + '<div class="kpi-icon">' + card.icon + '</div>'
      + '<div class="kpi-label">' + card.label + '</div>'
      + '<div class="kpi-value">--</div>'
      + '<div class="kpi-note">' + card.note + '</div>'
      + '<div class="loading-overlay"><div class="skeleton-stack">'
      + '<span class="skeleton skeleton-pill"></span>'
      + '<span class="skeleton skeleton-line large"></span>'
      + '<span class="skeleton skeleton-line"></span>'
      + '</div></div>'
      + '</article>'
  )).join('');

  const chartCardsHtml = chartCards.map((card) => (
    '<article class="chart-card' + (card.wide ? ' wide' : '') + '" id="' + card.id + 'Card">'
      + '<div class="card-head">'
      + '<div><h3>' + card.title + '</h3><p>' + card.subtitle + '</p></div>'
      + '</div>'
      + '<div class="chart-shell">'
      + '<canvas id="' + card.id + '" aria-label="' + card.title + '"></canvas>'
      + '<div class="chart-message hidden">' + card.emptyMessage + '</div>'
      + '<div class="loading-overlay chart-loading"><div class="chart-skeleton">'
      + '<span class="skeleton skeleton-line large"></span>'
      + '<span class="skeleton skeleton-line"></span>'
      + '<span class="skeleton skeleton-line"></span>'
      + '<span class="skeleton skeleton-line small"></span>'
      + '</div></div>'
      + '</div>'
      + '</article>'
  )).join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <style>
      :root {
        --primary: #1A73E8;
        --primary-dark: #1557B0;
        --primary-soft: #E8F0FE;
        --surface: rgba(255, 255, 255, 0.9);
        --surface-strong: #FFFFFF;
        --surface-muted: #EEF3F8;
        --border: rgba(26, 115, 232, 0.12);
        --text: #16324A;
        --muted: #5F7285;
        --success: #34A853;
        --warning: #F9AB00;
        --danger: #D93025;
        --shadow: 0 24px 60px rgba(17, 53, 89, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Google Sans', Arial, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(26, 115, 232, 0.16), transparent 32%),
          radial-gradient(circle at top right, rgba(52, 168, 83, 0.12), transparent 24%),
          linear-gradient(180deg, #F7FBFF 0%, #EEF5FB 100%);
      }

      button,
      select,
      input {
        font: inherit;
      }

      .dashboard {
        padding: 22px;
      }

      .hero {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 24px;
        color: #FFFFFF;
        background: linear-gradient(135deg, #1A73E8 0%, #0B57D0 55%, #0C7FF2 100%);
        box-shadow: var(--shadow);
      }

      .hero::before,
      .hero::after {
        content: '';
        position: absolute;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        pointer-events: none;
      }

      .hero::before {
        width: 240px;
        height: 240px;
        top: -110px;
        right: -60px;
      }

      .hero::after {
        width: 180px;
        height: 180px;
        bottom: -80px;
        left: -40px;
      }

      .hero-content {
        position: relative;
        z-index: 1;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.14);
      }

      h1 {
        margin: 14px 0 8px;
        font-size: 30px;
        line-height: 1.1;
      }

      .hero p {
        margin: 0;
        max-width: 720px;
        color: rgba(255, 255, 255, 0.86);
      }

      .meta-row {
        margin-top: 14px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.86);
      }

      .filters {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 12px;
        margin-top: 20px;
      }

      .field {
        min-width: 0;
      }

      .field label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.84);
      }

      .field input,
      .field select {
        width: 100%;
        height: 42px;
        padding: 0 12px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 14px;
        color: #16324A;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
      }

      .field input:focus,
      .field select:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.7);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.18);
      }

      .filter-actions {
        display: flex;
        align-items: flex-end;
        gap: 10px;
      }

      .btn {
        height: 42px;
        padding: 0 16px;
        border: none;
        border-radius: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }

      .btn:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .btn:disabled {
        cursor: wait;
        opacity: 0.7;
      }

      .btn-primary {
        color: #0B57D0;
        background: #FFFFFF;
        box-shadow: 0 12px 24px rgba(8, 37, 74, 0.18);
      }

      .btn-secondary {
        color: #FFFFFF;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.22);
      }

      .banner-stack {
        margin-top: 16px;
        display: grid;
        gap: 10px;
      }

      .banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 12px 32px rgba(15, 39, 71, 0.08);
      }

      .banner-warning {
        color: #7A5300;
        background: #FFF7D8;
        border: 1px solid rgba(249, 171, 0, 0.18);
      }

      .banner-error {
        color: #8A1F17;
        background: #FDE8E6;
        border: 1px solid rgba(217, 48, 37, 0.16);
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
      }

      .kpi-card,
      .chart-card,
      .empty-state {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: var(--surface-strong);
        box-shadow: var(--shadow);
        animation: fadeUp 0.45s ease both;
      }

      .kpi-card {
        min-height: 150px;
        padding: 18px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 1) 100%),
          var(--card-surface);
      }

      .kpi-card::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 5px;
        background: var(--card-accent);
      }

      .kpi-card::after {
        content: '';
        position: absolute;
        right: -34px;
        bottom: -34px;
        width: 110px;
        height: 110px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.42);
      }

      .kpi-card.is-dark {
        color: #FFFFFF;
        background: linear-gradient(180deg, rgba(33, 33, 33, 0.96), rgba(33, 33, 33, 1));
      }

      .kpi-card.is-dark .kpi-note,
      .kpi-card.is-dark .kpi-label {
        color: rgba(255, 255, 255, 0.78);
      }

      .kpi-icon {
        position: relative;
        z-index: 1;
        width: 42px;
        height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        font-size: 20px;
        background: rgba(255, 255, 255, 0.72);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48);
      }

      .kpi-label {
        position: relative;
        z-index: 1;
        margin-top: 16px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .kpi-value {
        position: relative;
        z-index: 1;
        margin-top: 10px;
        font-size: 28px;
        font-weight: 800;
        line-height: 1.05;
      }

      .kpi-note {
        position: relative;
        z-index: 1;
        margin-top: 8px;
        font-size: 13px;
        color: var(--muted);
      }

      .chart-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-top: 18px;
      }

      .chart-card {
        padding: 18px;
        background:
          radial-gradient(circle at top right, rgba(26, 115, 232, 0.06), transparent 34%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.96));
      }

      .chart-card.wide {
        grid-column: 1 / -1;
      }

      .card-head h3 {
        margin: 0;
        font-size: 18px;
      }

      .card-head p {
        margin: 6px 0 0;
        font-size: 13px;
        color: var(--muted);
      }

      .chart-shell {
        position: relative;
        min-height: 270px;
        margin-top: 18px;
      }

      canvas {
        width: 100% !important;
        height: 270px !important;
      }

      .chart-card.wide canvas {
        height: 300px !important;
      }

      .chart-message {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        border-radius: 18px;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--muted);
        background: rgba(238, 243, 248, 0.72);
      }

      .loading-overlay {
        position: absolute;
        inset: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(3px);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .kpi-card.is-dark .loading-overlay {
        background: rgba(16, 16, 16, 0.72);
      }

      .is-loading .loading-overlay {
        opacity: 1;
      }

      .skeleton-stack,
      .chart-skeleton {
        width: 100%;
        max-width: 200px;
        display: grid;
        gap: 10px;
      }

      .chart-skeleton {
        max-width: 280px;
      }

      .skeleton {
        display: block;
        position: relative;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(26, 115, 232, 0.1);
      }

      .skeleton::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
        animation: shimmer 1.6s infinite;
      }

      .skeleton-pill {
        width: 48px;
        height: 48px;
      }

      .skeleton-line {
        width: 100%;
        height: 12px;
      }

      .skeleton-line.large {
        height: 18px;
        width: 72%;
      }

      .skeleton-line.small {
        width: 54%;
      }

      .empty-state {
        margin-top: 18px;
        padding: 28px;
        display: flex;
        align-items: center;
        gap: 24px;
        background:
          radial-gradient(circle at top left, rgba(26, 115, 232, 0.08), transparent 36%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 1));
      }

      .empty-illustration {
        flex: 0 0 140px;
        width: 140px;
        height: 140px;
        border-radius: 32px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #E8F0FE, #F7FBFF);
        color: var(--primary);
      }

      .empty-copy h3 {
        margin: 0 0 8px;
        font-size: 22px;
      }

      .empty-copy p {
        margin: 0;
        color: var(--muted);
      }

      .hidden {
        display: none !important;
      }

      @keyframes shimmer {
        100% {
          transform: translateX(100%);
        }
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 1180px) {
        .filters {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .kpi-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 860px) {
        .dashboard {
          padding: 14px;
        }

        .filters,
        .kpi-grid,
        .chart-grid {
          grid-template-columns: 1fr;
        }

        .chart-card.wide {
          grid-column: auto;
        }

        .empty-state {
          flex-direction: column;
          text-align: center;
        }
      }
    </style>
  </head>
  <body>
    <div class="dashboard" id="dashboardRoot">
      <section class="hero">
        <div class="hero-content">
          <span class="eyebrow">Analytics Dashboard</span>
          <h1>Order performance at a glance</h1>
          <p>Track deliveries, returns, wilaya demand, and courier performance from one cached Apps Script endpoint.</p>
          <div class="meta-row">
            <span id="metaText">Loading dashboard data...</span>
          </div>
          <div class="filters">
            <div class="field">
              <label for="dateFrom">Date From</label>
              <input id="dateFrom" type="date">
            </div>
            <div class="field">
              <label for="dateTo">Date To</label>
              <input id="dateTo" type="date">
            </div>
            <div class="field">
              <label for="provider">Provider</label>
              <select id="provider"></select>
            </div>
            <div class="field">
              <label for="status">Status</label>
              <select id="status"></select>
            </div>
            <div class="field">
              <label for="wilaya">Wilaya</label>
              <select id="wilaya"></select>
            </div>
            <div class="filter-actions">
              <button class="btn btn-primary" id="applyFilters">Apply</button>
              <button class="btn btn-secondary" id="resetFilters">Reset</button>
            </div>
          </div>
        </div>
      </section>

      <div class="banner-stack" id="bannerStack"></div>

      <section class="kpi-grid is-loading" id="kpiGrid">
        ${kpiCardsHtml}
      </section>

      <section class="chart-grid is-loading" id="chartGrid">
        ${chartCardsHtml}
      </section>

      <section class="empty-state hidden" id="emptyState">
        <div class="empty-illustration" aria-hidden="true">
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
            <rect x="16" y="22" width="56" height="44" rx="14" fill="#FFFFFF" stroke="#1A73E8" stroke-width="3"/>
            <path d="M28 56C34 48 40 44 46 44C52 44 58 48 60 54" stroke="#1A73E8" stroke-width="4" stroke-linecap="round"/>
            <circle cx="36" cy="36" r="5" fill="#34A853"/>
            <circle cx="56" cy="34" r="5" fill="#F9AB00"/>
          </svg>
        </div>
        <div class="empty-copy">
          <h3>No orders match your filters</h3>
          <p>Try widening the date range or clearing one of the filters to bring the charts back.</p>
        </div>
      </section>
    </div>

    <script>
      var DASHBOARD_BOOTSTRAP = ${JSON.stringify(bootstrap)};
      var STORAGE_KEY = 'honeystore.analytics.filters';
      var dashboardState = {
        charts: {},
        lastData: null,
        currentFilters: null
      };

      window.addEventListener('load', function() {
        bindDashboardEvents();
        populateStaticSelects();
        var savedFilters = getSavedFilters();
        applyFiltersToControls(savedFilters);
        loadDashboard(savedFilters);
      });

      function bindDashboardEvents() {
        document.getElementById('applyFilters').addEventListener('click', function() {
          loadDashboard(readFiltersFromControls());
        });

        document.getElementById('resetFilters').addEventListener('click', function() {
          clearSavedFilters();
          var emptyFilters = {
            dateFrom: '',
            dateTo: '',
            provider: '',
            status: '',
            wilaya: ''
          };
          applyFiltersToControls(emptyFilters);
          loadDashboard(emptyFilters);
        });
      }

      function populateStaticSelects() {
        renderSelectOptions('provider', DASHBOARD_BOOTSTRAP.providerNames, 'All providers', '');
        renderSelectOptions('status', DASHBOARD_BOOTSTRAP.statusOptions, 'All statuses', '');
        renderSelectOptions('wilaya', [], 'All wilayas', '');
      }

      function readFiltersFromControls() {
        return sanitizeFilters({
          dateFrom: document.getElementById('dateFrom').value,
          dateTo: document.getElementById('dateTo').value,
          provider: document.getElementById('provider').value,
          status: document.getElementById('status').value,
          wilaya: document.getElementById('wilaya').value
        });
      }

      function sanitizeFilters(filters) {
        var safe = {
          dateFrom: sanitizeDateString(filters && filters.dateFrom),
          dateTo: sanitizeDateString(filters && filters.dateTo),
          provider: sanitizeText(filters && filters.provider),
          status: sanitizeText(filters && filters.status),
          wilaya: sanitizeText(filters && filters.wilaya)
        };

        if (safe.dateFrom && safe.dateTo && safe.dateFrom > safe.dateTo) {
          var temp = safe.dateFrom;
          safe.dateFrom = safe.dateTo;
          safe.dateTo = temp;
        }

        return safe;
      }

      function sanitizeDateString(value) {
        var text = sanitizeText(value);
        return /^\\d{4}-\\d{2}-\\d{2}$/.test(text) ? text : '';
      }

      function sanitizeText(value) {
        return String(value || '').trim();
      }

      function applyFiltersToControls(filters) {
        var safe = sanitizeFilters(filters || {});
        document.getElementById('dateFrom').value = safe.dateFrom;
        document.getElementById('dateTo').value = safe.dateTo;
        setSelectValue('provider', safe.provider);
        setSelectValue('status', safe.status);
        setSelectValue('wilaya', safe.wilaya);
      }

      function setSelectValue(selectId, value) {
        var select = document.getElementById(selectId);
        if (!select) return;

        if (value && !Array.prototype.some.call(select.options, function(option) {
          return option.value === value;
        })) {
          var extra = document.createElement('option');
          extra.value = value;
          extra.textContent = value;
          select.appendChild(extra);
        }

        select.value = value || '';
      }

      function renderSelectOptions(selectId, options, placeholder, selectedValue) {
        var select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '';

        var blank = document.createElement('option');
        blank.value = '';
        blank.textContent = placeholder;
        select.appendChild(blank);

        (options || []).forEach(function(optionValue) {
          var option = document.createElement('option');
          option.value = optionValue;
          option.textContent = optionValue;
          select.appendChild(option);
        });

        setSelectValue(selectId, selectedValue);
      }

      function loadDashboard(filters) {
        var safeFilters = sanitizeFilters(filters || {});
        dashboardState.currentFilters = safeFilters;
        persistFilters(safeFilters);
        setLoading(true);
        renderBanners([]);

        google.script.run
          .withSuccessHandler(function(data) {
            handleDashboardSuccess(data || {});
          })
          .withFailureHandler(function(error) {
            setLoading(false);
            renderBanners([
              {
                type: 'error',
                text: extractErrorMessage(error)
              }
            ]);
          })
          .getDashboardData(safeFilters);
      }

      function handleDashboardSuccess(data) {
        dashboardState.lastData = data;
        dashboardState.currentFilters = sanitizeFilters(data.filters || {});

        renderSelectOptions(
          'provider',
          (data.filterOptions && data.filterOptions.providers) || DASHBOARD_BOOTSTRAP.providerNames,
          'All providers',
          dashboardState.currentFilters.provider
        );
        renderSelectOptions(
          'status',
          (data.filterOptions && data.filterOptions.statuses) || DASHBOARD_BOOTSTRAP.statusOptions,
          'All statuses',
          dashboardState.currentFilters.status
        );
        renderSelectOptions(
          'wilaya',
          (data.filterOptions && data.filterOptions.wilayas) || [],
          'All wilayas',
          dashboardState.currentFilters.wilaya
        );
        applyFiltersToControls(dashboardState.currentFilters);
        persistFilters(dashboardState.currentFilters);

        renderMeta(data);
        renderBanners(buildBannersFromData(data));
        renderKpis(data.kpis || {});
        toggleEmptyState(Boolean(data.empty));

        if (data.empty) {
          destroyAllCharts();
        } else {
          renderCharts(data);
        }

        setLoading(false);
      }

      function buildBannersFromData(data) {
        var banners = [];
        if (data && data.warning) {
          banners.push({
            type: 'warning',
            text: data.warning
          });
        }
        if (!window.Chart) {
          banners.push({
            type: 'error',
            text: 'Chart.js could not be loaded from the CDN, so charts are unavailable.'
          });
        }
        return banners;
      }

      function renderMeta(data) {
        var parts = [];
        var filteredRows = Number(data.filteredRows || 0);
        var rowsConsidered = Number(data.rowsConsidered || 0);

        parts.push(formatNumber(filteredRows) + ' matching orders');
        parts.push('from ' + formatNumber(rowsConsidered) + ' scanned rows');

        if (data.generatedAt) {
          parts.push('updated ' + formatTime(data.generatedAt));
        }

        document.getElementById('metaText').textContent = parts.join(' • ');
      }

      function renderBanners(banners) {
        var container = document.getElementById('bannerStack');
        container.innerHTML = '';

        (banners || []).forEach(function(banner) {
          var item = document.createElement('div');
          item.className = 'banner ' + (banner.type === 'error' ? 'banner-error' : 'banner-warning');
          item.textContent = banner.text;
          container.appendChild(item);
        });
      }

      function renderKpis(kpis) {
        var totalOrders = Number(kpis.totalOrders || 0);
        var deliveredOrders = Number(kpis.deliveredOrders || 0);
        var returnedOrders = Number(kpis.returnedOrders || 0);

        var cardValues = {
          totalOrders: {
            value: formatNumber(totalOrders),
            note: 'Delivered orders: ' + formatNumber(deliveredOrders)
          },
          totalRevenue: {
            value: formatCurrency(kpis.totalRevenue || 0),
            note: 'Delivered orders only'
          },
          deliveryRate: {
            value: formatPercent(kpis.deliveryRate || 0),
            note: formatNumber(deliveredOrders) + ' delivered out of ' + formatNumber(totalOrders)
          },
          returnRate: {
            value: formatPercent(kpis.returnRate || 0),
            note: formatNumber(returnedOrders) + ' returns in this view'
          },
          averageOrderValue: {
            value: formatCurrency(kpis.averageOrderValue || 0),
            note: deliveredOrders ? 'Average delivered basket' : 'No delivered orders yet'
          }
        };

        Object.keys(cardValues).forEach(function(key) {
          var card = document.querySelector('[data-kpi="' + key + '"]');
          if (!card) return;
          card.querySelector('.kpi-value').textContent = cardValues[key].value;
          card.querySelector('.kpi-note').textContent = cardValues[key].note;
        });
      }

      function toggleEmptyState(isEmpty) {
        document.getElementById('emptyState').classList.toggle('hidden', !isEmpty);
        document.getElementById('chartGrid').classList.toggle('hidden', isEmpty);
      }

      function setLoading(isLoading) {
        document.getElementById('kpiGrid').classList.toggle('is-loading', isLoading);
        document.getElementById('chartGrid').classList.toggle('is-loading', isLoading);
        document.getElementById('applyFilters').disabled = isLoading;
        document.getElementById('resetFilters').disabled = isLoading;
      }

      function persistFilters(filters) {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters || {}));
        } catch (error) {
          // Ignore sessionStorage failures.
        }
      }

      function getSavedFilters() {
        try {
          return sanitizeFilters(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'));
        } catch (error) {
          return sanitizeFilters({});
        }
      }

      function clearSavedFilters() {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          // Ignore sessionStorage failures.
        }
      }

      function renderCharts(data) {
        if (!window.Chart) return;

        renderStatusChart(data.byStatus || {});
        renderConfirmationChart(data.byConfirmation || {});
        renderWilayaChart(data.byWilaya || []);
        renderProviderChart(data.byProvider || []);
        renderRevenueChart(data.revenueOverTime || [], data.revenueGrouping || 'day');
      }

      function destroyAllCharts() {
        Object.keys(dashboardState.charts).forEach(function(chartId) {
          dashboardState.charts[chartId].destroy();
        });
        dashboardState.charts = {};
      }

      function prepareChart(canvasId, hasData, emptyMessage) {
        var canvas = document.getElementById(canvasId);
        var card = document.getElementById(canvasId + 'Card');
        var message = card.querySelector('.chart-message');

        if (dashboardState.charts[canvasId]) {
          dashboardState.charts[canvasId].destroy();
          delete dashboardState.charts[canvasId];
        }

        if (!hasData) {
          canvas.classList.add('hidden');
          message.textContent = emptyMessage;
          message.classList.remove('hidden');
          return null;
        }

        canvas.classList.remove('hidden');
        message.classList.add('hidden');
        return canvas.getContext('2d');
      }

      function renderStatusChart(byStatus) {
        var series = buildSeriesFromMap(byStatus, DASHBOARD_BOOTSTRAP.statusOptions);
        var labels = series.labels;
        var ctx = prepareChart('statusChart', labels.length > 0, 'No status data for the current filters.');
        if (!ctx) return;

        dashboardState.charts.statusChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: series.values,
              backgroundColor: labels.map(function(label, index) {
                return resolvePaletteColor(label, DASHBOARD_BOOTSTRAP.statusColors, index, 0.96);
              }),
              borderColor: '#FFFFFF',
              borderWidth: 2,
              hoverOffset: 10
            }]
          },
          options: buildCommonChartOptions({
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 16
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + formatNumber(context.raw);
                  }
                }
              }
            }
          })
        });
      }

      function renderConfirmationChart(byConfirmation) {
        var series = buildSeriesFromMap(byConfirmation, DASHBOARD_BOOTSTRAP.confirmationOptions);
        var labels = series.labels;
        var ctx = prepareChart('confirmationChart', labels.length > 0, 'No confirmation data for the current filters.');
        if (!ctx) return;

        dashboardState.charts.confirmationChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Orders',
              data: series.values,
              backgroundColor: labels.map(function(label, index) {
                return resolvePaletteColor(label, DASHBOARD_BOOTSTRAP.confirmationColors, index, 0.9);
              }),
              borderRadius: 10,
              borderSkipped: false,
              barThickness: 18
            }]
          },
          options: buildCommonChartOptions({
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
              x: buildCountAxisConfig(),
              y: {
                grid: { display: false },
                ticks: { color: '#16324A' }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return 'Orders: ' + formatNumber(context.raw);
                  }
                }
              }
            }
          })
        });
      }

      function renderWilayaChart(items) {
        var topWilayas = (items || []).slice(0, 10);
        var labels = topWilayas.map(function(item) { return item.wilaya; });
        var counts = topWilayas.map(function(item) { return item.count; });
        var revenues = topWilayas.map(function(item) { return Number(item.revenue || 0); });
        var ctx = prepareChart('wilayaChart', labels.length > 0, 'No wilaya data for the current filters.');
        if (!ctx) return;

        var gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(26, 115, 232, 0.95)');
        gradient.addColorStop(1, 'rgba(26, 115, 232, 0.28)');

        dashboardState.charts.wilayaChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Orders',
              data: counts,
              backgroundColor: gradient,
              borderColor: '#1A73E8',
              borderWidth: 1,
              borderRadius: 12,
              borderSkipped: false
            }]
          },
          options: buildCommonChartOptions({
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  color: '#5F7285',
                  maxRotation: 35,
                  minRotation: 0
                }
              },
              y: buildCountAxisConfig()
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return 'Orders: ' + formatNumber(context.raw);
                  },
                  afterLabel: function(context) {
                    return 'Revenue: ' + formatCurrency(revenues[context.dataIndex] || 0);
                  }
                }
              }
            }
          })
        });
      }

      function renderProviderChart(items) {
        var providers = (items || []).slice(0, 12);
        var labels = providers.map(function(item) { return item.provider; });
        var counts = providers.map(function(item) { return item.count; });
        var deliveryRates = providers.map(function(item) {
          return Math.round(Number(item.deliveryRate || 0) * 1000) / 10;
        });
        var hues = providers.map(function(item) {
          return getHueForLabel(item.provider);
        });
        var ctx = prepareChart('providerChart', labels.length > 0, 'No provider data for the current filters.');
        if (!ctx) return;

        dashboardState.charts.providerChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Orders',
              data: counts,
              backgroundColor: hues.map(function(hue) { return hslaFromHue(hue, 0.9); }),
              borderRadius: 10,
              borderSkipped: false,
              yAxisID: 'y'
            }, {
              label: 'Delivery Rate %',
              data: deliveryRates,
              backgroundColor: hues.map(function(hue) { return hslaFromHue(hue, 0.36); }),
              borderColor: hues.map(function(hue) { return hslaFromHue(hue, 0.92); }),
              borderWidth: 1,
              borderRadius: 10,
              borderSkipped: false,
              yAxisID: 'y1'
            }]
          },
          options: buildCommonChartOptions({
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  color: '#5F7285',
                  maxRotation: 35,
                  minRotation: 0
                }
              },
              y: buildCountAxisConfig(),
              y1: {
                position: 'right',
                beginAtZero: true,
                max: 100,
                grid: { drawOnChartArea: false },
                ticks: {
                  color: '#5F7285',
                  callback: function(value) { return value + '%'; }
                }
              }
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 16
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    var label = context.dataset.label || '';
                    if (context.dataset.yAxisID === 'y1') {
                      return label + ': ' + context.raw + '%';
                    }
                    return label + ': ' + formatNumber(context.raw);
                  }
                }
              }
            }
          })
        });
      }

      function renderRevenueChart(series, grouping) {
        var labels = (series || []).map(function(item) {
          return formatDateLabel(item.key, grouping);
        });
        var values = (series || []).map(function(item) {
          return Number(item.revenue || 0);
        });
        var ctx = prepareChart('revenueChart', labels.length > 0, 'No delivered revenue available for the current filters.');
        if (!ctx) return;

        var areaGradient = ctx.createLinearGradient(0, 0, 0, 300);
        areaGradient.addColorStop(0, 'rgba(26, 115, 232, 0.28)');
        areaGradient.addColorStop(1, 'rgba(26, 115, 232, 0.02)');

        dashboardState.charts.revenueChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Revenue',
              data: values,
              borderColor: '#1A73E8',
              backgroundColor: areaGradient,
              fill: true,
              tension: 0.32,
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: '#1A73E8',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2
            }]
          },
          options: buildCommonChartOptions({
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#5F7285' }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(22, 50, 74, 0.08)'
                },
                ticks: {
                  color: '#5F7285',
                  callback: function(value) {
                    return formatShortCurrency(value);
                  }
                }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return 'Revenue: ' + formatCurrency(context.raw);
                  }
                }
              }
            }
          })
        });
      }

      function buildSeriesFromMap(map, preferredOrder) {
        var labels = [];
        var values = [];
        var consumed = {};

        (preferredOrder || []).forEach(function(label) {
          var count = Number(map[label] || 0);
          if (count > 0) {
            labels.push(label);
            values.push(count);
            consumed[label] = true;
          }
        });

        Object.keys(map || {}).sort().forEach(function(label) {
          var count = Number(map[label] || 0);
          if (!consumed[label] && count > 0) {
            labels.push(label);
            values.push(count);
          }
        });

        return { labels: labels, values: values };
      }

      function buildCommonChartOptions(overrides) {
        return mergeObjects({
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 900,
            easing: 'easeOutQuart'
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              labels: {
                color: '#16324A'
              }
            }
          }
        }, overrides || {});
      }

      function buildCountAxisConfig() {
        return {
          beginAtZero: true,
          grid: {
            color: 'rgba(22, 50, 74, 0.08)'
          },
          ticks: {
            color: '#5F7285',
            callback: function(value) {
              return formatNumber(value);
            }
          }
        };
      }

      function mergeObjects(base, extra) {
        var output = Array.isArray(base) ? base.slice() : Object.assign({}, base);

        Object.keys(extra || {}).forEach(function(key) {
          var extraValue = extra[key];
          if (extraValue && typeof extraValue === 'object' && !Array.isArray(extraValue)) {
            var baseValue = output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])
              ? output[key]
              : {};
            output[key] = mergeObjects(baseValue, extraValue);
          } else {
            output[key] = extraValue;
          }
        });

        return output;
      }

      function resolvePaletteColor(label, palette, index, alpha) {
        var fallback = ['#78909C', '#26A69A', '#5C6BC0', '#EF6C00', '#8E24AA'];
        var base = (palette && palette[label]) || fallback[index % fallback.length];
        return typeof alpha === 'number' ? hexToRgba(base, alpha) : base;
      }

      function hexToRgba(hex, alpha) {
        var normalized = String(hex || '').replace('#', '');
        if (normalized.length !== 6) return hex;
        var r = parseInt(normalized.slice(0, 2), 16);
        var g = parseInt(normalized.slice(2, 4), 16);
        var b = parseInt(normalized.slice(4, 6), 16);
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
      }

      function getHueForLabel(label) {
        var hash = 0;
        String(label || '').split('').forEach(function(character) {
          hash = ((hash << 5) - hash) + character.charCodeAt(0);
          hash |= 0;
        });
        return Math.abs(hash) % 360;
      }

      function hslaFromHue(hue, alpha) {
        return 'hsla(' + hue + ', 68%, 50%, ' + alpha + ')';
      }

      function formatNumber(value) {
        return Number(value || 0).toLocaleString('en-US');
      }

      function formatCurrency(value) {
        try {
          return new Intl.NumberFormat('fr-DZ', {
            style: 'currency',
            currency: 'DZD',
            maximumFractionDigits: 0
          }).format(Number(value || 0));
        } catch (error) {
          return formatNumber(value) + ' DZD';
        }
      }

      function formatShortCurrency(value) {
        var numeric = Number(value || 0);
        if (Math.abs(numeric) >= 1000000) {
          return (numeric / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (Math.abs(numeric) >= 1000) {
          return (numeric / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return formatNumber(numeric);
      }

      function formatPercent(value) {
        return (Number(value || 0) * 100).toFixed(1) + '%';
      }

      function formatTime(isoString) {
        var date = new Date(isoString);
        if (isNaN(date.getTime())) return 'just now';
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      function formatDateLabel(key, grouping) {
        var parts = String(key || '').split('-');
        if (parts.length !== 3) return key;

        var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (isNaN(date.getTime())) return key;

        var formatted = date.toLocaleDateString([], {
          day: '2-digit',
          month: 'short'
        });

        return grouping === 'week' ? 'Week of ' + formatted : formatted;
      }

      function extractErrorMessage(error) {
        if (!error) return 'Unable to load dashboard data.';
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        return 'Unable to load dashboard data.';
      }
    </script>
  </body>
</html>`;
}
