# Order Analytics Dashboard Implementation Plan

## Executive Summary

This document outlines a comprehensive implementation plan for building a rich, animated analytics dashboard for the Google Sheets Order Management System. The dashboard will provide real-time insights into order performance, delivery status, revenue metrics, and courier performance.

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER ANALYTICS DASHBOARD                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  KPI Cards  │  │   Charts    │  │   Tables    │             │
│  │  (Animated) │  │  (Recharts) │  │  (Data)     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                    STATE MANAGEMENT                               │
│              (React Query + Context API)                         │
├─────────────────────────────────────────────────────────────────┤
│                    DATA LAYER                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │  Google Sheets API  │  │   Payload CMS API   │               │
│  │  (Code.gs Backend)  │  │   (Local Storage)   │               │
│  └─────────────────────┘  └─────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI Framework | Next.js 14+ | Application framework |
| Animation | Framer Motion | Rich animations & transitions |
| Charts | Recharts | Data visualization |
| State | React Query | Server state & caching |
| Styling | Tailwind CSS | Responsive styling |
| Icons | Lucide React | Iconography |
| Data | Google Apps Script | Order data backend |

---

## 2. Data Model & Analytics Metrics

### 2.1 Order Data Structure (from Code.gs)

```typescript
interface Order {
  DATE: string;
  'ORDER ID': string;
  NAME: string;
  PHONE: string;
  'CODE WILAYA': string;
  WILAYA: string;
  COMMUNE: string;
  ADRESSE: string;
  STATION: string;
  PRODUCT: string;
  'PRODUCT Option': string;
  QUANTITY: number;
  'PRODUCT PRICE': number;
  'DELIVERY PRICE': number;
  'TOTAL PRICE': number;
  'DELIVERY MODE': 'Stop Desk' | 'Door Delivery';
  NOTE: string;
  'STOCK TYPE': 'STOCK' | 'NORMAL';
  'PRODUCT TO CHANGE': string;
  FRAGILE: 'fragile' | 'NO';
  WEIGHT: number;
  INSURANCE: 'OUI' | 'NO';
  EXCHANGE: 'EXCHANGE' | 'NO';
  SOCIETE: string;
  CONFIRMATION: string;
  TRACKING: string;
  STATUS: 'EN LIVRAISON' | 'LIVREE' | 'ANNULE' | 'RETOUR';
  'RAW STATUS': string;
}
```

### 2.2 Analytics Metrics

#### KPI Metrics
| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Total Orders** | All orders in period | COUNT(orders) |
| **Total Revenue** | Sum of TOTAL PRICE | SUM(TOTAL PRICE) |
| **Average Order Value** | Revenue / Orders | SUM / COUNT |
| **Conversion Rate** | LIVREE / Total | LIVREE / COUNT |
| **Cancellation Rate** | ANNULE / Total | ANNULE / COUNT |
| **Return Rate** | RETOUR / Total | RETOUR / COUNT |

#### Delivery Performance
| Metric | Description |
|--------|-------------|
| **Delivery Success Rate** | % of orders delivered |
| **Average Delivery Time** | Days from order to delivery |
| **Pending Deliveries** | Orders in EN LIVRAISON |
| **Failed Deliveries** | Orders in ANNULE/RETOUR |

#### Geographic Distribution
| Metric | Description |
|--------|-------------|
| **Top Wilayas** | Orders by WILAYA |
| **Top Communes** | Orders by COMMUNE |
| **Delivery Hotspots** | Geographic heat map |

#### Product Analytics
| Metric | Description |
|--------|-------------|
| **Top Products** | Most ordered products |
| **Product Mix** | Revenue by product |
| **Stock vs Normal** | Order type distribution |

#### Courier Performance
| Metric | Description |
|--------|-------------|
| **Provider Distribution** | Orders per SOCIETE |
| **Provider Success Rate** | Deliveries per provider |
| **Provider Revenue** | Revenue per provider |

---

## 3. UI/UX Design Specification

### 3.1 Layout Structure

```tsx
// Dashboard Layout
<DashboardLayout>
  {/* Header */}
  <DashboardHeader 
    searchQuery
    onSearchChange
    onRefresh
    onExport
    isRefreshing
  />
  
  {/* KPI Cards Row */}
  <KPIRow>
    <DashboardCard stat={totalOrders} index={0} />
    <DashboardCard stat={revenue} index={1} />
    <DashboardCard stat={successRate} index={2} />
    <DashboardCard stat={pendingOrders} index={3} />
  </KPIRow>
  
  {/* Charts Row */}
  <ChartsRow>
    <RevenueChart />
    <OrderStatusPieChart />
    <OrdersTrendLineChart />
  </ChartsRow>
  
  {/* Secondary Charts */}
  <SecondaryCharts>
    <TopProductsChart />
    <WilayaDistributionMap />
    <CourierPerformanceTable />
  </SecondaryCharts>
</DashboardLayout>
```

### 3.2 Color Palette

```css
:root {
  /* Primary */
  --primary: #1A73E8;
  --primary-light: #4285F4;
  --primary-dark: #1557B0;
  
  /* Status Colors */
  --success: #34A853;
  --warning: #FBBC04;
  --danger: #EA4335;
  --info: #4285F4;
  
  /* Order Status */
  --status-en-livraison: #FFF3CD;
  --status-livree: #D4EDDA;
  --status-annule: #F8D7DA;
  --status-retour: #212121;
  
  /* Chart Colors */
  --chart-1: #1A73E8;
  --chart-2: #34A853;
  --chart-3: #FBBC04;
  --chart-4: #EA4335;
  --chart-5: #9333EA;
  --chart-6: #06B6D4;
}
```

### 3.3 Animation Specifications

#### Page Load Animations
```tsx
// Staggered card entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1, duration: 0.5 }}
/>

// Chart bars growth
<motion.div
  initial={{ height: 0 }}
  animate={{ height: `${value}%` }}
  transition={{ duration: 1, delay: index * 0.1 }}
/>

// Number counting animation
<CountUpAnimation 
  end={value} 
  duration={2} 
  easing="easeOutExpo" 
/>
```

#### Micro-interactions
| Element | Animation | Trigger |
|---------|-----------|---------|
| KPI Card | Scale 1.02, shadow lift | Hover |
| Chart Bar | Tooltip fade in | Hover |
| Table Row | Background highlight | Hover |
| Button | Ripple effect | Click |
| Refresh | Spin 360° | Loading |
| Filter | Slide down | Open |

#### Chart Animations
```tsx
// Line chart draw
<LineChart>
  <Line 
    type="monotone" 
    animationDuration={1500}
    animationEasing="ease-in-out"
  />
</LineChart>

// Pie chart segments
<PieChart>
  <Pie 
    animationBegin={0}
    animationDuration={1200}
    animationType="expansion"
  />
</PieChart>

// Bar chart grow
<BarChart>
  <Bar 
    animationDuration={1000}
    animationType="scaleIn"
  />
</BarChart>
```

### 3.4 Responsive Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px;   /* Single column */
--breakpoint-md: 768px;   /* 2 columns */
--breakpoint-lg: 1024px;  /* 3 columns */
--breakpoint-xl: 1280px;  /* 4 columns */
--breakpoint-2xl: 1536px; /* Full layout */
```

---

## 4. Component Implementation

### 4.1 KPI Cards Component

```tsx
interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: string;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percent';
}

// Features:
// - Animated number counting on load
// - Color-coded change indicators
// - Gradient background on hover
// - Progress bar visualization
// - Tooltip with detailed stats
```

### 4.2 Revenue Chart Component

```tsx
interface RevenueChartProps {
  data: RevenueData[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: string) => void;
  showComparison?: boolean;
}

// Chart Types:
// - Bar chart for daily/weekly revenue
// - Line chart for trends
// - Area chart for cumulative revenue
// - Comparison overlay (current vs previous period)
```

### 4.3 Order Status Distribution

```tsx
interface OrderStatusChartProps {
  data: OrderStatusData[];
  showLegend?: boolean;
  showPercentage?: boolean;
  animationType?: 'radial' | 'linear' | 'funnel';
}

// Pie/Donut/Radial chart showing:
// - LIVREE (Delivered) - Green
// - EN LIVRAISON (In Delivery) - Yellow
// - ANNULE (Cancelled) - Red
// - RETOUR (Returned) - Black
```

### 4.4 Orders Trend Chart

```tsx
interface OrdersTrendChartProps {
  data: OrderTrendData[];
  metrics: ('orders' | 'revenue' | 'avgValue')[];
  showTrendLine?: boolean;
  showForecast?: boolean;
}

// Multi-line chart with toggleable metrics
```

### 4.5 Top Products Chart

```tsx
interface TopProductsChartProps {
  data: ProductPerformanceData[];
  limit?: number;
  sortBy?: 'orders' | 'revenue' | 'quantity';
  horizontal?: boolean;
}

// Horizontal bar chart
```

### 4.6 Geographic Distribution

```tsx
interface GeoDistributionProps {
  data: GeoData[];
  type: 'wilaya' | 'commune';
  visualization: 'bar' | 'map' | 'treemap';
}

// Algeria-specific wilaya distribution
```

### 4.7 Courier Performance Table

```tsx
interface CourierPerformanceProps {
  data: CourierData[];
  sortable?: boolean;
  filterable?: boolean;
  showMetrics: ('orders' | 'revenue' | 'successRate' | 'avgTime')[];
}

// Sortable table with:
// - Provider name & logo
// - Total orders
// - Success rate (color coded)
// - Average delivery time
// - Revenue generated
```

---

## 5. Data Integration

### 5.1 Google Sheets API Integration

```typescript
// New Google Apps Script functions needed:

/**
 * Get all orders with optional date filtering
 */
function getOrdersForAnalytics(startDate, endDate) {
  // Returns: Order[] with analytics-ready data
}

/**
 * Get aggregated metrics
 */
function getAnalyticsMetrics(startDate, endDate) {
  // Returns: {
  //   totalOrders,
  //   totalRevenue,
  //   averageOrderValue,
  //   ordersByStatus,
  //   ordersByWilaya,
  //   ordersByProduct,
  //   ordersByCourier,
  //   dailyTrends
  // }
}

/**
 * Real-time order count
 */
function getRealtimeStats() {
  // Returns current day's stats
}
```

### 5.2 API Endpoints (Next.js)

```typescript
// app/api/analytics/route.ts
GET /api/analytics
  ?startDate=2024-01-01
  &endDate=2024-12-31
  &groupBy=day|week|month
  &metrics=orders,revenue,status

// Returns aggregated analytics data
```

### 5.3 Data Caching Strategy

```
┌─────────────────────────────────────────┐
│           CACHE STRATEGY                 │
├─────────────────────────────────────────┤
│  Static Data (Wilayas, Products): 24h  │
│  Dashboard Stats: 5min                  │
│  Real-time Count: 30sec                 │
│  Historical Data: No cache              │
└─────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Create analytics API routes
- [ ] Implement data fetching hooks
- [ ] Set up React Query provider
- [ ] Build KPI Card component with animations
- [ ] Integrate with Code.gs backend

### Phase 2: Core Charts (Week 2)

- [ ] Revenue trend chart
- [ ] Order status pie/donut chart
- [ ] Daily orders bar chart
- [ ] Implement chart animations
- [ ] Add time range filters

### Phase 3: Advanced Analytics (Week 3)

- [ ] Top products visualization
- [ ] Geographic distribution
- [ ] Courier performance table
- [ ] Comparison features (vs previous period)

### Phase 4: Polish & Optimization (Week 4)

- [ ] Micro-interactions
- [ ] Loading skeletons
- [ ] Error states
- [ ] Mobile responsiveness
- [ ] Performance optimization

---

## 7. File Structure

```
app/
├── api/
│   └── analytics/
│       └── route.ts              # Analytics API endpoint

components/
├── analytics/
│   ├── analytics-dashboard.tsx   # Main dashboard container
│   ├── kpi-card.tsx              # Animated KPI card
│   ├── kpi-row.tsx               # KPI cards row
│   ├── revenue-chart.tsx         # Revenue visualization
│   ├── order-status-chart.tsx    # Status distribution
│   ├── orders-trend-chart.tsx    # Trend over time
│   ├── top-products-chart.tsx    # Product performance
│   ├── geo-distribution.tsx     # Geographic analytics
│   ├── courier-performance.tsx   # Courier table
│   └── analytics-filters.tsx     # Date/provider filters

lib/
├── analytics/
│   ├── calculations.ts           # Metric calculations
│   ├── transformers.ts           # Data transformation
│   └── constants.ts              # Analytics constants

hooks/
├── use-analytics.ts              # Main analytics hook
├── use-realtime-stats.ts         # Real-time stats hook
└── use-analytics-filters.ts     # Filter state hook
```

---

## 8. Acceptance Criteria

### Visual Requirements
- [ ] All animations run at 60fps
- [ ] Page load completes in under 3 seconds
- [ ] Charts are fully responsive
- [ ] Color contrast meets WCAG AA
- [ ] Dark mode support

### Functional Requirements
- [ ] Accurate data matching Code.gs calculations
- [ ] Date range filtering works correctly
- [ ] All chart types render properly
- [ ] Real-time updates function correctly
- [ ] Export functionality works

### Performance Requirements
- [ ] Initial bundle size < 200KB
- [ ] Chart renders in < 500ms
- [ ] Smooth scrolling with many data points
- [ ] Efficient re-renders (React Query)

---

## 9. Dependencies

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "framer-motion": "^11.0.0",
    "@tanstack/react-query": "^5.0.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.300.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

---

## 10. Short Enhanced Prompt

```
Build a rich analytics dashboard for Google Sheets order management with:

• KPI Cards: Animated count-up numbers, color-coded changes, gradient hover effects
• Charts: Revenue trends (area), order status (donut), daily orders (bar), top products (horizontal bar)
• Animations: Staggered entrance, 1.5s chart drawing, hover scale(1.02), 60fps smooth transitions
• Filters: Date range, status, courier provider
• Source: Google Apps Script (Code.gs) - columns include DATE, TOTAL PRICE, STATUS, WILAYA, PRODUCT, SOCIETE
• Use: Framer Motion + Recharts + existing dashboard-card.tsx patterns
```
```
