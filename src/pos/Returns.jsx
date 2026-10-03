import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CFormInput,
  CFormSelect,
  CSpinner,
  CAlert,
} from '@coreui/react'

import { cilSearch, cilReload, cilCloudDownload, cilEye } from '@coreui/icons'

import CIcon from '@coreui/icons-react'

import ViewReturnModal from './ViewReturnModal'

const Returns = () => {
  const API_URL = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

  // ============================================================
  // STATE
  // ============================================================

  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')

  const [status, setStatus] = useState('')
  const [refundType, setRefundType] = useState('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [selectedReturn, setSelectedReturn] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)

  // ============================================================
  // HELPERS
  // ============================================================

  const formatCurrency = (value) => {
    return `₦${Number(value || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const formatDate = (value) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '-'

    return date.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusColor = (value) => {
    switch (String(value || '').toLowerCase()) {
      case 'approved':
        return 'success'

      case 'pending':
        return 'warning'

      case 'rejected':
      case 'declined':
        return 'danger'

      case 'completed':
        return 'success'

      default:
        return 'secondary'
    }
  }

  const getRefundTypeLabel = (value) => {
    switch (String(value || '').toLowerCase()) {
      case 'refund':
        return 'Refund'

      case 'exchange':
        return 'Exchange'

      case 'credit_note':
        return 'Credit Note'

      default:
        return value || '-'
    }
  }

  const getCustomerName = (customer) => {
    if (!customer) return 'Walk-in Customer'

    return (
      customer.fullname ||
      customer.name ||
      customer.fullName ||
      `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
      'Walk-in Customer'
    )
  }

  // ============================================================
  // GET RETURNS
  // ============================================================

  const getReturns = useCallback(async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}/api/v1/returns`, {
        params: {
          status: status || undefined,
          refundType: refundType || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = response.data

      let result = []

      if (Array.isArray(data)) {
        result = data
      } else if (Array.isArray(data?.returns)) {
        result = data.returns
      } else if (Array.isArray(data?.data)) {
        result = data.data
      } else if (Array.isArray(data?.rows)) {
        result = data.rows
      }

      setReturns(result)
    } catch (error) {
      console.error('Failed to load returns:', error)

      setReturns([])

      Swal.fire({
        icon: 'error',
        title: 'Unable to Load Returns',
        text: error.response?.data?.message || 'Unable to load return records. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }, [API_URL, status, refundType, startDate, endDate])

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    getReturns()
  }, [getReturns])

  // ============================================================
  // SEARCH FILTER
  // ============================================================

  const filteredReturns = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return returns

    return returns.filter((item) => {
      const returnNumber = String(item.returnNumber || '').toLowerCase()

      const receiptNumber = String(
        item.Sale?.receiptNumber || item.sale?.receiptNumber || item.invoiceNumber || '',
      ).toLowerCase()

      const customerName = getCustomerName(item.Customer || item.customer).toLowerCase()

      return (
        returnNumber.includes(keyword) ||
        receiptNumber.includes(keyword) ||
        customerName.includes(keyword)
      )
    })
  }, [returns, search])

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    const totalRefund = filteredReturns.reduce(
      (sum, item) => sum + Number(item.totalRefund || 0),
      0,
    )

    const approved = filteredReturns.filter(
      (item) => String(item.status).toLowerCase() === 'approved',
    ).length

    const pending = filteredReturns.filter(
      (item) => String(item.status).toLowerCase() === 'pending',
    ).length

    const rejected = filteredReturns.filter((item) =>
      ['rejected', 'declined'].includes(String(item.status).toLowerCase()),
    ).length

    return {
      totalReturns: filteredReturns.length,
      totalRefund,
      approved,
      pending,
      rejected,
    }
  }, [filteredReturns])

  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setRefundType('')
    setStartDate('')
    setEndDate('')
  }

  // ============================================================
  // EXPORT EXCEL
  // ============================================================

  const exportExcel = () => {
    if (!filteredReturns.length) {
      Swal.fire({
        icon: 'info',
        title: 'Nothing to Export',
        text: 'There are no return records matching your current filters.',
      })

      return
    }

    const worksheetData = filteredReturns.map((item) => ({
      ReturnNumber: item.returnNumber || '',
      Invoice: item.Sale?.receiptNumber || item.sale?.receiptNumber || item.invoiceNumber || '',
      Customer: getCustomerName(item.Customer || item.customer),
      RefundType: getRefundTypeLabel(item.refundType),
      RefundAmount: Number(item.totalRefund || 0),
      Status: item.status || '',
      Date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-NG') : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)

    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 22 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
    ]

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Returns')

    XLSX.writeFile(
      workbook,
      `Onishakara_Gold_Returns_${new Date().toISOString().slice(0, 10)}.xlsx`,
    )
  }

  // ============================================================
  // OPEN RETURN
  // ============================================================

  const openReturn = (data) => {
    setSelectedReturn(data)
    setShowViewModal(true)
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="onishakara-returns-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div
            className="text-uppercase fw-semibold"
            style={{
              fontSize: '11px',
              letterSpacing: '2px',
              color: '#b08d57',
            }}
          >
            Onishakara Gold
          </div>

          <h3
            className="mb-1 fw-bold"
            style={{
              color: '#1f1f1f',
              letterSpacing: '-0.5px',
            }}
          >
            Returns Management
          </h3>

          <div className="text-medium-emphasis">Review product returns, refunds and exchanges.</div>
        </div>

        <div className="d-flex gap-2">
          <CButton color="light" className="border" onClick={getReturns} disabled={loading}>
            {loading ? <CSpinner size="sm" /> : <CIcon icon={cilReload} className="me-1" />}
            Refresh
          </CButton>

          <CButton color="dark" onClick={exportExcel} disabled={!filteredReturns.length}>
            <CIcon icon={cilCloudDownload} className="me-1" />
            Export Excel
          </CButton>
        </div>
      </div>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} lg={3}>
          <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '14px' }}>
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Total Returns</div>

              <div
                className="fw-bold"
                style={{
                  fontSize: '28px',
                  color: '#222',
                }}
              >
                {summary.totalReturns}
              </div>

              <div className="small text-medium-emphasis mt-2">Matching current filters</div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} lg={3}>
          <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '14px' }}>
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Total Refunded</div>

              <div
                className="fw-bold"
                style={{
                  fontSize: '26px',
                  color: '#b08d57',
                }}
              >
                {formatCurrency(summary.totalRefund)}
              </div>

              <div className="small text-medium-emphasis mt-2">Return value</div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} lg={3}>
          <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '14px' }}>
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Approved</div>

              <div
                className="fw-bold"
                style={{
                  fontSize: '28px',
                  color: '#198754',
                }}
              >
                {summary.approved}
              </div>

              <div className="small text-medium-emphasis mt-2">Approved returns</div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} lg={3}>
          <CCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '14px' }}>
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Pending</div>

              <div
                className="fw-bold"
                style={{
                  fontSize: '28px',
                  color: '#d39e00',
                }}
              >
                {summary.pending}
              </div>

              <div className="small text-medium-emphasis mt-2">Awaiting processing</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ======================================================
          RETURNS TABLE
      ====================================================== */}

      <CCard className="border-0 shadow-sm" style={{ borderRadius: '14px' }}>
        <CCardHeader
          className="bg-white border-bottom"
          style={{
            padding: '18px 20px',
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Returns Report</strong>

              <div className="small text-medium-emphasis mt-1">
                {filteredReturns.length} record
                {filteredReturns.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          {/* ==================================================
              FILTERS
          ================================================== */}

          <CRow className="g-2 mb-4">
            <CCol xs={12} md={6} lg={2}>
              <label className="form-label small fw-semibold">Start Date</label>

              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={6} lg={2}>
              <label className="form-label small fw-semibold">End Date</label>

              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={6} lg={2}>
              <label className="form-label small fw-semibold">Status</label>

              <CFormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={6} lg={2}>
              <label className="form-label small fw-semibold">Return Type</label>

              <CFormSelect value={refundType} onChange={(e) => setRefundType(e.target.value)}>
                <option value="">All Types</option>
                <option value="refund">Refund</option>
                <option value="exchange">Exchange</option>
                <option value="credit_note">Credit Note</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={8} lg={2}>
              <label className="form-label small fw-semibold">Search</label>

              <div className="position-relative">
                <CFormInput
                  placeholder="Return, invoice, customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingRight: '38px' }}
                />

                <CIcon
                  icon={cilSearch}
                  className="position-absolute"
                  style={{
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#888',
                  }}
                />
              </div>
            </CCol>

            <CCol xs={12} md={4} lg={2} className="d-flex align-items-end gap-2">
              <CButton color="dark" className="flex-grow-1" onClick={getReturns} disabled={loading}>
                {loading ? <CSpinner size="sm" /> : 'Apply'}
              </CButton>

              <CButton
                color="light"
                className="border"
                onClick={clearFilters}
                title="Clear filters"
              >
                Clear
              </CButton>
            </CCol>
          </CRow>

          {/* ==================================================
              TABLE
          ================================================== */}

          {loading ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: '280px' }}
            >
              <div className="text-center">
                <CSpinner />

                <div className="small text-medium-emphasis mt-3">Loading returns...</div>
              </div>
            </div>
          ) : filteredReturns.length === 0 ? (
            <CAlert color="light" className="border text-center py-5">
              <div className="mb-2">
                <CIcon icon={cilSearch} size="xl" style={{ color: '#b08d57' }} />
              </div>

              <h6 className="fw-semibold">No return records found</h6>

              <div className="small text-medium-emphasis">
                Try changing your filters or search term.
              </div>
            </CAlert>
          ) : (
            <CTable hover responsive align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Return No.</CTableHeaderCell>

                  <CTableHeaderCell>Invoice</CTableHeaderCell>

                  <CTableHeaderCell>Customer</CTableHeaderCell>

                  <CTableHeaderCell>Return Type</CTableHeaderCell>

                  <CTableHeaderCell>Refund</CTableHeaderCell>

                  <CTableHeaderCell>Status</CTableHeaderCell>

                  <CTableHeaderCell>Date</CTableHeaderCell>

                  <CTableHeaderCell className="text-end">Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredReturns.map((item) => {
                  const customer = item.Customer || item.customer

                  const sale = item.Sale || item.sale

                  return (
                    <CTableRow key={item.id}>
                      <CTableDataCell>
                        <div className="fw-semibold">{item.returnNumber || '-'}</div>

                        {item.id && <div className="small text-medium-emphasis">#{item.id}</div>}
                      </CTableDataCell>

                      <CTableDataCell>
                        <span className="fw-medium">
                          {sale?.receiptNumber || item.invoiceNumber || '-'}
                        </span>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="fw-medium">{getCustomerName(customer)}</div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <CBadge color="light" textColor="dark" className="border">
                          {getRefundTypeLabel(item.refundType)}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>
                        <span className="fw-semibold">{formatCurrency(item.totalRefund)}</span>
                      </CTableDataCell>

                      <CTableDataCell>
                        <CBadge color={getStatusColor(item.status)}>
                          {String(item.status || 'unknown').toUpperCase()}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>{formatDate(item.createdAt)}</CTableDataCell>

                      <CTableDataCell className="text-end">
                        <CButton
                          size="sm"
                          color="light"
                          className="border"
                          onClick={() => openReturn(item)}
                        >
                          View
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* ======================================================
          VIEW RETURN MODAL
      ====================================================== */}

      <ViewReturnModal
        show={showViewModal}
        onHide={() => {
          setShowViewModal(false)
          setSelectedReturn(null)
        }}
        returnData={selectedReturn}
      />
    </div>
  )
}

export default Returns
