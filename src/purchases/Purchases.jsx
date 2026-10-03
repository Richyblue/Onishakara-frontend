import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
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
  cilArrowRight,
  cilBuilding,
  cilCalendar,
  cilCheckCircle,
  cilCloudDownload,
  cilEye,
  cilFilter,
  cilPencil,
  cilPlus,
  cilReload,
  cilSearch,
  cilTrash,
  cilXCircle,
} from '@coreui/icons'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('authToken') ||
  ''

const getErrorMessage = (error) => {
  const data = error?.response?.data

  if (!data) {
    return error?.message || 'Unable to complete request.'
  }

  if (typeof data === 'string') {
    return data
  }

  if (data.message) {
    return data.message
  }

  if (data.error) {
    return typeof data.error === 'string'
      ? data.error
      : data.error?.message || 'Unable to complete request.'
  }

  return 'Unable to complete request.'
}

const formatCurrency = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatDate = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getSupplierName = (purchase) => {
  return (
    purchase?.Supplier?.companyName ||
    purchase?.Supplier?.name ||
    purchase?.supplier?.companyName ||
    purchase?.supplier?.name ||
    'Unknown Supplier'
  )
}

const getSupplierId = (purchase) =>
  purchase?.supplierId || purchase?.Supplier?.id || purchase?.supplier?.id || ''

const paymentBadge = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'paid':
      return (
        <CBadge color="success" shape="rounded-pill">
          Paid
        </CBadge>
      )

    case 'partial':
      return (
        <CBadge color="warning" shape="rounded-pill">
          Partial
        </CBadge>
      )

    case 'unpaid':
    default:
      return (
        <CBadge color="danger" shape="rounded-pill">
          Unpaid
        </CBadge>
      )
  }
}

const purchaseStatusBadge = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'received':
      return (
        <CBadge color="success" shape="rounded-pill">
          Received
        </CBadge>
      )

    case 'draft':
      return (
        <CBadge color="secondary" shape="rounded-pill">
          Draft
        </CBadge>
      )

    case 'cancelled':
      return (
        <CBadge color="danger" shape="rounded-pill">
          Cancelled
        </CBadge>
      )

    default:
      return (
        <CBadge color="secondary" shape="rounded-pill">
          {status || 'Unknown'}
        </CBadge>
      )
  }
}

const Purchases = () => {
  const navigate = useNavigate()

  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [purchaseStatus, setPurchaseStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [page, setPage] = useState(1)
  const [limit] = useState(15)

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  })

  const [processingId, setProcessingId] = useState(null)

  const headers = useMemo(() => {
    const token = getToken()

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}
  }, [])

  const fetchSuppliers = useCallback(async () => {
    setLoadingSuppliers(true)

    try {
      const response = await axios.get(`${API_URL}/suppliers`, {
        headers,
        params: {
          limit: 500,
          status: 'active',
        },
      })

      const data = response?.data

      const list = data?.suppliers || data?.data || data?.rows || []

      setSuppliers(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Fetch suppliers error:', err)
    } finally {
      setLoadingSuppliers(false)
    }
  }, [headers])

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {
        page,
        limit,
      }

      if (search.trim()) {
        params.search = search.trim()
      }

      if (supplierId) {
        params.supplierId = supplierId
      }

      if (paymentStatus) {
        params.paymentStatus = paymentStatus
      }

      if (purchaseStatus) {
        params.status = purchaseStatus
      }

      if (startDate) {
        params.startDate = startDate
      }

      if (endDate) {
        params.endDate = endDate
      }

      const response = await axios.get(`${API_URL}/purchases`, {
        headers,
        params,
      })

      const data = response?.data

      const list = data?.purchases || data?.data || data?.rows || []

      setPurchases(Array.isArray(list) ? list : [])

      if (data?.pagination) {
        setPagination({
          total: Number(data.pagination.total || 0),
          page: Number(data.pagination.page || page),
          limit: Number(data.pagination.limit || limit),
          totalPages: Math.max(1, Number(data.pagination.totalPages || 1)),
        })
      } else {
        const total = Array.isArray(list) ? list.length : 0

        setPagination({
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        })
      }
    } catch (err) {
      console.error('Fetch purchases error:', err)

      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [headers, page, limit, search, supplierId, paymentStatus, purchaseStatus, startDate, endDate])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  const handleSearch = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const handleSupplierChange = (event) => {
    setSupplierId(event.target.value)
    setPage(1)
  }

  const handlePaymentStatusChange = (event) => {
    setPaymentStatus(event.target.value)
    setPage(1)
  }

  const handlePurchaseStatusChange = (event) => {
    setPurchaseStatus(event.target.value)
    setPage(1)
  }

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value)
    setPage(1)
  }

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSupplierId('')
    setPaymentStatus('')
    setPurchaseStatus('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const hasFilters =
    Boolean(search) ||
    Boolean(supplierId) ||
    Boolean(paymentStatus) ||
    Boolean(purchaseStatus) ||
    Boolean(startDate) ||
    Boolean(endDate)

  const handleReceive = async (purchase) => {
    if (String(purchase?.status).toLowerCase() !== 'draft') {
      return
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Receive Purchase?',
      html: `
        <div style="font-size:14px;line-height:1.6">
          Purchase <strong>${purchase.purchaseNumber || 'N/A'}</strong>
          will be marked as received and its quantities will be added
          to inventory.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Receive Purchase',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#c9a227',
      cancelButtonColor: '#333',
    })

    if (!result.isConfirmed) {
      return
    }

    setProcessingId(purchase.id)

    try {
      await axios.put(
        `${API_URL}/purchases/${purchase.id}/receive`,
        {},
        {
          headers,
        },
      )

      await Swal.fire({
        icon: 'success',
        title: 'Purchase Received',
        text: 'Stock has been added to inventory successfully.',
        confirmButtonColor: '#c9a227',
      })

      fetchPurchases()
    } catch (err) {
      console.error('Receive purchase error:', err)

      await Swal.fire({
        icon: 'error',
        title: 'Unable to Receive Purchase',
        text: getErrorMessage(err),
        confirmButtonColor: '#c9a227',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleCancelPurchase = async (purchase) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Cancel Purchase?',
      html: `
        <div style="font-size:14px;line-height:1.6">
          You are about to cancel
          <strong>${purchase.purchaseNumber || 'this purchase'}</strong>.
          ${
            String(purchase.status).toLowerCase() === 'received'
              ? '<br/><br/><strong>Because this purchase has already been received, its stock quantities will also be reversed.</strong>'
              : ''
          }
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel Purchase',
      cancelButtonText: 'Keep Purchase',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#333',
    })

    if (!result.isConfirmed) {
      return
    }

    setProcessingId(purchase.id)

    try {
      await axios.delete(`${API_URL}/purchases/${purchase.id}`, {
        headers,
      })

      await Swal.fire({
        icon: 'success',
        title: 'Purchase Cancelled',
        text: 'The purchase has been cancelled successfully.',
        confirmButtonColor: '#c9a227',
      })

      fetchPurchases()
    } catch (err) {
      console.error('Cancel purchase error:', err)

      await Swal.fire({
        icon: 'error',
        title: 'Unable to Cancel Purchase',
        text: getErrorMessage(err),
        confirmButtonColor: '#c9a227',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const exportCSV = () => {
    if (!purchases.length) {
      Swal.fire({
        icon: 'info',
        title: 'Nothing to Export',
        text: 'There are no purchases on the current page.',
        confirmButtonColor: '#c9a227',
      })

      return
    }

    const headersRow = [
      'Purchase Number',
      'Date',
      'Supplier',
      'Invoice Number',
      'Subtotal',
      'Discount',
      'Tax',
      'Shipping',
      'Other Charges',
      'Total',
      'Amount Paid',
      'Balance Due',
      'Payment Status',
      'Purchase Status',
    ]

    const rows = purchases.map((purchase) => [
      purchase.purchaseNumber || '',
      formatDate(purchase.purchaseDate),
      getSupplierName(purchase),
      purchase.invoiceNumber || '',
      Number(purchase.subtotal || 0).toFixed(2),
      Number(purchase.discount || 0).toFixed(2),
      Number(purchase.tax || 0).toFixed(2),
      Number(purchase.shippingCost || 0).toFixed(2),
      Number(purchase.otherCharges || 0).toFixed(2),
      Number(purchase.totalAmount || 0).toFixed(2),
      Number(purchase.amountPaid || 0).toFixed(2),
      Number(purchase.balanceDue || 0).toFixed(2),
      purchase.paymentStatus || '',
      purchase.status || '',
    ])

    const csv = [headersRow, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? '')
            return `"${text.replace(/"/g, '""')}"`
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
    link.download = `onishakara-purchases-${new Date().toISOString().slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  const totals = useMemo(() => {
    return purchases.reduce(
      (acc, purchase) => {
        acc.total += Number(purchase.totalAmount || 0)

        acc.paid += Number(purchase.amountPaid || 0)

        acc.balance += Number(purchase.balanceDue || 0)

        if (String(purchase.paymentStatus).toLowerCase() === 'paid') {
          acc.paidCount += 1
        }

        if (String(purchase.paymentStatus).toLowerCase() === 'partial') {
          acc.partialCount += 1
        }

        if (String(purchase.paymentStatus).toLowerCase() === 'unpaid') {
          acc.unpaidCount += 1
        }

        return acc
      },
      {
        total: 0,
        paid: 0,
        balance: 0,
        paidCount: 0,
        partialCount: 0,
        unpaidCount: 0,
      },
    )
  }, [purchases])

  return (
    <CContainer fluid className="py-4 px-3 px-lg-4">
      <style>
        {`
          .onishakara-purchases {
            --gold: #c9a227;
            --gold-dark: #a8830f;
            --gold-soft: #f8f2dc;
            --black: #111111;
            --charcoal: #1d1d1d;
            --muted: #777;
            --border: #e8e3d5;
          }

          .purchase-title {
            font-weight: 800;
            color: var(--black);
            letter-spacing: -0.5px;
          }

          .purchase-subtitle {
            color: var(--muted);
            font-size: 14px;
          }

          .purchase-card {
            border: 1px solid var(--border);
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 8px 28px rgba(0,0,0,.045);
            overflow: hidden;
          }

          .purchase-stat {
            min-height: 128px;
            padding: 20px;
            position: relative;
          }

          .purchase-stat-label {
            color: #777;
            font-size: 12px;
            font-weight: 650;
            text-transform: uppercase;
            letter-spacing: .45px;
          }

          .purchase-stat-value {
            font-size: 23px;
            font-weight: 800;
            color: #111;
            margin-top: 6px;
          }

          .purchase-stat-note {
            font-size: 12px;
            color: #8a8a8a;
            margin-top: 3px;
          }

          .purchase-stat-icon {
            width: 42px;
            height: 42px;
            border-radius: 11px;
            background: var(--gold-soft);
            color: var(--gold-dark);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .purchase-toolbar {
            padding: 18px;
            border-bottom: 1px solid var(--border);
            background: #fff;
          }

          .purchase-input {
            border-radius: 10px;
            border-color: #ded9cb;
            min-height: 42px;
          }

          .purchase-input:focus {
            border-color: var(--gold);
            box-shadow: 0 0 0 .18rem rgba(201,162,39,.13);
          }

          .purchase-table-wrapper {
            overflow-x: auto;
          }

          .purchase-table {
            margin-bottom: 0;
            min-width: 1120px;
          }

          .purchase-table thead th {
            background: #faf9f5;
            border-bottom: 1px solid var(--border);
            color: #555;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .45px;
            font-weight: 750;
            white-space: nowrap;
            padding: 14px 12px;
          }

          .purchase-table tbody td {
            vertical-align: middle;
            padding: 14px 12px;
            border-bottom-color: #f0ede5;
            font-size: 13px;
          }

          .purchase-table tbody tr:hover {
            background: #fdfcf8;
          }

          .purchase-number {
            font-weight: 800;
            color: #171717;
          }

          .purchase-supplier {
            font-weight: 650;
            color: #222;
          }

          .purchase-muted {
            color: #888;
            font-size: 12px;
          }

          .purchase-action {
            width: 34px;
            height: 34px;
            border-radius: 9px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 1px solid #e4dfd3;
            background: #fff;
            color: #555;
          }

          .purchase-action:hover {
            border-color: var(--gold);
            color: #111;
            background: var(--gold-soft);
          }

          .purchase-action-danger:hover {
            border-color: #dc3545;
            color: #dc3545;
            background: #fff5f5;
          }

          .purchase-pagination {
            border-top: 1px solid var(--border);
            padding: 15px 18px;
          }

          .purchase-page-button {
            min-width: 36px;
            height: 36px;
            border-radius: 9px;
            border: 1px solid #e2ddd0;
            background: #fff;
            color: #333;
            font-weight: 650;
            margin-right: 5px;
          }

          .purchase-page-button.active {
            background: var(--gold);
            border-color: var(--gold);
            color: #111;
          }

          .purchase-page-button:disabled {
            opacity: .45;
          }

          .btn-onishakara-gold {
            background: var(--gold);
            border-color: var(--gold);
            color: #111;
            font-weight: 750;
          }

          .btn-onishakara-gold:hover {
            background: var(--gold-dark);
            border-color: var(--gold-dark);
            color: #fff;
          }

          .btn-onishakara-dark {
            background: #111;
            border-color: #111;
            color: #fff;
            font-weight: 650;
          }

          .btn-onishakara-dark:hover {
            background: #292929;
            border-color: #292929;
            color: #fff;
          }

          .empty-purchase {
            padding: 70px 20px;
            text-align: center;
            color: #777;
          }

          .empty-purchase-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--gold-soft);
            color: var(--gold-dark);
          }

          @media(max-width: 767px) {
            .purchase-stat {
              min-height: 110px;
            }

            .purchase-stat-value {
              font-size: 19px;
            }
          }
        `}
      </style>

      <div className="onishakara-purchases">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="purchase-title mb-1">Purchases</h2>

            <div className="purchase-subtitle">
              Manage supplier purchases, stock receiving and outstanding balances.
            </div>
          </div>

          <div className="d-flex gap-2">
            <CButton className="btn-onishakara-dark" onClick={fetchPurchases} disabled={loading}>
              <CIcon icon={cilReload} className="me-2" />
              Refresh
            </CButton>

            <CButton className="btn-onishakara-gold" onClick={() => navigate('/purchases/add')}>
              <CIcon icon={cilPlus} className="me-2" />
              New Purchase
            </CButton>
          </div>
        </div>

        {/* Summary */}
        <CRow className="g-3 mb-4">
          <CCol sm={6} xl={3}>
            <CCard className="purchase-card">
              <CCardBody className="purchase-stat">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="purchase-stat-label">Current Page Purchases</div>

                    <div className="purchase-stat-value">{purchases.length}</div>

                    <div className="purchase-stat-note">{pagination.total} total records</div>
                  </div>

                  <div className="purchase-stat-icon">
                    <CIcon icon={cilBuilding} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol sm={6} xl={3}>
            <CCard className="purchase-card">
              <CCardBody className="purchase-stat">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="purchase-stat-label">Purchase Value</div>

                    <div className="purchase-stat-value">{formatCurrency(totals.total)}</div>

                    <div className="purchase-stat-note">Current page</div>
                  </div>

                  <div className="purchase-stat-icon">
                    <CIcon icon={cilCloudDownload} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol sm={6} xl={3}>
            <CCard className="purchase-card">
              <CCardBody className="purchase-stat">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="purchase-stat-label">Amount Paid</div>

                    <div className="purchase-stat-value">{formatCurrency(totals.paid)}</div>

                    <div className="purchase-stat-note">Paid purchases: {totals.paidCount}</div>
                  </div>

                  <div className="purchase-stat-icon">
                    <CIcon icon={cilCheckCircle} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol sm={6} xl={3}>
            <CCard className="purchase-card">
              <CCardBody className="purchase-stat">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="purchase-stat-label">Outstanding</div>

                    <div className="purchase-stat-value">{formatCurrency(totals.balance)}</div>

                    <div className="purchase-stat-note">
                      Partial: {totals.partialCount} · Unpaid: {totals.unpaidCount}
                    </div>
                  </div>

                  <div className="purchase-stat-icon">
                    <CIcon icon={cilXCircle} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* Error */}
        {error && (
          <CAlert color="danger" dismissible onClose={() => setError('')} className="mb-4">
            <strong>Unable to load purchases:</strong> {error}
          </CAlert>
        )}

        {/* Main Card */}
        <CCard className="purchase-card">
          {/* Toolbar */}
          <div className="purchase-toolbar">
            <CRow className="g-2 align-items-end">
              <CCol lg={3} md={6}>
                <label className="form-label small fw-semibold">Search</label>

                <div className="position-relative">
                  <CFormInput
                    className="purchase-input"
                    value={search}
                    onChange={handleSearch}
                    placeholder="Purchase or invoice number..."
                    style={{
                      paddingLeft: '39px',
                    }}
                  />

                  <CIcon
                    icon={cilSearch}
                    className="position-absolute"
                    style={{
                      left: '13px',
                      top: '13px',
                      color: '#999',
                    }}
                  />
                </div>
              </CCol>

              <CCol lg={2} md={6}>
                <label className="form-label small fw-semibold">Supplier</label>

                <CFormSelect
                  className="purchase-input"
                  value={supplierId}
                  onChange={handleSupplierChange}
                  disabled={loadingSuppliers}
                >
                  <option value="">All Suppliers</option>

                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.companyName || supplier.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol lg={2} md={6}>
                <label className="form-label small fw-semibold">Payment</label>

                <CFormSelect
                  className="purchase-input"
                  value={paymentStatus}
                  onChange={handlePaymentStatusChange}
                >
                  <option value="">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </CFormSelect>
              </CCol>

              <CCol lg={2} md={6}>
                <label className="form-label small fw-semibold">Purchase Status</label>

                <CFormSelect
                  className="purchase-input"
                  value={purchaseStatus}
                  onChange={handlePurchaseStatusChange}
                >
                  <option value="">All Statuses</option>
                  <option value="received">Received</option>
                  <option value="draft">Draft</option>
                  <option value="cancelled">Cancelled</option>
                </CFormSelect>
              </CCol>

              <CCol lg={3} md={6}>
                <label className="form-label small fw-semibold">Date Range</label>

                <div className="d-flex gap-2">
                  <CFormInput
                    type="date"
                    className="purchase-input"
                    value={startDate}
                    onChange={handleStartDateChange}
                  />

                  <CFormInput
                    type="date"
                    className="purchase-input"
                    value={endDate}
                    onChange={handleEndDateChange}
                  />
                </div>
              </CCol>

              <CCol xs={12}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
                  <div className="d-flex align-items-center gap-2">
                    <CIcon
                      icon={cilFilter}
                      style={{
                        color: '#c9a227',
                      }}
                    />

                    <span className="small" style={{ color: '#777' }}>
                      {hasFilters ? 'Filters are active' : 'Showing all purchases'}
                    </span>

                    {hasFilters && (
                      <CButton
                        color="light"
                        size="sm"
                        onClick={clearFilters}
                        style={{
                          border: '1px solid #e1dccf',
                        }}
                      >
                        Clear Filters
                      </CButton>
                    )}
                  </div>

                  <CButton
                    color="light"
                    size="sm"
                    onClick={exportCSV}
                    disabled={!purchases.length}
                    style={{
                      border: '1px solid #e1dccf',
                    }}
                  >
                    <CIcon icon={cilCloudDownload} className="me-1" />
                    Export CSV
                  </CButton>
                </div>
              </CCol>
            </CRow>
          </div>

          {/* Table */}
          <div className="purchase-table-wrapper">
            <CTable hover responsive={false} className="purchase-table">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Purchase</CTableHeaderCell>

                  <CTableHeaderCell>Date</CTableHeaderCell>

                  <CTableHeaderCell>Supplier</CTableHeaderCell>

                  <CTableHeaderCell>Total</CTableHeaderCell>

                  <CTableHeaderCell>Paid</CTableHeaderCell>

                  <CTableHeaderCell>Balance</CTableHeaderCell>

                  <CTableHeaderCell>Payment</CTableHeaderCell>

                  <CTableHeaderCell>Status</CTableHeaderCell>

                  <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {loading ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center py-5">
                      <CSpinner
                        style={{
                          color: '#c9a227',
                        }}
                      />

                      <div className="small text-medium-emphasis mt-2">Loading purchases...</div>
                    </CTableDataCell>
                  </CTableRow>
                ) : purchases.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9}>
                      <div className="empty-purchase">
                        <div className="empty-purchase-icon">
                          <CIcon icon={cilCloudDownload} size="xl" />
                        </div>

                        <h5
                          className="mb-2"
                          style={{
                            fontWeight: 750,
                            color: '#222',
                          }}
                        >
                          No Purchases Found
                        </h5>

                        <p className="mb-3">
                          {hasFilters
                            ? 'No purchase matches your current filters.'
                            : 'You have not created any purchases yet.'}
                        </p>

                        {hasFilters ? (
                          <CButton className="btn-onishakara-dark" onClick={clearFilters}>
                            Clear Filters
                          </CButton>
                        ) : (
                          <CButton
                            className="btn-onishakara-gold"
                            onClick={() => navigate('/purchases/add')}
                          >
                            <CIcon icon={cilPlus} className="me-2" />
                            Create First Purchase
                          </CButton>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  purchases.map((purchase) => {
                    const isProcessing = processingId === purchase.id

                    return (
                      <CTableRow key={purchase.id}>
                        <CTableDataCell>
                          <div className="purchase-number">
                            {purchase.purchaseNumber || `#${purchase.id}`}
                          </div>

                          {purchase.invoiceNumber && (
                            <div className="purchase-muted">Invoice: {purchase.invoiceNumber}</div>
                          )}
                        </CTableDataCell>

                        <CTableDataCell>
                          <div className="d-flex align-items-center gap-2">
                            <CIcon
                              icon={cilCalendar}
                              style={{
                                color: '#c9a227',
                              }}
                            />

                            <span>{formatDate(purchase.purchaseDate)}</span>
                          </div>
                        </CTableDataCell>

                        <CTableDataCell>
                          <div className="purchase-supplier">{getSupplierName(purchase)}</div>

                          {purchase?.Supplier?.phone && (
                            <div className="purchase-muted">{purchase.Supplier.phone}</div>
                          )}
                        </CTableDataCell>

                        <CTableDataCell>
                          <strong>{formatCurrency(purchase.totalAmount)}</strong>
                        </CTableDataCell>

                        <CTableDataCell>{formatCurrency(purchase.amountPaid)}</CTableDataCell>

                        <CTableDataCell>
                          <span
                            style={{
                              fontWeight: Number(purchase.balanceDue || 0) > 0 ? 750 : 500,
                              color: Number(purchase.balanceDue || 0) > 0 ? '#b42318' : '#198754',
                            }}
                          >
                            {formatCurrency(purchase.balanceDue)}
                          </span>
                        </CTableDataCell>

                        <CTableDataCell>{paymentBadge(purchase.paymentStatus)}</CTableDataCell>

                        <CTableDataCell>{purchaseStatusBadge(purchase.status)}</CTableDataCell>

                        <CTableDataCell>
                          <div className="d-flex justify-content-end gap-1">
                            <button
                              type="button"
                              className="purchase-action"
                              title="View Purchase"
                              onClick={() => navigate(`/purchases/${purchase.id}`)}
                            >
                              <CIcon icon={cilEye} />
                            </button>

                            {String(purchase.status).toLowerCase() === 'draft' && (
                              <>
                                <button
                                  type="button"
                                  className="purchase-action"
                                  title="Edit Purchase"
                                  onClick={() => navigate(`/purchases/edit/${purchase.id}`)}
                                >
                                  <CIcon icon={cilPencil} />
                                </button>

                                <button
                                  type="button"
                                  className="purchase-action"
                                  title="Receive Purchase"
                                  disabled={isProcessing}
                                  onClick={() => handleReceive(purchase)}
                                >
                                  {isProcessing ? (
                                    <CSpinner size="sm" />
                                  ) : (
                                    <CIcon icon={cilCheckCircle} />
                                  )}
                                </button>
                              </>
                            )}

                            {String(purchase.status).toLowerCase() !== 'cancelled' && (
                              <button
                                type="button"
                                className="purchase-action purchase-action-danger"
                                title="Cancel Purchase"
                                disabled={isProcessing}
                                onClick={() => handleCancelPurchase(purchase)}
                              >
                                {isProcessing ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} />}
                              </button>
                            )}
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
          </div>

          {/* Pagination */}
          {!loading && purchases.length > 0 && (
            <div className="purchase-pagination d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="small text-medium-emphasis">
                Showing <strong>{(pagination.page - 1) * pagination.limit + 1}</strong> to{' '}
                <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> of{' '}
                <strong>{pagination.total}</strong> purchases
              </div>

              <div>
                <button
                  type="button"
                  className="purchase-page-button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>

                {Array.from(
                  {
                    length: Math.min(5, pagination.totalPages),
                  },
                  (_, index) => {
                    let pageNumber

                    if (pagination.totalPages <= 5) {
                      pageNumber = index + 1
                    } else if (pagination.page <= 3) {
                      pageNumber = index + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + index
                    } else {
                      pageNumber = pagination.page - 2 + index
                    }

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`purchase-page-button ${
                          pagination.page === pageNumber ? 'active' : ''
                        }`}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    )
                  },
                )}

                <button
                  type="button"
                  className="purchase-page-button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CCard>
      </div>
    </CContainer>
  )
}

export default Purchases
