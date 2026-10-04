import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CProgress,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import { CChart, CChartDoughnut, CChartLine } from '@coreui/react-chartjs'

import {
  cilArrowBottom,
  cilArrowTop,
  cilCash,
  cilCart,
  cilChart,
  cilCheckCircle,
  cilPeople,
  cilReload,
  cilStorage,
  cilWarning,
  cilXCircle,
} from '@coreui/icons'

import CIcon from '@coreui/icons-react'

import './Dashboard.css'

// ============================================================
// API
// ============================================================

const API_ROOT = import.meta.env.VITE_BACKEND_URL
const API_URL = `${API_ROOT}`

// ============================================================
// COMPONENT
// ============================================================

const Dashboard = () => {
  // ==========================================================
  // STATE
  // ==========================================================

  const [dashboard, setDashboard] = useState({
    // TODAY
    todaySales: 0,
    todayProfit: 0,
    todayTransactions: 0,
    todayCustomers: 0,

    // MONTH
    monthSales: 0,
    monthProfit: 0,
    monthExpenses: 0,
    monthNetProfit: 0,

    // SALES
    grossSales: 0,
    totalReturns: 0,
    netSales: 0,
    averageSale: 0,

    // PROFITABILITY
    productRevenue: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    netProfit: 0,

    // PAYMENT
    cashSales: 0,
    transferSales: 0,
    posSales: 0,
    mixedSales: 0,

    // BUSINESS
    totalProducts: 0,
    totalCustomers: 0,
    totalStaff: 0,
    inventoryValue: 0,

    // ALERTS
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalAlerts: 0,

    // TABLES
    topProducts: [],
    topCashiers: [],

    // CHART
    sevenDaysSales: [],
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // ==========================================================
  // HELPERS
  // ==========================================================

  const money = (value) => {
    const number = Number(value || 0)

    return `₦${number.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  const number = (value) => {
    return Number(value || 0).toLocaleString('en-NG')
  }

  const getToken = () => {
    return localStorage.getItem('token')
  }

  const safeNumber = (value) => {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : 0
  }

  // ==========================================================
  // DASHBOARD API
  // ==========================================================

  const getDashboard = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true)
      }

      const token = getToken()

      if (!token) {
        throw new Error('Authentication token not found.')
      }

      const response = await axios.get(`${API_URL}api/v1/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      })

      const data = response?.data?.dashboard || {}

      setDashboard({
        todaySales: safeNumber(data.todaySales),
        todayProfit: safeNumber(data.todayProfit),
        todayTransactions: safeNumber(data.todayTransactions),
        todayCustomers: safeNumber(data.todayCustomers),

        monthSales: safeNumber(data.monthSales),
        monthProfit: safeNumber(data.monthProfit),
        monthExpenses: safeNumber(data.monthExpenses),
        monthNetProfit: safeNumber(data.monthNetProfit ?? data.monthProfit - data.monthExpenses),

        grossSales: safeNumber(data.grossSales),
        totalReturns: safeNumber(data.totalReturns),
        netSales: safeNumber(data.netSales),
        averageSale: safeNumber(data.averageSale),

        productRevenue: safeNumber(data.productRevenue),
        costOfGoodsSold: safeNumber(data.costOfGoodsSold),
        grossProfit: safeNumber(data.grossProfit),
        netProfit: safeNumber(data.netProfit),

        cashSales: safeNumber(data.cashSales),
        transferSales: safeNumber(data.transferSales),
        posSales: safeNumber(data.posSales),
        mixedSales: safeNumber(data.mixedSales),

        totalProducts: safeNumber(data.totalProducts),
        totalCustomers: safeNumber(data.totalCustomers),
        totalStaff: safeNumber(data.totalStaff),
        inventoryValue: safeNumber(data.inventoryValue),

        lowStockProducts: safeNumber(data.lowStockProducts),
        outOfStockProducts: safeNumber(data.outOfStockProducts),
        totalAlerts: safeNumber(
          data.totalAlerts ??
            safeNumber(data.lowStockProducts) + safeNumber(data.outOfStockProducts),
        ),

        topProducts: Array.isArray(data.topProducts) ? data.topProducts : [],

        topCashiers: Array.isArray(data.topCashiers) ? data.topCashiers : [],

        sevenDaysSales: Array.isArray(data.sevenDaysSales) ? data.sevenDaysSales : [],
      })

      return true
    } catch (error) {
      console.error('Dashboard Error:', error)

      if (showLoader) {
        Swal.fire({
          icon: 'error',
          title: 'Unable to Load Dashboard',
          text:
            error?.response?.data?.message ||
            error?.message ||
            'There was a problem loading the dashboard.',
          confirmButtonColor: '#b8860b',
        })
      }

      return false
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    getDashboard(true)
  }, [])

  // ==========================================================
  // REFRESH
  // ==========================================================

  const refreshDashboard = async () => {
    try {
      setRefreshing(true)

      const success = await getDashboard(false)

      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Dashboard Updated',
          text: 'The latest business figures have been loaded.',
          timer: 1400,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      }
    } finally {
      setRefreshing(false)
    }
  }

  // ==========================================================
  // CHART DATA
  // ==========================================================

  const salesLabels = useMemo(() => {
    return dashboard.sevenDaysSales.map((item) => {
      return item?.date || ''
    })
  }, [dashboard.sevenDaysSales])

  const salesValues = useMemo(() => {
    return dashboard.sevenDaysSales.map((item) => {
      return safeNumber(item?.sales)
    })
  }, [dashboard.sevenDaysSales])

  // ==========================================================
  // PAYMENT DATA
  // ==========================================================

  const paymentTotal = useMemo(() => {
    return dashboard.cashSales + dashboard.transferSales + dashboard.posSales + dashboard.mixedSales
  }, [dashboard.cashSales, dashboard.transferSales, dashboard.posSales, dashboard.mixedSales])

  const paymentChartData = {
    labels: ['Cash', 'Transfer', 'POS', 'Mixed'],
    datasets: [
      {
        data: [
          dashboard.cashSales,
          dashboard.transferSales,
          dashboard.posSales,
          dashboard.mixedSales,
        ],
      },
    ],
  }

  // ==========================================================
  // PAYMENT PERCENTAGE
  // ==========================================================

  const paymentPercentage = (value) => {
    if (!paymentTotal) {
      return 0
    }

    return Math.round((Number(value || 0) / paymentTotal) * 100)
  }

  // ==========================================================
  // TOP PRODUCT HELPERS
  // ==========================================================

  const getProductName = (item) => {
    return (
      item?.Product?.name ||
      item?.product?.name ||
      item?.productName ||
      item?.name ||
      'Unknown Product'
    )
  }

  const getProductQuantity = (item) => {
    return safeNumber(
      item?.totalSold ?? item?.quantitySold ?? item?.unitsSold ?? item?.quantity ?? 0,
    )
  }

  const getProductRevenue = (item) => {
    return safeNumber(item?.revenue ?? item?.totalRevenue ?? item?.sales ?? item?.totalSales ?? 0)
  }

  // ==========================================================
  // TOP CASHIER HELPERS
  // ==========================================================

  const getCashierName = (item) => {
    return (
      item?.User?.fullname ||
      item?.user?.fullname ||
      item?.RecordedBy?.fullname ||
      item?.cashierName ||
      item?.fullname ||
      'Unknown Cashier'
    )
  }

  const getCashierSales = (item) => {
    return safeNumber(item?.totalSales ?? item?.sales ?? item?.revenue ?? 0)
  }

  const getCashierTransactions = (item) => {
    return safeNumber(item?.transactions ?? item?.totalTransactions ?? item?.transactionCount ?? 0)
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{
          minHeight: '70vh',
          gap: '15px',
        }}
      >
        <CSpinner
          size="sm"
          style={{
            width: '3rem',
            height: '3rem',
            color: '#b8860b',
          }}
        />

        <div
          style={{
            fontSize: '14px',
            color: '#777',
            fontWeight: 500,
          }}
        >
          Loading Onishakara dashboard...
        </div>
      </div>
    )
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      style={{
        background: '#f7f7f7',
        minHeight: '100vh',
        paddingBottom: '40px',
      }}
    >
      <CContainer fluid className="px-3 px-lg-4 pt-4">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#b8860b',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Onishakara Gold Fashion Store
            </div>

            <h2
              style={{
                margin: 0,
                fontWeight: 700,
                color: '#171717',
              }}
            >
              Business Dashboard
            </h2>

            <div
              style={{
                color: '#777',
                fontSize: '14px',
                marginTop: '5px',
              }}
            >
              Monitor your sales, inventory and business performance.
            </div>
          </div>

          <CButton
            onClick={refreshDashboard}
            disabled={refreshing}
            style={{
              background: '#171717',
              borderColor: '#171717',
              color: '#fff',
              minWidth: '130px',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            {refreshing ? (
              <>
                <CSpinner component="span" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              <>
                <CIcon icon={cilReload} className="me-2" />
                Refresh
              </>
            )}
          </CButton>
        </div>

        {/* ==================================================
            INVENTORY ALERTS
        ================================================== */}

        {dashboard.totalAlerts > 0 && (
          <CRow className="g-3 mb-4">
            {dashboard.lowStockProducts > 0 && (
              <CCol xs={12} md={6}>
                <CAlert
                  color="warning"
                  className="mb-0 d-flex align-items-center"
                  style={{
                    borderRadius: '10px',
                    border: 'none',
                  }}
                >
                  <CIcon icon={cilWarning} size="lg" className="me-3" />

                  <div>
                    <strong>{number(dashboard.lowStockProducts)} products</strong> are below their
                    reorder level.
                  </div>
                </CAlert>
              </CCol>
            )}

            {dashboard.outOfStockProducts > 0 && (
              <CCol xs={12} md={6}>
                <CAlert
                  color="danger"
                  className="mb-0 d-flex align-items-center"
                  style={{
                    borderRadius: '10px',
                    border: 'none',
                  }}
                >
                  <CIcon icon={cilXCircle} size="lg" className="me-3" />

                  <div>
                    <strong>{number(dashboard.outOfStockProducts)} products</strong> are currently
                    out of stock.
                  </div>
                </CAlert>
              </CCol>
            )}
          </CRow>
        )}

        {/* ==================================================
            TODAY OVERVIEW
        ================================================== */}

        <CRow className="g-3 mb-4">
          {/* SALES */}

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="dashboard-label">Today's Sales</div>

                    <div className="dashboard-value">{money(dashboard.todaySales)}</div>
                  </div>

                  <div className="dashboard-icon gold">
                    <CIcon icon={cilCash} />
                  </div>
                </div>

                <div className="dashboard-caption">Completed sales today</div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* PROFIT */}

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="dashboard-label">Today's Profit</div>

                    <div className="dashboard-value">{money(dashboard.todayProfit)}</div>
                  </div>

                  <div className="dashboard-icon green">
                    <CIcon icon={cilChart} />
                  </div>
                </div>

                <div className="dashboard-caption">Profit after today's expenses</div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* TRANSACTIONS */}

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="dashboard-label">Transactions</div>

                    <div className="dashboard-value">{number(dashboard.todayTransactions)}</div>
                  </div>

                  <div className="dashboard-icon dark">
                    <CIcon icon={cilCart} />
                  </div>
                </div>

                <div className="dashboard-caption">Sales transactions today</div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* CUSTOMERS */}

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="dashboard-label">Customers Served</div>

                    <div className="dashboard-value">{number(dashboard.todayCustomers)}</div>
                  </div>

                  <div className="dashboard-icon blue">
                    <CIcon icon={cilPeople} />
                  </div>
                </div>

                <div className="dashboard-caption">Customers served today</div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* ==================================================
            7 DAY SALES + MONTHLY PERFORMANCE
        ================================================== */}

        <CRow className="g-3 mb-4">
          {/* 7 DAY CHART */}

          <CCol xs={12} lg={8}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardHeader className="bg-white border-0 pt-4 px-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="dashboard-section-title">Sales Performance</h5>

                    <div className="dashboard-section-subtitle">Sales for the last 7 days</div>
                  </div>

                  <CBadge
                    style={{
                      background: '#f5ead0',
                      color: '#8a6500',
                      padding: '8px 12px',
                    }}
                  >
                    7 Days
                  </CBadge>
                </div>
              </CCardHeader>

              <CCardBody className="px-4 pb-4">
                <div style={{ height: '310px' }}>
                  <CChartLine
                    data={{
                      labels: salesLabels.length > 0 ? salesLabels : ['No data'],
                      datasets: [
                        {
                          label: 'Sales',
                          data: salesValues.length > 0 ? salesValues : [0],
                          fill: true,
                          tension: 0.35,
                          borderWidth: 3,
                          pointRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              return ` Sales: ${money(context.raw)}`
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => {
                              return `₦${Number(value).toLocaleString('en-NG')}`
                            },
                          },
                          grid: {
                            drawBorder: false,
                          },
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* MONTHLY */}

          <CCol xs={12} lg={4}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardHeader className="bg-white border-0 pt-4 px-4">
                <h5 className="dashboard-section-title">This Month</h5>

                <div className="dashboard-section-subtitle">Current month performance</div>
              </CCardHeader>

              <CCardBody className="px-4">
                <div className="monthly-stat">
                  <span>Sales</span>
                  <strong>{money(dashboard.monthSales)}</strong>
                </div>

                <div className="monthly-stat">
                  <span>Gross Profit</span>
                  <strong>{money(dashboard.monthProfit)}</strong>
                </div>

                <div className="monthly-stat">
                  <span>Expenses</span>
                  <strong>{money(dashboard.monthExpenses)}</strong>
                </div>

                <div
                  className="monthly-stat"
                  style={{
                    borderBottom: 'none',
                  }}
                >
                  <span>Net Profit</span>
                  <strong
                    style={{
                      color: dashboard.monthNetProfit >= 0 ? '#198754' : '#dc3545',
                    }}
                  >
                    {money(dashboard.monthNetProfit)}
                  </strong>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* ==================================================
            SALES PERFORMANCE
        ================================================== */}

        <CRow className="g-3 mb-4">
          <CCol xs={12} sm={6} xl={3}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="dashboard-label">Gross Sales</div>

                <div className="dashboard-value">{money(dashboard.grossSales)}</div>

                <div className="dashboard-caption">Total completed sales</div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="dashboard-label">Returns</div>

                <div className="dashboard-value" style={{ color: '#dc3545' }}>
                  {money(dashboard.totalReturns)}
                </div>

                <div className="dashboard-caption">Approved customer returns</div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="dashboard-label">Net Sales</div>

                <div className="dashboard-value" style={{ color: '#198754' }}>
                  {money(dashboard.netSales)}
                </div>

                <div className="dashboard-caption">Sales after returns</div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="dashboard-label">Average Sale</div>

                <div className="dashboard-value">{money(dashboard.averageSale)}</div>

                <div className="dashboard-caption">Average transaction value</div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* ==================================================
            PROFITABILITY
        ================================================== */}

        <CRow className="g-3 mb-4">
          <CCol xs={12} lg={7}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardHeader className="bg-white border-0 pt-4 px-4">
                <h5 className="dashboard-section-title">Profitability</h5>

                <div className="dashboard-section-subtitle">Revenue and cost breakdown</div>
              </CCardHeader>

              <CCardBody className="px-4">
                <div className="profit-row">
                  <div>
                    <span>Product Revenue</span>
                    <small>Revenue generated from fashion products</small>
                  </div>

                  <strong>{money(dashboard.productRevenue)}</strong>
                </div>

                <div className="profit-row">
                  <div>
                    <span>Cost of Goods Sold</span>
                    <small>Cost of products sold</small>
                  </div>

                  <strong style={{ color: '#dc3545' }}>{money(dashboard.costOfGoodsSold)}</strong>
                </div>

                <div className="profit-row">
                  <div>
                    <span>Gross Profit</span>
                    <small>Revenue less product cost</small>
                  </div>

                  <strong style={{ color: '#198754' }}>{money(dashboard.grossProfit)}</strong>
                </div>

                <div className="profit-row" style={{ borderBottom: 'none' }}>
                  <div>
                    <span>Net Profit</span>
                    <small>Profit after business expenses</small>
                  </div>

                  <strong
                    style={{
                      color: dashboard.netProfit >= 0 ? '#198754' : '#dc3545',
                    }}
                  >
                    {money(dashboard.netProfit)}
                  </strong>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* PAYMENT */}

          <CCol xs={12} lg={5}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardHeader className="bg-white border-0 pt-4 px-4">
                <h5 className="dashboard-section-title">Payment Breakdown</h5>

                <div className="dashboard-section-subtitle">Completed sales by payment method</div>
              </CCardHeader>

              <CCardBody className="px-4">
                <CRow className="align-items-center">
                  <CCol xs={6}>
                    <div style={{ height: '190px' }}>
                      <CChartDoughnut
                        data={paymentChartData}
                        options={{
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          cutout: '70%',
                        }}
                      />
                    </div>
                  </CCol>

                  <CCol xs={6}>
                    <div className="payment-item">
                      <span className="payment-dot cash" />
                      <div>
                        <strong>Cash</strong>
                        <small>{paymentPercentage(dashboard.cashSales)}%</small>
                      </div>
                    </div>

                    <div className="payment-item">
                      <span className="payment-dot transfer" />
                      <div>
                        <strong>Transfer</strong>
                        <small>{paymentPercentage(dashboard.transferSales)}%</small>
                      </div>
                    </div>

                    <div className="payment-item">
                      <span className="payment-dot pos" />
                      <div>
                        <strong>POS</strong>
                        <small>{paymentPercentage(dashboard.posSales)}%</small>
                      </div>
                    </div>

                    <div className="payment-item">
                      <span className="payment-dot mixed" />
                      <div>
                        <strong>Mixed</strong>
                        <small>{paymentPercentage(dashboard.mixedSales)}%</small>
                      </div>
                    </div>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* ==================================================
            BUSINESS OVERVIEW
        ================================================== */}

        <CRow className="g-3 mb-4">
          <CCol xs={12} sm={6} xl={3}>
            <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="dashboard-label">Products</div>

                    <div className="dashboard-value">{number(dashboard.totalProducts)}</div>
                  </div>

                  <div className="dashboard-icon gold">
                    <CIcon icon={cilStorage} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="dashboard-label">Customers</div>

                    <div className="dashboard-value">{number(dashboard.totalCustomers)}</div>
                  </div>

                  <div className="dashboard-icon blue">
                    <CIcon icon={cilPeople} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="dashboard-label">Staff</div>

                    <div className="dashboard-value">{number(dashboard.totalStaff)}</div>
                  </div>

                  <div className="dashboard-icon dark">
                    <CIcon icon={cilPeople} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={12} sm={6} xl={3}>
            <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="dashboard-label">Inventory Value</div>

                    <div className="dashboard-value">{money(dashboard.inventoryValue)}</div>
                  </div>

                  <div className="dashboard-icon green">
                    <CIcon icon={cilStorage} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* ==================================================
            INVENTORY STATUS
        ================================================== */}

        <CRow className="g-3 mb-4">
          <CCol xs={12} lg={4}>
            <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="dashboard-label">Low Stock</div>

                    <h3 className="mb-0 mt-1">{number(dashboard.lowStockProducts)}</h3>
                  </div>

                  <CIcon icon={cilWarning} size="xl" style={{ color: '#d39e00' }} />
                </div>

                <CProgress
                  value={
                    dashboard.totalProducts > 0
                      ? Math.min(100, (dashboard.lowStockProducts / dashboard.totalProducts) * 100)
                      : 0
                  }
                  color="warning"
                  height={7}
                />

                <small className="text-muted d-block mt-2">Products requiring attention</small>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={12} lg={4}>
            <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="dashboard-label">Out of Stock</div>

                    <h3 className="mb-0 mt-1">{number(dashboard.outOfStockProducts)}</h3>
                  </div>

                  <CIcon icon={cilXCircle} size="xl" style={{ color: '#dc3545' }} />
                </div>

                <CProgress
                  value={
                    dashboard.totalProducts > 0
                      ? Math.min(
                          100,
                          (dashboard.outOfStockProducts / dashboard.totalProducts) * 100,
                        )
                      : 0
                  }
                  color="danger"
                  height={7}
                />

                <small className="text-muted d-block mt-2">Products unavailable for sale</small>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs={12} lg={4}>
            <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <CCardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="dashboard-label">Total Alerts</div>

                    <h3 className="mb-0 mt-1">{number(dashboard.totalAlerts)}</h3>
                  </div>

                  <CIcon icon={cilWarning} size="xl" style={{ color: '#b8860b' }} />
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    color: '#777',
                  }}
                >
                  Inventory issues requiring attention.
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* ==================================================
            TOP PRODUCTS
        ================================================== */}

        <CRow className="g-3 mb-4">
          <CCol xs={12} lg={7}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardHeader className="bg-white border-0 pt-4 px-4">
                <div>
                  <h5 className="dashboard-section-title">Top-Selling Products</h5>

                  <div className="dashboard-section-subtitle">
                    Products generating the highest sales volume
                  </div>
                </div>
              </CCardHeader>

              <CCardBody className="px-4">
                {dashboard.topProducts.length === 0 ? (
                  <div className="dashboard-empty">No product sales data available yet.</div>
                ) : (
                  <CTable responsive hover align="middle" className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>#</CTableHeaderCell>

                        <CTableHeaderCell>Product</CTableHeaderCell>

                        <CTableHeaderCell className="text-center">Units Sold</CTableHeaderCell>

                        <CTableHeaderCell className="text-end">Revenue</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {dashboard.topProducts.slice(0, 5).map((item, index) => (
                        <CTableRow key={item?.ProductId || index}>
                          <CTableDataCell>
                            <CBadge
                              style={{
                                background: index === 0 ? '#b8860b' : '#eee',
                                color: index === 0 ? '#fff' : '#555',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {index + 1}
                            </CBadge>
                          </CTableDataCell>

                          <CTableDataCell>
                            <strong>{getProductName(item)}</strong>
                          </CTableDataCell>

                          <CTableDataCell className="text-center">
                            {number(getProductQuantity(item))}
                          </CTableDataCell>

                          <CTableDataCell className="text-end">
                            <strong>{money(getProductRevenue(item))}</strong>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                )}
              </CCardBody>
            </CCard>
          </CCol>

          {/* ==================================================
              TOP CASHIERS
          ================================================== */}

          <CCol xs={12} lg={5}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardHeader className="bg-white border-0 pt-4 px-4">
                <h5 className="dashboard-section-title">Top Cashiers</h5>

                <div className="dashboard-section-subtitle">Staff ranked by completed sales</div>
              </CCardHeader>

              <CCardBody className="px-4">
                {dashboard.topCashiers.length === 0 ? (
                  <div className="dashboard-empty">No cashier sales data available yet.</div>
                ) : (
                  dashboard.topCashiers.slice(0, 5).map((item, index) => (
                    <div key={item?.UserId || item?.StaffId || index} className="cashier-row">
                      <div className="cashier-rank">{index + 1}</div>

                      <div className="cashier-avatar">
                        {getCashierName(item).charAt(0).toUpperCase()}
                      </div>

                      <div className="cashier-info">
                        <strong>{getCashierName(item)}</strong>

                        <small>{number(getCashierTransactions(item))} transactions</small>
                      </div>

                      <div className="cashier-sales">{money(getCashierSales(item))}</div>
                    </div>
                  ))
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* ==================================================
            FOOTER STATUS
        ================================================== */}

        <CCard className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <CCardBody>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div className="d-flex align-items-center">
                <CIcon
                  icon={cilCheckCircle}
                  style={{
                    color: '#198754',
                    marginRight: '10px',
                  }}
                />

                <div>
                  <strong>Business system operational</strong>

                  <div
                    style={{
                      color: '#777',
                      fontSize: '13px',
                    }}
                  >
                    Onishakara Gold Fashion Store dashboard is up to date.
                  </div>
                </div>
              </div>

              <div
                style={{
                  color: '#777',
                  fontSize: '13px',
                }}
              >
                Inventory alerts:{' '}
                <strong style={{ color: '#171717' }}>{number(dashboard.totalAlerts)}</strong>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CContainer>
    </div>
  )
}

export default Dashboard
