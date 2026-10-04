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

const API_ROOT = import.meta.env.VITE_BACKEND_URL

const API_URL = `${API_ROOT}api/v1`

const formatMoney = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

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

const SaleDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [sale, setSale] = useState(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  // ==========================================================
  // LOAD SALE
  // ==========================================================

  const loadSale = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_URL}/sales/${id}`, {
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load sale.')
      }

      setSale(data.sale || null)
    } catch (err) {
      console.error('LOAD SALE ERROR:', err)

      setError(err.message || 'Unable to load sale.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadSale()
  }, [loadSale])

  // ==========================================================
  // PRINT
  // ==========================================================

  const printSale = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="sale-details-loading">
        <CSpinner />
        <span>Loading transaction...</span>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="sale-details-page">
        <CAlert color="danger">{error || 'Sale not found.'}</CAlert>

        <CButton className="gold-button" onClick={() => navigate('/sales')}>
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back to Sales
        </CButton>
      </div>
    )
  }

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
          <CButton className="gold-outline-button" onClick={loadSale}>
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
        <CCardHeader className="receipt-header">
          <div>
            <div className="receipt-brand">ONISHAKARA GOLD</div>

            <small>FASHION STORE</small>
          </div>

          <div className="receipt-number-block">
            <span>RECEIPT</span>

            <strong>{sale.receiptNumber}</strong>
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

                <strong>{formatDate(sale.createdAt)}</strong>
              </div>
            </CCol>

            <CCol xs={12} md={3}>
              <div className="detail-info-box">
                <span>Customer</span>

                <strong>{sale.Customer?.fullname || 'Walk-in Customer'}</strong>

                {sale.Customer?.phone && <small>{sale.Customer.phone}</small>}
              </div>
            </CCol>

            <CCol xs={12} md={3}>
              <div className="detail-info-box">
                <span>Payment</span>

                <strong>{String(sale.paymentMethod || '').toUpperCase()}</strong>
              </div>
            </CCol>

            <CCol xs={12} md={3}>
              <div className="detail-info-box">
                <span>Status</span>

                <CBadge
                  color={
                    sale.status === 'completed'
                      ? 'success'
                      : sale.status === 'refunded'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {String(sale.status || '').toUpperCase()}
                </CBadge>
              </div>
            </CCol>
          </CRow>

          {/* =================================================
                ITEMS
            ================================================== */}

          <div className="receipt-section-title">Products Purchased</div>

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
                {(sale.SaleItems || []).map((item) => {
                  const variant = item.ProductVariant

                  const variantName = variant
                    ? [
                        variant.size ? `Size ${variant.size}` : null,

                        variant.color ? `Colour ${variant.color}` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')
                    : '-'

                  return (
                    <CTableRow key={item.id}>
                      <CTableDataCell>
                        <strong>{item.Product?.name || 'Product'}</strong>
                      </CTableDataCell>

                      <CTableDataCell>{variantName}</CTableDataCell>

                      <CTableDataCell>{variant?.sku || item.Product?.sku || '-'}</CTableDataCell>

                      <CTableDataCell>{item.quantity}</CTableDataCell>

                      <CTableDataCell>{formatMoney(item.price)}</CTableDataCell>

                      <CTableDataCell className="text-end">
                        <strong>{formatMoney(item.subtotal)}</strong>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          </div>

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

          {(sale.StandTag || sale.CardNumber || sale.localSaleId || sale.note) && (
            <div className="extra-sale-info">
              {sale.StandTag && (
                <div>
                  <span>Stand Tag</span>

                  <strong>{sale.StandTag}</strong>
                </div>
              )}

              {sale.CardNumber && (
                <div>
                  <span>Card Number</span>

                  <strong>{sale.CardNumber}</strong>
                </div>
              )}

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
            grid-template-columns: repeat(3, 1fr);
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
