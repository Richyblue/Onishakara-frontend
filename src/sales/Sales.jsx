import React, { useCallback, useEffect, useMemo, useState } from 'react'

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

import CIcon from '@coreui/icons-react'
import {
  cilChevronLeft,
  cilChevronRight,
  cilCloudDownload,
  cilEye,
  cilReload,
  cilSearch,
} from '@coreui/icons'

import { useNavigate } from 'react-router-dom'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

const formatMoney = (value) => {
  return `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatDate = (value) => {
  if (!value) return '-'

  return new Date(value).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success'

    case 'refunded':
      return 'warning'

    case 'voided':
      return 'danger'

    default:
      return 'secondary'
  }
}

const getPaymentColor = (method) => {
  switch (method) {
    case 'cash':
      return 'success'

    case 'pos':
      return 'primary'

    case 'transfer':
      return 'info'

    case 'mixed':
      return 'warning'

    default:
      return 'secondary'
  }
}

const Sales = () => {
  const navigate = useNavigate()

  const [sales, setSales] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [search, setSearch] = useState('')

  const [paymentMethod, setPaymentMethod] = useState('')

  const [status, setStatus] = useState('')

  const [startDate, setStartDate] = useState('')

  const [endDate, setEndDate] = useState('')

  const [page, setPage] = useState(1)

  const [limit] = useState(20)

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  })

  // ==========================================================
  // LOAD SALES
  // ==========================================================

  const loadSales = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true)
        }

        setError('')

        const params = new URLSearchParams()

        params.set('page', page)
        params.set('limit', limit)

        if (search.trim()) {
          params.set('search', search.trim())
        }

        if (paymentMethod) {
          params.set('paymentMethod', paymentMethod)
        }

        if (status) {
          params.set('status', status)
        }

        if (startDate) {
          params.set('startDate', startDate)
        }

        if (endDate) {
          params.set('endDate', endDate)
        }

        const response = await fetch(`${API_URL}/sales?${params.toString()}`, {
          headers: getAuthHeaders(),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load sales.')
        }

        setSales(Array.isArray(data.data) ? data.data : [])

        setPagination(
          data.pagination || {
            total: 0,
            page,
            limit,
            totalPages: 1,
          },
        )
      } catch (err) {
        console.error('LOAD SALES ERROR:', err)

        setError(err.message || 'Unable to load sales.')
      } finally {
        setLoading(false)
      }
    },
    [page, limit, search, paymentMethod, status, startDate, endDate],
  )

  useEffect(() => {
    loadSales()
  }, [loadSales])

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearch('')
    setPaymentMethod('')
    setStatus('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  const exportCSV = () => {
    if (!sales.length) return

    const headers = [
      'Receipt Number',
      'Date',
      'Customer',
      'Items',
      'Subtotal',
      'Discount',
      'Total',
      'Payment Method',
      'Status',
    ]

    const rows = sales.map((sale) => [
      sale.receiptNumber || '',
      formatDate(sale.createdAt),
      sale.Customer?.fullname || 'Walk-in Customer',
      sale.SaleItems?.length || 0,
      Number(sale.subtotal || 0).toFixed(2),
      Number(sale.discount || 0).toFixed(2),
      Number(sale.totalAmount || 0).toFixed(2),
      sale.paymentMethod || '',
      sale.status || '',
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '')

            return `"${value.replace(/"/g, '""')}"`
          })
          .join(','),
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    link.download = `onishakara-sales-${new Date().toISOString().slice(0, 10)}.csv`

    link.click()

    URL.revokeObjectURL(url)
  }

  // ==========================================================
  // PAGE TOTAL
  // ==========================================================

  const pageTotal = useMemo(() => {
    return sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0)
  }, [sales])

  return (
    <div className="onishakara-sales-page">
      {/* =====================================================
            HEADER
        ====================================================== */}

      <div className="sales-page-header">
        <div>
          <div className="sales-eyebrow">ONISHAKARA GOLD</div>

          <h2>Sales History</h2>

          <p>View, search and manage completed fashion retail transactions.</p>
        </div>

        <div className="sales-header-actions">
          <CButton className="gold-outline-button" onClick={() => loadSales()}>
            <CIcon icon={cilReload} className="me-2" />
            Refresh
          </CButton>

          <CButton className="gold-button" onClick={exportCSV} disabled={!sales.length}>
            <CIcon icon={cilCloudDownload} className="me-2" />
            Export CSV
          </CButton>
        </div>
      </div>

      {/* =====================================================
            ERROR
        ====================================================== */}

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {/* =====================================================
            SUMMARY
        ====================================================== */}

      <CRow className="g-3 mb-4">
        <CCol xs={12} md={4}>
          <CCard className="sales-summary-card">
            <CCardBody>
              <span>Transactions</span>

              <strong>{pagination.total}</strong>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} md={4}>
          <CCard className="sales-summary-card">
            <CCardBody>
              <span>Current Page Sales</span>

              <strong>{formatMoney(pageTotal)}</strong>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} md={4}>
          <CCard className="sales-summary-card">
            <CCardBody>
              <span>Current Page</span>

              <strong>
                {pagination.page} / {pagination.totalPages || 1}
              </strong>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
            FILTERS
        ====================================================== */}

      <CCard className="sales-card mb-4">
        <CCardHeader>
          <div className="sales-section-title">Search & Filters</div>
        </CCardHeader>

        <CCardBody>
          <CRow className="g-3">
            <CCol xs={12} lg={4}>
              <label>Search</label>

              <div className="sales-search-wrapper">
                <CIcon icon={cilSearch} className="sales-search-icon" />

                <CFormInput
                  placeholder="Receipt, local ID, stand tag or card number..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </CCol>

            <CCol xs={12} sm={6} lg={2}>
              <label>Payment</label>

              <CFormSelect
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Payments</option>

                <option value="cash">Cash</option>

                <option value="pos">POS</option>

                <option value="transfer">Transfer</option>

                <option value="mixed">Mixed</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} sm={6} lg={2}>
              <label>Status</label>

              <CFormSelect
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Statuses</option>

                <option value="completed">Completed</option>

                <option value="refunded">Refunded</option>

                <option value="voided">Voided</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} sm={6} lg={2}>
              <label>From</label>

              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(1)
                }}
              />
            </CCol>

            <CCol xs={12} sm={6} lg={2}>
              <label>To</label>

              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(1)
                }}
              />
            </CCol>
          </CRow>

          <div className="sales-filter-footer">
            <span>
              Showing <strong>{sales.length}</strong> of <strong>{pagination.total}</strong>{' '}
              transactions
            </span>

            <CButton color="light" onClick={resetFilters}>
              Clear Filters
            </CButton>
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
            TABLE
        ====================================================== */}

      <CCard className="sales-card">
        <CCardHeader>
          <div className="sales-section-title">Transaction History</div>
        </CCardHeader>

        <CCardBody className="p-0">
          {loading ? (
            <div className="sales-loading">
              <CSpinner />
              <span>Loading sales...</span>
            </div>
          ) : sales.length === 0 ? (
            <div className="sales-empty">
              <div className="sales-empty-icon">₦</div>

              <h4>No sales found</h4>

              <p>No transactions match your current filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <CTable hover align="middle" className="sales-table mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Receipt</CTableHeaderCell>

                    <CTableHeaderCell>Date</CTableHeaderCell>

                    <CTableHeaderCell>Customer</CTableHeaderCell>

                    <CTableHeaderCell>Items</CTableHeaderCell>

                    <CTableHeaderCell>Payment</CTableHeaderCell>

                    <CTableHeaderCell>Total</CTableHeaderCell>

                    <CTableHeaderCell>Status</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Action</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {sales.map((sale) => (
                    <CTableRow key={sale.id}>
                      <CTableDataCell>
                        <strong className="receipt-number">{sale.receiptNumber || '-'}</strong>

                        {sale.localSaleId && <small>Offline synced</small>}
                      </CTableDataCell>

                      <CTableDataCell>{formatDate(sale.createdAt)}</CTableDataCell>

                      <CTableDataCell>
                        <strong>{sale.Customer?.fullname || 'Walk-in Customer'}</strong>

                        {sale.Customer?.phone && <small>{sale.Customer.phone}</small>}
                      </CTableDataCell>

                      <CTableDataCell>{sale.SaleItems?.length || 0}</CTableDataCell>

                      <CTableDataCell>
                        <CBadge color={getPaymentColor(sale.paymentMethod)}>
                          {String(sale.paymentMethod || '').toUpperCase()}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>
                        <strong>{formatMoney(sale.totalAmount)}</strong>
                      </CTableDataCell>

                      <CTableDataCell>
                        <CBadge color={getStatusColor(sale.status)}>
                          {String(sale.status || '').toUpperCase()}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell className="text-end">
                        <CButton
                          size="sm"
                          className="view-sale-button"
                          onClick={() => navigate(`/sales/${sale.id}`)}
                        >
                          <CIcon icon={cilEye} className="me-1" />
                          View
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>

        {/* ===================================================
              PAGINATION
          ==================================================== */}

        {!loading && pagination.totalPages > 1 && (
          <div className="sales-pagination">
            <CButton
              size="sm"
              color="light"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              <CIcon icon={cilChevronLeft} />
            </CButton>

            <span>
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
            </span>

            <CButton
              size="sm"
              color="light"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => Math.min(current + 1, pagination.totalPages))}
            >
              <CIcon icon={cilChevronRight} />
            </CButton>
          </div>
        )}
      </CCard>

      {/* =====================================================
            STYLES
        ====================================================== */}

      <style>{`
          .onishakara-sales-page {
            padding: 24px;
            min-height: 100%;
            background:
              linear-gradient(
                180deg,
                #0b0b0b 0%,
                #111111 100%
              );
            color: #f4f4f4;
          }
  
          .sales-page-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 25px;
          }
  
          .sales-eyebrow {
            color: #d4af37;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 3px;
            margin-bottom: 5px;
          }
  
          .sales-page-header h2 {
            margin: 0;
            font-weight: 800;
            letter-spacing: -.5px;
          }
  
          .sales-page-header p {
            color: #969696;
            margin: 7px 0 0;
          }
  
          .sales-header-actions {
            display: flex;
            gap: 10px;
          }
  
          .gold-button {
            background: #d4af37 !important;
            border-color: #d4af37 !important;
            color: #111 !important;
            font-weight: 700;
          }
  
          .gold-outline-button {
            border: 1px solid #d4af37 !important;
            color: #d4af37 !important;
            background: transparent !important;
          }
  
          .sales-card,
          .sales-summary-card {
            background: #171717 !important;
            border: 1px solid #2d2d2d !important;
            color: #fff !important;
            box-shadow: 0 12px 35px rgba(0,0,0,.18);
          }
  
          .sales-summary-card {
            border-left: 3px solid #d4af37 !important;
          }
  
          .sales-summary-card span {
            display: block;
            color: #888;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
  
          .sales-summary-card strong {
            display: block;
            font-size: 24px;
            color: #d4af37;
          }
  
          .sales-card .card-header {
            background: #1c1c1c;
            border-bottom: 1px solid #2c2c2c;
            color: #d4af37;
          }
  
          .sales-section-title {
            font-weight: 800;
            letter-spacing: .3px;
          }
  
          .sales-card label {
            display: block;
            color: #aaa;
            font-size: 12px;
            margin-bottom: 6px;
            font-weight: 600;
          }
  
          .sales-card .form-control,
          .sales-card .form-select {
            background: #0f0f0f;
            border-color: #343434;
            color: #fff;
          }
  
          .sales-card .form-control:focus,
          .sales-card .form-select:focus {
            border-color: #d4af37;
            box-shadow: 0 0 0 .15rem rgba(212,175,55,.12);
          }
  
          .sales-search-wrapper {
            position: relative;
          }
  
          .sales-search-wrapper .form-control {
            padding-left: 38px;
          }
  
          .sales-search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #777;
            z-index: 2;
          }
  
          .sales-filter-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-top: 18px;
            padding-top: 15px;
            border-top: 1px solid #292929;
            color: #888;
            font-size: 13px;
          }
  
          .sales-table {
            color: #eee;
          }
  
          .sales-table thead th {
            background: #101010;
            color: #888;
            border-bottom: 1px solid #303030;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .7px;
            white-space: nowrap;
          }
  
          .sales-table tbody td {
            border-color: #292929;
            color: #ddd;
          }
  
          .sales-table tbody tr:hover {
            background: rgba(212,175,55,.035);
          }
  
          .receipt-number {
            display: block;
            color: #d4af37;
          }
  
          .sales-table small {
            display: block;
            color: #777;
            margin-top: 3px;
          }
  
          .view-sale-button {
            background: transparent !important;
            border: 1px solid #454545 !important;
            color: #d4af37 !important;
          }
  
          .sales-loading,
          .sales-empty {
            min-height: 280px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            color: #777;
          }
  
          .sales-empty-icon {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #d4af37;
            color: #d4af37;
            font-size: 22px;
          }
  
          .sales-empty h4 {
            color: #ddd;
            margin: 0;
          }
  
          .sales-empty p {
            margin: 0;
          }
  
          .sales-pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 18px;
            padding: 18px;
            border-top: 1px solid #2a2a2a;
            color: #999;
          }
  
          @media (max-width: 768px) {
            .onishakara-sales-page {
              padding: 15px;
            }
  
            .sales-page-header {
              align-items: flex-start;
              flex-direction: column;
            }
  
            .sales-header-actions {
              width: 100%;
            }
  
            .sales-header-actions button {
              flex: 1;
            }
  
            .sales-filter-footer {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}</style>
    </div>
  )
}

export default Sales
