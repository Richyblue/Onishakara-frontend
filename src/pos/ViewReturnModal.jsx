import React from 'react'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CCard,
  CCardBody,
  CRow,
  CCol,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'

import { cilPrint, cilCheckCircle, cilWarning, cilXCircle } from '@coreui/icons'

/**
 * ============================================================
 * MONEY FORMATTER
 * ============================================================
 */

const formatMoney = (value) => {
  return `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * ============================================================
 * DATE FORMATTER
 * ============================================================
 */

const formatDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * ============================================================
 * TIME FORMATTER
 * ============================================================
 */

const formatTime = (value) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * ============================================================
 * REFUND TYPE LABEL
 * ============================================================
 */

const getRefundTypeLabel = (type) => {
  switch (type) {
    case 'refund':
      return 'Refund'

    case 'exchange':
      return 'Exchange'

    case 'credit_note':
      return 'Credit Note'

    default:
      return type || '-'
  }
}

/**
 * ============================================================
 * STATUS BADGE
 * ============================================================
 */

const StatusBadge = ({ status }) => {
  if (status === 'approved') {
    return (
      <CBadge color="success" className="px-3 py-2">
        <CIcon icon={cilCheckCircle} className="me-1" />
        Approved
      </CBadge>
    )
  }

  if (status === 'pending') {
    return (
      <CBadge color="warning" className="px-3 py-2">
        <CIcon icon={cilWarning} className="me-1" />
        Pending
      </CBadge>
    )
  }

  return (
    <CBadge color="danger" className="px-3 py-2">
      <CIcon icon={cilXCircle} className="me-1" />

      {status || 'Rejected'}
    </CBadge>
  )
}

/**
 * ============================================================
 * VIEW RETURN MODAL
 * ============================================================
 */

const ViewReturnModal = ({ show, onHide, returnData }) => {
  if (!returnData) {
    return null
  }

  const sale = returnData.Sale || returnData.sale || {}

  const customer = returnData.Customer || returnData.customer || {}

  const processedBy = returnData.ProcessedBy || returnData.processedBy || {}

  const returnItems = Array.isArray(returnData.ReturnItems)
    ? returnData.ReturnItems
    : Array.isArray(returnData.returnItems)
      ? returnData.returnItems
      : []

  /**
   * --------------------------------------------------------
   * TOTAL
   * --------------------------------------------------------
   */

  const totalRefund = Number(returnData.totalRefund || 0)

  /**
   * --------------------------------------------------------
   * PRINT
   * --------------------------------------------------------
   */

  const handlePrint = () => {
    window.print()
  }

  return (
    <CModal visible={show} size="xl" onClose={onHide} alignment="center">
      {/* =================================================
                HEADER
            ================================================= */}

      <CModalHeader>
        <div>
          <CModalTitle className="fw-bold">Return Details</CModalTitle>

          <div className="small text-body-secondary mt-1">Product return transaction</div>
        </div>
      </CModalHeader>

      {/* =================================================
                BODY
            ================================================= */}

      <CModalBody>
        {/* =============================================
                    RETURN SUMMARY
                ============================================= */}

        <CCard className="border-0 shadow-sm mb-4">
          <CCardBody>
            <CRow className="g-4">
              {/* RETURN NUMBER */}

              <CCol xs={12} md={4}>
                <div className="small text-body-secondary mb-1">Return Number</div>

                <div className="fw-bold">{returnData.returnNumber || '-'}</div>
              </CCol>

              {/* INVOICE */}

              <CCol xs={12} md={4}>
                <div className="small text-body-secondary mb-1">Original Invoice</div>

                <div className="fw-bold">{sale.receiptNumber || '-'}</div>
              </CCol>

              {/* CUSTOMER */}

              <CCol xs={12} md={4}>
                <div className="small text-body-secondary mb-1">Customer</div>

                <div className="fw-bold">{customer.fullname || 'Walk-in Customer'}</div>
              </CCol>
            </CRow>

            <hr className="my-4" />

            <CRow className="g-4">
              {/* REFUND TYPE */}

              <CCol xs={12} md={4}>
                <div className="small text-body-secondary mb-1">Resolution</div>

                <div className="fw-semibold">{getRefundTypeLabel(returnData.refundType)}</div>
              </CCol>

              {/* STATUS */}

              <CCol xs={12} md={4}>
                <div className="small text-body-secondary mb-2">Status</div>

                <StatusBadge status={returnData.status} />
              </CCol>

              {/* TOTAL REFUND */}

              <CCol xs={12} md={4}>
                <div className="small text-body-secondary mb-1">Total Refund</div>

                <div className="fw-bold fs-5 text-danger">{formatMoney(totalRefund)}</div>
              </CCol>
            </CRow>

            <hr className="my-4" />

            <CRow className="g-4">
              {/* REASON */}

              <CCol xs={12} md={4}>
                <div className="small text-body-secondary mb-1">Reason</div>

                <div className="fw-semibold">{returnData.reason || '-'}</div>
              </CCol>

              {/* PROCESSED BY */}

              <CCol xs={12} md={4}>
                <div className="small text-body-secondary mb-1">Processed By</div>

                <div className="fw-semibold">{processedBy.fullname || '-'}</div>
              </CCol>

              {/* DATE */}

              <CCol xs={12} md={4}>
                <div className="small text-body-secondary mb-1">Return Date</div>

                <div className="fw-semibold">
                  {formatDate(returnData.createdAt)}

                  {formatTime(returnData.createdAt) && (
                    <span className="text-body-secondary ms-2">
                      {formatTime(returnData.createdAt)}
                    </span>
                  )}
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =============================================
                    REMARKS
                ============================================= */}

        <CCard className="border-0 shadow-sm mb-4">
          <CCardBody>
            <h6 className="fw-bold mb-2">Remarks</h6>

            <div className="border rounded p-3 bg-body-tertiary">
              {returnData.remarks || 'No remarks provided.'}
            </div>
          </CCardBody>
        </CCard>

        {/* =============================================
                    RETURNED ITEMS
                ============================================= */}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-1">Returned Products</h5>

            <div className="small text-body-secondary">Products included in this return</div>
          </div>

          <CBadge color="dark" className="px-3 py-2">
            {returnItems.length} {returnItems.length === 1 ? 'line' : 'lines'}
          </CBadge>
        </div>

        <div className="table-responsive">
          <CTable bordered hover align="middle" className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Product</CTableHeaderCell>

                <CTableHeaderCell>Variant</CTableHeaderCell>

                <CTableHeaderCell>SKU</CTableHeaderCell>

                <CTableHeaderCell className="text-center">Qty</CTableHeaderCell>

                <CTableHeaderCell className="text-end">Price</CTableHeaderCell>

                <CTableHeaderCell className="text-end">Subtotal</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {returnItems.length > 0 ? (
                returnItems.map((item) => {
                  const product = item.Product || item.product || {}

                  const variant = item.ProductVariant || item.productVariant || null

                  const variantText = [variant?.size, variant?.color].filter(Boolean).join(' / ')

                  return (
                    <CTableRow key={item.id}>
                      {/* PRODUCT */}

                      <CTableDataCell>
                        <div className="fw-semibold">{product.name || 'Product'}</div>
                      </CTableDataCell>

                      {/* VARIANT */}

                      <CTableDataCell>{variantText || '-'}</CTableDataCell>

                      {/* SKU */}

                      <CTableDataCell>{variant?.sku || product.sku || '-'}</CTableDataCell>

                      {/* QTY */}

                      <CTableDataCell className="text-center">
                        <CBadge color="secondary" shape="rounded-pill">
                          {Number(item.quantity || 0)}
                        </CBadge>
                      </CTableDataCell>

                      {/* PRICE */}

                      <CTableDataCell className="text-end">
                        {formatMoney(item.price)}
                      </CTableDataCell>

                      {/* SUBTOTAL */}

                      <CTableDataCell className="text-end fw-bold">
                        {formatMoney(item.subtotal)}
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-5 text-body-secondary">
                    No returned products found.
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </div>

        {/* =============================================
                    TOTAL
                ============================================= */}

        <div className="d-flex justify-content-end mt-4">
          <div
            className="border rounded p-3"
            style={{
              minWidth: '280px',
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Total Refund</span>

              <span className="fs-4 fw-bold text-danger">{formatMoney(totalRefund)}</span>
            </div>
          </div>
        </div>
      </CModalBody>

      {/* =================================================
                FOOTER
            ================================================= */}

      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onHide}>
          Close
        </CButton>

        <CButton color="dark" onClick={handlePrint}>
          <CIcon icon={cilPrint} className="me-1" />
          Print
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ViewReturnModal
