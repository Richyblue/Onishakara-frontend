/**
 * Onishakara Gold POS
 * Application Routes Configuration
 *
 * Fashion Retail / Inventory / Sales Management
 *
 * Routes are grouped by business function for easier maintenance.
 */

import React from 'react'

// ============================================================
// DASHBOARD
// ============================================================

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

// ============================================================
// PRODUCTS & INVENTORY
// ============================================================

const Products = React.lazy(() => import('./product/product'))
const ViewProduct = React.lazy(() => import('./product/viewProduct'))
const EditProduct = React.lazy(() => import('./product/editProduct'))
const RecycleBin = React.lazy(() => import('./product/RecycleBin'))

const Categories = React.lazy(() => import('./categories/Categories'))
const Brands = React.lazy(() => import('./brands/Brand'))

// ============================================================
// CUSTOMERS
// ============================================================

const Customer = React.lazy(() => import('./customers/CreateCustomer'))
const ViewCustomer = React.lazy(() => import('./customers/ViewCustomers'))
const EditCustomer = React.lazy(() => import('./customers/EditCustomer'))

// ============================================================
// SALES / POS
// ============================================================

// Uncomment when the new Onishakara POS page is ready.
// const Pos = React.lazy(() => import('./pos/posPage'))

const SalesReport = React.lazy(() => import('./pos/salesReport'))
const Reports = React.lazy(() => import('./pos/Report'))
const ReturnSales = React.lazy(() => import('./pos/Returns'))

// ============================================================
// EXPENSES
// ============================================================

const Expense = React.lazy(() => import('./expense/AddExpense'))
const ViewExpense = React.lazy(() => import('./expense/ExpenseList'))

// ============================================================
// STAFF
// ============================================================

const Staff = React.lazy(() => import('./staff/AddStaff'))
const ViewStaff = React.lazy(() => import('./staff/ViewStaff'))
const EditStaff = React.lazy(() => import('./staff/editStaff'))

// ============================================================
// SUPPLIERS
// ============================================================

const Suppliers = React.lazy(() => import('./suppliers/Suppliers'))
const AddSupplier = React.lazy(() => import('./suppliers/AddSupplier'))
const SupplierDetails = React.lazy(() => import('./suppliers/SupplierDetails'))

// ============================================================
// PURCHASES
// ============================================================

const Purchases = React.lazy(() => import('./purchases/Purchases'))

const AddPurchase = React.lazy(() => import('./purchases/AddPurchase'))
// const AddPurchase = React.lazy(() => import('./views/purchases/AddPurchase'))

// PurchaseDetails will be added later if required.
const PurchaseDetails = React.lazy(() => import('./purchases/PurchaseDetails'))
const EditPurchase = React.lazy(() => import('./purchases/EditPurchase'))
const Sales = React.lazy(() => import('./sales/Sales'))

const SaleDetails = React.lazy(() => import('./sales/SaleDetails'))

const SalesReports = React.lazy(() => import('./sales/SalesReport'))
const Stock = React.lazy(() => import('./stock/Stock'))
const StockHistory = React.lazy(() => import('./stock/StockHistory'))

// ============================================================
// SETTINGS
// ============================================================

const Settings = React.lazy(() => import('./Settings'))
const HardwareSettings = React.lazy(() => import('./HardwareSettings'))

// ============================================================
// AUTH
// ============================================================

const Logout = React.lazy(() => import('./auth/logout'))

// ============================================================
// DEVELOPMENT / COREUI DEMO PAGES
// ============================================================

const Charts = React.lazy(() => import('./views/charts/Charts'))
const Layout = React.lazy(() => import('./views/forms/layout/Layout'))
const Range = React.lazy(() => import('./views/forms/range/Range'))
const Select = React.lazy(() => import('./views/forms/select/Select'))
const Validation = React.lazy(() => import('./views/forms/validation/Validation'))

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))

const Flags = React.lazy(() => import('./views/icons/flags/Flags'))

// Notifications
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))

const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))

const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))

// ============================================================
// ROUTES
// ============================================================

export const routes = [
  // ----------------------------------------------------------
  // HOME / DASHBOARD
  // ----------------------------------------------------------

  {
    path: '/',
    exact: true,
    name: 'Home',
  },

  {
    path: '/dashboard',
    name: 'Dashboard',
    element: Dashboard,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // PRODUCTS
  // ----------------------------------------------------------

  {
    path: '/products',
    name: 'Products',
    element: Products,
    roles: ['admin', 'manager', 'cashier'],
  },

  {
    path: '/viewProduct',
    name: 'View Product',
    element: ViewProduct,
    roles: ['admin', 'manager', 'cashier'],
  },

  {
    path: '/editProduct/:id',
    name: 'Edit Product',
    element: EditProduct,
    roles: ['admin', 'manager'],
  },

  {
    path: '/recycleBin',
    name: 'Product Recycle Bin',
    element: RecycleBin,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------

  {
    path: '/categories',
    name: 'Categories',
    element: Categories,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // BRANDS
  // ----------------------------------------------------------

  {
    path: '/brands',
    name: 'Brands',
    element: Brands,
    roles: ['admin', 'manager'],
  },
  // ----------------------------------------------------------
  // CUSTOMERS
  // ----------------------------------------------------------

  {
    path: '/customer',
    exact: true,
    name: 'Add Customer',
    element: Customer,
    roles: ['admin', 'manager'],
  },

  {
    path: '/viewCustomer',
    name: 'Customers',
    element: ViewCustomer,
    roles: ['admin', 'manager', 'cashier'],
  },

  {
    path: '/editCustomer/:id',
    name: 'Edit Customer',
    element: EditCustomer,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // SALES / POS
  // ----------------------------------------------------------

  // Enable when the new Onishakara POS component is ready.
  /*
  {
    path: '/pos',
    name: 'POS',
    element: Pos,
    roles: ['admin', 'manager', 'cashier'],
  },
  */

  {
    path: '/salesReport',
    name: 'Sales Report',
    element: SalesReport,
    roles: ['admin', 'manager', 'cashier'],
  },

  {
    path: '/report',
    name: 'Management Report',
    element: Reports,
    roles: ['admin', 'manager'],
  },

  {
    path: '/returns',
    name: 'Return Sales',
    element: ReturnSales,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // SUPPLIERS
  // ----------------------------------------------------------

  {
    path: '/suppliers',
    name: 'Suppliers',
    element: Suppliers,
    roles: ['admin', 'manager'],
  },

  {
    path: '/suppliers/add',
    name: 'Add Supplier',
    element: AddSupplier,
    roles: ['admin', 'manager'],
  },

  {
    path: '/suppliers/:id',
    name: 'Supplier Details',
    element: SupplierDetails,
    roles: ['admin', 'manager'],
  },

  {
    path: '/suppliers/edit/:id',
    name: 'Edit Supplier',
    element: AddSupplier,
    roles: ['admin', 'manager'],
  },

  {
    path: '/suppliers/recycle-bin',
    name: 'Supplier Recycle Bin',
    element: Suppliers,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // PURCHASES
  // ----------------------------------------------------------

  {
    path: '/purchases',
    name: 'Purchases',
    element: Purchases,
    roles: ['admin', 'manager'],
  },

  // AddPurchase route will be added after creating the form.

  {
    path: '/purchases/add',
    name: 'Add Purchase',
    element: AddPurchase,
    roles: ['admin', 'manager'],
  },

  {
    path: '/purchases/edit/:id',
    name: 'Edit Purchase',
    element: AddPurchase,
    roles: ['admin', 'manager'],
  },

  {
    path: '/purchases/:id',
    name: 'Purchase Details',
    element: PurchaseDetails,
    roles: ['admin', 'manager'],
  },

  {
    path: '/purchases/edit/:id',
    name: 'Edit Purchase',
    element: EditPurchase,
    roles: ['admin', 'manager'],
  },

  {
    path: '/stock',
    name: 'Stock',
    element: Stock,
    roles: ['admin', 'manager'],
  },

  {
    path: '/stock/history',
    name: 'Stock History',
    element: StockHistory,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // EXPENSES
  // ----------------------------------------------------------

  {
    path: '/expense',
    name: 'Add Expense',
    element: Expense,
    roles: ['admin', 'manager'],
  },

  {
    path: '/viewExpense',
    name: 'Expenses',
    element: ViewExpense,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // STAFF
  // ----------------------------------------------------------

  {
    path: '/staff',
    name: 'Add Staff',
    element: Staff,
    roles: ['admin', 'manager'],
  },

  {
    path: '/viewStaff',
    name: 'Staff',
    element: ViewStaff,
    roles: ['admin', 'manager'],
  },

  {
    path: '/editStaff/:id',
    name: 'Edit Staff',
    element: EditStaff,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

  {
    path: '/setting',
    name: 'Settings',
    element: Settings,
    roles: ['admin'],
  },

  {
    path: '/hardwareSetting',
    name: 'Hardware Settings',
    element: HardwareSettings,
    roles: ['admin', 'manager'],
  },

  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  {
    path: '/logout',
    name: 'Logout',
    element: Logout,
  },

  // ==========================================================
  // COREUI / DEVELOPMENT ROUTES
  // ==========================================================

  {
    path: '/charts',
    name: 'Charts',
    element: Charts,
  },

  {
    path: '/forms/layout',
    name: 'Layout',
    element: Layout,
  },

  {
    path: '/forms/range',
    name: 'Range',
    element: Range,
  },

  {
    path: '/forms/select',
    name: 'Select',
    element: Select,
  },

  {
    path: '/forms/validation',
    name: 'Validation',
    element: Validation,
  },

  // ----------------------------------------------------------
  // ICONS
  // ----------------------------------------------------------

  {
    path: '/icons/coreui',
    name: 'CoreUI Icons',
    element: CoreUIIcons,
  },

  {
    path: '/icons/flags',
    name: 'Flags',
    element: Flags,
  },

  // ----------------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------------

  {
    path: '/notifications/alerts',
    name: 'Alerts',
    element: Alerts,
  },

  {
    path: '/notifications/badges',
    name: 'Badges',
    element: Badges,
  },

  {
    path: '/notifications/modals',
    name: 'Modals',
    element: Modals,
  },

  {
    path: '/sales',
    name: 'Sales',
    element: Sales,
    roles: ['admin', 'manager', 'cashier'],
  },

  {
    path: '/sales/report',
    name: 'Sales Report',
    element: SalesReports,
    roles: ['admin', 'manager'],
  },

  {
    path: '/sales/:id',
    name: 'Sale Details',
    element: SaleDetails,
    roles: ['admin', 'manager', 'cashier'],
  },
]

export default routes
