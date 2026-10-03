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
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import './stock.css'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
const API_URL = `${API_ROOT}/api/v1`

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('authToken') ||
  ''

const getData = (response) =>
  response?.data?.data || response?.data?.result || response?.data || response

const getArray = (response) => {
  const data = getData(response)

  if (Array.isArray(data)) return data

  if (Array.isArray(data?.movements)) return data.movements
  if (Array.isArray(data?.history)) return data.history
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.results)) return data.results

  return []
}

const money = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatDate = (date) => {
  if (!date) return '—'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getMovementLabel = (type) => {
  const labels = {
    purchase: 'Purchase',
    sale: 'Sale',
    adjustment: 'Adjustment',
    return: 'Return',
    damage: 'Damage',
    loss: 'Loss',
    opening: 'Opening Stock',
    transfer: 'Transfer',
  }

  return labels[type] || type || 'Unknown'
}

const getMovementColor = (type) => {
  if (type === 'purchase' || type === 'return' || type === 'opening') {
    return 'success'
  }

  if (type === 'sale') return 'info'

  if (type === 'damage' || type === 'loss') return 'danger'

  return 'warning'
}

const StockHistory = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const queryProductId = new URLSearchParams(location.search).get('productId')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [movements, setMovements] = useState([])

  const [search, setSearch] = useState('')
  const [movementType, setMovementType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    }),
    [],
  )

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      let url = `${API_URL}/stock/history`

      if (queryProductId) {
        url = `${API_URL}/stock/${queryProductId}/history`
      }

      const params = new URLSearchParams()

      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      if (movementType !== 'all') {
        params.append('movementType', movementType)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
        headers,
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json?.message || 'Unable to load stock history.')
      }

      setMovements(getArray(json))
    } catch (err) {
      console.error('Stock history error:', err)
      setError(err.message || 'Unable to load stock history.')
    } finally {
      setLoading(false)
    }
  }, [headers, queryProductId, dateFrom, dateTo, movementType])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    setPage(1)
  }, [search, movementType, dateFrom, dateTo, perPage])

  const filteredMovements = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return movements

    return movements.filter((movement) => {
      const product =
        movement?.Product?.name || movement?.product?.name || movement?.productName || ''

      const reference = movement?.referenceNumber || movement?.referenceId || ''

      const reason = movement?.reason || ''
      const notes = movement?.notes || ''

      return (
        String(product).toLowerCase().includes(keyword) ||
        String(reference).toLowerCase().includes(keyword) ||
        String(reason).toLowerCase().includes(keyword) ||
        String(notes).toLowerCase().includes(keyword)
      )
    })
  }, [movements, search])

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / perPage))

  const paginatedMovements = useMemo(() => {
    const start = (page - 1) * perPage

    return filteredMovements.slice(start, start + perPage)
  }, [filteredMovements, page, perPage])

  const exportCSV = () => {
    const rows = filteredMovements.map((movement) => [
      movement?.Product?.name || movement?.product?.name || movement?.productName || '',
      movement?.Variant?.size || movement?.ProductVariant?.size || '',
      movement?.Variant?.color || movement?.ProductVariant?.color || '',
      getMovementLabel(movement?.movementType),
      movement?.quantityBefore ?? 0,
      movement?.quantityChange ?? 0,
      movement?.quantityAfter ?? 0,
      movement?.referenceType || '',
      movement?.referenceNumber || movement?.referenceId || '',
      movement?.reason || '',
      movement?.notes || '',
      formatDate(movement?.createdAt),
    ])

    const csv = [
      [
        'Product',
        'Size',
        'Colour',
        'Movement',
        'Before',
        'Change',
        'After',
        'Reference Type',
        'Reference',
        'Reason',
        'Notes',
        'Date',
      ],
      ...rows,
    ]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `onishakara-stock-history-${new Date().toISOString().slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="oni-stock-page">
      <div className="oni-stock-header">
        <div>
          <div className="oni-stock-eyebrow">INVENTORY AUDIT</div>

          <h1>Stock History</h1>

          <p>Track every movement made to your inventory.</p>
        </div>

        <div className="oni-stock-header-actions">
          <CButton className="oni-stock-dark-button" onClick={() => navigate('/stock')}>
            Back to Stock
          </CButton>

          <CButton
            className="oni-stock-outline-button"
            onClick={exportCSV}
            disabled={!filteredMovements.length}
          >
            Export CSV
          </CButton>

          <CButton className="oni-stock-gold-button" onClick={fetchHistory} disabled={loading}>
            Refresh
          </CButton>
        </div>
      </div>

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      <CCard className="oni-stock-filter-card">
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol lg={4}>
              <label className="oni-stock-label">Search</label>

              <CFormInput
                className="oni-stock-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Product, reference or reason..."
              />
            </CCol>

            <CCol sm={6} lg={2}>
              <label className="oni-stock-label">Movement</label>

              <CFormSelect
                className="oni-stock-input"
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
              >
                <option value="all">All Movements</option>
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return</option>
                <option value="damage">Damage</option>
                <option value="loss">Loss</option>
                <option value="opening">Opening</option>
                <option value="transfer">Transfer</option>
              </CFormSelect>
            </CCol>

            <CCol sm={6} lg={2}>
              <label className="oni-stock-label">From</label>

              <CFormInput
                type="date"
                className="oni-stock-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </CCol>

            <CCol sm={6} lg={2}>
              <label className="oni-stock-label">To</label>

              <CFormInput
                type="date"
                className="oni-stock-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </CCol>

            <CCol sm={6} lg={2}>
              <label className="oni-stock-label">Per Page</label>

              <CFormSelect
                className="oni-stock-input"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </CFormSelect>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard className="oni-stock-table-card">
        <div className="oni-stock-table-header">
          <div>
            <h3>{queryProductId ? 'Product Stock History' : 'Inventory Movements'}</h3>

            <p>
              {filteredMovements.length.toLocaleString()} movement
              {filteredMovements.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="oni-stock-loading">
            <CSpinner />
            <p>Loading stock history...</p>
          </div>
        ) : paginatedMovements.length === 0 ? (
          <div className="oni-stock-empty">
            <div className="oni-stock-empty-icon">↕</div>

            <h4>No stock movements found</h4>

            <p>There are no inventory movements matching your filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <CTable hover align="middle" className="oni-stock-table">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>DATE</CTableHeaderCell>

                  <CTableHeaderCell>PRODUCT</CTableHeaderCell>

                  <CTableHeaderCell>MOVEMENT</CTableHeaderCell>

                  <CTableHeaderCell>BEFORE</CTableHeaderCell>

                  <CTableHeaderCell>CHANGE</CTableHeaderCell>

                  <CTableHeaderCell>AFTER</CTableHeaderCell>

                  <CTableHeaderCell>REFERENCE</CTableHeaderCell>

                  <CTableHeaderCell>REASON</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {paginatedMovements.map((movement, index) => {
                  const type = movement?.movementType

                  const product =
                    movement?.Product?.name ||
                    movement?.product?.name ||
                    movement?.productName ||
                    'Unknown Product'

                  const variant = movement?.Variant || movement?.ProductVariant || movement?.variant

                  const variantText = [
                    variant?.size ? `Size: ${variant.size}` : '',
                    variant?.color ? `Colour: ${variant.color}` : '',
                  ]
                    .filter(Boolean)
                    .join(' • ')

                  const change = Number(movement?.quantityChange || 0)

                  return (
                    <CTableRow key={movement?.id || `${movement?.createdAt}-${index}`}>
                      <CTableDataCell>
                        <div className="oni-date-cell">
                          <strong>{formatDate(movement?.createdAt)}</strong>
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="oni-history-product">
                          <strong>{product}</strong>

                          {variantText && <small>{variantText}</small>}
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <CBadge color={getMovementColor(type)} className="oni-stock-status">
                          {getMovementLabel(type)}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>
                        {Number(movement?.quantityBefore || 0).toLocaleString()}
                      </CTableDataCell>

                      <CTableDataCell>
                        <strong
                          className={
                            change > 0
                              ? 'oni-change-positive'
                              : change < 0
                                ? 'oni-change-negative'
                                : ''
                          }
                        >
                          {change > 0 ? '+' : ''}
                          {change.toLocaleString()}
                        </strong>
                      </CTableDataCell>

                      <CTableDataCell>
                        <strong>{Number(movement?.quantityAfter || 0).toLocaleString()}</strong>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="oni-reference-cell">
                          <strong>
                            {movement?.referenceNumber || movement?.referenceId || '—'}
                          </strong>

                          {movement?.referenceType && <small>{movement.referenceType}</small>}
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="oni-reason-cell">
                          <strong>{movement?.reason || '—'}</strong>

                          {movement?.notes && <small>{movement.notes}</small>}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          </div>
        )}

        {!loading && filteredMovements.length > 0 && (
          <div className="oni-stock-pagination">
            <div>
              Showing <strong>{(page - 1) * perPage + 1}</strong> –{' '}
              <strong>{Math.min(page * perPage, filteredMovements.length)}</strong> of{' '}
              <strong>{filteredMovements.length}</strong>
            </div>

            <div className="oni-pagination-buttons">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>

              <span className="oni-page-number">
                {page} / {totalPages}
              </span>

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
    </div>
  )
}

export default StockHistory
