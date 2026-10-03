/**
 * Onishakara Gold Fashion Store
 * Sidebar Navigation Configuration
 *
 * Fashion Retail / Inventory / Sales Management
 *
 * Navigation is aligned with the current application routes.
 */

import React from 'react'
import CIcon from '@coreui/icons-react'

import {
  cilSpeedometer,
  cilCart,
  cilStorage,
  cilPeople,
  cilUserPlus,
  cilBuilding,
  cilTags,
  cilList,
  cilChartPie,
  cilBarChart,
  cilCash,
  cilCreditCard,
  cilSettings,
  cilAppsSettings,
  cilAccountLogout,
  cilNotes,
  cilBasket,
  cilHistory,
  cilTransfer,
  cilWarning,
  cilUser,
} from '@coreui/icons'

import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  // ============================================================
  // DASHBOARD
  // ============================================================

  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  // ============================================================
  // POS
  // ============================================================

  {
    component: CNavItem,
    name: 'POS',
    to: '/pos',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
    badge: {
      color: 'success',
      text: 'SELL',
    },
  },

  // ============================================================
  // PRODUCTS & INVENTORY
  // ============================================================

  {
    component: CNavTitle,
    name: 'PRODUCTS & INVENTORY',
  },

  {
    component: CNavGroup,
    name: 'Products',
    to: '/products',
    icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Products',
        to: '/products',
      },

      {
        component: CNavItem,
        name: 'View Products',
        to: '/viewProduct',
      },

      {
        component: CNavItem,
        name: 'Categories',
        to: '/categories',
      },

      {
        component: CNavItem,
        name: 'Brands',
        to: '/brands',
      },

      {
        component: CNavItem,
        name: 'Recycle Bin',
        to: '/recycleBin',
      },
    ],
  },

  // ============================================================
  // STOCK
  // ============================================================

  {
    component: CNavGroup,
    name: 'Stock Management',
    to: '/stock',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Stock Overview',
        to: '/stock',
      },

      {
        component: CNavItem,
        name: 'Stock History',
        to: '/stock/history',
      },
    ],
  },

  // ============================================================
  // PURCHASES
  // ============================================================

  {
    component: CNavGroup,
    name: 'Purchases',
    to: '/purchases',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Purchases',
        to: '/purchases',
      },

      {
        component: CNavItem,
        name: 'New Purchase',
        to: '/purchases/add',
      },
    ],
  },

  // ============================================================
  // SUPPLIERS
  // ============================================================

  {
    component: CNavGroup,
    name: 'Suppliers',
    to: '/suppliers',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Suppliers',
        to: '/suppliers',
      },

      {
        component: CNavItem,
        name: 'Add Supplier',
        to: '/suppliers/add',
      },
    ],
  },

  // ============================================================
  // CUSTOMERS
  // ============================================================

  {
    component: CNavGroup,
    name: 'Customers',
    to: '/viewCustomer',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Customers',
        to: '/viewCustomer',
      },

      {
        component: CNavItem,
        name: 'Add Customer',
        to: '/customer',
      },
    ],
  },

  // ============================================================
  // SALES
  // ============================================================

  {
    component: CNavTitle,
    name: 'SALES & TRANSACTIONS',
  },

  {
    component: CNavGroup,
    name: 'Sales',
    to: '/sales',
    icon: <CIcon icon={cilCash} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Sales Transactions',
        to: '/sales',
      },

      {
        component: CNavItem,
        name: 'Sales Report',
        to: '/sales/report',
      },

      {
        component: CNavItem,
        name: 'Sales Details',
        to: '/sales/:id',
      },
    ],
  },

  // ============================================================
  // RETURNS
  // ============================================================

  {
    component: CNavItem,
    name: 'Return Sales',
    to: '/returns',
    icon: <CIcon icon={cilTransfer} customClassName="nav-icon" />,
  },

  // ============================================================
  // REPORTS
  // ============================================================

  {
    component: CNavTitle,
    name: 'REPORTS & FINANCE',
  },

  {
    component: CNavGroup,
    name: 'Reports',
    to: '/report',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Management Report',
        to: '/report',
      },

      {
        component: CNavItem,
        name: 'Sales Report',
        to: '/sales/report',
      },

      {
        component: CNavItem,
        name: 'Sales Summary',
        to: '/salesReport',
      },
    ],
  },

  // ============================================================
  // EXPENSES
  // ============================================================

  {
    component: CNavGroup,
    name: 'Expenses',
    to: '/viewExpense',
    icon: <CIcon icon={cilBarChart} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Expenses',
        to: '/viewExpense',
      },

      {
        component: CNavItem,
        name: 'Add Expense',
        to: '/expense',
      },
    ],
  },

  // ============================================================
  // STAFF
  // ============================================================

  {
    component: CNavTitle,
    name: 'STAFF MANAGEMENT',
  },

  {
    component: CNavGroup,
    name: 'Staff',
    to: '/viewStaff',
    icon: <CIcon icon={cilUserPlus} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Staff',
        to: '/viewStaff',
      },

      {
        component: CNavItem,
        name: 'Add Staff',
        to: '/staff',
      },
    ],
  },

  // ============================================================
  // SETTINGS
  // ============================================================

  {
    component: CNavTitle,
    name: 'SYSTEM',
  },

  {
    component: CNavGroup,
    name: 'Settings',
    to: '/setting',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'General Settings',
        to: '/setting',
      },

      {
        component: CNavItem,
        name: 'Hardware Settings',
        to: '/hardwareSetting',
      },
    ],
  },

  // ============================================================
  // LOGOUT
  // ============================================================

  {
    component: CNavItem,
    name: 'Sign Out',
    to: '/logout',
    icon: <CIcon icon={cilAccountLogout} customClassName="nav-icon" />,
  },
]

export default _nav
