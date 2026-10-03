import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import './stock.css'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
const API_URL = `${API_ROOT}/api/v1`

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('authToken') ||
  ''

const money = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const getData = (response) => {
  if (!response) return null

  return response.data?.data || response.data?.result || response.data || response
}

const getArray = (response, keys = []) => {
  const data = getData(response)

  if (Array.isArray(data)) return data

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(response?.data?.[key])) return response.data[key]
  }

  return []
}

const getProductName = (item) =>
  item?.Product?.name || item?.product?.name || item?.productName || item?.name || 'Unknown Product'

const getVariantName = (item) => {
  const variant = item?.Variant || item?.ProductVariant || item?.variant || item

  const parts = []

  if (variant?.size) parts.push(`Size: ${variant.size}`)
  if (variant?.color) parts.push(`Colour: ${variant.color}`)

  return parts.join(' • ')
}

const getStockQuantity = (item) =>
  Number(item?.quantity ?? item?.stockQuantity ?? item?.currentStock ?? 0)

const getReorderLevel = (item) =>
  Number(item?.reorderLevel ?? item?.Product?.reorderLevel ?? item?.product?.reorderLevel ?? 0)

const getSellingPrice = (item) =>
  Number(item?.sellingPrice ?? item?.Product?.sellingPrice ?? item?.product?.sellingPrice ?? 0)

const getCostPrice = (item) =>
  Number(item?.costPrice ?? item?.Product?.costPrice ?? item?.product?.costPrice ?? 0)

const getStockStatus = (item) => {
  const quantity = getStockQuantity(item)
  const reorder = getReorderLevel(item)

  if (quantity <= 0) return 'out'
  if (quantity <= reorder) return 'low'
  return 'normal'
}

const Stock = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [stock, setStock] = useState([])
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalStockValue: 0,
    lowStock: 0,
    outOfStock: 0,
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)

  const [adjustModal, setAdjustModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const [adjustment, setAdjustment] = useState({
    quantity: '',
    reason: '',
    notes: '',
    variantId: '',
  })

  const [adjusting, setAdjusting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    }),
    [],
  )

  const fetchStock = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true)
        else setRefreshing(true)

        setError('')

        const response = await fetch(`${API_URL}/stock`, {
          method: 'GET',
          headers,
        })

        const json = await response.json()

        if (!response.ok) {
          throw new Error(json?.message || 'Unable to load stock.')
        }

        const list = getArray(json, ['stock', 'products', 'items', 'rows', 'results'])

        setStock(list)
      } catch (err) {
        console.error('Stock loading error:', err)
        setError(err.message || 'Unable to load stock.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [headers],
  )

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/stock/summary`, {
        headers,
      })

      const json = await response.json()

      if (!response.ok) return

      const data = getData(json) || {}

      setSummary({
        totalProducts: Number(
          data.totalProducts ?? data.total_products ?? data.productCount ?? data.totalItems ?? 0,
        ),
        totalQuantity: Number(data.totalQuantity ?? data.total_quantity ?? data.totalStock ?? 0),
        totalStockValue: Number(
          data.totalStockValue ?? data.total_stock_value ?? data.stockValue ?? 0,
        ),
        lowStock: Number(data.lowStock ?? data.low_stock ?? data.lowStockCount ?? 0),
        outOfStock: Number(data.outOfStock ?? data.out_of_stock ?? data.outOfStockCount ?? 0),
      })
    } catch (err) {
      console.error('Stock summary error:', err)
    }
  }, [headers])

  useEffect(() => {
    fetchStock()
    fetchSummary()
  }, [fetchStock, fetchSummary])

  const refreshAll = async () => {
    await Promise.all([fetchStock(false), fetchSummary()])
  }

  const categories = useMemo(() => {
    const values = new Set()

    stock.forEach((item) => {
      const category =
        item?.Category?.name ||
        item?.Product?.Category?.name ||
        item?.category?.name ||
        item?.categoryName

      if (category) values.add(category)
    })

    return Array.from(values).sort()
  }, [stock])

  const filteredStock = useMemo(() => {
    let result = [...stock]

    const keyword = search.trim().toLowerCase()

    if (keyword) {
      result = result.filter((item) => {
        const productName = getProductName(item).toLowerCase()

        const sku = String(
          item?.sku || item?.Product?.sku || item?.product?.sku || '',
        ).toLowerCase()

        const barcode = String(
          item?.barcode || item?.Product?.barcode || item?.product?.barcode || '',
        ).toLowerCase()

        const variant = getVariantName(item).toLowerCase()

        return (
          productName.includes(keyword) ||
          sku.includes(keyword) ||
          barcode.includes(keyword) ||
          variant.includes(keyword)
        )
      })
    }

    if (statusFilter !== 'all') {
      result = result.filter((item) => getStockStatus(item) === statusFilter)
    }

    if (categoryFilter !== 'all') {
      result = result.filter((item) => {
        const category =
          item?.Category?.name ||
          item?.Product?.Category?.name ||
          item?.category?.name ||
          item?.categoryName

        return category === categoryFilter
      })
    }

    return result
  }, [stock, search, statusFilter, categoryFilter])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, categoryFilter, perPage])

  const totalPages = Math.max(1, Math.ceil(filteredStock.length / perPage))

  const paginatedStock = useMemo(() => {
    const start = (page - 1) * perPage
    return filteredStock.slice(start, start + perPage)
  }, [filteredStock, page, perPage])

  const openAdjustment = (item) => {
    setSelectedItem(item)

    setAdjustment({
      quantity: getStockQuantity(item),
      reason: '',
      notes: '',
      variantId:
        item?.variantId ||
        item?.ProductVariantId ||
        item?.ProductVariant?.id ||
        item?.Variant?.id ||
        '',
    })

    setAdjustModal(true)
  }

  const closeAdjustment = () => {
    if (adjusting) return

    setAdjustModal(false)
    setSelectedItem(null)

    setAdjustment({
      quantity: '',
      reason: '',
      notes: '',
      variantId: '',
    })
  }

  const submitAdjustment = async () => {
    if (!selectedItem) return

    const quantity = Number(adjustment.quantity)

    if (!Number.isFinite(quantity) || quantity < 0) {
      setError('Enter a valid stock quantity.')
      return
    }

    if (!adjustment.reason.trim()) {
      setError('Please enter a reason for the stock adjustment.')
      return
    }

    try {
      setAdjusting(true)
      setError('')
      setSuccessMessage('')

      const productId =
        selectedItem?.productId ||
        selectedItem?.ProductId ||
        selectedItem?.Product?.id ||
        selectedItem?.id

      const body = {
        quantity,
        reason: adjustment.reason.trim(),
        notes: adjustment.notes.trim(),
      }

      if (adjustment.variantId) {
        body.variantId = Number(adjustment.variantId)
      }

      const response = await fetch(`${API_URL}/stock/${productId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json?.message || 'Stock adjustment failed.')
      }

      setSuccessMessage(`${getProductName(selectedItem)} stock updated successfully.`)

      closeAdjustment()

      await refreshAll()
    } catch (err) {
      console.error('Stock adjustment error:', err)
      setError(err.message || 'Unable to adjust stock.')
    } finally {
      setAdjusting(false)
    }
  }

  const exportCSV = () => {
    const rows = filteredStock.map((item) => {
      const productName = getProductName(item)
      const variant = getVariantName(item)

      const sku = item?.sku || item?.Product?.sku || item?.product?.sku || ''

      const barcode = item?.barcode || item?.Product?.barcode || item?.product?.barcode || ''

      const quantity = getStockQuantity(item)
      const reorder = getReorderLevel(item)
      const cost = getCostPrice(item)
      const selling = getSellingPrice(item)

      let status = 'In Stock'

      if (quantity <= 0) status = 'Out of Stock'
      else if (quantity <= reorder) status = 'Low Stock'

      return [
        productName,
        variant,
        sku,
        barcode,
        quantity,
        reorder,
        cost,
        selling,
        quantity * cost,
        status,
      ]
    })

    const csv = [
      [
        'Product',
        'Variant',
        'SKU',
        'Barcode',
        'Quantity',
        'Reorder Level',
        'Cost Price',
        'Selling Price',
        'Stock Value',
        'Status',
      ],
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const stringValue = String(value ?? '')
            return `"${stringValue.replace(/"/g, '""')}"`
          })
          .join(','),
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `onishakara-stock-${new Date().toISOString().slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  const statusBadge = (item) => {
    const status = getStockStatus(item)

    if (status === 'out') {
      return (
        <CBadge color="danger" className="oni-stock-status">
          Out of Stock
        </CBadge>
      )
    }

    if (status === 'low') {
      return (
        <CBadge color="warning" className="oni-stock-status">
          Low Stock
        </CBadge>
      )
    }

    return (
      <CBadge color="success" className="oni-stock-status">
        In Stock
      </CBadge>
    )
  }

  const getPageNumbers = () => {
    const pages = []

    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)

    for (let i = start; i <= end; i += 1) {
      pages.push(i)
    }

    return pages
  }

  return (
    <div className="oni-stock-page">
      {/* HEADER */}
      <div className="oni-stock-header">
        <div>
          <div className="oni-stock-eyebrow">INVENTORY CONTROL</div>

          <h1>Stock Management</h1>

          <p>Monitor inventory, manage stock levels and record stock adjustments.</p>
        </div>

        <div className="oni-stock-header-actions">
          <CButton className="oni-stock-dark-button" onClick={() => navigate('/stock/history')}>
            Stock History
          </CButton>

          <CButton
            className="oni-stock-outline-button"
            onClick={exportCSV}
            disabled={!filteredStock.length}
          >
            Export CSV
          </CButton>

          <CButton className="oni-stock-gold-button" onClick={refreshAll} disabled={refreshing}>
            {refreshing ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </CButton>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {successMessage && (
        <CAlert color="success" dismissible onClose={() => setSuccessMessage('')}>
          {successMessage}
        </CAlert>
      )}

      {/* SUMMARY */}
      <CRow className="g-3 oni-stock-summary">
        <CCol md={6} xl={3}>
          <div className="oni-stock-summary-card">
            <div className="oni-stock-summary-icon">▣</div>

            <div>
              <span>Total Products</span>
              <strong>{summary.totalProducts.toLocaleString()}</strong>
            </div>
          </div>
        </CCol>

        <CCol md={6} xl={3}>
          <div className="oni-stock-summary-card">
            <div className="oni-stock-summary-icon">▤</div>

            <div>
              <span>Total Quantity</span>
              <strong>{summary.totalQuantity.toLocaleString()}</strong>
            </div>
          </div>
        </CCol>

        <CCol md={6} xl={3}>
          <div className="oni-stock-summary-card">
            <div className="oni-stock-summary-icon">₦</div>

            <div>
              <span>Stock Value</span>
              <strong>{money(summary.totalStockValue)}</strong>
            </div>
          </div>
        </CCol>

        <CCol md={6} xl={3}>
          <div className="oni-stock-summary-card oni-stock-alert-card">
            <div className="oni-stock-summary-icon">!</div>

            <div>
              <span>Attention Required</span>
              <strong>
                {(Number(summary.lowStock || 0) + Number(summary.outOfStock || 0)).toLocaleString()}
              </strong>

              <small>
                {summary.lowStock} low · {summary.outOfStock} out
              </small>
            </div>
          </div>
        </CCol>
      </CRow>

      {/* QUICK FILTERS */}
      <div className="oni-stock-quick-filters">
        <button
          type="button"
          className={statusFilter === 'all' ? 'active' : ''}
          onClick={() => setStatusFilter('all')}
        >
          All Stock
          <span>{stock.length}</span>
        </button>

        <button
          type="button"
          className={statusFilter === 'normal' ? 'active' : ''}
          onClick={() => setStatusFilter('normal')}
        >
          In Stock
          <span>{stock.filter((item) => getStockStatus(item) === 'normal').length}</span>
        </button>

        <button
          type="button"
          className={statusFilter === 'low' ? 'active' : ''}
          onClick={() => setStatusFilter('low')}
        >
          Low Stock
          <span>{stock.filter((item) => getStockStatus(item) === 'low').length}</span>
        </button>

        <button
          type="button"
          className={statusFilter === 'out' ? 'active' : ''}
          onClick={() => setStatusFilter('out')}
        >
          Out of Stock
          <span>{stock.filter((item) => getStockStatus(item) === 'out').length}</span>
        </button>
      </div>

      {/* FILTERS */}
      <CCard className="oni-stock-filter-card">
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol lg={5}>
              <label className="oni-stock-label">Search Inventory</label>

              <CFormInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, SKU, barcode or variant..."
                className="oni-stock-input"
              />
            </CCol>

            <CCol sm={6} lg={3}>
              <label className="oni-stock-label">Stock Status</label>

              <CFormSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="oni-stock-input"
              >
                <option value="all">All Status</option>
                <option value="normal">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </CFormSelect>
            </CCol>

            <CCol sm={6} lg={2}>
              <label className="oni-stock-label">Category</label>

              <CFormSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="oni-stock-input"
              >
                <option value="all">All Categories</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol sm={6} lg={2}>
              <label className="oni-stock-label">Per Page</label>

              <CFormSelect
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="oni-stock-input"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </CFormSelect>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* TABLE */}
      <CCard className="oni-stock-table-card">
        <div className="oni-stock-table-header">
          <div>
            <h3>Inventory</h3>

            <p>
              Showing {filteredStock.length.toLocaleString()} item
              {filteredStock.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="oni-stock-table-total">
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div className="oni-stock-loading">
            <CSpinner />
            <p>Loading inventory...</p>
          </div>
        ) : paginatedStock.length === 0 ? (
          <div className="oni-stock-empty">
            <div className="oni-stock-empty-icon">▱</div>

            <h4>No stock records found</h4>

            <p>Try changing your search or filter settings.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <CTable hover align="middle" className="oni-stock-table">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>PRODUCT</CTableHeaderCell>
                  <CTableHeaderCell>SKU / BARCODE</CTableHeaderCell>
                  <CTableHeaderCell>VARIANT</CTableHeaderCell>
                  <CTableHeaderCell>STOCK</CTableHeaderCell>
                  <CTableHeaderCell>REORDER</CTableHeaderCell>
                  <CTableHeaderCell>COST</CTableHeaderCell>
                  <CTableHeaderCell>SELLING</CTableHeaderCell>
                  <CTableHeaderCell>STOCK VALUE</CTableHeaderCell>
                  <CTableHeaderCell>STATUS</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">ACTION</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {paginatedStock.map((item, index) => {
                  const quantity = getStockQuantity(item)
                  const reorder = getReorderLevel(item)
                  const cost = getCostPrice(item)
                  const selling = getSellingPrice(item)
                  const variant = getVariantName(item)

                  const productId =
                    item?.productId || item?.ProductId || item?.Product?.id || item?.id

                  const sku = item?.sku || item?.Product?.sku || item?.product?.sku || '—'

                  const barcode =
                    item?.barcode || item?.Product?.barcode || item?.product?.barcode || '—'

                  const category =
                    item?.Category?.name ||
                    item?.Product?.Category?.name ||
                    item?.category?.name ||
                    ''

                  return (
                    <CTableRow key={item?.id || `${productId}-${item?.variantId || index}`}>
                      <CTableDataCell>
                        <div className="oni-product-cell">
                          <div className="oni-product-avatar">
                            {getProductName(item).charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{getProductName(item)}</strong>

                            {category && <small>{category}</small>}
                          </div>
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="oni-code-cell">
                          <strong>{sku}</strong>
                          <small>{barcode}</small>
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        {variant ? (
                          <span className="oni-variant">{variant}</span>
                        ) : (
                          <span className="text-muted">No variant</span>
                        )}
                      </CTableDataCell>

                      <CTableDataCell>
                        <strong
                          className={
                            quantity <= 0
                              ? 'oni-stock-number danger'
                              : quantity <= reorder
                                ? 'oni-stock-number warning'
                                : 'oni-stock-number'
                          }
                        >
                          {quantity.toLocaleString()}
                        </strong>
                      </CTableDataCell>

                      <CTableDataCell>{reorder.toLocaleString()}</CTableDataCell>

                      <CTableDataCell>{money(cost)}</CTableDataCell>

                      <CTableDataCell>{money(selling)}</CTableDataCell>

                      <CTableDataCell>
                        <strong>{money(quantity * cost)}</strong>
                      </CTableDataCell>

                      <CTableDataCell>{statusBadge(item)}</CTableDataCell>

                      <CTableDataCell className="text-end">
                        <div className="oni-stock-actions">
                          <CButton
                            size="sm"
                            className="oni-action-button"
                            onClick={() => openAdjustment(item)}
                          >
                            Adjust
                          </CButton>

                          <CButton
                            size="sm"
                            className="oni-history-button"
                            onClick={() => navigate(`/stock/history?productId=${productId}`)}
                          >
                            History
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filteredStock.length > 0 && (
          <div className="oni-stock-pagination">
            <div>
              Showing <strong>{(page - 1) * perPage + 1}</strong> –{' '}
              <strong>{Math.min(page * perPage, filteredStock.length)}</strong> of{' '}
              <strong>{filteredStock.length}</strong>
            </div>

            <div className="oni-pagination-buttons">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>

              {getPageNumbers().map((number) => (
                <button
                  type="button"
                  key={number}
                  className={page === number ? 'active' : ''}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CCard>

      {/* ADJUSTMENT MODAL */}
      <CModal
        visible={adjustModal}
        onClose={closeAdjustment}
        alignment="center"
        size="lg"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Adjust Stock</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {selectedItem && (
            <>
              <div className="oni-adjust-product">
                <div className="oni-adjust-avatar">
                  {getProductName(selectedItem).charAt(0).toUpperCase()}
                </div>

                <div>
                  <h5>{getProductName(selectedItem)}</h5>

                  <p>{getVariantName(selectedItem) || 'Main product stock'}</p>
                </div>
              </div>

              <CRow className="g-3">
                <CCol md={6}>
                  <label className="oni-stock-label">Current Quantity</label>

                  <CFormInput
                    value={getStockQuantity(selectedItem)}
                    disabled
                    className="oni-stock-input"
                  />
                </CCol>

                <CCol md={6}>
                  <label className="oni-stock-label">New Quantity *</label>

                  <CFormInput
                    type="number"
                    min="0"
                    value={adjustment.quantity}
                    onChange={(e) =>
                      setAdjustment((current) => ({
                        ...current,
                        quantity: e.target.value,
                      }))
                    }
                    className="oni-stock-input oni-adjust-quantity"
                  />
                </CCol>

                <CCol md={12}>
                  <label className="oni-stock-label">Reason *</label>

                  <CFormSelect
                    value={adjustment.reason}
                    onChange={(e) =>
                      setAdjustment((current) => ({
                        ...current,
                        reason: e.target.value,
                      }))
                    }
                    className="oni-stock-input"
                  >
                    <option value="">Select adjustment reason</option>
                    <option value="Physical stock count">Physical stock count</option>
                    <option value="Opening stock">Opening stock</option>
                    <option value="Damaged stock">Damaged stock</option>
                    <option value="Lost stock">Lost stock</option>
                    <option value="Stock correction">Stock correction</option>
                    <option value="Found stock">Found stock</option>
                    <option value="Other">Other</option>
                  </CFormSelect>
                </CCol>

                <CCol md={12}>
                  <label className="oni-stock-label">Notes</label>

                  <textarea
                    className="form-control oni-stock-textarea"
                    rows="4"
                    value={adjustment.notes}
                    onChange={(e) =>
                      setAdjustment((current) => ({
                        ...current,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add additional information about this adjustment..."
                  />
                </CCol>
              </CRow>

              <div className="oni-adjust-preview">
                <div>
                  <span>Current Stock</span>
                  <strong>{getStockQuantity(selectedItem)}</strong>
                </div>

                <div className="oni-adjust-arrow">→</div>

                <div>
                  <span>New Stock</span>
                  <strong>{Number(adjustment.quantity || 0)}</strong>
                </div>

                <div>
                  <span>Change</span>

                  <strong
                    className={
                      Number(adjustment.quantity || 0) - getStockQuantity(selectedItem) < 0
                        ? 'danger'
                        : 'positive'
                    }
                  >
                    {Number(adjustment.quantity || 0) - getStockQuantity(selectedItem) > 0
                      ? '+'
                      : ''}
                    {(
                      Number(adjustment.quantity || 0) - getStockQuantity(selectedItem)
                    ).toLocaleString()}
                  </strong>
                </div>
              </div>
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton className="oni-modal-cancel" onClick={closeAdjustment} disabled={adjusting}>
            Cancel
          </CButton>

          <CButton
            className="oni-stock-gold-button"
            onClick={submitAdjustment}
            disabled={adjusting}
          >
            {adjusting ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Stock Adjustment'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Stock
