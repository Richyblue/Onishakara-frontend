import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilReload,
  cilCloudDownload,
  cilPrint,
  cilCheckCircle,
  cilClock,
  cilXCircle,
  cilCart,
  cilX,
} from '@coreui/icons'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CPagination,
  CPaginationItem,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

const API_URL = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
const PAGE_SIZE = 10
const GOLD = '#c9a227'
const money = (n) => `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
const dateLabel = (v) => {
  const d = new Date(v)
  return v && !Number.isNaN(d.getTime()) ? d.toLocaleString('en-NG') : '—'
}
const escapeHtml = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
const statusColor = (s) =>
  ['approved', 'completed', 'paid'].includes(String(s).toLowerCase())
    ? 'success'
    : String(s).toLowerCase() === 'pending'
      ? 'warning'
      : ['declined', 'cancelled', 'refunded', 'failed'].includes(String(s).toLowerCase())
        ? 'danger'
        : 'secondary'

export default function OrderManagement() {
  const [orders, setOrders] = useState([]),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState(''),
    [status, setStatus] = useState('all'),
    [payment, setPayment] = useState('all'),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null),
    [printOrder, setPrintOrder] = useState(null),
    [printOpen, setPrintOpen] = useState(false),
    [printerList, setPrinterList] = useState([]),
    [printer, setPrinter] = useState('XP-80C'),
    [printing, setPrinting] = useState(false)
  const auth = () => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Session expired. Please sign in again.')
    return { headers: { Authorization: `Bearer ${token}` } }
  }
  const orderNo = (o) => o?.receiptNumber || o?.orderNumber || `ORD-${o?.id}`
  const customerName = (o) =>
    o?.Customer?.name ||
    o?.Customer?.fullName ||
    o?.customer?.name ||
    o?.customerName ||
    'Walk-in customer'
  const items = (o) =>
    Array.isArray(o?.SaleItems)
      ? o.SaleItems
      : Array.isArray(o?.saleItems)
        ? o.saleItems
        : Array.isArray(o?.items)
          ? o.items
          : []
  const orderStatus = (o) => o?.approvalStatus || o?.status || 'pending'
  const total = (o) => o?.totalAmount ?? o?.total ?? o?.grandTotal ?? 0

  const loadOrders = useCallback(
    async (refresh = false) => {
      try {
        refresh ? setRefreshing(true) : setLoading(true)
        const r = await axios.get(`${API_URL}/api/v1/orders`, {
          ...auth(),
          params: {
            search: search.trim() || undefined,
            status: status !== 'all' ? status : undefined,
            paymentMethod: payment !== 'all' ? payment : undefined,
            dateFrom: from || undefined,
            dateTo: to || undefined,
            page: 1,
            limit: 500,
          },
        })
        const d = r.data
        setOrders(
          Array.isArray(d?.orders)
            ? d.orders
            : Array.isArray(d?.data)
              ? d.data
              : Array.isArray(d)
                ? d
                : [],
        )
        setPage(1)
      } catch (e) {
        Swal.fire({
          icon: 'error',
          title: 'Unable to load orders',
          text: e.response?.data?.message || e.message,
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [search, status, payment, from, to],
  )
  useEffect(() => {
    loadOrders()
  }, [loadOrders])
  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const q = [orderNo(o), customerName(o), o.paymentMethod, o.saleType, o.id]
            .join(' ')
            .toLowerCase(),
          d = new Date(o.createdAt || o.date || 0)
        return (
          (!search.trim() || q.includes(search.trim().toLowerCase())) &&
          (status === 'all' || String(orderStatus(o)).toLowerCase() === status) &&
          (payment === 'all' || String(o.paymentMethod || '').toLowerCase() === payment) &&
          (!from || d >= new Date(`${from}T00:00:00`)) &&
          (!to || d <= new Date(`${to}T23:59:59.999`))
        )
      }),
    [orders, search, status, payment, from, to],
  )
  const stats = useMemo(
    () => ({
      all: filtered.length,
      approved: filtered.filter((o) =>
        ['approved', 'completed', 'paid'].includes(String(orderStatus(o)).toLowerCase()),
      ).length,
      pending: filtered.filter((o) => String(orderStatus(o)).toLowerCase() === 'pending').length,
      value: filtered
        .filter(
          (o) =>
            !['declined', 'cancelled', 'refunded'].includes(String(orderStatus(o)).toLowerCase()),
        )
        .reduce((s, o) => s + Number(total(o) || 0), 0),
    }),
    [filtered],
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    currentPage = Math.min(page, pages),
    shown = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const changeStatus = async (o, next) => {
    const c = await Swal.fire({
      title: `${next === 'approved' ? 'Approve' : 'Decline'} order?`,
      text: orderNo(o),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      confirmButtonColor: next === 'approved' ? '#15803d' : '#dc2626',
    })
    if (!c.isConfirmed) return
    try {
      await axios.patch(`${API_URL}/api/v1/orders/${o.id}/status`, { status: next }, auth())
      await loadOrders(true)
      Swal.fire({ icon: 'success', title: 'Order updated', timer: 1200, showConfirmButton: false })
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Update failed',
        text: e.response?.data?.message || e.message,
      })
    }
  }
  const openPrint = async (o) => {
    setPrintOrder(o)
    setPrintOpen(true)
    setPrinter('XP-80C')
    try {
      if (typeof window.electronAPI?.getPrinters === 'function') {
        const r = await window.electronAPI.getPrinters(),
          list = (Array.isArray(r) ? r : r?.printers || [])
            .map((p) => (typeof p === 'string' ? p : p?.name))
            .filter(Boolean)
        setPrinterList(list)
        const xp = list.find((n) => /XP-80C|Xprinter/i.test(n))
        if (xp) setPrinter(xp)
      }
    } catch (e) {
      console.warn('Printer discovery unavailable', e)
    }
  }
  const receiptHtml = (o) => {
    const rows = items(o)
      .map((i) => {
        const name =
            i.name ||
            i.Product?.name ||
            i.product?.name ||
            i.Service?.name ||
            i.service?.name ||
            i.description ||
            'Item',
          qty = Number(i.quantity || 1),
          price = Number(i.price ?? i.unitPrice ?? i.Product?.sellingPrice ?? i.Service?.price ?? 0)
        return `<tr><td>${escapeHtml(name)}<small>${qty} × ${money(price)}</small></td><td class="num">${money(i.subtotal ?? price * qty)}</td></tr>`
      })
      .join('')
    return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(orderNo(o))}</title><style>@page{size:80mm auto;margin:3mm}*{box-sizing:border-box}body{width:74mm;margin:0 auto;font:12px Arial;color:#111}.center{text-align:center}.brand{font-size:18px;font-weight:900;letter-spacing:1px}.muted{font-size:10px;color:#555}.rule{border-top:1px dashed #333;margin:8px 0}.meta{font-size:11px;line-height:1.7}table{width:100%;border-collapse:collapse;margin-top:8px}td{padding:5px 0;border-bottom:1px dotted #ddd;vertical-align:top}small{display:block;font-size:10px;color:#555;margin-top:2px}.num{text-align:right;white-space:nowrap}.total{font-size:16px;font-weight:900}.footer{text-align:center;font-size:10px;margin-top:12px}</style></head><body><div class="center"><div class="brand">ONISHAKARA GOLD</div><div class="muted">SALES RECEIPT</div></div><div class="rule"></div><div class="meta"><div><b>Receipt:</b> ${escapeHtml(orderNo(o))}</div><div><b>Date:</b> ${escapeHtml(dateLabel(o.createdAt || o.date))}</div><div><b>Customer:</b> ${escapeHtml(customerName(o))}</div><div><b>Payment:</b> ${escapeHtml(o.paymentMethod || '—')}</div></div><div class="rule"></div><table><thead><tr><td><b>ITEM</b></td><td class="num"><b>AMOUNT</b></td></tr></thead><tbody>${rows || '<tr><td>Order items</td><td class="num">—</td></tr>'}</tbody></table><div class="rule"></div><div class="meta"><div>Subtotal <span style="float:right">${money(o.subtotal ?? total(o))}</span></div><div>Discount <span style="float:right">${money(o.discount)}</span></div><div class="total">TOTAL <span style="float:right">${money(total(o))}</span></div></div><div class="rule"></div><div class="footer">Thank you for shopping with us!<br/>Please keep this receipt for your records.</div></body></html>`
  }
  const doPrint = async () => {
    if (!printOrder) return
    setPrinting(true)
    try {
      const html = receiptHtml(printOrder)
      if (typeof window.electronAPI?.printReceipt === 'function') {
        const r = await window.electronAPI.printReceipt(html, printer)
        if (r?.success === false)
          throw new Error(r.error || r.message || 'Printer rejected receipt')
        setPrintOpen(false)
        await Swal.fire({
          icon: 'success',
          title: 'Receipt sent to printer',
          text: r?.printer || printer,
          timer: 1400,
          showConfirmButton: false,
        })
      } else {
        const w = window.open('', '_blank', 'width=420,height=720')
        if (!w) throw new Error('Please allow pop-ups to print the receipt.')
        w.document.open()
        w.document.write(html)
        w.document.close()
        w.focus()
        w.onload = () => w.print()
        setPrintOpen(false)
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Printing failed', text: e.message })
    } finally {
      setPrinting(false)
    }
  }
  const exportCsv = () => {
    const data = [
        ['Order ID', 'Customer', 'Date', 'Payment Method', 'Status', 'Total'],
        ...filtered.map((o) => [
          orderNo(o),
          customerName(o),
          dateLabel(o.createdAt || o.date),
          o.paymentMethod || '',
          orderStatus(o),
          total(o),
        ]),
      ],
      csv = data
        .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n'),
      url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })),
      a = document.createElement('a')
    a.href = url
    a.download = `Onishakara-Orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  const statCard = (label, value, sub, icon, color) => (
    <CCard
      className="border-0 h-100"
      style={{ borderRadius: 16, boxShadow: '0 5px 24px rgba(15,23,42,.06)' }}
    >
      <CCardBody style={{ padding: 20 }}>
        <div className="d-flex justify-content-between">
          <div>
            <div style={{ color: '#71717a', fontSize: 11, fontWeight: 800, letterSpacing: '.7px' }}>
              {label.toUpperCase()}
            </div>
            <div className="mt-2" style={{ fontSize: 25, fontWeight: 850, color: '#18181b' }}>
              {value}
            </div>
            <div className="mt-1" style={{ fontSize: 11, color: '#a1a1aa' }}>
              {sub}
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: `${color}14`,
              color,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <CIcon icon={icon} size="lg" />
          </div>
        </div>
      </CCardBody>
    </CCard>
  )

  return (
    <div style={{ minHeight: '100%', paddingBottom: 30 }}>
      <div
        className="mb-4"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg,#09090b,#18181b 55%,#27272a)',
          borderRadius: 20,
          padding: 30,
          color: '#fff',
          boxShadow: '0 12px 35px rgba(0,0,0,.16)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: '50%',
            right: -60,
            top: -70,
            border: '1px solid rgba(232,189,53,.18)',
            boxShadow: '0 0 0 30px rgba(232,189,53,.03)',
          }}
        />
        <CRow className="align-items-center position-relative">
          <CCol lg={8}>
            <div style={{ color: '#e8bd35', fontSize: 11, fontWeight: 800, letterSpacing: 2 }}>
              ONISHAKARA GOLD
            </div>
            <h2
              className="mt-2 mb-2"
              style={{ fontWeight: 850, fontSize: 28, letterSpacing: '-.7px' }}
            >
              Order Management
            </h2>
            <p
              className="mb-0"
              style={{ color: '#a1a1aa', fontSize: 14, maxWidth: 650, lineHeight: 1.7 }}
            >
              Manage transactions, review order status, retrieve order details and print
              professional receipts to your XP-80C Xprinter.
            </p>
          </CCol>
          <CCol lg={4} className="text-lg-end mt-4 mt-lg-0">
            <CButton
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              className="border-0 me-2"
              style={{ background: '#27272a', color: '#fff', borderRadius: 10, fontWeight: 700 }}
            >
              {refreshing ? (
                <CSpinner size="sm" className="me-2" />
              ) : (
                <CIcon icon={cilReload} className="me-2" />
              )}
              Refresh
            </CButton>
            <CButton
              onClick={exportCsv}
              className="border-0"
              style={{
                background: 'linear-gradient(135deg,#e8bd35,#c9a227)',
                color: '#111',
                borderRadius: 10,
                fontWeight: 800,
              }}
            >
              <CIcon icon={cilCloudDownload} className="me-2" />
              Export CSV
            </CButton>
          </CCol>
        </CRow>
      </div>
      <CRow className="mb-4">
        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          {statCard('Orders in view', stats.all, 'Matching current filters', cilCart, GOLD)}
        </CCol>
        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          {statCard(
            'Approved orders',
            stats.approved,
            'Approved / completed / paid',
            cilCheckCircle,
            '#15803d',
          )}
        </CCol>
        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          {statCard('Pending review', stats.pending, 'Awaiting review', cilClock, '#b45309')}
        </CCol>
        <CCol sm={6} xl={3}>
          {statCard(
            'Order value',
            money(stats.value),
            'Excludes declined / refunded',
            cilCloudDownload,
            '#2563eb',
          )}
        </CCol>
      </CRow>
      <CCard
        className="border-0"
        style={{ borderRadius: 18, boxShadow: '0 7px 30px rgba(15,23,42,.07)', overflow: 'hidden' }}
      >
        <CCardHeader className="border-0" style={{ background: '#fff', padding: '22px 24px' }}>
          <CRow className="align-items-center">
            <CCol lg={6}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Orders & Transactions</div>
              <div className="mt-1" style={{ fontSize: 12, color: '#a1a1aa' }}>
                {filtered.length} order(s) matching this view
              </div>
            </CCol>
            <CCol lg={6} className="mt-3 mt-lg-0">
              <CInputGroup>
                <CInputGroupText style={{ background: '#fff', borderRight: 0, color: '#a1a1aa' }}>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Search receipt, customer, payment..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  style={{ minHeight: 42, borderLeft: 0, boxShadow: 'none' }}
                />
              </CInputGroup>
            </CCol>
          </CRow>
        </CCardHeader>
        <CCardBody style={{ padding: '0 24px 24px' }}>
          <div
            className="mb-3"
            style={{
              background: 'linear-gradient(135deg,#fafafa,#f8fafc)',
              borderRadius: 14,
              padding: 15,
              border: '1px solid #eee',
            }}
          >
            <CRow className="align-items-end">
              <CCol xl={3} md={6} className="mb-3 mb-xl-0">
                <label className="small fw-bold text-uppercase mb-2">Status</label>
                <CFormSelect
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </CFormSelect>
              </CCol>
              <CCol xl={3} md={6} className="mb-3 mb-xl-0">
                <label className="small fw-bold text-uppercase mb-2">Payment</label>
                <CFormSelect
                  value={payment}
                  onChange={(e) => {
                    setPayment(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All methods</option>
                  <option value="cash">Cash</option>
                  <option value="pos">POS</option>
                  <option value="transfer">Transfer</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </CFormSelect>
              </CCol>
              <CCol xl={2} md={6} className="mb-3 mb-xl-0">
                <label className="small fw-bold text-uppercase mb-2">From</label>
                <CFormInput
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value)
                    setPage(1)
                  }}
                />
              </CCol>
              <CCol xl={2} md={6} className="mb-3 mb-xl-0">
                <label className="small fw-bold text-uppercase mb-2">To</label>
                <CFormInput
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value)
                    setPage(1)
                  }}
                />
              </CCol>
              <CCol xl={2}>
                {(search || status !== 'all' || payment !== 'all' || from || to) && (
                  <CButton
                    color="light"
                    className="w-100"
                    onClick={() => {
                      setSearch('')
                      setStatus('all')
                      setPayment('all')
                      setFrom('')
                      setTo('')
                      setPage(1)
                    }}
                  >
                    <CIcon icon={cilX} className="me-2" />
                    Clear filters
                  </CButton>
                )}
              </CCol>
            </CRow>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <CSpinner style={{ color: GOLD }} />
              <div className="mt-3 text-body-secondary">Loading orders securely…</div>
            </div>
          ) : (
            <div style={{ border: '1px solid #eee', borderRadius: 14, overflow: 'hidden' }}>
              <CTable hover responsive align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow style={{ background: '#fafafa' }}>
                    {[
                      'Order / Receipt',
                      'Customer',
                      'Date & time',
                      'Payment',
                      'Total',
                      'Status',
                      'Actions',
                    ].map((h) => (
                      <CTableHeaderCell
                        key={h}
                        className={h === 'Actions' ? 'text-end' : ''}
                        style={{
                          padding: '14px 13px',
                          color: '#71717a',
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '.6px',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {shown.length ? (
                    shown.map((o) => (
                      <CTableRow key={o.id}>
                        <CTableDataCell style={{ padding: '14px 13px', minWidth: 150 }}>
                          <div style={{ fontWeight: 800, fontSize: 12 }}>{orderNo(o)}</div>
                          <small className="text-body-secondary">ID: {o.id}</small>
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '14px 13px', minWidth: 150 }}>
                          <strong style={{ fontSize: 12 }}>{customerName(o)}</strong>
                          <div className="text-body-secondary" style={{ fontSize: 10 }}>
                            {items(o).length} item(s)
                          </div>
                        </CTableDataCell>
                        <CTableDataCell
                          style={{ padding: '14px 13px', whiteSpace: 'nowrap', fontSize: 11 }}
                        >
                          {dateLabel(o.createdAt || o.date)}
                        </CTableDataCell>
                        <CTableDataCell
                          style={{
                            padding: '14px 13px',
                            fontSize: 12,
                            textTransform: 'capitalize',
                          }}
                        >
                          {o.paymentMethod || '—'}
                        </CTableDataCell>
                        <CTableDataCell
                          style={{ padding: '14px 13px', fontWeight: 850, whiteSpace: 'nowrap' }}
                        >
                          {money(total(o))}
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '14px 13px' }}>
                          <CBadge
                            color={statusColor(orderStatus(o))}
                            style={{
                              padding: '7px 9px',
                              borderRadius: 7,
                              textTransform: 'capitalize',
                            }}
                          >
                            {orderStatus(o)}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell
                          className="text-end"
                          style={{ padding: 12, whiteSpace: 'nowrap' }}
                        >
                          <CButton
                            size="sm"
                            title="View details"
                            onClick={() => setDetail(o)}
                            className="border-0 me-1"
                            style={{
                              width: 34,
                              height: 34,
                              padding: 0,
                              borderRadius: 9,
                              background: '#f4f4f5',
                              color: '#3f3f46',
                            }}
                          >
                            view
                          </CButton>
                          <CButton
                            size="sm"
                            title="Print receipt"
                            onClick={() => openPrint(o)}
                            className="border-0 me-1"
                            style={{
                              width: 34,
                              height: 34,
                              padding: 0,
                              borderRadius: 9,
                              background: '#eff6ff',
                              color: '#2563eb',
                            }}
                          >
                            <CIcon icon={cilPrint} />
                          </CButton>
                          {String(orderStatus(o)).toLowerCase() === 'pending' && (
                            <>
                              <CButton
                                size="sm"
                                title="Approve"
                                onClick={() => changeStatus(o, 'approved')}
                                className="border-0 me-1"
                                style={{
                                  width: 34,
                                  height: 34,
                                  padding: 0,
                                  borderRadius: 9,
                                  background: '#f0fdf4',
                                  color: '#15803d',
                                }}
                              >
                                <CIcon icon={cilCheckCircle} />
                              </CButton>
                              <CButton
                                size="sm"
                                title="Decline"
                                onClick={() => changeStatus(o, 'declined')}
                                className="border-0"
                                style={{
                                  width: 34,
                                  height: 34,
                                  padding: 0,
                                  borderRadius: 9,
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                }}
                              >
                                <CIcon icon={cilXCircle} />
                              </CButton>
                            </>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center py-5">
                        <strong>No orders found</strong>
                        <div className="small text-body-secondary mt-1">
                          Try changing the search or filters.
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </div>
          )}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-body-secondary">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </small>
              <CPagination className="mb-0">
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pages || Math.abs(p - currentPage) <= 1)
                  .map((p) => (
                    <CPaginationItem
                      key={p}
                      active={p === currentPage}
                      onClick={() => setPage(p)}
                      style={{ cursor: 'pointer' }}
                    >
                      {p}
                    </CPaginationItem>
                  ))}
              </CPagination>
            </div>
          )}
        </CCardBody>
      </CCard>
      <CModal
        visible={Boolean(detail)}
        onClose={() => setDetail(null)}
        size="lg"
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Order details · {detail ? orderNo(detail) : ''}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {detail && (
            <>
              <CRow className="g-3 mb-3">
                <CCol md={6}>
                  <div className="small text-body-secondary">Customer</div>
                  <strong>{customerName(detail)}</strong>
                </CCol>
                <CCol md={6}>
                  <div className="small text-body-secondary">Date</div>
                  <strong>{dateLabel(detail.createdAt || detail.date)}</strong>
                </CCol>
                <CCol md={6}>
                  <div className="small text-body-secondary">Payment</div>
                  <strong>{detail.paymentMethod || '—'}</strong>
                </CCol>
                <CCol md={6}>
                  <div className="small text-body-secondary">Status</div>
                  <CBadge color={statusColor(orderStatus(detail))}>{orderStatus(detail)}</CBadge>
                </CCol>
              </CRow>
              <CTable bordered responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Item</CTableHeaderCell>
                    <CTableHeaderCell>Qty</CTableHeaderCell>
                    <CTableHeaderCell>Price</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {items(detail).map((i, n) => {
                    const name =
                        i.name ||
                        i.Product?.name ||
                        i.product?.name ||
                        i.Service?.name ||
                        i.service?.name ||
                        i.description ||
                        `Item ${n + 1}`,
                      qty = Number(i.quantity || 1),
                      price = Number(
                        i.price ?? i.unitPrice ?? i.Product?.sellingPrice ?? i.Service?.price ?? 0,
                      )
                    return (
                      <CTableRow key={i.id || n}>
                        <CTableDataCell>{name}</CTableDataCell>
                        <CTableDataCell>{qty}</CTableDataCell>
                        <CTableDataCell>{money(price)}</CTableDataCell>
                        <CTableDataCell className="text-end">
                          {money(i.subtotal ?? qty * price)}
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
              <div className="text-end">
                Subtotal: <strong>{money(detail.subtotal ?? total(detail))}</strong>
                <br />
                Discount: <strong>{money(detail.discount)}</strong>
                <h5 className="mt-2">Total: {money(total(detail))}</h5>
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setDetail(null)}>
            Close
          </CButton>
          <CButton
            onClick={() => {
              const o = detail
              setDetail(null)
              openPrint(o)
            }}
            style={{ background: GOLD, borderColor: GOLD, color: '#111' }}
          >
            <CIcon icon={cilPrint} className="me-2" />
            Print receipt
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal visible={printOpen} onClose={() => setPrintOpen(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilPrint} className="me-2" />
            Print receipt
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div
            className="p-3 mb-3"
            style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 12 }}
          >
            <div className="small text-body-secondary">Receipt number</div>
            <strong>{printOrder ? orderNo(printOrder) : '—'}</strong>
            <div className="small text-body-secondary mt-2">Total amount</div>
            <div className="fs-4 fw-bold">{money(printOrder ? total(printOrder) : 0)}</div>
          </div>
          <label className="form-label fw-bold">Printer</label>
          <CFormSelect value={printer} onChange={(e) => setPrinter(e.target.value)}>
            {Array.from(new Set(['XP-80C', ...printerList])).map((p) => (
              <option key={p} value={p}>
                {p}
                {/XP-80C|Xprinter/i.test(p) ? ' · Xprinter receipt printer' : ''}
              </option>
            ))}
          </CFormSelect>
          <div className="small text-body-secondary mt-2">
            80 mm receipt format. Electron must pass the selected printer name to its print device.
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setPrintOpen(false)}>
            Cancel
          </CButton>
          <CButton
            disabled={printing || !printOrder}
            onClick={doPrint}
            className="border-0"
            style={{
              background: 'linear-gradient(135deg,#e8bd35,#c9a227)',
              color: '#111',
              fontWeight: 800,
            }}
          >
            {printing ? (
              <CSpinner size="sm" className="me-2" />
            ) : (
              <CIcon icon={cilPrint} className="me-2" />
            )}
            Print to {printer}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}
