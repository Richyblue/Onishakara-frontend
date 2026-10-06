import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CCard,
  CCardBody,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react'

const ReceiptModal = ({ show, onHide, sale }) => {
  const receiptRef = useRef(null)

  // ==========================================================
  // API
  // ==========================================================

  const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

  const API_URL = `${API_ROOT}/api/v1`

  // ==========================================================
  // STATE
  // ==========================================================

  const [settings, setSettings] = useState({})
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [printing, setPrinting] = useState(false)

  // ==========================================================
  // FETCH COMPANY SETTINGS
  // ==========================================================

  useEffect(() => {
    let mounted = true

    const fetchSettings = async () => {
      try {
        setLoadingSettings(true)
        setSettingsError('')

        const token = localStorage.getItem('token')

        const response = await axios.get(`${API_URL}/settings`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        })

        console.log('Receipt Settings API response:', response.data)

        if (mounted) {
          setSettings(response.data?.settings || response.data?.data || {})
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error.response?.data || error.message)

        if (mounted) {
          setSettingsError(error.response?.data?.message || 'Unable to load company settings.')

          setSettings({})
        }
      } finally {
        if (mounted) {
          setLoadingSettings(false)
        }
      }
    }

    if (show) {
      fetchSettings()
    }

    return () => {
      mounted = false
    }
  }, [show, API_URL])

  // ==========================================================
  // SETTINGS VALUES
  // ==========================================================

  const companyName = settings?.companyName || 'ONISHAKARA GOLD FASHION STORE'

  const companyPhone = settings?.companyPhone || ''

  const companyEmail = settings?.companyEmail || ''

  const companyAddress = settings?.companyAddress || ''

  const currencySymbol = settings?.currencySymbol || '₦'

  const receiptFooter = settings?.receiptFooter || 'Thank You For Your Patronage'

  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const formatAmount = (amount) => {
    const value = Number(amount || 0)

    return `${currencySymbol}${value.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // ==========================================================
  // CUSTOMER NAME
  // ==========================================================

  const getCustomerName = () => {
    if (!sale) {
      return 'Walk-in Customer'
    }

    if (typeof sale.customer === 'string') {
      return sale.customer
    }

    if (sale.customer?.name) {
      return sale.customer.name
    }

    if (sale.customer?.fullname) {
      return sale.customer.fullname
    }

    if (sale.customer?.fullName) {
      return sale.customer.fullName
    }

    if (sale.Customer?.name) {
      return sale.Customer.name
    }

    if (sale.Customer?.fullname) {
      return sale.Customer.fullname
    }

    if (sale.Customer?.fullName) {
      return sale.Customer.fullName
    }

    return 'Walk-in Customer'
  }

  // ==========================================================
  // CASHIER NAME
  // ==========================================================

  const getCashierName = () => {
    if (!sale) {
      return 'Admin'
    }

    if (typeof sale.recordedBy === 'string') {
      return sale.recordedBy
    }

    if (sale.recordedBy?.fullname) {
      return sale.recordedBy.fullname
    }

    if (sale.recordedBy?.fullName) {
      return sale.recordedBy.fullName
    }

    if (sale.RecordedBy?.fullname) {
      return sale.RecordedBy.fullname
    }

    if (sale.RecordedBy?.fullName) {
      return sale.RecordedBy.fullName
    }

    if (sale.cashier?.fullname) {
      return sale.cashier.fullname
    }

    if (sale.cashier?.fullName) {
      return sale.cashier.fullName
    }

    if (sale.cashier?.name) {
      return sale.cashier.name
    }

    return 'Admin'
  }

  // ==========================================================
  // PRODUCT NAME
  // ==========================================================

  const getItemName = (item) => {
    if (!item) {
      return '-'
    }

    // Already-normalized POS item
    if (item.name) {
      let name = item.name

      const size = item.size
      const color = item.color

      const variantParts = [size, color].filter(Boolean)

      if (variantParts.length && !name.includes(variantParts.join(' / '))) {
        name += ` (${variantParts.join(' / ')})`
      }

      return name
    }

    // Backend productName
    if (item.productName) {
      let name = item.productName

      const variant = item.ProductVariant || item.productVariant || null

      if (variant) {
        const variantParts = [variant.size, variant.color].filter(Boolean)

        if (variantParts.length) {
          name += ` (${variantParts.join(' / ')})`
        }
      }

      return name
    }

    // Sequelize Product
    if (item.Product?.name) {
      let name = item.Product.name

      const variant = item.ProductVariant || item.productVariant || null

      if (variant) {
        const variantParts = [variant.size, variant.color].filter(Boolean)

        if (variantParts.length) {
          name += ` (${variantParts.join(' / ')})`
        }
      }

      return name
    }

    // Lowercase Sequelize-style object
    if (item.product?.name) {
      let name = item.product.name

      const variant =
        item.ProductVariant || item.productVariant || item.product?.ProductVariant || null

      if (variant) {
        const variantParts = [variant.size, variant.color].filter(Boolean)

        if (variantParts.length) {
          name += ` (${variantParts.join(' / ')})`
        }
      }

      return name
    }

    return '-'
  }

  // ==========================================================
  // ITEM QUANTITY
  // ==========================================================

  const getItemQuantity = (item) => {
    const quantity = Number(item?.quantity ?? item?.qty ?? 1)

    return Number.isFinite(quantity) ? quantity : 1
  }

  // ==========================================================
  // ITEM PRICE
  // ==========================================================

  const getItemPrice = (item) => {
    const price = Number(
      item?.price ?? item?.sellingPrice ?? item?.unitPrice ?? item?.Product?.sellingPrice ?? 0,
    )

    return Number.isFinite(price) ? price : 0
  }

  // ==========================================================
  // ITEM AMOUNT
  // ==========================================================

  const getItemAmount = (item) => {
    const quantity = getItemQuantity(item)

    const subtotal = Number(item?.subtotal ?? item?.total ?? item?.totalAmount)

    if (Number.isFinite(subtotal) && subtotal !== 0) {
      return subtotal
    }

    return getItemPrice(item) * quantity
  }

  // ==========================================================
  // GET RECEIPT ITEMS
  // ==========================================================

  const getReceiptItems = () => {
    if (Array.isArray(sale?.items)) {
      return sale.items
    }

    if (Array.isArray(sale?.SaleItems)) {
      return sale.SaleItems
    }

    if (Array.isArray(sale?.saleItems)) {
      return sale.saleItems
    }

    return []
  }

  // ==========================================================
  // RECEIPT ITEMS
  // ==========================================================

  const receiptItems = getReceiptItems()

  // ==========================================================
  // GENERATE SINGLE RECEIPT
  // ==========================================================

  const generateReceiptContent = () => {
    const items = receiptItems

    return `
      <div class="receipt">

        <div class="company-header">

          <h2>${companyName}</h2>

          ${
            companyAddress
              ? `
                <p class="address">
                  ${companyAddress}
                </p>
              `
              : ''
          }

          ${
            companyPhone
              ? `
                <p>
                  Tel: ${companyPhone}
                </p>
              `
              : ''
          }

          ${
            companyEmail
              ? `
                <p>
                  ${companyEmail}
                </p>
              `
              : ''
          }

        </div>

        <div class="separator"></div>

        <p>
          <strong>Receipt No:</strong>
          ${sale?.receiptNumber || sale?.receiptNo || sale?.id || '-'}
        </p>

        <p>
          <strong>Customer:</strong>
          ${getCustomerName()}
        </p>

        <p>
          <strong>Date:</strong>
          ${sale?.createdAt ? new Date(sale.createdAt).toLocaleString() : '-'}
        </p>

        <p>
          <strong>Cashier:</strong>
          ${getCashierName()}
        </p>

        ${
          sale?.paymentMethod
            ? `
              <p>
                <strong>Payment:</strong>
                ${String(sale.paymentMethod).toUpperCase()}
              </p>
            `
            : ''
        }

        <div class="separator"></div>

        <table>

          <thead>

            <tr>
              <th align="left">
                Item
              </th>

              <th align="center">
                Qty
              </th>

              <th align="right">
                Amount
              </th>
            </tr>

          </thead>

          <tbody>

            ${
              items.length
                ? items
                    .map((item) => {
                      const quantity = getItemQuantity(item)

                      const amount = getItemAmount(item)

                      return `
                          <tr>

                            <td>
                              ${getItemName(item)}
                            </td>

                            <td align="center">
                              ${quantity}
                            </td>

                            <td align="right">
                              ${formatAmount(amount)}
                            </td>

                          </tr>
                        `
                    })
                    .join('')
                : `
                    <tr>
                      <td
                        colspan="3"
                        align="center"
                      >
                        No items
                      </td>
                    </tr>
                  `
            }

          </tbody>

        </table>

        <div class="separator"></div>

        <div class="total-row">

          <span>
            Subtotal:
          </span>

          <strong>
            ${formatAmount(sale?.subtotal ?? sale?.totalAmount ?? 0)}
          </strong>

        </div>

        <div class="total-row">

          <span>
            Discount:
          </span>

          <strong>
            ${formatAmount(sale?.discount || 0)}
          </strong>

        </div>

        <div class="total-row grand-total">

          <span>
            TOTAL:
          </span>

          <strong>
            ${formatAmount(sale?.totalAmount || 0)}
          </strong>

        </div>

        <div class="separator"></div>

        <div class="receipt-footer">

          <p>
            ${receiptFooter}
          </p>

          <p>
            Please Visit Again
          </p>

        </div>

      </div>
    `
  }

  // ==========================================================
  // PRINT SINGLE RECEIPT
  // ==========================================================

  const handlePrint = async () => {
    if (printing) {
      return
    }

    try {
      // ======================================================
      // CHECK ELECTRON
      // ======================================================

      if (!window.electron || !window.electron.printReceipt) {
        alert('Electron printing is not available.')

        return
      }

      setPrinting(true)

      // ======================================================
      // GENERATE ONE RECEIPT ONLY
      // ======================================================

      const receipt = generateReceiptContent()

      // ======================================================
      // RECEIPT HTML
      // ======================================================

      const html = `
        <!DOCTYPE html>

        <html>

          <head>

            <meta charset="UTF-8" />

            <style>

              @page {
                size: 60mm auto;
                margin: 0;
              }

              * {
                box-sizing: border-box;
              }

              html,
              body {
                margin: 0;
                padding: 0;
                width: 60mm;
                background: #ffffff;
              }

              body {
  width: 60mm;
  margin: 0;
  padding: 5px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8px;
  font-weight: 700;
  color: #000000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* THERMAL PRINT FONT DARKNESS */
.receipt,
.receipt * {
  color: #000000 !important;
  font-weight: 700;
}

.receipt strong,
.receipt b,
.receipt th,
.receipt .grand-total {
  font-weight: 900 !important;
}
              .receipt {
                width: 60mm;
                padding: 5px;
              }

              .company-header {
                text-align: center;
              }

              .company-header h2 {
                font-size: 14px;
                margin: 2px 0;
                font-weight: bold;
              }

              .company-header p {
                margin: 2px 0;
              }

              .address {
                white-space: pre-line;
              }

              .separator {
                border-top: 1px dashed #000;
                margin: 8px 0;
              }

              p {
                margin: 4px 0;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                font-size: 9px;
              }

              th,
              td {
                padding: 2px 0;
                word-break: break-word;
                vertical-align: top;
              }

              th:first-child,
              td:first-child {
                width: 50%;
              }

              th:nth-child(2),
              td:nth-child(2) {
                width: 15%;
              }

              th:last-child,
              td:last-child {
                width: 35%;
              }

              .total-row {
                display: flex;
                justify-content: space-between;
                gap: 8px;
                margin: 5px 0;
              }

              .grand-total {
                font-size: 12px;
                font-weight: bold;
              }

              .receipt-footer {
                text-align: center;
                margin-top: 10px;
              }

              .receipt-footer p {
                margin: 3px 0;
                white-space: pre-line;
              }

            </style>

          </head>

          <body>

            ${receipt}

          </body>

        </html>
      `

      // ======================================================
      // SEND TO ELECTRON
      // ======================================================

      const result = await window.electron.printReceipt(html)

      // ======================================================
      // HANDLE ELECTRON RESULT
      // ======================================================

      if (result?.success === false) {
        throw new Error(result.message || 'Printing failed.')
      }

      console.log('Receipt printed successfully.')

      // ======================================================
      // CLOSE MODAL AFTER PRINT
      // ======================================================

      if (onHide) {
        onHide()
      }
    } catch (error) {
      console.error('Printer Error:', error)

      alert(error.message || 'Unable to print receipt.')
    } finally {
      setPrinting(false)
    }
  }

  // ==========================================================
  // NO SALE / RECEIPT PREPARING
  // ==========================================================

  if (!sale) {
    if (!show) {
      return null
    }

    return (
      <CModal visible={show} onClose={printing ? undefined : onHide} alignment="center">
        <CModalBody className="text-center py-5">
          <CSpinner />

          <p className="mt-3 mb-0">Preparing receipt...</p>
        </CModalBody>
      </CModal>
    )
  }

  // ==========================================================
  // MODAL
  // ==========================================================

  return (
    <CModal visible={show} onClose={printing ? undefined : onHide} alignment="center" size="lg">
      <CModalHeader>
        <CModalTitle>Receipt Preview</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {loadingSettings ? (
          <div className="text-center py-4">
            <CSpinner />

            <p className="mt-2 mb-0">Loading company information...</p>
          </div>
        ) : (
          <>
            {settingsError && <CAlert color="warning">{settingsError}</CAlert>}

            {/* =================================================
                RECEIPT PREVIEW
            ================================================= */}

            <CCard>
              <CCardBody>
                <div
                  ref={receiptRef}
                  style={{
                    width: '80mm',
                    margin: '0 auto',
                    padding: '5px',
                    fontSize: '9px',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontWeight: 700,
                    color: '#000000',
                    background: '#fff',
                  }}
                >
                  {/* COMPANY */}

                  <div
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    <h3
                      style={{
                        margin: '2px 0',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      {companyName}
                    </h3>

                    {companyAddress && (
                      <p
                        style={{
                          margin: '2px 0',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {companyAddress}
                      </p>
                    )}

                    {companyPhone && (
                      <p
                        style={{
                          margin: '2px 0',
                        }}
                      >
                        Tel: {companyPhone}
                      </p>
                    )}

                    {companyEmail && (
                      <p
                        style={{
                          margin: '2px 0',
                        }}
                      >
                        {companyEmail}
                      </p>
                    )}
                  </div>

                  <hr
                    style={{
                      borderTop: '1px dashed #000',
                    }}
                  />

                  {/* RECEIPT INFORMATION */}

                  <p>
                    <strong>Receipt No:</strong>{' '}
                    {sale.receiptNumber || sale.receiptNo || sale.id || '-'}
                  </p>

                  <p>
                    <strong>Customer:</strong> {getCustomerName()}
                  </p>

                  <p>
                    <strong>Date:</strong>{' '}
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '-'}
                  </p>

                  <p>
                    <strong>Cashier:</strong> {getCashierName()}
                  </p>

                  {sale.paymentMethod && (
                    <p>
                      <strong>Payment:</strong> {String(sale.paymentMethod).toUpperCase()}
                    </p>
                  )}

                  <hr
                    style={{
                      borderTop: '1px dashed #000',
                    }}
                  />

                  {/* ITEMS */}

                  <table
                    style={{
                      width: '100%',
                      fontSize: '9px',
                      borderCollapse: 'collapse',
                    }}
                  >
                    <thead>
                      <tr>
                        <th align="left">Item</th>

                        <th align="center">Qty</th>

                        <th align="right">Amt</th>
                      </tr>
                    </thead>

                    <tbody>
                      {receiptItems.length ? (
                        receiptItems.map((item, index) => (
                          <tr key={item.id || index}>
                            <td>{getItemName(item)}</td>

                            <td align="center">{getItemQuantity(item)}</td>

                            <td align="right">{formatAmount(getItemAmount(item))}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" align="center">
                            No items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <hr
                    style={{
                      borderTop: '1px dashed #000',
                    }}
                  />

                  {/* TOTALS */}

                  <div>
                    <p
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        margin: '4px 0',
                      }}
                    >
                      <span>Subtotal:</span>

                      <strong>{formatAmount(sale.subtotal ?? sale.totalAmount ?? 0)}</strong>
                    </p>

                    <p
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        margin: '4px 0',
                      }}
                    >
                      <span>Discount:</span>

                      <strong>{formatAmount(sale.discount || 0)}</strong>
                    </p>

                    <p
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        margin: '4px 0',
                      }}
                    >
                      <span>TOTAL:</span>

                      <strong>{formatAmount(sale.totalAmount || 0)}</strong>
                    </p>
                  </div>

                  <hr
                    style={{
                      borderTop: '1px dashed #000',
                    }}
                  />

                  {/* FOOTER */}

                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: '10px',
                    }}
                  >
                    <p
                      style={{
                        margin: '3px 0',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {receiptFooter}
                    </p>

                    <p
                      style={{
                        margin: '3px 0',
                      }}
                    >
                      Please Visit Again
                    </p>
                  </div>
                </div>
              </CCardBody>
            </CCard>

            {/* =================================================
                PRINT BUTTON
            ================================================= */}

            <div className="text-center mt-3">
              <CButton color="primary" onClick={handlePrint} disabled={printing || loadingSettings}>
                {printing ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Printing Receipt...
                  </>
                ) : (
                  'Print Receipt'
                )}
              </CButton>
            </div>
          </>
        )}
      </CModalBody>
    </CModal>
  )
}

export default ReceiptModal
