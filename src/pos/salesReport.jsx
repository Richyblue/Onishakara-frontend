import React, { useCallback, useEffect, useMemo, useState } from 'react'

import axios from 'axios'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import {
  cilArrowBottom,
  cilCash,
  cilChevronLeft,
  cilChevronRight,
  cilCloudDownload,
  cilCreditCard,
  cilFilter,
  cilMoney,
  cilReload,
  cilSearch,
  cilTransfer,
} from '@coreui/icons'

import CIcon from '@coreui/icons-react'

import Swal from 'sweetalert2'

import * as XLSX from 'xlsx'

/**
 * ============================================================
 * API
 * ============================================================
 */

const API_ROOT = import.meta.env.VITE_BACKEND_URL

const API_URL = `${API_ROOT}api/v1`

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

const money = (value) => {
  const amount = Number(value || 0)

  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const number = (value) => {
  return Number(value || 0).toLocaleString('en-NG')
}

const formatDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getPaymentLabel = (method) => {
  switch (String(method || '').toLowerCase()) {
    case 'cash':
      return 'Cash'

    case 'transfer':
      return 'Transfer'

    case 'pos':
      return 'POS'

    case 'mixed':
      return 'Mixed'

    default:
      return method || 'Unknown'
  }
}

const getPaymentBadge = (method) => {
  switch (String(method || '').toLowerCase()) {
    case 'cash':
      return 'success'

    case 'transfer':
      return 'info'

    case 'pos':
      return 'primary'

    case 'mixed':
      return 'warning'

    default:
      return 'secondary'
  }
}

/**
 * ============================================================
 * KPI CARD
 * ============================================================
 */

const StatCard = ({ title, value, subtitle, icon, iconClass = '' }) => {
  return (
    <CCard className="border-0 shadow-sm h-100">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-body-secondary small fw-semibold mb-2">{title}</div>

            <div className="fs-4 fw-bold">{value}</div>

            {subtitle && <div className="small text-body-secondary mt-1">{subtitle}</div>}
          </div>

          <div className={`rounded-3 p-3 bg-body-tertiary ${iconClass}`}>
            <CIcon icon={icon} size="lg" />
          </div>
        </div>
      </CCardBody>
    </CCard>
  )
}

/**
 * ============================================================
 * SALE DETAILS MODAL
 * ============================================================
 */

const SaleDetailsModal = ({ sale, visible, onClose }) => {
  if (!visible || !sale) {
    return null
  }

  const items = Array.isArray(sale.items) ? sale.items : []

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{
        background: 'rgba(0,0,0,.55)',
        zIndex: 1055,
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-bold mb-1">Sale Details</h5>

              <div className="small text-body-secondary">{sale.receiptNumber || '-'}</div>
            </div>

            <CButton color="light" onClick={onClose}>
              ×
            </CButton>
          </div>

          <div className="modal-body">
            <CRow className="g-3 mb-4">
              <CCol md={4}>
                <div className="small text-body-secondary">Customer</div>

                <div className="fw-semibold">{sale.customer || 'Walk-in Customer'}</div>
              </CCol>

              <CCol md={4}>
                <div className="small text-body-secondary">Payment</div>

                <CBadge color={getPaymentBadge(sale.paymentMethod)}>
                  {getPaymentLabel(sale.paymentMethod)}
                </CBadge>
              </CCol>

              <CCol md={4}>
                <div className="small text-body-secondary">Date</div>

                <div className="fw-semibold">
                  {formatDate(sale.createdAt)} {formatTime(sale.createdAt)}
                </div>
              </CCol>
            </CRow>

            <div className="table-responsive">
              <CTable hover align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Product</CTableHeaderCell>

                    <CTableHeaderCell>Variant</CTableHeaderCell>

                    <CTableHeaderCell className="text-center">Qty</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Price</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Total</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {items.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center py-4 text-body-secondary">
                        No sale items found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    items.map((item, index) => {
                      const variant = item.variant || null

                      const variantText = [variant?.size, variant?.color]
                        .filter(Boolean)
                        .join(' / ')

                      return (
                        <CTableRow key={item.id || index}>
                          <CTableDataCell>
                            <div className="fw-semibold">{item.productName || 'Product'}</div>

                            {variant?.sku && (
                              <div className="small text-body-secondary">SKU: {variant.sku}</div>
                            )}
                          </CTableDataCell>

                          <CTableDataCell>{variantText || '-'}</CTableDataCell>

                          <CTableDataCell className="text-center">
                            {number(item.quantity)}
                          </CTableDataCell>

                          <CTableDataCell className="text-end">{money(item.price)}</CTableDataCell>

                          <CTableDataCell className="text-end fw-semibold">
                            {money(item.subtotal)}
                          </CTableDataCell>
                        </CTableRow>
                      )
                    })
                  )}
                </CTableBody>
              </CTable>
            </div>

            <div className="border-top pt-3 mt-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-body-secondary">Subtotal</span>

                <strong>{money(sale.subtotal)}</strong>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-body-secondary">Discount</span>

                <strong>{money(sale.discount)}</strong>
              </div>

              <div className="d-flex justify-content-between fs-5">
                <span className="fw-bold">Total</span>

                <strong>{money(sale.amount)}</strong>
              </div>
            </div>

            {sale.note && (
              <div className="mt-3 p-3 bg-body-tertiary rounded">
                <div className="small text-body-secondary mb-1">Note</div>

                <div>{sale.note}</div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <CButton color="secondary" variant="outline" onClick={onClose}>
              Close
            </CButton>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

const MySales = () => {
  const [loading, setLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState('')

  const [report, setReport] = useState({
    grossSales: 0,
    totalReturns: 0,
    netSales: 0,
    totalTransactions: 0,
    customersServed: 0,
    itemsSold: 0,
    totalReturnedItems: 0,
    averageSale: 0,
    cashSales: 0,
    transferSales: 0,
    posSales: 0,
    mixedSales: 0,
    sales: [],
  })

  const [period, setPeriod] = useState('today')

  const [startDate, setStartDate] = useState('')

  const [endDate, setEndDate] = useState('')

  const [search, setSearch] = useState('')

  const [paymentFilter, setPaymentFilter] = useState('all')

  const [selectedSale, setSelectedSale] = useState(null)

  const [showSaleDetails, setShowSaleDetails] = useState(false)

  const [page, setPage] = useState(1)

  const rowsPerPage = 10

  /**
   * ========================================================
   * TOKEN
   * ========================================================
   */

  const getToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('accessToken') || ''
  }

  /**
   * ========================================================
   * FETCH REPORT
   * ========================================================
   */

  const fetchReport = useCallback(
    async (isRefresh = false) => {
      try {
        setError('')

        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        const token = getToken()

        if (!token) {
          throw new Error('Authentication token not found.')
        }

        const params = {}

        /**
         * Custom dates take priority.
         */
        if (startDate || endDate) {
          if (startDate) {
            params.startDate = startDate
          }

          if (endDate) {
            params.endDate = endDate
          }
        } else {
          params.period = period
        }

        const response = await axios.get(`${API_URL}/report/my-sales`, {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        })

        const data = response?.data || {}

        if (!data.success) {
          throw new Error(data.message || 'Unable to load sales report.')
        }

        setReport({
          grossSales: Number(data.grossSales || 0),

          totalReturns: Number(data.totalReturns || 0),

          netSales: Number(data.netSales || 0),

          totalTransactions: Number(data.totalTransactions || 0),

          customersServed: Number(data.customersServed || 0),

          itemsSold: Number(data.itemsSold || 0),

          totalReturnedItems: Number(data.totalReturnedItems || 0),

          averageSale: Number(data.averageSale || 0),

          cashSales: Number(data.cashSales || 0),

          transferSales: Number(data.transferSales || 0),

          posSales: Number(data.posSales || 0),

          mixedSales: Number(data.mixedSales || 0),

          sales: Array.isArray(data.sales) ? data.sales : [],
        })

        setPage(1)
      } catch (err) {
        console.error('MY SALES REPORT ERROR:', err)

        setError(err?.response?.data?.message || err?.message || 'Failed to load cashier sales.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [period, startDate, endDate],
  )

  /**
   * ========================================================
   * INITIAL LOAD / FILTER CHANGE
   * ========================================================
   */

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  /**
   * ========================================================
   * FILTERED SALES
   * ========================================================
   */

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase()

    return (report.sales || []).filter((sale) => {
      const matchesSearch =
        !term ||
        String(sale.receiptNumber || '')
          .toLowerCase()
          .includes(term) ||
        String(sale.customer || '')
          .toLowerCase()
          .includes(term) ||
        String(sale.cashier || '')
          .toLowerCase()
          .includes(term) ||
        (sale.items || []).some((item) =>
          String(item.productName || '')
            .toLowerCase()
            .includes(term),
        )

      const matchesPayment =
        paymentFilter === 'all' || String(sale.paymentMethod || '').toLowerCase() === paymentFilter

      return matchesSearch && matchesPayment
    })
  }, [report.sales, search, paymentFilter])

  /**
   * ========================================================
   * PAGINATION
   * ========================================================
   */

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / rowsPerPage))

  const paginatedSales = filteredSales.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  /**
   * ========================================================
   * DISPLAY SUMMARY
   * ========================================================
   *
   * These values follow the current filtered table.
   */

  const visibleSummary = useMemo(() => {
    const sales = filteredSales || []

    let gross = 0
    let returns = 0
    let items = 0

    sales.forEach((sale) => {
      gross += Number(sale.amount || 0)

      items += (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    })

    /**
     * Returns are already supplied as an
     * aggregate by the backend.
     *
     * When filtering the table by search/payment,
     * we do not invent a return allocation.
     *
     * Therefore only use backend return total
     * when no client-side filtering is active.
     */

    const hasClientFilter = Boolean(search.trim()) || paymentFilter !== 'all'

    if (!hasClientFilter) {
      returns = Number(report.totalReturns || 0)
    }

    const net = gross - returns

    return {
      gross,
      returns,
      net,
      transactions: sales.length,
      items,
    }
  }, [filteredSales, report.totalReturns, search, paymentFilter])

  /**
   * ========================================================
   * EXPORT EXCEL
   * ========================================================
   */

  const exportExcel = () => {
    if (!filteredSales.length) {
      Swal.fire({
        icon: 'info',
        title: 'No sales',
        text: 'There are no sales available to export.',
      })

      return
    }

    const rows = []

    filteredSales.forEach((sale) => {
      const items = sale.items || []

      if (!items.length) {
        rows.push({
          Receipt: sale.receiptNumber,

          Customer: sale.customer,

          Product: '',

          Variant: '',

          Quantity: '',

          Price: '',

          Total: sale.amount,

          Payment: getPaymentLabel(sale.paymentMethod),

          Date: sale.createdAt ? new Date(sale.createdAt).toLocaleString('en-NG') : '',
        })

        return
      }

      items.forEach((item) => {
        const variant = item.variant || {}

        rows.push({
          Receipt: sale.receiptNumber,

          Customer: sale.customer,

          Product: item.productName,

          Variant: [variant.size, variant.color].filter(Boolean).join(' / '),

          Quantity: item.quantity,

          Price: item.price,

          Total: item.subtotal,

          Payment: getPaymentLabel(sale.paymentMethod),

          Date: sale.createdAt ? new Date(sale.createdAt).toLocaleString('en-NG') : '',
        })
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'My Sales')

    const filename = `my-sales-${new Date().toISOString().slice(0, 10)}.xlsx`

    XLSX.writeFile(workbook, filename)
  }

  /**
   * ========================================================
   * RESET FILTERS
   * ========================================================
   */

  const clearFilters = () => {
    setPeriod('today')
    setStartDate('')
    setEndDate('')
    setSearch('')
    setPaymentFilter('all')
    setPage(1)
  }

  /**
   * ========================================================
   * OPEN SALE
   * ========================================================
   */

  const openSale = (sale) => {
    setSelectedSale(sale)
    setShowSaleDetails(true)
  }

  /**
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          minHeight: '60vh',
        }}
      >
        <div className="text-center">
          <CSpinner />

          <div className="mt-3 text-body-secondary">Loading your sales...</div>
        </div>
      </div>
    )
  }

  /**
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (
    <div className="container-fluid py-3">
      {/* =================================================
              HEADER
          ================================================= */}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">My Sales</h3>

          <div className="text-body-secondary">View and track your product sales</div>
        </div>

        <div className="d-flex gap-2">
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => fetchReport(true)}
            disabled={refreshing}
          >
            <CIcon icon={cilReload} className="me-1" />

            {refreshing ? 'Refreshing...' : 'Refresh'}
          </CButton>

          <CButton color="dark" onClick={exportExcel}>
            <CIcon icon={cilCloudDownload} className="me-1" />
            Export
          </CButton>
        </div>
      </div>

      {/* =================================================
              ERROR
          ================================================= */}

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {/* =================================================
              KPI CARDS
          ================================================= */}

      <CRow className="g-3 mb-4">
        <CCol sm={6} xl={3}>
          <StatCard
            title="Gross Sales"
            value={money(visibleSummary.gross)}
            subtitle={`${visibleSummary.transactions} transactions`}
            icon={cilMoney}
          />
        </CCol>

        <CCol sm={6} xl={3}>
          <StatCard
            title="Returns"
            value={money(visibleSummary.returns)}
            subtitle={`${number(report.totalReturnedItems)} items returned`}
            icon={cilArrowBottom}
          />
        </CCol>

        <CCol sm={6} xl={3}>
          <StatCard
            title="Net Sales"
            value={money(visibleSummary.net)}
            subtitle="After returns"
            icon={cilCash}
          />
        </CCol>

        <CCol sm={6} xl={3}>
          <StatCard
            title="Average Sale"
            value={money(report.averageSale)}
            subtitle={`${number(visibleSummary.items)} items sold`}
            icon={cilCreditCard}
          />
        </CCol>
      </CRow>

      {/* =================================================
              PAYMENT SUMMARY
          ================================================= */}

      <CRow className="g-3 mb-4">
        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="small text-body-secondary mb-1">Cash</div>

              <div className="fw-bold fs-5">{money(report.cashSales)}</div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="small text-body-secondary mb-1">Transfer</div>

              <div className="fw-bold fs-5">{money(report.transferSales)}</div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="small text-body-secondary mb-1">POS</div>

              <div className="fw-bold fs-5">{money(report.posSales)}</div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="small text-body-secondary mb-1">Mixed</div>

              <div className="fw-bold fs-5">{money(report.mixedSales)}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =================================================
              FILTERS
          ================================================= */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-transparent">
          <div className="d-flex align-items-center gap-2 fw-semibold">
            <CIcon icon={cilFilter} />
            Filters
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow className="g-3">
            <CCol md={3}>
              <label className="form-label fw-semibold">Period</label>

              <CFormSelect
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value)

                  setStartDate('')
                  setEndDate('')
                  setPage(1)
                }}
              >
                <option value="today">Today</option>

                <option value="yesterday">Yesterday</option>

                <option value="this_week">This Week</option>

                <option value="this_month">This Month</option>

                <option value="all">All Time</option>
              </CFormSelect>
            </CCol>

            <CCol md={2}>
              <label className="form-label fw-semibold">Start Date</label>

              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)

                  setPeriod('')
                  setPage(1)
                }}
              />
            </CCol>

            <CCol md={2}>
              <label className="form-label fw-semibold">End Date</label>

              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)

                  setPeriod('')
                  setPage(1)
                }}
              />
            </CCol>

            <CCol md={3}>
              <label className="form-label fw-semibold">Search</label>

              <div className="position-relative">
                <CFormInput
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)

                    setPage(1)
                  }}
                  placeholder="Receipt, customer or product..."
                  className="ps-5"
                />

                <CIcon
                  icon={cilSearch}
                  className="position-absolute"
                  style={{
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: 0.55,
                  }}
                />
              </div>
            </CCol>

            <CCol md={2}>
              <label className="form-label fw-semibold">Payment</label>

              <CFormSelect
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value)

                  setPage(1)
                }}
              >
                <option value="all">All Payments</option>

                <option value="cash">Cash</option>

                <option value="transfer">Transfer</option>

                <option value="pos">POS</option>

                <option value="mixed">Mixed</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <div className="d-flex justify-content-end mt-3">
            <CButton color="secondary" variant="outline" onClick={clearFilters}>
              Clear Filters
            </CButton>
          </div>
        </CCardBody>
      </CCard>

      {/* =================================================
              SALES TABLE
          ================================================= */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-transparent">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <div className="fw-bold">Sales History</div>

              <div className="small text-body-secondary">
                {number(filteredSales.length)} sales found
              </div>
            </div>

            <CBadge color="dark">
              Page {page} of {totalPages}
            </CBadge>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <div className="table-responsive">
            <CTable hover align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Receipt</CTableHeaderCell>

                  <CTableHeaderCell>Customer</CTableHeaderCell>

                  <CTableHeaderCell>Products</CTableHeaderCell>

                  <CTableHeaderCell>Payment</CTableHeaderCell>

                  <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>

                  <CTableHeaderCell>Date</CTableHeaderCell>

                  <CTableHeaderCell className="text-center">Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {paginatedSales.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center py-5">
                      <div className="text-body-secondary">No sales found.</div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  paginatedSales.map((sale, index) => {
                    const items = sale.items || []

                    const productNames = items.map((item) => item.productName).filter(Boolean)

                    const uniqueProducts = [...new Set(productNames)]

                    return (
                      <CTableRow key={sale.id || index}>
                        <CTableDataCell>
                          <div className="fw-semibold">{sale.receiptNumber || '-'}</div>

                          {sale.localSaleId && (
                            <div className="small text-body-secondary">{sale.localSaleId}</div>
                          )}
                        </CTableDataCell>

                        <CTableDataCell>
                          <div className="fw-semibold">{sale.customer || 'Walk-in Customer'}</div>
                        </CTableDataCell>

                        <CTableDataCell>
                          {uniqueProducts.length > 0 ? (
                            <>
                              <div className="fw-semibold">{uniqueProducts[0]}</div>

                              {uniqueProducts.length > 1 && (
                                <div className="small text-body-secondary">
                                  +{uniqueProducts.length - 1} more
                                </div>
                              )}

                              <div className="small text-body-secondary">
                                {number(
                                  items.reduce(
                                    (total, item) => total + Number(item.quantity || 0),
                                    0,
                                  ),
                                )}{' '}
                                item(s)
                              </div>
                            </>
                          ) : (
                            '-'
                          )}
                        </CTableDataCell>

                        <CTableDataCell>
                          <CBadge color={getPaymentBadge(sale.paymentMethod)}>
                            {getPaymentLabel(sale.paymentMethod)}
                          </CBadge>
                        </CTableDataCell>

                        <CTableDataCell className="text-end">
                          <div className="fw-bold">{money(sale.amount)}</div>

                          {Number(sale.discount || 0) > 0 && (
                            <div className="small text-body-secondary">
                              Discount: {money(sale.discount)}
                            </div>
                          )}
                        </CTableDataCell>

                        <CTableDataCell>
                          <div>{formatDate(sale.createdAt)}</div>

                          <div className="small text-body-secondary">
                            {formatTime(sale.createdAt)}
                          </div>
                        </CTableDataCell>

                        <CTableDataCell className="text-center">
                          <CButton
                            size="sm"
                            color="dark"
                            variant="outline"
                            onClick={() => openSale(sale)}
                          >
                            View
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
          </div>

          {/* =================================================
                      PAGINATION
                  ================================================= */}

          {filteredSales.length > rowsPerPage && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <div className="small text-body-secondary">
                Showing {Math.min((page - 1) * rowsPerPage + 1, filteredSales.length)} -{' '}
                {Math.min(page * rowsPerPage, filteredSales.length)} of {filteredSales.length}
              </div>

              <div className="d-flex gap-2">
                <CButton
                  size="sm"
                  color="secondary"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <CIcon icon={cilChevronLeft} />
                </CButton>

                <CButton
                  size="sm"
                  color="secondary"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <CIcon icon={cilChevronRight} />
                </CButton>
              </div>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* =================================================
              SALE DETAILS
          ================================================= */}

      <SaleDetailsModal
        sale={selectedSale}
        visible={showSaleDetails}
        onClose={() => {
          setShowSaleDetails(false)

          setSelectedSale(null)
        }}
      />
    </div>
  )
}

export default MySales
