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
import { cilChart, cilCloudDownload, cilReload } from '@coreui/icons'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

const formatMoney = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

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

const SalesReport = () => {
  const today = new Date().toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(today)

  const [endDate, setEndDate] = useState(today)

  const [summary, setSummary] = useState(null)

  const [cashiers, setCashiers] = useState([])

  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  // ==========================================================
  // LOAD REPORT
  // ==========================================================

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()

      if (startDate) {
        params.set('startDate', startDate)
      }

      if (endDate) {
        params.set('endDate', endDate)
      }

      const [summaryResponse, cashierResponse, productResponse] = await Promise.all([
        fetch(`${API_URL}/sales/summary?${params.toString()}`, {
          headers: getAuthHeaders(),
        }),

        fetch(`${API_URL}/sales/cashiers?${params.toString()}`, {
          headers: getAuthHeaders(),
        }),

        fetch(`${API_URL}/sales/products?${params.toString()}`, {
          headers: getAuthHeaders(),
        }),
      ])

      const [summaryData, cashierData, productData] = await Promise.all([
        summaryResponse.json(),
        cashierResponse.json(),
        productResponse.json(),
      ])

      if (!summaryResponse.ok) {
        throw new Error(summaryData.message || 'Unable to load sales summary.')
      }

      if (!cashierResponse.ok) {
        throw new Error(cashierData.message || 'Unable to load cashier report.')
      }

      if (!productResponse.ok) {
        throw new Error(productData.message || 'Unable to load product report.')
      }

      setSummary(summaryData.data || null)

      setCashiers(Array.isArray(cashierData.data) ? cashierData.data : [])

      setProducts(Array.isArray(productData.data) ? productData.data : [])
    } catch (err) {
      console.error('SALES REPORT ERROR:', err)

      setError(err.message || 'Unable to load sales report.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  // ==========================================================
  // PRODUCT TOTAL
  // ==========================================================

  const totalUnitsSold = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.quantitySold || 0), 0),
    [products],
  )

  // ==========================================================
  // EXPORT
  // ==========================================================

  const exportReport = () => {
    const rows = [
      ['ONISHAKARA GOLD SALES REPORT'],

      [`Period: ${startDate} to ${endDate}`],

      [],

      ['TOTAL SALES', summary?.totalSales || 0],

      ['TRANSACTIONS', summary?.transactionCount || 0],

      ['AVERAGE SALE', summary?.averageSale || 0],

      ['DISCOUNT', summary?.discount || 0],

      [],

      ['PAYMENT BREAKDOWN'],

      ['Cash', summary?.paymentBreakdown?.cash || 0],

      ['POS', summary?.paymentBreakdown?.pos || 0],

      ['Transfer', summary?.paymentBreakdown?.transfer || 0],

      ['Mixed', summary?.paymentBreakdown?.mixed || 0],
    ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    link.download = `onishakara-sales-report-${startDate}-${endDate}.csv`

    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="onishakara-report-page">
      {/* =====================================================
            HEADER
        ====================================================== */}

      <div className="report-header">
        <div>
          <div className="report-eyebrow">ONISHAKARA GOLD</div>

          <h2>Sales Reports</h2>

          <p>Analyze sales performance, payment methods, cashiers and products.</p>
        </div>

        <div className="report-actions">
          <CButton className="report-outline-button" onClick={loadReport}>
            <CIcon icon={cilReload} className="me-2" />
            Refresh
          </CButton>

          <CButton className="report-gold-button" onClick={exportReport}>
            <CIcon icon={cilCloudDownload} className="me-2" />
            Export
          </CButton>
        </div>
      </div>

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {/* =====================================================
            DATE FILTER
        ====================================================== */}

      <CCard className="report-card mb-4">
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol xs={12} md={4}>
              <label>Start Date</label>

              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={4}>
              <label>End Date</label>

              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={4}>
              <CButton className="report-gold-button w-100" onClick={loadReport}>
                Generate Report
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {loading ? (
        <div className="report-loading">
          <CSpinner />

          <span>Generating sales report...</span>
        </div>
      ) : (
        <>
          {/* =================================================
                KPI CARDS
            ================================================== */}

          <CRow className="g-3 mb-4">
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-kpi">
                <CCardBody>
                  <span>Total Sales</span>

                  <strong>{formatMoney(summary?.totalSales)}</strong>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-kpi">
                <CCardBody>
                  <span>Transactions</span>

                  <strong>{Number(summary?.transactionCount || 0).toLocaleString()}</strong>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-kpi">
                <CCardBody>
                  <span>Average Sale</span>

                  <strong>{formatMoney(summary?.averageSale)}</strong>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-kpi">
                <CCardBody>
                  <span>Units Sold</span>

                  <strong>{totalUnitsSold.toLocaleString()}</strong>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* =================================================
                PAYMENT BREAKDOWN
            ================================================== */}

          <CCard className="report-card mb-4">
            <CCardHeader>
              <div className="report-section-title">Payment Breakdown</div>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3">
                {[
                  ['Cash', summary?.paymentBreakdown?.cash, 'success'],

                  ['POS', summary?.paymentBreakdown?.pos, 'primary'],

                  ['Transfer', summary?.paymentBreakdown?.transfer, 'info'],

                  ['Mixed', summary?.paymentBreakdown?.mixed, 'warning'],
                ].map((item) => (
                  <CCol xs={12} sm={6} lg={3} key={item[0]}>
                    <div className="payment-box">
                      <span>{item[0]}</span>

                      <strong>{formatMoney(item[1])}</strong>
                    </div>
                  </CCol>
                ))}
              </CRow>
            </CCardBody>
          </CCard>

          {/* =================================================
                CASHIER PERFORMANCE
            ================================================== */}

          <CCard className="report-card mb-4">
            <CCardHeader>
              <div className="report-section-title">Cashier Sales</div>
            </CCardHeader>

            <CCardBody className="p-0">
              {cashiers.length === 0 ? (
                <div className="report-empty">No cashier sales found.</div>
              ) : (
                <div className="table-responsive">
                  <CTable hover align="middle" className="report-table mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Cashier</CTableHeaderCell>

                        <CTableHeaderCell>Transactions</CTableHeaderCell>

                        <CTableHeaderCell>Cash</CTableHeaderCell>

                        <CTableHeaderCell>POS</CTableHeaderCell>

                        <CTableHeaderCell>Transfer</CTableHeaderCell>

                        <CTableHeaderCell>Mixed</CTableHeaderCell>

                        <CTableHeaderCell className="text-end">Total Sales</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {cashiers.map((cashier) => (
                        <CTableRow key={cashier.cashierId}>
                          <CTableDataCell>
                            <strong>{cashier.cashierName}</strong>
                          </CTableDataCell>

                          <CTableDataCell>{cashier.transactionCount}</CTableDataCell>

                          <CTableDataCell>{formatMoney(cashier.cash)}</CTableDataCell>

                          <CTableDataCell>{formatMoney(cashier.pos)}</CTableDataCell>

                          <CTableDataCell>{formatMoney(cashier.transfer)}</CTableDataCell>

                          <CTableDataCell>{formatMoney(cashier.mixed)}</CTableDataCell>

                          <CTableDataCell className="text-end">
                            <strong className="gold-text">{formatMoney(cashier.totalSales)}</strong>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>

          {/* =================================================
                PRODUCT PERFORMANCE
            ================================================== */}

          <CCard className="report-card">
            <CCardHeader>
              <div className="report-section-title">Product Sales</div>
            </CCardHeader>

            <CCardBody className="p-0">
              {products.length === 0 ? (
                <div className="report-empty">No product sales found.</div>
              ) : (
                <div className="table-responsive">
                  <CTable hover align="middle" className="report-table mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Product</CTableHeaderCell>

                        <CTableHeaderCell>Variant</CTableHeaderCell>

                        <CTableHeaderCell>SKU</CTableHeaderCell>

                        <CTableHeaderCell>Quantity Sold</CTableHeaderCell>

                        <CTableHeaderCell className="text-end">Sales</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {products.map((product) => (
                        <CTableRow
                          key={
                            product.variantId
                              ? `variant-${product.variantId}`
                              : `product-${product.productId}`
                          }
                        >
                          <CTableDataCell>
                            <strong>{product.productName}</strong>
                          </CTableDataCell>

                          <CTableDataCell>{product.variantName || '-'}</CTableDataCell>

                          <CTableDataCell>{product.sku || '-'}</CTableDataCell>

                          <CTableDataCell>
                            <CBadge color="secondary">
                              {Number(product.quantitySold || 0).toLocaleString()}
                            </CBadge>
                          </CTableDataCell>

                          <CTableDataCell className="text-end">
                            <strong className="gold-text">{formatMoney(product.totalSales)}</strong>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>
        </>
      )}

      <style>{`
          .onishakara-report-page {
            min-height: 100%;
            padding: 24px;
            background: #0b0b0b;
            color: #fff;
          }
  
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 20px;
            margin-bottom: 25px;
          }
  
          .report-eyebrow {
            color: #d4af37;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 3px;
          }
  
          .report-header h2 {
            margin: 5px 0;
            font-weight: 800;
          }
  
          .report-header p {
            color: #888;
            margin: 0;
          }
  
          .report-actions {
            display: flex;
            gap: 10px;
          }
  
          .report-gold-button {
            background: #d4af37 !important;
            border-color: #d4af37 !important;
            color: #111 !important;
            font-weight: 800;
          }
  
          .report-outline-button {
            background: transparent !important;
            border-color: #d4af37 !important;
            color: #d4af37 !important;
          }
  
          .report-card,
          .report-kpi {
            background: #171717 !important;
            border: 1px solid #2b2b2b !important;
            color: #fff !important;
          }
  
          .report-card .card-header {
            background: #111;
            border-bottom: 1px solid #2b2b2b;
          }
  
          .report-section-title {
            color: #d4af37;
            font-weight: 800;
          }
  
          .report-card label {
            display: block;
            color: #888;
            font-size: 12px;
            margin-bottom: 6px;
          }
  
          .report-card .form-control {
            background: #101010;
            border-color: #343434;
            color: #fff;
          }
  
          .report-card .form-control:focus {
            border-color: #d4af37;
            box-shadow: 0 0 0 .15rem rgba(212,175,55,.12);
          }
  
          .report-kpi {
            border-left: 3px solid #d4af37 !important;
          }
  
          .report-kpi span {
            display: block;
            color: #777;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
  
          .report-kpi strong {
            color: #d4af37;
            font-size: 22px;
          }
  
          .payment-box {
            background: #111;
            border: 1px solid #292929;
            padding: 18px;
          }
  
          .payment-box span {
            display: block;
            color: #777;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 7px;
          }
  
          .payment-box strong {
            color: #eee;
            font-size: 18px;
          }
  
          .report-table {
            color: #ddd;
          }
  
          .report-table th {
            background: #101010;
            border-color: #292929;
            color: #777;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .6px;
            white-space: nowrap;
          }
  
          .report-table td {
            border-color: #292929;
          }
  
          .gold-text {
            color: #d4af37 !important;
          }
  
          .report-loading,
          .report-empty {
            min-height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 12px;
            color: #777;
          }
  
          @media (max-width: 768px) {
            .onishakara-report-page {
              padding: 15px;
            }
  
            .report-header {
              align-items: flex-start;
              flex-direction: column;
            }
  
            .report-actions {
              width: 100%;
            }
  
            .report-actions button {
              flex: 1;
            }
          }
        `}</style>
    </div>
  )
}

export default SalesReport
