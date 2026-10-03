import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CBadge,
  CSpinner,
} from '@coreui/react'

const ReturnModal = ({ show, onHide, saleId, reload }) => {
  const API_URL = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

  // ============================================================
  // STATE
  // ============================================================

  const [items, setItems] = useState([])

  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [refundType, setRefundType] = useState('refund')

  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(false)

  const [sale, setSale] = useState(null)

  // ============================================================
  // FORMATTERS
  // ============================================================

  const formatCurrency = (value) => {
    return `₦${Number(value || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const getVariantName = (item) => {
    const variant = item.ProductVariant || item.productVariant

    if (!variant) {
      return ''
    }

    return [variant.size, variant.color].filter(Boolean).join(' / ')
  }

  const getProductName = (item) => {
    return item.Product?.name || item.product?.name || item.productName || 'Unknown Product'
  }

  // ============================================================
  // GET SALE
  // ============================================================

  const getSale = async () => {
    if (!saleId) {
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}/api/v1/report/${saleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const saleData = response.data?.sale

      if (!saleData) {
        throw new Error('Sale information was not returned.')
      }

      setSale(saleData)

      const saleItems = saleData.SaleItems || []

      setItems(
        saleItems
          .filter((item) => item.itemType === 'product' || !item.itemType)
          .map((item) => {
            const quantity = Number(item.quantity || 0)

            const price = Number(item.price || 0)

            return {
              ...item,

              selected: false,

              returnQty: quantity,

              unitPrice: price,

              refund: quantity * price,
            }
          }),
      )
    } catch (error) {
      console.error('GET SALE FOR RETURN ERROR:', error)

      setSale(null)
      setItems([])

      Swal.fire({
        icon: 'error',
        title: 'Unable to Load Sale',
        text: error.response?.data?.message || error.message || 'Unable to load invoice.',
      })
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // LOAD SALE WHEN MODAL OPENS
  // ============================================================

  useEffect(() => {
    if (show && saleId) {
      getSale()
    }

    if (!show) {
      setItems([])
      setSale(null)
    }
  }, [show, saleId])

  // ============================================================
  // TOGGLE ITEM
  // ============================================================

  const toggleItem = (index) => {
    setItems((previous) =>
      previous.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }

        return {
          ...item,
          selected: !item.selected,
        }
      }),
    )
  }

  // ============================================================
  // CHANGE RETURN QUANTITY
  // ============================================================

  const changeQty = (index, value) => {
    setItems((previous) =>
      previous.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }

        const soldQuantity = Number(item.quantity || 0)

        let returnQuantity = Number(value || 0)

        if (!Number.isFinite(returnQuantity)) {
          returnQuantity = 1
        }

        returnQuantity = Math.max(1, Math.min(Math.floor(returnQuantity), soldQuantity))

        const unitPrice = Number(item.unitPrice || 0)

        return {
          ...item,

          returnQty: returnQuantity,

          refund: returnQuantity * unitPrice,
        }
      }),
    )
  }

  // ============================================================
  // TOTAL REFUND
  // ============================================================

  const totalRefund = useMemo(() => {
    return items
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + Number(item.refund || 0), 0)
  }, [items])

  // ============================================================
  // SELECTED COUNT
  // ============================================================

  const selectedCount = useMemo(() => {
    return items.filter((item) => item.selected).length
  }, [items])

  // ============================================================
  // PROCESS RETURN
  // ============================================================

  const processReturn = async () => {
    if (!sale?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Sale Not Found',
        text: 'The original sale could not be identified.',
      })

      return
    }

    const selectedItems = items
      .filter((item) => item.selected)
      .map((item) => ({
        ProductId: Number(item.ProductId),

        ProductVariantId: item.ProductVariantId ? Number(item.ProductVariantId) : null,

        itemType: 'product',

        quantity: Number(item.returnQty),

        // The backend also validates against
        // the original SaleItem price.
        price: Number(item.unitPrice),

        subtotal: Number(item.refund),
      }))

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (selectedItems.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Item Selected',
        text: 'Please select at least one product to return.',
      })

      return
    }

    if (!reason) {
      await Swal.fire({
        icon: 'warning',
        title: 'Reason Required',
        text: 'Please select a return reason.',
      })

      return
    }

    if (totalRefund <= 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Refund',
        text: 'The refund amount must be greater than zero.',
      })

      return
    }

    // ----------------------------------------------------------
    // CONFIRM
    // ----------------------------------------------------------

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Process Return?',
      html: `
          <div style="text-align:left">
            <p>
              <strong>${selectedCount}</strong>
              product${selectedCount !== 1 ? 's' : ''}
              selected.
            </p>

            <p>
              Refund amount:
              <strong>
                ${formatCurrency(totalRefund)}
              </strong>
            </p>

            <p>
              Return type:
              <strong>
                ${refundType.replace('_', ' ')}
              </strong>
            </p>
          </div>
        `,

      showCancelButton: true,

      confirmButtonText: 'Yes, Process Return',

      cancelButtonText: 'Cancel',

      confirmButtonColor: '#b08d57',
    })

    if (!confirmation.isConfirmed) {
      return
    }

    // ----------------------------------------------------------
    // PROCESS
    // ----------------------------------------------------------

    try {
      setProcessing(true)

      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_URL}/api/v1/returns`,
        {
          saleId: sale.id,

          items: selectedItems,

          refundType,

          reason,

          remarks: remarks.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      await Swal.fire({
        icon: 'success',
        title: 'Return Processed',
        text: response.data?.message || 'Return processed successfully.',
        confirmButtonColor: '#b08d57',
      })

      // --------------------------------------------------------
      // REFRESH PARENT
      // --------------------------------------------------------

      if (typeof reload === 'function') {
        await reload()
      }

      // --------------------------------------------------------
      // RESET
      // --------------------------------------------------------

      resetModal()

      onHide()
    } catch (error) {
      console.error('PROCESS RETURN ERROR:', error)

      Swal.fire({
        icon: 'error',
        title: 'Return Failed',
        text: error.response?.data?.message || 'Unable to process the return.',
      })
    } finally {
      setProcessing(false)
    }
  }

  // ============================================================
  // RESET
  // ============================================================

  const resetModal = () => {
    setItems([])
    setReason('')
    setRemarks('')
    setRefundType('refund')
    setSale(null)
  }

  // ============================================================
  // CLOSE
  // ============================================================

  const closeModal = () => {
    if (processing) {
      return
    }

    resetModal()

    onHide()
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <CModal visible={show} size="xl" alignment="center" backdrop="static" onClose={closeModal}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <CModalHeader>
        <CModalTitle>
          <div>
            <div
              className="text-uppercase"
              style={{
                fontSize: '10px',
                letterSpacing: '2px',
                color: '#b08d57',
              }}
            >
              Onishakara Gold
            </div>

            <div className="fw-bold">Process Sales Return</div>
          </div>
        </CModalTitle>
      </CModalHeader>

      {/* ======================================================
          BODY
      ====================================================== */}

      <CModalBody>
        {loading ? (
          <div className="text-center py-5">
            <CSpinner />

            <div className="text-medium-emphasis mt-3">Loading invoice...</div>
          </div>
        ) : !sale ? (
          <div className="text-center py-5 text-medium-emphasis">
            Sale information is unavailable.
          </div>
        ) : (
          <>
            {/* ==================================================
                SALE SUMMARY
            ================================================== */}

            <CCard
              className="border-0 shadow-sm mb-4"
              style={{
                borderRadius: '12px',
              }}
            >
              <CCardBody>
                <CRow className="g-3">
                  <CCol xs={12} md={3}>
                    <div className="small text-medium-emphasis">Invoice</div>

                    <div className="fw-bold">{sale.receiptNumber || '-'}</div>
                  </CCol>

                  <CCol xs={12} md={3}>
                    <div className="small text-medium-emphasis">Customer</div>

                    <div className="fw-semibold">
                      {sale.Customer?.fullname || 'Walk-in Customer'}
                    </div>
                  </CCol>

                  <CCol xs={12} md={3}>
                    <div className="small text-medium-emphasis">Payment</div>

                    <div className="fw-semibold text-uppercase">{sale.paymentMethod || '-'}</div>
                  </CCol>

                  <CCol xs={12} md={3}>
                    <div className="small text-medium-emphasis">Original Total</div>

                    <div
                      className="fw-bold"
                      style={{
                        color: '#b08d57',
                      }}
                    >
                      {formatCurrency(sale.totalAmount)}
                    </div>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* ==================================================
                PRODUCTS
            ================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-1">Products</h6>

                <div className="small text-medium-emphasis">
                  Select the products being returned.
                </div>
              </div>

              {selectedCount > 0 && (
                <CBadge color="dark" className="px-3 py-2">
                  {selectedCount} selected
                </CBadge>
              )}
            </div>

            <CTable bordered hover responsive align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>

                  <CTableHeaderCell>Product</CTableHeaderCell>

                  <CTableHeaderCell>Variant</CTableHeaderCell>

                  <CTableHeaderCell>Unit Price</CTableHeaderCell>

                  <CTableHeaderCell>Sold Qty</CTableHeaderCell>

                  <CTableHeaderCell>Return Qty</CTableHeaderCell>

                  <CTableHeaderCell>Refund</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {items.length > 0 ? (
                  items.map((item, index) => {
                    const variantName = getVariantName(item)

                    return (
                      <CTableRow
                        key={
                          item.id || `${item.ProductId}-${item.ProductVariantId || 'base'}-${index}`
                        }
                      >
                        {/* SELECT */}

                        <CTableDataCell>
                          <CFormCheck
                            checked={Boolean(item.selected)}
                            onChange={() => toggleItem(index)}
                          />
                        </CTableDataCell>

                        {/* PRODUCT */}

                        <CTableDataCell>
                          <div className="fw-semibold">{getProductName(item)}</div>

                          {item.Product?.sku && (
                            <div className="small text-medium-emphasis">
                              SKU: {item.Product.sku}
                            </div>
                          )}
                        </CTableDataCell>

                        {/* VARIANT */}

                        <CTableDataCell>
                          {variantName ? (
                            <CBadge color="light" textColor="dark" className="border">
                              {variantName}
                            </CBadge>
                          ) : (
                            <span className="text-medium-emphasis">Standard</span>
                          )}
                        </CTableDataCell>

                        {/* PRICE */}

                        <CTableDataCell>{formatCurrency(item.unitPrice)}</CTableDataCell>

                        {/* SOLD */}

                        <CTableDataCell>{item.quantity}</CTableDataCell>

                        {/* RETURN QTY */}

                        <CTableDataCell
                          style={{
                            width: '130px',
                          }}
                        >
                          <CFormInput
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={item.returnQty}
                            disabled={!item.selected || processing}
                            onChange={(e) => changeQty(index, e.target.value)}
                          />
                        </CTableDataCell>

                        {/* REFUND */}

                        <CTableDataCell>
                          {item.selected ? (
                            <span className="fw-bold">{formatCurrency(item.refund)}</span>
                          ) : (
                            <span className="text-medium-emphasis">-</span>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center py-5">
                      <div className="text-medium-emphasis">No products found in this sale.</div>
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>

            {/* ==================================================
                RETURN OPTIONS
            ================================================== */}

            <CRow className="g-3 mt-3">
              <CCol xs={12} md={6}>
                <label className="form-label fw-semibold">Return Reason</label>

                <CFormSelect
                  value={reason}
                  disabled={processing}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="">Select Reason</option>

                  <option value="Damaged Product">Damaged Product</option>

                  <option value="Wrong Item">Wrong Item</option>

                  <option value="Wrong Size">Wrong Size</option>

                  <option value="Wrong Color">Wrong Color</option>

                  <option value="Customer Changed Mind">Customer Changed Mind</option>

                  <option value="Customer Complaint">Customer Complaint</option>

                  <option value="Defective Product">Defective Product</option>

                  <option value="Other">Other</option>
                </CFormSelect>
              </CCol>

              <CCol xs={12} md={6}>
                <label className="form-label fw-semibold">Resolution</label>

                <CFormSelect
                  value={refundType}
                  disabled={processing}
                  onChange={(e) => setRefundType(e.target.value)}
                >
                  <option value="refund">Refund</option>

                  <option value="exchange">Exchange</option>

                  <option value="credit_note">Credit Note</option>
                </CFormSelect>
              </CCol>
            </CRow>

            {/* ==================================================
                REMARKS
            ================================================== */}

            <div className="mt-3">
              <label className="form-label fw-semibold">Remarks</label>

              <CFormTextarea
                rows={3}
                value={remarks}
                disabled={processing}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any additional information about this return..."
              />
            </div>

            {/* ==================================================
                REFUND SUMMARY
            ================================================== */}

            <CCard
              className="border-0 mt-4"
              style={{
                background: '#f8f6f1',
                borderRadius: '12px',
              }}
            >
              <CCardBody>
                <CRow className="align-items-center">
                  <CCol>
                    <div className="small text-medium-emphasis">Selected Products</div>

                    <div className="fw-semibold">{selectedCount}</div>
                  </CCol>

                  <CCol className="text-end">
                    <div className="small text-medium-emphasis">Total Refund</div>

                    <div
                      className="fw-bold"
                      style={{
                        fontSize: '26px',
                        color: '#b08d57',
                      }}
                    >
                      {formatCurrency(totalRefund)}
                    </div>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </>
        )}
      </CModalBody>

      {/* ========================================================
          FOOTER
      ======================================================== */}

      <CModalFooter>
        <CButton color="light" className="border" disabled={processing} onClick={closeModal}>
          Cancel
        </CButton>

        <CButton
          color="dark"
          disabled={
            loading || processing || !sale || selectedCount === 0 || totalRefund <= 0 || !reason
          }
          onClick={processReturn}
        >
          {processing ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            'Process Return'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ReturnModal
