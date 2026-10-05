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
import { cilChart, cilCloudDownload, cilReload, cilSearch } from '@coreui/icons'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
const API_URL = `${API_ROOT}/api/v1`

const formatMoney = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatNumber = (value) => Number(value || 0).toLocaleString('en-NG')

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

const getCashierName = (sale) => {
  return (
    sale?.RecordedBy?.fullname ||
    sale?.RecordedBy?.name ||
    sale?.RecordedBy?.email ||
    sale?.cashierName ||
    'Unknown Cashier'
  )
}

const getCustomerName = (sale) => {
  return (
    sale?.Customer?.name ||
    sale?.Customer?.fullname ||
    sale?.Customer?.fullName ||
    sale?.customerName ||
    'Walk-in Customer'
  )
}

const getSaleItems = (sale) => {
  return sale?.SaleItems || sale?.saleItems || sale?.items || []
}

const getProductName = (item) => {
  return (
    item?.Product?.name ||
    item?.product?.name ||
    item?.productName ||
    item?.name ||
    'Unknown Product'
  )
}

const getVariantName = (item) => {
  const variant = item?.ProductVariant || item?.productVariant || item?.Variant || item?.variant

  if (!variant) {
    return item?.variantName || '-'
  }

  const parts = [variant.size, variant.color].filter(Boolean)

  return parts.length ? parts.join(' / ') : variant.name || item?.variantName || '-'
}

const getSku = (item) => {
  return (
    item?.Product?.sku ||
    item?.product?.sku ||
    item?.ProductVariant?.sku ||
    item?.productVariant?.sku ||
    item?.sku ||
    '-'
  )
}

const getQuantity = (item) => {
  return Number(item?.quantity || item?.qty || 0)
}

const getItemSales = (item) => {
  return Number(item?.subtotal || item?.total || item?.amount || 0)
}

const SalesReport = () => {
  const today = new Date().toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  const [report, setReport] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [cashierFilter, setCashierFilter] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')

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

      const response = await fetch(`${API_URL}/report?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to load sales report.')
      }

      const reportData = data?.data || data

      setReport(reportData || null)
    } catch (err) {
      console.error('SALES REPORT ERROR:', err)

      setError(err?.message || 'Unable to load sales report.')

      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  // ==========================================================
  // RAW DATA
  // ==========================================================

  const sales = useMemo(() => {
    return Array.isArray(report?.sales) ? report.sales : []
  }, [report])

  const cashierSales = useMemo(() => {
    return Array.isArray(report?.cashierSales) ? report.cashierSales : []
  }, [report])

  const productSales = useMemo(() => {
    return Array.isArray(report?.productSales) ? report.productSales : []
  }, [report])

  const variantSales = useMemo(() => {
    return Array.isArray(report?.variantSales) ? report.variantSales : []
  }, [report])

  // ==========================================================
  // CASHIER FILTER OPTIONS
  // ==========================================================

  const cashierOptions = useMemo(() => {
    const map = new Map()

    cashierSales.forEach((cashier) => {
      const id = cashier?.cashierId ?? cashier?.RecordedById ?? cashier?.id

      const name =
        cashier?.cashierName ||
        cashier?.name ||
        cashier?.fullname ||
        cashier?.email ||
        'Unknown Cashier'

      if (id !== undefined && id !== null) {
        map.set(String(id), name)
      }
    })

    // Also derive cashiers directly from sales
    sales.forEach((sale) => {
      const id = sale?.RecordedById || sale?.RecordedBy?.id

      const name = getCashierName(sale)

      if (id !== undefined && id !== null) {
        map.set(String(id), name)
      }
    })

    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }))
  }, [cashierSales, sales])

  // ==========================================================
  // FILTERED SALES
  // ==========================================================

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleCashierId = sale?.RecordedById || sale?.RecordedBy?.id

      const cashierMatch = !cashierFilter || String(saleCashierId) === String(cashierFilter)

      const paymentMatch =
        paymentFilter === 'all' ||
        String(sale?.paymentMethod || '').toLowerCase() === paymentFilter.toLowerCase()

      return cashierMatch && paymentMatch
    })
  }, [sales, cashierFilter, paymentFilter])

  // ==========================================================
  // PRODUCT SALES TABLE
  // ==========================================================

  const productRows = useMemo(() => {
    const map = new Map()

    filteredSales.forEach((sale) => {
      getSaleItems(sale).forEach((item) => {
        const productId = item?.ProductId || item?.productId || item?.Product?.id

        const variantId =
          item?.ProductVariantId || item?.productVariantId || item?.ProductVariant?.id

        const key = `${productId || 'product'}-${variantId || 'no-variant'}`

        const existing = map.get(key)

        const quantity = getQuantity(item)
        const amount = getItemSales(item)

        if (existing) {
          existing.quantitySold += quantity
          existing.totalSales += amount
        } else {
          map.set(key, {
            key,
            productId,
            variantId,
            productName: getProductName(item),
            variantName: getVariantName(item),
            sku: getSku(item),
            quantitySold: quantity,
            totalSales: amount,
          })
        }
      })
    })

    let rows = Array.from(map.values())

    if (productSearch.trim()) {
      const search = productSearch.trim().toLowerCase()

      rows = rows.filter((row) =>
        [row.productName, row.variantName, row.sku]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search),
      )
    }

    return rows.sort((a, b) => Number(b.totalSales || 0) - Number(a.totalSales || 0))
  }, [filteredSales, productSearch])

  // ==========================================================
  // KPI CALCULATIONS
  // ==========================================================

  const kpis = useMemo(() => {
    const grossSales = Number(report?.grossSales || 0)

    const totalReturns = Number(report?.totalReturns || 0)

    const netSales = Number(report?.netSales ?? grossSales - totalReturns)

    const transactions = Number(report?.totalTransactions ?? filteredSales.length)

    const itemsSold = Number(
      report?.itemsSold || productRows.reduce((sum, row) => sum + Number(row.quantitySold || 0), 0),
    )

    const averageSale = transactions > 0 ? netSales / transactions : 0

    return {
      grossSales,
      totalReturns,
      netSales,
      transactions,
      itemsSold,
      averageSale,
      customersServed: Number(report?.customersServed || 0),
      productRevenue: Number(report?.productRevenue || 0),
      productCost: Number(report?.productCost || 0),
      grossProfit: Number(report?.grossProfit || 0),
      totalExpenses: Number(report?.totalExpenses || 0),
      netProfit: Number(report?.netProfit || 0),
    }
  }, [report, filteredSales.length, productRows])

  // ==========================================================
  // PAYMENT BREAKDOWN
  // ==========================================================

  const payments = useMemo(() => {
    return {
      cash: Number(report?.cashSales || 0),

      pos: Number(report?.posSales || 0),

      transfer: Number(report?.transferSales || 0),

      mixed: Number(report?.mixedSales || 0),
    }
  }, [report])

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  const exportReport = () => {
    const rows = [
      ['ONISHAKARA GOLD FASHION STORE'],
      ['SALES REPORT'],
      [`Period: ${startDate} to ${endDate}`],
      [],
      ['Gross Sales', kpis.grossSales],
      ['Returns', kpis.totalReturns],
      ['Net Sales', kpis.netSales],
      ['Transactions', kpis.transactions],
      ['Items Sold', kpis.itemsSold],
      ['Average Sale', kpis.averageSale],
      [],
      ['PAYMENT BREAKDOWN'],
      ['Cash', payments.cash],
      ['POS', payments.pos],
      ['Transfer', payments.transfer],
      ['Mixed', payments.mixed],
      [],
      ['PRODUCT SALES'],
      ['Product', 'Variant', 'SKU', 'Quantity', 'Sales'],
    ]

    productRows.forEach((product) => {
      rows.push([
        product.productName,
        product.variantName,
        product.sku,
        product.quantitySold,
        product.totalSales,
      ])
    })

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

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setCashierFilter('')
    setProductSearch('')
    setPaymentFilter('all')
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="onishakara-report-page">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="report-header">
        <div>
          <div className="report-eyebrow">ONISHAKARA GOLD</div>

          <h2>Sales Reports</h2>

          <p>Analyze retail sales performance, cashiers, products and payments.</p>
        </div>

        <div className="report-actions">
          <CButton className="report-outline-button" onClick={loadReport} disabled={loading}>
            <CIcon icon={cilReload} className="me-2" />
            Refresh
          </CButton>

          <CButton className="report-gold-button" onClick={exportReport} disabled={loading}>
            <CIcon icon={cilCloudDownload} className="me-2" />
            Export
          </CButton>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {/* ======================================================
          DATE FILTER
      ======================================================= */}

      <CCard className="report-card mb-4">
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol xs={12} md={3}>
              <label>Start Date</label>

              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={3}>
              <label>End Date</label>

              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={3}>
              <label>Cashier</label>

              <CFormSelect value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)}>
                <option value="">All Cashiers</option>

                {cashierOptions.map((cashier) => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={3}>
              <CButton className="report-gold-button w-100" onClick={loadReport} disabled={loading}>
                <CIcon icon={cilChart} className="me-2" />
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
          {/* ==================================================
              KPI CARDS
          =================================================== */}

          <CRow className="g-3 mb-4">
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-kpi">
                <CCardBody>
                  <span>Gross Sales</span>

                  <strong>{formatMoney(kpis.grossSales)}</strong>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-kpi">
                <CCardBody>
                  <span>Net Sales</span>

                  <strong>{formatMoney(kpis.netSales)}</strong>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-kpi">
                <CCardBody>
                  <span>Transactions</span>

                  <strong>{formatNumber(kpis.transactions)}</strong>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-kpi">
                <CCardBody>
                  <span>Average Sale</span>

                  <strong>{formatMoney(kpis.averageSale)}</strong>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* ==================================================
              SECONDARY KPIs
          =================================================== */}

          <CRow className="g-3 mb-4">
            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-stat">
                <CCardBody>
                  <span>Items Sold</span>

                  <strong>{formatNumber(kpis.itemsSold)}</strong>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-stat">
                <CCardBody>
                  <span>Customers Served</span>

                  <strong>{formatNumber(kpis.customersServed)}</strong>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-stat">
                <CCardBody>
                  <span>Product Revenue</span>

                  <strong>{formatMoney(kpis.productRevenue)}</strong>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} sm={6} lg={3}>
              <CCard className="report-stat">
                <CCardBody>
                  <span>Gross Profit</span>

                  <strong>{formatMoney(kpis.grossProfit)}</strong>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* ==================================================
              PAYMENT BREAKDOWN
          =================================================== */}

          <CCard className="report-card mb-4">
            <CCardHeader>
              <div className="report-section-title">Payment Breakdown</div>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3">
                {[
                  ['Cash', payments.cash, 'success'],
                  ['POS', payments.pos, 'primary'],
                  ['Transfer', payments.transfer, 'info'],
                  ['Mixed', payments.mixed, 'warning'],
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

          {/* ==================================================
              CASHIER PERFORMANCE
          =================================================== */}

          <CCard className="report-card mb-4">
            <CCardHeader>
              <div className="report-section-title">Cashier Sales</div>
            </CCardHeader>

            <CCardBody className="p-0">
              {cashierSales.length === 0 ? (
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
                      {cashierSales.map((cashier, index) => (
                        <CTableRow key={cashier.cashierId || index}>
                          <CTableDataCell>
                            <strong>
                              {cashier.cashierName ||
                                cashier.name ||
                                cashier.fullname ||
                                'Unknown Cashier'}
                            </strong>
                          </CTableDataCell>

                          <CTableDataCell>{formatNumber(cashier.transactionCount)}</CTableDataCell>

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

          {/* ==================================================
              PRODUCT FILTER
          =================================================== */}

          <CCard className="report-card mb-4">
            <CCardBody>
              <CRow className="g-3 align-items-end">
                <CCol xs={12} md={6}>
                  <label>Search Product</label>

                  <div className="search-wrapper">
                    <CIcon icon={cilSearch} />

                    <CFormInput
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search product, variant or SKU..."
                    />
                  </div>
                </CCol>

                <CCol xs={12} md={3}>
                  <label>Payment Method</label>

                  <CFormSelect
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                  >
                    <option value="all">All Payments</option>

                    <option value="cash">Cash</option>

                    <option value="pos">POS</option>

                    <option value="transfer">Transfer</option>

                    <option value="mixed">Mixed</option>
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={3}>
                  <CButton className="report-outline-button w-100" onClick={resetFilters}>
                    Clear Filters
                  </CButton>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* ==================================================
              PRODUCT PERFORMANCE
          =================================================== */}

          <CCard className="report-card mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <div className="report-section-title">Product Sales</div>

                <CBadge className="report-badge">
                  {formatNumber(productRows.length)} Products
                </CBadge>
              </div>
            </CCardHeader>

            <CCardBody className="p-0">
              {productRows.length === 0 ? (
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
                      {productRows.map((product) => (
                        <CTableRow key={product.key}>
                          <CTableDataCell>
                            <strong>{product.productName}</strong>
                          </CTableDataCell>

                          <CTableDataCell>{product.variantName}</CTableDataCell>

                          <CTableDataCell>{product.sku}</CTableDataCell>

                          <CTableDataCell>
                            <CBadge color="secondary">{formatNumber(product.quantitySold)}</CBadge>
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

          {/* ==================================================
              SALES TRANSACTIONS
          =================================================== */}

          <CCard className="report-card">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="report-section-title">Sales Transactions</div>

                  <small className="report-muted">
                    Showing {formatNumber(filteredSales.length)} transaction
                    {filteredSales.length !== 1 ? 's' : ''}
                  </small>
                </div>

                <CBadge className="report-badge">{formatMoney(kpis.netSales)}</CBadge>
              </div>
            </CCardHeader>

            <CCardBody className="p-0">
              {filteredSales.length === 0 ? (
                <div className="report-empty">No sales transactions found.</div>
              ) : (
                <div className="table-responsive">
                  <CTable hover align="middle" className="report-table mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Invoice</CTableHeaderCell>

                        <CTableHeaderCell>Customer</CTableHeaderCell>

                        <CTableHeaderCell>Cashier</CTableHeaderCell>

                        <CTableHeaderCell>Payment</CTableHeaderCell>

                        <CTableHeaderCell>Items</CTableHeaderCell>

                        <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>

                        <CTableHeaderCell>Date</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {filteredSales.map((sale) => {
                        const items = getSaleItems(sale)

                        const itemCount = items.reduce((sum, item) => sum + getQuantity(item), 0)

                        return (
                          <CTableRow key={sale.id}>
                            <CTableDataCell>
                              <strong>
                                {sale.receiptNumber || sale.invoiceNumber || `SALE-${sale.id}`}
                              </strong>
                            </CTableDataCell>

                            <CTableDataCell>{getCustomerName(sale)}</CTableDataCell>

                            <CTableDataCell>{getCashierName(sale)}</CTableDataCell>

                            <CTableDataCell>
                              <CBadge className="payment-badge">
                                {String(sale.paymentMethod || '-').toUpperCase()}
                              </CBadge>
                            </CTableDataCell>

                            <CTableDataCell>{formatNumber(itemCount)}</CTableDataCell>

                            <CTableDataCell className="text-end">
                              <strong className="gold-text">
                                {formatMoney(sale.netAmount ?? sale.totalAmount)}
                              </strong>
                            </CTableDataCell>

                            <CTableDataCell>
                              {sale.createdAt
                                ? new Date(sale.createdAt).toLocaleString('en-NG', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })
                                : '-'}
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
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
        .report-kpi,
        .report-stat {
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

        .report-card .form-control,
        .report-card .form-select {
          background: #101010;
          border-color: #343434;
          color: #fff;
        }

        .report-card .form-control:focus,
        .report-card .form-select:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 .15rem rgba(212,175,55,.12);
        }

        .report-card .form-select option {
          background: #171717;
          color: #fff;
        }

        .report-kpi {
          border-left: 3px solid #d4af37 !important;
        }

        .report-kpi span,
        .report-stat span {
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

        .report-stat {
          border-top: 2px solid #292929 !important;
        }

        .report-stat strong {
          color: #eee;
          font-size: 18px;
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
          color: #ddd;
        }

        .report-table tbody tr:hover {
          background: #1d1d1d !important;
        }

        .gold-text {
          color: #d4af37 !important;
        }

        .report-badge {
          background: rgba(212,175,55,.12) !important;
          color: #d4af37 !important;
          border: 1px solid rgba(212,175,55,.3);
        }

        .payment-badge {
          background: #222 !important;
          color: #d4af37 !important;
          border: 1px solid #393939;
          font-size: 9px;
        }

        .report-muted {
          color: #777;
        }

        .search-wrapper {
          position: relative;
        }

        .search-wrapper > svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #777;
          z-index: 2;
        }

        .search-wrapper .form-control {
          padding-left: 38px;
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
