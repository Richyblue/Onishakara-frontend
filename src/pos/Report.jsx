import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'

import ReturnModal from './ReturnModal'

import {
  cilSearch,
  cilCloudDownload,
  cilFilter,
  cilMoney,
  cilPeople,
  cilChart,
  cilCheckCircle,
  cilCart,
  cilWarning,
  cilReload,
} from '@coreui/icons'

import CIcon from '@coreui/icons-react'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CFormInput,
  CFormSelect,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CBadge,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const Report = () => {
  // =========================================================
  // API
  // =========================================================

  const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
  const API_URL = `${API_ROOT}/api/v1`

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [cashierFilter, setCashierFilter] = useState('')

  const [sales, setSales] = useState([])
  const [report, setReport] = useState({})

  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState(null)

  // =========================================================
  // HELPERS
  // =========================================================

  const money = (value) => {
    return `₦${Number(value || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const number = (value) => {
    return Number(value || 0)
  }

  const formatDate = (date) => {
    if (!date) return '-'

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) {
      return '-'
    }

    return parsed.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getSaleItems = (sale) => {
    return sale?.SaleItems || sale?.saleItems || sale?.items || []
  }

  const getProductItems = (sale) => {
    return getSaleItems(sale).filter(
      (item) =>
        item?.itemType === 'product' ||
        item?.Product ||
        item?.product ||
        item?.ProductId ||
        item?.productId,
    )
  }

  const getCustomerName = (sale) => {
    return (
      sale?.Customer?.fullname ||
      sale?.Customer?.name ||
      sale?.customer?.fullname ||
      sale?.customer?.name ||
      sale?.customerName ||
      'Walk-in Customer'
    )
  }

  const getCashierName = (sale) => {
    return (
      sale?.RecordedBy?.fullname ||
      sale?.RecordedBy?.name ||
      sale?.RecordedBy?.User?.fullname ||
      sale?.RecordedBy?.User?.name ||
      sale?.recordedBy?.fullname ||
      sale?.recordedBy?.name ||
      sale?.recordedByName ||
      'Unknown'
    )
  }

  const getProductName = (item) => {
    return (
      item?.Product?.name || item?.product?.name || item?.productName || item?.name || 'Product'
    )
  }

  const getVariantName = (item) => {
    const variant = item?.ProductVariant || item?.productVariant || item?.Variant || item?.variant

    if (!variant) {
      return ''
    }

    const parts = [variant.size, variant.color].filter(Boolean)

    return parts.length ? parts.join(' / ') : ''
  }

  const getPaymentMethod = (sale) => {
    return String(sale?.paymentMethod || sale?.PaymentMethod || 'cash').toLowerCase()
  }

  const formatPaymentMethod = (method) => {
    const value = String(method || '').toLowerCase()

    if (value === 'pos') return 'POS'
    if (value === 'cash') return 'Cash'
    if (value === 'transfer') return 'Transfer'
    if (value === 'mixed') return 'Mixed'
    if (value === 'bank') return 'Bank'

    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'
  }

  const getSaleReturns = (sale) => {
    return sale?.SalesReturns || sale?.salesReturns || sale?.SalesReturn || sale?.salesReturn || []
  }

  const getReturnedItems = (sale) => {
    return getSaleReturns(sale).flatMap(
      (returnRecord) => returnRecord?.ReturnItems || returnRecord?.returnItems || [],
    )
  }

  const getSaleReturnTotal = (sale) => {
    return getSaleReturns(sale)
      .filter(
        (returnRecord) => String(returnRecord?.status || 'approved').toLowerCase() === 'approved',
      )
      .reduce((total, returnRecord) => total + number(returnRecord?.totalRefund), 0)
  }

  const getReturnedQuantity = (sale, saleItem) => {
    const saleItemId = Number(saleItem?.id || saleItem?.SaleItemId || saleItem?.saleItemId)

    const returnedItems = getReturnedItems(sale)

    return returnedItems
      .filter((item) => {
        const returnedSaleItemId = Number(item?.SaleItemId || item?.saleItemId)

        if (saleItemId && returnedSaleItemId) {
          return saleItemId === returnedSaleItemId
        }

        return (
          Number(item?.ProductId || item?.productId) ===
          Number(saleItem?.ProductId || saleItem?.productId)
        )
      })
      .reduce((total, item) => total + number(item?.quantity), 0)
  }

  const getRemainingQuantity = (sale, item) => {
    const soldQuantity = number(item?.quantity)
    const returnedQuantity = getReturnedQuantity(sale, item)

    return Math.max(soldQuantity - returnedQuantity, 0)
  }

  const getProductRevenue = (sale) => {
    return getProductItems(sale).reduce((total, item) => {
      const quantity = getRemainingQuantity(sale, item)

      const subtotal = number(item?.subtotal) || number(item?.price) * number(item?.quantity)

      const originalQuantity = number(item?.quantity)

      if (originalQuantity <= 0) {
        return total
      }

      const unitPrice = subtotal / originalQuantity

      return total + unitPrice * quantity
    }, 0)
  }

  const getProductCost = (sale) => {
    return getProductItems(sale).reduce((total, item) => {
      const quantity = getRemainingQuantity(sale, item)

      const costPrice =
        number(item?.costPrice) ||
        number(item?.Product?.costPrice) ||
        number(item?.product?.costPrice) ||
        number(item?.ProductVariant?.costPrice) ||
        number(item?.productVariant?.costPrice)

      return total + costPrice * quantity
    }, 0)
  }

  const getProductProfit = (sale) => {
    return getProductRevenue(sale) - getProductCost(sale)
  }

  const getNetSaleAmount = (sale) => {
    return Math.max(number(sale?.totalAmount) - getSaleReturnTotal(sale), 0)
  }

  // =========================================================
  // CASHIERS
  // =========================================================

  const cashiers = useMemo(() => {
    const map = new Map()

    sales.forEach((sale) => {
      const cashier = getCashierName(sale)

      if (cashier && cashier !== 'Unknown') {
        map.set(cashier, cashier)
      }
    })

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b))
  }, [sales])

  // =========================================================
  // FILTER SALES
  // =========================================================

  const filteredSales = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return sales.filter((sale) => {
      const invoice = String(sale?.invoiceNumber || sale?.receiptNumber || '').toLowerCase()

      const customer = getCustomerName(sale).toLowerCase()

      const cashier = getCashierName(sale).toLowerCase()

      const paymentMethod = getPaymentMethod(sale)

      const products = getProductItems(sale)
        .map((item) => {
          return [getProductName(item), getVariantName(item), item?.sku, item?.barcode]
            .filter(Boolean)
            .join(' ')
        })
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !keyword ||
        invoice.includes(keyword) ||
        customer.includes(keyword) ||
        cashier.includes(keyword) ||
        products.includes(keyword)

      const matchesPayment = !paymentFilter || paymentMethod === paymentFilter

      const matchesCashier = !cashierFilter || cashier === cashierFilter

      return matchesSearch && matchesPayment && matchesCashier
    })
  }, [sales, search, paymentFilter, cashierFilter])

  // =========================================================
  // KPI
  // =========================================================

  const kpis = useMemo(() => {
    let grossSales = 0
    let totalReturns = 0
    let netSales = 0
    let productRevenue = 0
    let productCost = 0
    let productProfit = 0
    let totalItemsSold = 0
    let totalItemsReturned = 0

    filteredSales.forEach((sale) => {
      grossSales += number(sale?.totalAmount)

      totalReturns += getSaleReturnTotal(sale)

      netSales += getNetSaleAmount(sale)

      productRevenue += getProductRevenue(sale)

      productCost += getProductCost(sale)

      productProfit += getProductProfit(sale)

      getProductItems(sale).forEach((item) => {
        totalItemsSold += number(item?.quantity)

        totalItemsReturned += getReturnedQuantity(sale, item)
      })
    })

    /*
     * When there is no client-side search/filter,
     * trust the backend's authoritative calculated
     * values where available.
     */
    const hasClientFilter =
      Boolean(search.trim()) || Boolean(paymentFilter) || Boolean(cashierFilter)

    if (!hasClientFilter) {
      if (report?.grossSales !== undefined) {
        grossSales = number(report.grossSales)
      }

      if (report?.totalReturns !== undefined) {
        totalReturns = number(report.totalReturns)
      }

      if (report?.netSales !== undefined) {
        netSales = number(report.netSales)
      }

      if (report?.productRevenue !== undefined) {
        productRevenue = number(report.productRevenue)
      }

      if (report?.productCost !== undefined) {
        productCost = number(report.productCost)
      }

      if (report?.grossProfit !== undefined) {
        productProfit = number(report.grossProfit)
      }

      if (report?.totalItemsSold !== undefined) {
        totalItemsSold = number(report.totalItemsSold)
      }

      if (report?.totalReturnedItems !== undefined) {
        totalItemsReturned = number(report.totalReturnedItems)
      }
    }

    const totalExpenses = number(report?.totalExpenses)

    const netProfit = productProfit - totalExpenses

    const averageSale = filteredSales.length > 0 ? netSales / filteredSales.length : 0

    return {
      grossSales,
      totalReturns,
      netSales,
      productRevenue,
      productCost,
      productProfit,
      totalExpenses,
      netProfit,
      totalItemsSold,
      totalItemsReturned,
      totalTransactions: filteredSales.length,
      averageSale,
    }
  }, [filteredSales, report, search, paymentFilter, cashierFilter])

  // =========================================================
  // SALES TREND
  // =========================================================

  const salesTrendData = useMemo(() => {
    const grouped = {}

    filteredSales.forEach((sale) => {
      if (!sale?.createdAt) return

      const dateObject = new Date(sale.createdAt)

      if (Number.isNaN(dateObject.getTime())) return

      const key = dateObject.toISOString().slice(0, 10)

      if (!grouped[key]) {
        grouped[key] = {
          key,
          date: dateObject.toLocaleDateString('en-NG', {
            day: '2-digit',
            month: 'short',
          }),
          sales: 0,
          returns: 0,
          netSales: 0,
        }
      }

      grouped[key].sales += number(sale?.totalAmount)

      grouped[key].returns += getSaleReturnTotal(sale)

      grouped[key].netSales += getNetSaleAmount(sale)
    })

    return Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key))
  }, [filteredSales])

  // =========================================================
  // PAYMENT BREAKDOWN
  // =========================================================

  const paymentBreakdownData = useMemo(() => {
    const map = {}

    filteredSales.forEach((sale) => {
      const method = formatPaymentMethod(getPaymentMethod(sale))

      if (!map[method]) {
        map[method] = 0
      }

      map[method] += getNetSaleAmount(sale)
    })

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .filter((item) => item.value > 0)
  }, [filteredSales])

  // =========================================================
  // TOP PRODUCTS
  // =========================================================

  const topProductsData = useMemo(() => {
    const map = {}

    filteredSales.forEach((sale) => {
      getProductItems(sale).forEach((item) => {
        const productName = getProductName(item)
        const variantName = getVariantName(item)

        const label = variantName ? `${productName} - ${variantName}` : productName

        const quantity = getRemainingQuantity(sale, item)

        const subtotal = number(item?.subtotal) || number(item?.price) * number(item?.quantity)

        const originalQuantity = number(item?.quantity)

        const unitPrice = originalQuantity > 0 ? subtotal / originalQuantity : 0

        if (!map[label]) {
          map[label] = {
            name: label,
            quantity: 0,
            revenue: 0,
          }
        }

        map[label].quantity += quantity

        map[label].revenue += unitPrice * quantity
      })
    })

    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }, [filteredSales])

  // =========================================================
  // LOAD REPORT
  // =========================================================

  const getSalesReport = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}/report`, {
        params: {
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(statusFilter && {
            status: statusFilter,
          }),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = response.data || {}

      setReport(data)

      const normalizedSales = (data?.sales || []).map((sale) => ({
        ...sale,
        SaleItems: sale?.SaleItems || sale?.saleItems || sale?.items || [],
        SalesReturns:
          sale?.SalesReturns || sale?.salesReturns || sale?.SalesReturn || sale?.salesReturn || [],
      }))

      setSales(normalizedSales)
    } catch (error) {
      console.error('Report Error:', error)

      console.error('Report response:', error?.response?.data)
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    getSalesReport()
  }, [])

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setStatusFilter('')
    setSearch('')
    setPaymentFilter('')
    setCashierFilter('')
  }

  // =========================================================
  // RETURN
  // =========================================================

  const handleReturn = (sale) => {
    setSelectedSaleId(sale.id)
    setShowReturnModal(true)
  }

  // =========================================================
  // EXCEL EXPORT
  // =========================================================

  const exportExcel = () => {
    const exportData = []

    filteredSales.forEach((sale) => {
      const items = getProductItems(sale)

      const productDetails = items
        .map((item) => {
          const productName = getProductName(item)

          const variantName = getVariantName(item)

          const quantity = number(item?.quantity)

          return variantName
            ? `${productName} (${variantName}) x ${quantity}`
            : `${productName} x ${quantity}`
        })
        .join(', ')

      exportData.push({
        Invoice: sale?.invoiceNumber || sale?.receiptNumber || '-',

        Customer: getCustomerName(sale),

        Cashier: getCashierName(sale),

        Products: productDetails || '-',

        'Payment Method': formatPaymentMethod(getPaymentMethod(sale)),

        'Gross Amount': number(sale?.totalAmount),

        'Returned Amount': getSaleReturnTotal(sale),

        'Net Amount': getNetSaleAmount(sale),

        'Product Cost': getProductCost(sale),

        'Gross Profit': getProductProfit(sale),

        Status: sale?.approvalStatus || sale?.status || '-',

        Date: sale?.createdAt ? formatDate(sale.createdAt) : '-',

        'Card Number': sale?.CardNumber || '-',

        'Stand Tag': sale?.StandTag || '-',
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report')

    const filename =
      startDate || endDate
        ? `Onishakara-Sales-Report-${startDate || 'start'}-${endDate || 'end'}.xlsx`
        : 'Onishakara-Sales-Report.xlsx'

    XLSX.writeFile(workbook, filename)
  }

  // =========================================================
  // CHART COLORS
  // =========================================================

  const CHART_COLORS = ['#c9a227', '#1f2937', '#6b7280', '#d4af37', '#111827']

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="fw-bold mb-1">Sales & Profit Report</h4>

              <div className="text-medium-emphasis">
                Monitor product sales, returns, inventory cost and business profitability.
              </div>
            </div>

            <div className="d-flex gap-2">
              <CButton
                color="secondary"
                variant="outline"
                onClick={getSalesReport}
                disabled={loading}
              >
                <CIcon icon={cilReload} className="me-2" />
                Refresh
              </CButton>

              <CButton color="success" onClick={exportExcel} disabled={!filteredSales.length}>
                <CIcon icon={cilCloudDownload} className="me-2" />
                Export Excel
              </CButton>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
          KPI ROW 1
      ====================================================== */}

      <CRow className="g-3 mb-3">
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Gross Sales</div>

                  <h3 className="fw-bold text-success mb-1">{money(kpis.grossSales)}</h3>

                  <small className="text-medium-emphasis">Before returns</small>
                </div>

                <CIcon icon={cilMoney} size="xl" className="text-success" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Returns</div>

                  <h3 className="fw-bold text-danger mb-1">{money(kpis.totalReturns)}</h3>

                  <small className="text-medium-emphasis">Approved returns</small>
                </div>

                <CIcon icon={cilWarning} size="xl" className="text-danger" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Net Sales</div>

                  <h3 className="fw-bold text-primary mb-1">{money(kpis.netSales)}</h3>

                  <small className="text-medium-emphasis">Sales after returns</small>
                </div>

                <CIcon icon={cilChart} size="xl" className="text-primary" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Transactions</div>

                  <h3 className="fw-bold mb-1">{kpis.totalTransactions.toLocaleString()}</h3>

                  <small className="text-medium-emphasis">Avg: {money(kpis.averageSale)}</small>
                </div>

                <CIcon icon={cilPeople} size="xl" className="text-info" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          KPI ROW 2
      ====================================================== */}

      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Product Revenue</div>

              <h3 className="fw-bold mb-1">{money(kpis.productRevenue)}</h3>

              <small className="text-medium-emphasis">Remaining product value</small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Cost of Goods</div>

              <h3 className="fw-bold text-warning mb-1">{money(kpis.productCost)}</h3>

              <small className="text-medium-emphasis">Product purchase cost</small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Gross Profit</div>

              <h3 className="fw-bold text-success mb-1">{money(kpis.productProfit)}</h3>

              <small className="text-medium-emphasis">Revenue − product cost</small>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Net Profit</div>

              <h3 className="fw-bold text-success mb-1">{money(kpis.netProfit)}</h3>

              <small className="text-medium-emphasis">Gross profit − expenses</small>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          KPI ROW 3
      ====================================================== */}

      <CRow className="g-3 mb-4">
        <CCol xs={12} md={4}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Total Items Sold</div>

              <h4 className="fw-bold mb-0">{kpis.totalItemsSold.toLocaleString()}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} md={4}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Items Returned</div>

              <h4 className="fw-bold text-danger mb-0">
                {kpis.totalItemsReturned.toLocaleString()}
              </h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} md={4}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Total Expenses</div>

              <h4 className="fw-bold text-warning mb-0">{money(kpis.totalExpenses)}</h4>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          CHARTS
      ====================================================== */}

      <CRow className="g-3 mb-4">
        {/* SALES TREND */}

        <CCol xs={12} lg={8}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Sales Performance</h5>

              <small className="text-medium-emphasis">
                Gross sales, returns and net sales across the selected period.
              </small>
            </CCardHeader>

            <CCardBody>
              {salesTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={330}>
                  <LineChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis dataKey="date" tickLine={false} axisLine={false} />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₦${Number(value).toLocaleString()}`}
                    />

                    <Tooltip formatter={(value) => money(value)} />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="sales"
                      name="Gross Sales"
                      stroke="#2eb85c"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="netSales"
                      name="Net Sales"
                      stroke="#321fdb"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="returns"
                      name="Returns"
                      stroke="#e55353"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-medium-emphasis py-5">
                  No sales data available.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* PAYMENT BREAKDOWN */}

        <CCol xs={12} lg={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Payment Breakdown</h5>

              <small className="text-medium-emphasis">Net sales by payment method.</small>
            </CCardHeader>

            <CCardBody>
              {paymentBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={330}>
                  <PieChart>
                    <Pie
                      data={paymentBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      innerRadius={55}
                      paddingAngle={3}
                    >
                      {paymentBreakdownData.map((entry, index) => (
                        <Cell
                          key={`payment-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip formatter={(value) => money(value)} />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-medium-emphasis py-5">
                  No payment data available.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          TOP PRODUCTS
      ====================================================== */}

      <CRow className="g-3 mb-4">
        <CCol xs={12}>
          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Top Selling Products</h5>

              <small className="text-medium-emphasis">Products ranked by quantity sold.</small>
            </CCardHeader>

            <CCardBody>
              {topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={topProductsData}
                    layout="vertical"
                    margin={{
                      left: 30,
                      right: 30,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />

                    <XAxis type="number" tickLine={false} axisLine={false} />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={180}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Quantity Sold') {
                          return Number(value).toLocaleString()
                        }

                        return money(value)
                      }}
                    />

                    <Legend />

                    <Bar
                      dataKey="quantity"
                      name="Quantity Sold"
                      fill="#c9a227"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-medium-emphasis py-5">
                  No product sales available.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-transparent border-0">
          <div className="d-flex align-items-center">
            <CIcon icon={cilFilter} className="me-2" />

            <strong>Report Filters</strong>
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow className="g-3">
            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Start Date</label>

              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">End Date</label>

              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Status</label>

              <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>

                <option value="approved">Approved</option>

                <option value="pending">Pending</option>

                <option value="declined">Declined</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Payment</label>

              <CFormSelect value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="">All Payments</option>

                <option value="cash">Cash</option>

                <option value="pos">POS</option>

                <option value="transfer">Transfer</option>

                <option value="mixed">Mixed</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Cashier</label>

              <CFormSelect value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)}>
                <option value="">All Cashiers</option>

                {cashiers.map((cashier) => (
                  <option key={cashier} value={cashier}>
                    {cashier}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Search</label>

              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>

                <CFormInput
                  placeholder="Invoice, customer, product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>
          </CRow>

          <div className="mt-3 d-flex gap-2 flex-wrap">
            <CButton color="primary" onClick={getSalesReport} disabled={loading}>
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Loading...
                </>
              ) : (
                <>
                  <CIcon icon={cilFilter} className="me-2" />
                  Apply Filters
                </>
              )}
            </CButton>

            <CButton color="secondary" variant="outline" onClick={clearFilters}>
              Clear Filters
            </CButton>
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
          CURRENT FILTER SUMMARY
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <div className="d-flex align-items-center flex-wrap gap-3">
            <strong>Current Report:</strong>

            {startDate && (
              <CBadge color="dark" className="px-3 py-2">
                From: {startDate}
              </CBadge>
            )}

            {endDate && (
              <CBadge color="dark" className="px-3 py-2">
                To: {endDate}
              </CBadge>
            )}

            {statusFilter && (
              <CBadge color="primary" className="px-3 py-2">
                Status: {statusFilter}
              </CBadge>
            )}

            {paymentFilter && (
              <CBadge color="info" className="px-3 py-2">
                Payment: {formatPaymentMethod(paymentFilter)}
              </CBadge>
            )}

            {cashierFilter && (
              <CBadge color="warning" textColor="dark" className="px-3 py-2">
                Cashier: {cashierFilter}
              </CBadge>
            )}

            {search && (
              <CBadge color="secondary" className="px-3 py-2">
                Search: {search}
              </CBadge>
            )}

            <span className="text-medium-emphasis">
              {filteredSales.length} transaction
              {filteredSales.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
          SALES TABLE
      ====================================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-transparent">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="mb-1 fw-bold">Sales Transactions</h5>

              <small className="text-medium-emphasis">
                Showing {filteredSales.length} transaction
                {filteredSales.length !== 1 ? 's' : ''}
              </small>
            </div>

            <div className="d-flex gap-2">
              <CBadge color="success" className="px-3 py-2">
                Net Sales: {money(kpis.netSales)}
              </CBadge>

              <CBadge color="warning" textColor="dark" className="px-3 py-2">
                Profit: {money(kpis.productProfit)}
              </CBadge>
            </div>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <CSpinner />

              <div className="mt-3 text-medium-emphasis">Loading report...</div>
            </div>
          ) : (
            <CTable hover responsive className="mb-0 align-middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Invoice</CTableHeaderCell>

                  <CTableHeaderCell>Customer</CTableHeaderCell>

                  <CTableHeaderCell>Cashier</CTableHeaderCell>

                  <CTableHeaderCell>Products</CTableHeaderCell>

                  <CTableHeaderCell>Payment</CTableHeaderCell>

                  <CTableHeaderCell>Gross</CTableHeaderCell>

                  <CTableHeaderCell>Return</CTableHeaderCell>

                  <CTableHeaderCell>Net</CTableHeaderCell>

                  <CTableHeaderCell>Cost</CTableHeaderCell>

                  <CTableHeaderCell>Profit</CTableHeaderCell>

                  <CTableHeaderCell>Status</CTableHeaderCell>

                  <CTableHeaderCell>Date</CTableHeaderCell>

                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => {
                    const items = getProductItems(sale)

                    const returnAmount = getSaleReturnTotal(sale)

                    const netAmount = getNetSaleAmount(sale)

                    const productCost = getProductCost(sale)

                    const profit = getProductProfit(sale)

                    const hasReturn = returnAmount > 0

                    const status = String(
                      sale?.approvalStatus || sale?.status || 'pending',
                    ).toLowerCase()

                    return (
                      <CTableRow key={sale.id}>
                        {/* INVOICE */}

                        <CTableDataCell>
                          <strong>{sale?.invoiceNumber || sale?.receiptNumber || '-'}</strong>

                          {hasReturn && (
                            <div className="mt-1">
                              <CBadge color="danger">RETURN: {money(returnAmount)}</CBadge>
                            </div>
                          )}
                        </CTableDataCell>

                        {/* CUSTOMER */}

                        <CTableDataCell>{getCustomerName(sale)}</CTableDataCell>

                        {/* CASHIER */}

                        <CTableDataCell>{getCashierName(sale)}</CTableDataCell>

                        {/* PRODUCTS */}

                        <CTableDataCell
                          style={{
                            minWidth: 220,
                          }}
                        >
                          {items.length > 0 ? (
                            items.map((item, index) => {
                              const productName = getProductName(item)

                              const variantName = getVariantName(item)

                              const soldQty = number(item?.quantity)

                              const remainingQty = getRemainingQuantity(sale, item)

                              const returnedQty = Math.max(soldQty - remainingQty, 0)

                              return (
                                <div key={item?.id || index} className="mb-2">
                                  <div className="fw-semibold">{productName}</div>

                                  {variantName && (
                                    <div className="small text-primary">{variantName}</div>
                                  )}

                                  <small className="text-medium-emphasis">
                                    Sold: {soldQty}
                                    {returnedQty > 0 && <> • Returned: {returnedQty}</>}
                                    {remainingQty > 0 && returnedQty > 0 && (
                                      <> • Remaining: {remainingQty}</>
                                    )}
                                  </small>

                                  {remainingQty === 0 && soldQty > 0 && (
                                    <div>
                                      <CBadge color="danger" className="mt-1">
                                        FULLY RETURNED
                                      </CBadge>
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <span className="text-medium-emphasis">No products</span>
                          )}
                        </CTableDataCell>

                        {/* PAYMENT */}

                        <CTableDataCell>
                          <CBadge color="dark">
                            {formatPaymentMethod(getPaymentMethod(sale))}
                          </CBadge>
                        </CTableDataCell>

                        {/* GROSS */}

                        <CTableDataCell>
                          <strong>{money(sale?.totalAmount)}</strong>
                        </CTableDataCell>

                        {/* RETURN */}

                        <CTableDataCell>
                          {returnAmount > 0 ? (
                            <span className="text-danger fw-semibold">-{money(returnAmount)}</span>
                          ) : (
                            '-'
                          )}
                        </CTableDataCell>

                        {/* NET */}

                        <CTableDataCell>
                          <strong className="text-primary">{money(netAmount)}</strong>
                        </CTableDataCell>

                        {/* COST */}

                        <CTableDataCell>{money(productCost)}</CTableDataCell>

                        {/* PROFIT */}

                        <CTableDataCell>
                          <strong className={profit >= 0 ? 'text-success' : 'text-danger'}>
                            {money(profit)}
                          </strong>
                        </CTableDataCell>

                        {/* STATUS */}

                        <CTableDataCell>
                          <CBadge
                            color={
                              status === 'approved' || status === 'completed'
                                ? 'success'
                                : status === 'declined' || status === 'voided'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {status}
                          </CBadge>

                          {hasReturn && (
                            <div className="mt-1">
                              <CBadge color="danger">RETURN</CBadge>
                            </div>
                          )}
                        </CTableDataCell>

                        {/* DATE */}

                        <CTableDataCell>{formatDate(sale?.createdAt)}</CTableDataCell>

                        {/* ACTION */}

                        <CTableDataCell>
                          <CButton
                            color="warning"
                            size="sm"
                            disabled={status === 'voided' || status === 'declined'}
                            onClick={() => handleReturn(sale)}
                          >
                            <CIcon icon={cilCart} className="me-1" />
                            Return
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan="13" className="text-center py-5">
                      <CIcon icon={cilSearch} size="xl" className="text-medium-emphasis mb-3" />

                      <h5>No sales found</h5>

                      <p className="text-medium-emphasis mb-0">
                        Try changing the date, payment, cashier or search filters.
                      </p>
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* =====================================================
          RETURN MODAL
      ====================================================== */}

      <ReturnModal
        show={showReturnModal}
        onHide={() => setShowReturnModal(false)}
        saleId={selectedSaleId}
        reload={getSalesReport}
      />
    </>
  )
}

export default Report
