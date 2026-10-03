// src/views/purchases/PurchaseDetails.jsx

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
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
  cilArrowLeft,
  cilCheckCircle,
  cilCloudDownload,
  cilReload,
  cilTrash,
  cilX,
} from '@coreui/icons'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useNavigate, useParams } from 'react-router-dom'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
const API_URL = `${API_ROOT}/api/v1`

const money = (value) => {
  const number = Number(value || 0)

  return `₦${number.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const getPurchaseFromResponse = (response) => {
  const data = response?.data

  return data?.purchase || data?.data?.purchase || data?.data || data || null
}

const formatDate = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDateTime = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusBadge = (status) => {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'received') {
    return <CBadge color="success">RECEIVED</CBadge>
  }

  if (normalized === 'cancelled') {
    return <CBadge color="danger">CANCELLED</CBadge>
  }

  return <CBadge color="warning">DRAFT</CBadge>
}

const getPaymentBadge = (status) => {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'paid') {
    return <CBadge color="success">PAID</CBadge>
  }

  if (normalized === 'partial') {
    return <CBadge color="warning">PARTIAL</CBadge>
  }

  return <CBadge color="danger">UNPAID</CBadge>
}

const PurchaseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  const axiosConfig = useMemo(
    () => ({
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }),
    [token],
  )

  const loadPurchase = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError('')

      const response = await axios.get(`${API_URL}/purchases/${id}`, axiosConfig)

      const result = getPurchaseFromResponse(response)

      if (!result) {
        throw new Error('Purchase record was not found.')
      }

      setPurchase(result)
    } catch (err) {
      console.error('Failed to load purchase:', err)

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Unable to load purchase details.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }, [id, axiosConfig])

  useEffect(() => {
    loadPurchase()
  }, [loadPurchase])

  const handleReceive = async () => {
    if (!purchase?.id) return

    const result = await Swal.fire({
      title: 'Receive Purchase?',
      text: 'Receiving this purchase will add the purchased quantities to stock.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Receive',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b08d2c',
    })

    if (!result.isConfirmed) return

    try {
      setActionLoading(true)

      await axios.put(`${API_URL}/purchases/${purchase.id}/receive`, {}, axiosConfig)

      await Swal.fire({
        icon: 'success',
        title: 'Purchase Received',
        text: 'Stock has been updated successfully.',
        confirmButtonColor: '#b08d2c',
      })

      await loadPurchase()
    } catch (err) {
      console.error('Receive purchase error:', err)

      Swal.fire({
        icon: 'error',
        title: 'Unable to Receive Purchase',
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Something went wrong.',
        confirmButtonColor: '#b08d2c',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!purchase?.id) return

    const result = await Swal.fire({
      title: 'Cancel Purchase?',
      text:
        purchase.status === 'received'
          ? 'This will reverse the received stock and cancel the purchase.'
          : 'This purchase will be cancelled.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel Purchase',
      cancelButtonText: 'Keep Purchase',
      confirmButtonColor: '#dc3545',
    })

    if (!result.isConfirmed) return

    try {
      setActionLoading(true)

      await axios.delete(`${API_URL}/purchases/${purchase.id}`, axiosConfig)

      await Swal.fire({
        icon: 'success',
        title: 'Purchase Cancelled',
        text: 'The purchase has been cancelled successfully.',
        confirmButtonColor: '#b08d2c',
      })

      navigate('/purchases')
    } catch (err) {
      console.error('Cancel purchase error:', err)

      Swal.fire({
        icon: 'error',
        title: 'Unable to Cancel Purchase',
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Something went wrong.',
        confirmButtonColor: '#b08d2c',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '70vh' }}
      >
        <div className="text-center">
          <CSpinner size="sm" className="mb-3" />
          <div className="text-medium-emphasis">Loading purchase details...</div>
        </div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <CContainer fluid className="py-4">
        <CButton color="light" className="mb-3" onClick={() => navigate('/purchases')}>
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back to Purchases
        </CButton>

        <CAlert color="danger">
          <strong>Unable to load purchase.</strong>
          <div className="mt-1">{error || 'Purchase not found.'}</div>
        </CAlert>

        <CButton color="dark" onClick={loadPurchase}>
          <CIcon icon={cilReload} className="me-2" />
          Try Again
        </CButton>
      </CContainer>
    )
  }

  const items = Array.isArray(purchase.Items)
    ? purchase.Items
    : Array.isArray(purchase.items)
      ? purchase.items
      : []

  const supplier = purchase.Supplier || purchase.supplier || {}

  const subtotal = Number(purchase.subtotal || 0)
  const discount = Number(purchase.discount || 0)
  const tax = Number(purchase.tax || 0)
  const shippingCost = Number(purchase.shippingCost || 0)
  const otherCharges = Number(purchase.otherCharges || 0)
  const totalAmount = Number(purchase.totalAmount || 0)
  const amountPaid = Number(purchase.amountPaid || 0)
  const balanceDue = Number(purchase.balanceDue || 0)

  const isDraft = String(purchase.status).toLowerCase() === 'draft'
  const isCancelled = String(purchase.status).toLowerCase() === 'cancelled'

  return (
    <div
      className="purchase-details-page"
      style={{
        background: '#f5f5f3',
        minHeight: '100vh',
        paddingBottom: 40,
      }}
    >
      <style>
        {`
          .purchase-details-page {
            --gold: #b08d2c;
            --gold-dark: #8c6f20;
            --black: #111111;
            --charcoal: #242424;
          }

          .purchase-header {
            background: linear-gradient(135deg, #111111 0%, #242424 100%);
            color: #fff;
            border-radius: 14px;
            padding: 24px;
            box-shadow: 0 8px 25px rgba(0,0,0,.08);
          }

          .gold-line {
            width: 55px;
            height: 3px;
            background: #b08d2c;
            border-radius: 10px;
            margin-top: 8px;
          }

          .info-label {
            color: #777;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .5px;
          }

          .info-value {
            color: #171717;
            font-weight: 600;
            margin-top: 3px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }

          .summary-row:last-child {
            border-bottom: 0;
          }

          .grand-total {
            background: #111;
            color: #fff;
            border-radius: 10px;
            padding: 16px;
          }

          .grand-total .amount {
            color: #d6b65a;
            font-size: 24px;
            font-weight: 800;
          }

          .purchase-table th {
            background: #171717 !important;
            color: #fff !important;
            border-color: #333 !important;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: .4px;
          }

          .purchase-table td {
            vertical-align: middle;
          }

          .gold-btn {
            background: #b08d2c;
            border-color: #b08d2c;
            color: #fff;
          }

          .gold-btn:hover {
            background: #8c6f20;
            border-color: #8c6f20;
            color: #fff;
          }

          @media print {
            body {
              background: #fff !important;
            }

            .no-print {
              display: none !important;
            }

            .purchase-details-page {
              background: #fff !important;
              padding: 0 !important;
            }

            .purchase-header {
              box-shadow: none !important;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            .card {
              box-shadow: none !important;
              border: 1px solid #ddd !important;
            }
          }
        `}
      </style>

      <CContainer fluid className="py-4">
        {/* HEADER */}
        <div className="purchase-header mb-4">
          <CRow className="align-items-center">
            <CCol md={7}>
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#b08d2c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 20,
                  }}
                >
                  OG
                </div>

                <div>
                  <div
                    style={{
                      color: '#d6b65a',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                    }}
                  >
                    ONISHAKARA GOLD
                  </div>

                  <h3 className="mb-0 mt-1">Purchase Details</h3>

                  <div className="gold-line" />
                </div>
              </div>
            </CCol>

            <CCol md={5} className="text-md-end mt-3 mt-md-0 no-print">
              <CButton
                color="light"
                className="me-2"
                onClick={() => navigate('/purchases')}
                disabled={actionLoading}
              >
                <CIcon icon={cilArrowLeft} className="me-1" />
                Purchases
              </CButton>

              <CButton
                color="light"
                variant="outline"
                onClick={handlePrint}
                disabled={actionLoading}
              >
                <CIcon icon={cilCloudDownload} className="me-1" />
                Print
              </CButton>
            </CCol>
          </CRow>
        </div>

        {/* PURCHASE INFORMATION */}
        <CRow className="g-4">
          <CCol lg={8}>
            <CCard className="border-0 shadow-sm mb-4">
              <CCardHeader className="bg-white border-0 pt-4 px-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1 fw-bold">
                      {purchase.purchaseNumber || `Purchase #${purchase.id}`}
                    </h5>

                    <small className="text-medium-emphasis">
                      Recorded {formatDateTime(purchase.createdAt)}
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    {getStatusBadge(purchase.status)}
                    {getPaymentBadge(purchase.paymentStatus)}
                  </div>
                </div>
              </CCardHeader>

              <CCardBody className="px-4">
                <CRow className="g-4">
                  <CCol sm={6} md={4}>
                    <div className="info-label">Purchase Date</div>
                    <div className="info-value">{formatDate(purchase.purchaseDate)}</div>
                  </CCol>

                  <CCol sm={6} md={4}>
                    <div className="info-label">Invoice Number</div>
                    <div className="info-value">{purchase.invoiceNumber || '—'}</div>
                  </CCol>

                  <CCol sm={6} md={4}>
                    <div className="info-label">Payment Method</div>
                    <div className="info-value text-capitalize">
                      {purchase.paymentMethod || '—'}
                    </div>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* SUPPLIER */}
            <CCard className="border-0 shadow-sm mb-4">
              <CCardHeader className="bg-white border-0 px-4 pt-4">
                <h5 className="fw-bold mb-0">Supplier Information</h5>
              </CCardHeader>

              <CCardBody className="px-4">
                <CRow className="g-4">
                  <CCol md={6}>
                    <div className="info-label">Supplier</div>
                    <div className="info-value fs-5">{supplier.name || '—'}</div>

                    {supplier.companyName && (
                      <div className="text-medium-emphasis">{supplier.companyName}</div>
                    )}
                  </CCol>

                  <CCol md={6}>
                    <div className="info-label">Contact</div>
                    <div className="info-value">{supplier.phone || '—'}</div>

                    {supplier.email && <div className="text-medium-emphasis">{supplier.email}</div>}
                  </CCol>

                  <CCol md={12}>
                    <div className="info-label">Address</div>
                    <div className="info-value">
                      {[supplier.address, supplier.city, supplier.state, supplier.country]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </div>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* ITEMS */}
            <CCard className="border-0 shadow-sm">
              <CCardHeader className="bg-white border-0 px-4 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">Purchased Items</h5>

                  <CBadge color="dark">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </CBadge>
                </div>
              </CCardHeader>

              <CCardBody className="px-0">
                <div className="table-responsive">
                  <CTable hover className="mb-0 purchase-table">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>#</CTableHeaderCell>
                        <CTableHeaderCell>Product</CTableHeaderCell>
                        <CTableHeaderCell>Variant</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Qty</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Cost</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Subtotal</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Total</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {items.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell
                            colSpan={7}
                            className="text-center py-5 text-medium-emphasis"
                          >
                            No purchase items found.
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        items.map((item, index) => {
                          const product = item.Product || item.product || {}

                          const variant = item.Variant || item.variant || {}

                          const productName = item.productName || product.name || 'Product'

                          const variantName =
                            item.variantName ||
                            [variant.size, variant.color].filter(Boolean).join(' / ') ||
                            '—'

                          return (
                            <CTableRow key={item.id || index}>
                              <CTableDataCell>{index + 1}</CTableDataCell>

                              <CTableDataCell>
                                <div className="fw-semibold">{productName}</div>

                                {product.sku && (
                                  <small className="text-medium-emphasis">SKU: {product.sku}</small>
                                )}
                              </CTableDataCell>

                              <CTableDataCell>{variantName}</CTableDataCell>

                              <CTableDataCell className="text-end fw-semibold">
                                {Number(item.quantity || 0).toLocaleString('en-NG', {
                                  maximumFractionDigits: 3,
                                })}
                              </CTableDataCell>

                              <CTableDataCell className="text-end">
                                {money(item.costPrice)}
                              </CTableDataCell>

                              <CTableDataCell className="text-end">
                                {money(item.subtotal)}
                              </CTableDataCell>

                              <CTableDataCell className="text-end fw-bold">
                                {money(item.total)}
                              </CTableDataCell>
                            </CTableRow>
                          )
                        })
                      )}
                    </CTableBody>
                  </CTable>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* RIGHT SIDE */}
          <CCol lg={4}>
            <CCard className="border-0 shadow-sm mb-4">
              <CCardHeader className="bg-white border-0 px-4 pt-4">
                <h5 className="fw-bold mb-0">Purchase Summary</h5>
              </CCardHeader>

              <CCardBody className="px-4">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>

                <div className="summary-row">
                  <span>Discount</span>
                  <strong>{money(discount)}</strong>
                </div>

                <div className="summary-row">
                  <span>Tax</span>
                  <strong>{money(tax)}</strong>
                </div>

                <div className="summary-row">
                  <span>Shipping</span>
                  <strong>{money(shippingCost)}</strong>
                </div>

                <div className="summary-row">
                  <span>Other Charges</span>
                  <strong>{money(otherCharges)}</strong>
                </div>

                <div className="grand-total mt-3">
                  <div className="small text-uppercase">Total Purchase</div>

                  <div className="amount mt-1">{money(totalAmount)}</div>
                </div>

                <div className="summary-row mt-3">
                  <span>Amount Paid</span>
                  <strong className="text-success">{money(amountPaid)}</strong>
                </div>

                <div className="summary-row">
                  <span>Balance Due</span>
                  <strong className={balanceDue > 0 ? 'text-danger' : 'text-success'}>
                    {money(balanceDue)}
                  </strong>
                </div>
              </CCardBody>
            </CCard>

            {/* ACTIONS */}
            <CCard className="border-0 shadow-sm mb-4 no-print">
              <CCardHeader className="bg-white border-0 px-4 pt-4">
                <h5 className="fw-bold mb-0">Actions</h5>
              </CCardHeader>

              <CCardBody className="px-4">
                {isDraft && (
                  <CButton
                    className="gold-btn w-100 mb-3"
                    onClick={handleReceive}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <CSpinner size="sm" className="me-2" />
                    ) : (
                      <CIcon icon={cilCheckCircle} className="me-2" />
                    )}
                    Receive Purchase
                  </CButton>
                )}

                {!isCancelled && (
                  <CButton
                    color="danger"
                    variant="outline"
                    className="w-100"
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    <CIcon icon={cilTrash} className="me-2" />
                    Cancel Purchase
                  </CButton>
                )}

                <CButton
                  color="light"
                  className="w-100 mt-3"
                  onClick={loadPurchase}
                  disabled={loading || actionLoading}
                >
                  <CIcon icon={cilReload} className="me-2" />
                  Refresh
                </CButton>
              </CCardBody>
            </CCard>

            {/* NOTES */}
            {purchase.notes && (
              <CCard className="border-0 shadow-sm">
                <CCardHeader className="bg-white border-0 px-4 pt-4">
                  <h5 className="fw-bold mb-0">Notes</h5>
                </CCardHeader>

                <CCardBody className="px-4">
                  <div
                    style={{
                      background: '#fafafa',
                      borderLeft: '3px solid #b08d2c',
                      padding: '12px 14px',
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {purchase.notes}
                  </div>
                </CCardBody>
              </CCard>
            )}
          </CCol>
        </CRow>

        {/* FOOTER */}
        <div className="text-center mt-4 text-medium-emphasis">
          <small>
            Onishakara Gold • Purchase Record • {purchase.purchaseNumber || `#${purchase.id}`}
          </small>
        </div>
      </CContainer>
    </div>
  )
}

export default PurchaseDetails
