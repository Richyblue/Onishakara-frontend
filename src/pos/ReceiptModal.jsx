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

  const API_URL = import.meta.env.VITE_BACKEND_URL

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

        const response = await axios.get(`${API_URL}api/v1/settings`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        })

        console.log('Settings API response:', response.data)

        if (mounted) {
          setSettings(response.data?.settings || {})
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

  const companyName = settings?.companyName || 'GLAMOUR UNISEX SALON'

  const companyPhone = settings?.companyPhone || ''

  const companyEmail = settings?.companyEmail || ''

  const companyAddress = settings?.companyAddress || ''

  const currencySymbol = settings?.currencySymbol || '₦'

  const receiptFooter = settings?.receiptFooter || 'Thank You For Your Patronage'

  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const formatAmount = (amount) => {
    return `${currencySymbol}${Number(amount || 0).toLocaleString()}`
  }

  // ==========================================================
  // GENERATE SINGLE RECEIPT
  // ==========================================================

  const generateReceiptContent = () => {
    const items = sale?.items || []

    return `
      <div class="receipt">

        <div class="company-header">
          <h2>${companyName}</h2>

          ${companyAddress ? `<p class="address">${companyAddress}</p>` : ''}

          ${companyPhone ? `<p>Tel: ${companyPhone}</p>` : ''}

          ${companyEmail ? `<p>${companyEmail}</p>` : ''}
        </div>

        <div class="separator"></div>

        <p>
          <strong>Receipt No:</strong>
          ${sale?.receiptNumber || sale?.id || '-'}
        </p>

        <p>
          <strong>Customer:</strong>
          ${sale?.customer || 'Walk-in Customer'}
        </p>

        <p>
          <strong>Date:</strong>
          ${sale?.createdAt ? new Date(sale.createdAt).toLocaleString() : '-'}
        </p>

        <p>
          <strong>Cashier:</strong>
          ${sale?.recordedBy || 'Admin'}
        </p>

        <div class="separator"></div>

        <table>
          <thead>
            <tr>
              <th align="left">Item</th>
              <th align="center">Qty</th>
              <th align="right">Amount</th>
            </tr>
          </thead>

          <tbody>
            ${items
              .map((item) => {
                const quantity = item.quantity || item.qty || 1

                const amount = item.subtotal || 0

                return `
                  <tr>
                    <td>
                      ${item.name || '-'}
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
              .join('')}
          </tbody>
        </table>

        <div class="separator"></div>

        <div class="total-row">
          <span>Subtotal:</span>

          <strong>
            ${formatAmount(sale?.subtotal || sale?.totalAmount)}
          </strong>
        </div>

        <div class="total-row">
          <span>Discount:</span>

          <strong>
            ${formatAmount(sale?.discount)}
          </strong>
        </div>

        <div class="total-row grand-total">
          <span>TOTAL:</span>

          <strong>
            ${formatAmount(sale?.totalAmount)}
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

      if (!window.electron?.printReceipt) {
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
                font-family: monospace;
                font-size: 8px;
                color: #000;
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
  // NO SALE
  // ==========================================================

  if (!sale) {
    return null
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
                    fontFamily: 'monospace',
                    color: '#000',
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
                    <strong>Receipt No:</strong> {sale.receiptNumber || sale.id}
                  </p>

                  <p>
                    <strong>Customer:</strong> {sale.customer || 'Walk-in Customer'}
                  </p>

                  <p>
                    <strong>Date:</strong>{' '}
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '-'}
                  </p>

                  <p>
                    <strong>Cashier:</strong> {sale.recordedBy || 'Admin'}
                  </p>

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
                      {sale.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>

                          <td align="center">{item.quantity || item.qty || 1}</td>

                          <td align="right">{formatAmount(item.subtotal)}</td>
                        </tr>
                      ))}
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

                      <strong>{formatAmount(sale.subtotal || sale.totalAmount)}</strong>
                    </p>

                    <p
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        margin: '4px 0',
                      }}
                    >
                      <span>Discount:</span>

                      <strong>{formatAmount(sale.discount)}</strong>
                    </p>

                    <p
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        margin: '4px 0',
                      }}
                    >
                      <span>TOTAL:</span>

                      <strong>{formatAmount(sale.totalAmount)}</strong>
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
