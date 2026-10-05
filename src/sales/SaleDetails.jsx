import React, { useCallback, useEffect, useState } from 'react'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
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
import { cilArrowLeft, cilPrint, cilReload } from '@coreui/icons'

import { useNavigate, useParams } from 'react-router-dom'

/* ==========================================================
   API
========================================================== */

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

/* ==========================================================
   HELPERS
========================================================== */

const formatMoney = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  }
}

/* ==========================================================
   NORMALIZE SALE
========================================================== */

const normalizeSale = (responseData) => {
  if (!responseData) return null

  /*
   Backend may return:

   {
     sale: {...}
   }

   OR

   {
     data: {...}
   }

   OR directly:

   {...}
  */

  const sale = responseData.sale || responseData.data || responseData.result || responseData

  if (!sale || typeof sale !== 'object') {
    return null
  }

  return {
    ...sale,

    SaleItems: sale.SaleItems || sale.saleItems || sale.items || sale.Items || [],

    Customer: sale.Customer || sale.customer || null,

    RecordedBy: sale.RecordedBy || sale.recordedBy || null,
  }
}

/* ==========================================================
   SALE DETAILS
========================================================== */

const SaleDetails = () => {
  const { id } = useParams()

  const navigate = useNavigate()

  const [sale, setSale] = useState(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  /* ========================================================
     LOAD SALE
  ======================================================== */

  const loadSale = useCallback(async () => {
    if (!id) {
      setError('Sale ID is missing.')

      setLoading(false)

      return
    }

    try {
      setLoading(true)

      setError('')

      const response = await fetch(`${API_URL}/sales/${encodeURIComponent(id)}`, {
        method: 'GET',

        headers: getAuthHeaders(),

        cache: 'no-store',
      })

      let data = null

      try {
        data = await response.json()
      } catch {
        data = null
      }

      console.log('SALE DETAILS RESPONSE:', {
        status: response.status,
        data,
      })

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Unable to load sale. Server returned ${response.status}.`,
        )
      }

      const normalizedSale = normalizeSale(data)

      if (!normalizedSale?.id) {
        throw new Error('Sale was not returned by the server.')
      }

      setSale(normalizedSale)
    } catch (err) {
      console.error('LOAD SALE ERROR:', err)

      setSale(null)

      setError(err?.message || 'Unable to load sale. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadSale()
  }, [loadSale])

  /* ========================================================
     PRINT
  ======================================================== */

  const printSale = () => {
    window.print()
  }

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="sale-details-loading">
        <CSpinner />

        <span>Loading transaction...</span>
      </div>
    )
  }

  /* ========================================================
     ERROR
  ======================================================== */

  if (error || !sale) {
    return (
      <div className="sale-details-page">
        <div className="sale-error-card">
          <CAlert color="danger" className="mb-3">
            {error || 'Sale not found.'}
          </CAlert>

          <div className="d-flex gap-2">
            <CButton className="gold-outline-button" onClick={loadSale}>
              <CIcon icon={cilReload} className="me-2" />
              Try Again
            </CButton>

            <CButton className="gold-button" onClick={() => navigate('/sales')}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              Back to Sales
            </CButton>
          </div>
        </div>
      </div>
    )
  }

  /* ========================================================
     DATA
  ======================================================== */

  const items = Array.isArray(sale.SaleItems) ? sale.SaleItems : []

  const customerName =
    sale.Customer?.fullname ||
    sale.Customer?.name ||
    sale.customer?.fullname ||
    sale.customer?.name ||
    'Walk-in Customer'

  const customerPhone = sale.Customer?.phone || sale.customer?.phone || ''

  const cashierName =
    sale.RecordedBy?.fullname ||
    sale.recordedBy?.fullname ||
    sale.RecordedBy?.name ||
    sale.recordedBy?.name ||
    'System'

  const paymentMethod = String(sale.paymentMethod || 'cash')
    .replace(/_/g, ' ')
    .toUpperCase()

  const status = String(sale.status || 'completed').toLowerCase()

  const statusColor =
    status === 'completed'
      ? 'success'
      : status === 'refunded'
        ? 'warning'
        : status === 'cancelled'
          ? 'danger'
          : 'secondary'

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="sale-details-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="sale-details-header">
        <div>
          <button className="back-link" onClick={() => navigate('/sales')}>
            <CIcon icon={cilArrowLeft} className="me-1" />
            Back to Sales
          </button>

          <div className="sales-eyebrow">ONISHAKARA GOLD</div>

          <h2>Sale Details</h2>
        </div>

        <div className="sale-detail-actions">
          <CButton className="gold-outline-button" onClick={loadSale} disabled={loading}>
            <CIcon icon={cilReload} className="me-2" />
            Refresh
          </CButton>

          <CButton className="gold-button" onClick={printSale}>
            <CIcon icon={cilPrint} className="me-2" />
            Print Receipt
          </CButton>
        </div>
      </div>

      {/* =====================================================
          RECEIPT
      ====================================================== */}

      <CCard className="receipt-card">
        {/* ===================================================
            RECEIPT HEADER
        ==================================================== */}

        <CCardHeader className="receipt-header">
          <div>
            <div className="receipt-brand">ONISHAKARA GOLD</div>

            <small>FASHION STORE</small>
          </div>

          <div className="receipt-number-block">
            <span>RECEIPT</span>

            <strong>{sale.receiptNumber || sale.ReceiptNumber || `SALE-${sale.id}`}</strong>
          </div>
        </CCardHeader>

        <CCardBody>
          {/* =================================================
              SALE INFORMATION
          ================================================== */}

          <CRow className="g-3 mb-4">
            <CCol xs={12} md={3}>
              <div className="detail-info-box">
                <span>Date</span>

                <strong>{formatDate(sale.createdAt || sale.created_at || sale.date)}</strong>
              </div>
            </CCol>

            <CCol xs={12} md={3}>
              <div className="detail-info-box">
                <span>Customer</span>

                <strong>{customerName}</strong>

                {customerPhone && <small>{customerPhone}</small>}
              </div>
            </CCol>

            <CCol xs={12} md={3}>
              <div className="detail-info-box">
                <span>Cashier</span>

                <strong>{cashierName}</strong>
              </div>
            </CCol>

            <CCol xs={12} md={3}>
              <div className="detail-info-box">
                <span>Status</span>

                <CBadge color={statusColor}>{status.toUpperCase()}</CBadge>
              </div>
            </CCol>
          </CRow>

          {/* =================================================
              PAYMENT
          ================================================== */}

          <CRow className="g-3 mb-4">
            <CCol xs={12} md={4}>
              <div className="detail-info-box">
                <span>Payment Method</span>

                <strong>{paymentMethod}</strong>
              </div>
            </CCol>

            <CCol xs={12} md={4}>
              <div className="detail-info-box">
                <span>Sale ID</span>

                <strong>#{sale.id}</strong>
              </div>
            </CCol>

            <CCol xs={12} md={4}>
              <div className="detail-info-box">
                <span>Approval</span>

                <CBadge
                  color={
                    String(sale.approvalStatus || 'approved').toLowerCase() === 'approved'
                      ? 'success'
                      : 'warning'
                  }
                >
                  {String(sale.approvalStatus || 'approved').toUpperCase()}
                </CBadge>
              </div>
            </CCol>
          </CRow>

          {/* =================================================
              PRODUCTS
          ================================================== */}

          <div className="receipt-section-title">Products Purchased</div>

          {items.length === 0 ? (
            <div className="empty-items">No products were recorded for this sale.</div>
          ) : (
            <div className="table-responsive">
              <CTable align="middle" className="receipt-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Product</CTableHeaderCell>

                    <CTableHeaderCell>Variant</CTableHeaderCell>

                    <CTableHeaderCell>SKU</CTableHeaderCell>

                    <CTableHeaderCell>Qty</CTableHeaderCell>

                    <CTableHeaderCell>Price</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {items.map((item) => {
                    const product = item.Product || item.product || {}

                    const variant =
                      item.ProductVariant ||
                      item.productVariant ||
                      item.Variant ||
                      item.variant ||
                      null

                    const variantName = variant
                      ? [
                          variant.size ? `Size ${variant.size}` : null,

                          variant.color ? `Colour ${variant.color}` : null,
                        ]
                          .filter(Boolean)
                          .join(' • ')
                      : '-'

                    const productName = product.name || item.productName || item.name || 'Product'

                    const sku = variant?.sku || product?.sku || item.sku || '-'

                    const quantity = Number(item.quantity || 0)

                    const price = Number(item.price || 0)

                    const subtotal = Number(item.subtotal ?? quantity * price)

                    return (
                      <CTableRow key={item.id}>
                        <CTableDataCell>
                          <strong>{productName}</strong>
                        </CTableDataCell>

                        <CTableDataCell>{variantName}</CTableDataCell>

                        <CTableDataCell>{sku}</CTableDataCell>

                        <CTableDataCell>{quantity}</CTableDataCell>

                        <CTableDataCell>{formatMoney(price)}</CTableDataCell>

                        <CTableDataCell className="text-end">
                          <strong>{formatMoney(subtotal)}</strong>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
            </div>
          )}

          {/* =================================================
              TOTALS
          ================================================== */}

          <div className="receipt-total-area">
            <div className="receipt-total-row">
              <span>Subtotal</span>

              <strong>{formatMoney(sale.subtotal)}</strong>
            </div>

            <div className="receipt-total-row">
              <span>Discount</span>

              <strong className="discount-text">- {formatMoney(sale.discount)}</strong>
            </div>

            {Number(sale.pointsUsed || 0) > 0 && (
              <div className="receipt-total-row">
                <span>Loyalty Points Used</span>

                <strong>{Number(sale.pointsUsed).toLocaleString()}</strong>
              </div>
            )}

            <div className="receipt-grand-total">
              <span>TOTAL</span>

              <strong>{formatMoney(sale.totalAmount)}</strong>
            </div>
          </div>

          {/* =================================================
              EXTRA INFORMATION
          ================================================== */}

          {(sale.localSaleId || sale.note) && (
            <div className="extra-sale-info">
              {sale.localSaleId && (
                <div>
                  <span>Offline Sale ID</span>

                  <strong>{sale.localSaleId}</strong>
                </div>
              )}

              {sale.note && (
                <div className="sale-note">
                  <span>Note</span>

                  <strong>{sale.note}</strong>
                </div>
              )}
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* =====================================================
          STYLES
      ====================================================== */}

      <style>{`

        .sale-details-page {
          min-height: 100%;
          padding: 24px;
          background: #0b0b0b;
          color: #fff;
        }

        .sale-details-loading {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #0b0b0b;
          color: #777;
        }

        .sale-error-card {
          max-width: 900px;
          margin: 60px auto;
          padding: 25px;
          background: #171717;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
        }

        .sale-details-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 25px;
        }

        .back-link {
          border: 0;
          background: none;
          color: #999;
          padding: 0;
          margin-bottom: 15px;
          cursor: pointer;
        }

        .back-link:hover {
          color: #d4af37;
        }

        .sales-eyebrow {
          color: #d4af37;
          font-size: 11px;
          letter-spacing: 3px;
          font-weight: 800;
        }

        .sale-details-header h2 {
          margin: 5px 0 0;
          font-weight: 800;
        }

        .sale-detail-actions {
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
          background: transparent !important;
          border-color: #d4af37 !important;
          color: #d4af37 !important;
        }

        .receipt-card {
          background: #171717 !important;
          border: 1px solid #2c2c2c !important;
          color: #fff !important;
          max-width: 1200px;
          margin: auto;
        }

        .receipt-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #111 !important;
          border-bottom: 1px solid #2c2c2c !important;
          padding: 22px;
        }

        .receipt-brand {
          color: #d4af37;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .receipt-header small {
          color: #777;
          letter-spacing: 2px;
        }

        .receipt-number-block {
          text-align: right;
        }

        .receipt-number-block span {
          display: block;
          color: #777;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .receipt-number-block strong {
          display: block;
          color: #d4af37;
          margin-top: 4px;
        }

        .detail-info-box {
          background: #111;
          border: 1px solid #292929;
          padding: 15px;
          min-height: 80px;
        }

        .detail-info-box span {
          display: block;
          color: #777;
          font-size: 11px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .detail-info-box strong {
          display: block;
          color: #eee;
        }

        .detail-info-box small {
          display: block;
          color: #888;
          margin-top: 4px;
        }

        .receipt-section-title {
          color: #d4af37;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .empty-items {
          padding: 30px;
          text-align: center;
          color: #777;
          border: 1px dashed #333;
          border-radius: 8px;
        }

        .receipt-table {
          color: #eee;
        }

        .receipt-table th {
          background: #101010;
          color: #777;
          border-color: #2b2b2b;
          font-size: 11px;
          text-transform: uppercase;
        }

        .receipt-table td {
          border-color: #292929;
        }

        .receipt-total-area {
          max-width: 430px;
          margin: 25px 0 0 auto;
        }

        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #282828;
          color: #999;
        }

        .receipt-total-row strong {
          color: #eee;
        }

        .discount-text {
          color: #e57373 !important;
        }

        .receipt-grand-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 0 5px;
          color: #d4af37;
          font-size: 14px;
          font-weight: 800;
        }

        .receipt-grand-total strong {
          font-size: 24px;
        }

        .extra-sale-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #292929;
        }

        .extra-sale-info > div {
          background: #111;
          padding: 12px;
        }

        .extra-sale-info span {
          display: block;
          color: #777;
          font-size: 10px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .extra-sale-info strong {
          color: #ddd;
          word-break: break-word;
        }

        .sale-note {
          grid-column: 1 / -1;
        }

        @media (max-width: 768px) {

          .sale-details-page {
            padding: 15px;
          }

          .sale-details-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .sale-detail-actions {
            width: 100%;
          }

          .sale-detail-actions button {
            flex: 1;
          }

          .extra-sale-info {
            grid-template-columns: 1fr;
          }

        }

        @media print {

          .sale-details-page {
            background: #fff !important;
            color: #111 !important;
            padding: 0 !important;
          }

          .sale-details-header {
            display: none !important;
          }

          .receipt-card {
            border: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #111 !important;
          }

          .receipt-header {
            background: #fff !important;
            color: #111 !important;
          }

        }

      `}</style>
    </div>
  )
}

export default SaleDetails
