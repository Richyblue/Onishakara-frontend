import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
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

import CIcon from '@coreui/icons-react'

import {
  cilCheck,
  cilCheckCircle,
  cilInfo,
  cilLayers,
  cilPeople,
  cilPlus,
  cilReload,
  cilSearch,
  cilTrash,
  cilWarning,
  cilX,
} from '@coreui/icons'

const API_URL = import.meta.env.VITE_BACKEND_URL

const ProductConsumption = () => {
  // ============================================================
  // DATA
  // ============================================================

  const [consumptions, setConsumptions] = useState([])
  const [products, setProducts] = useState([])
  const [staff, setStaff] = useState([])

  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // ============================================================
  // ALERTS
  // ============================================================

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ============================================================
  // FILTERS
  // ============================================================

  const [search, setSearch] = useState('')
  const [staffFilter, setStaffFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // ============================================================
  // CREATE MODAL
  // ============================================================

  const [showCreateModal, setShowCreateModal] = useState(false)

  // ============================================================
  // DETAILS MODAL
  // ============================================================

  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedConsumption, setSelectedConsumption] = useState(null)

  // ============================================================
  // REJECT MODAL
  // ============================================================

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // ============================================================
  // FORM
  // ============================================================

  const [form, setForm] = useState({
    staff_id: '',
    reason: '',
    notes: '',
  })

  const [formItems, setFormItems] = useState([
    {
      product_id: '',
      quantity: 1,
    },
  ])

  // ============================================================
  // HELPERS
  // ============================================================

  const getToken = () => {
    return localStorage.getItem('token')
  }

  const getStaffName = (person) => {
    if (!person) return 'Unknown Staff'

    return (
      person.User?.fullname ||
      person.User?.name ||
      person.fullname ||
      person.name ||
      `${person.firstName || ''} ${person.lastName || ''}`.trim() ||
      `Staff #${person.id}`
    )
  }

  const getProductName = (product) => {
    if (!product) return 'Unknown Product'

    return product.name || product.Product?.name || `Product #${product.id}`
  }

  const getItems = (consumption) => {
    if (!consumption) return []

    return consumption.Items || consumption.items || consumption.ConsumptionItems || []
  }

  const getStaffObject = (consumption) => {
    return consumption?.Staff || consumption?.staff || null
  }

  const getProductObject = (item) => {
    return item?.Product || item?.product || null
  }

  const getReference = (item) => {
    return (
      item?.reference_number || item?.referenceNumber || item?.reference || `#${item?.id || ''}`
    )
  }

  // Sale linkage added for the POS product-consumption workflow.
  // A consumption is billed exactly once in POS; sale_id is populated after billing.
  const getSaleObject = (consumption) => {
    return consumption?.Sale || consumption?.sale || null
  }

  const getSaleId = (consumption) => {
    return consumption?.sale_id || consumption?.saleId || getSaleObject(consumption)?.id || null
  }

  const isBilled = (consumption) => Boolean(getSaleId(consumption))

  const getApprovedByName = (item) => {
    return item?.ApprovedBy?.fullname || item?.ApprovedBy?.name || '—'
  }

  const getDate = (item) => {
    return item?.requested_at || item?.requestedAt || item?.createdAt || item?.created_at
  }

  const formatCurrency = (value) => {
    return `₦${Number(value || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  const formatDate = (value) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTotalCost = (consumption) => {
    const items = getItems(consumption)

    return items.reduce((total, item) => {
      const quantity = Number(item.quantity || 0)

      const product = getProductObject(item)

      const unitCost = Number(item.unit_cost || item.unitCost || product?.costPrice || 0)

      const totalCost = Number(item.total_cost || item.totalCost || quantity * unitCost)

      return total + totalCost
    }, 0)
  }

  // ============================================================
  // API ARRAY HANDLER
  // ============================================================

  const extractArray = (data, keys = []) => {
    if (Array.isArray(data)) {
      return data
    }

    if (!data || typeof data !== 'object') {
      return []
    }

    for (const key of keys) {
      if (Array.isArray(data[key])) {
        return data[key]
      }
    }

    if (Array.isArray(data.data)) {
      return data.data
    }

    if (data.data && Array.isArray(data.data.data)) {
      return data.data.data
    }

    return []
  }

  // ============================================================
  // GET STAFF
  // ============================================================

  const getStaff = async () => {
    try {
      const token = getToken()

      const response = await axios.get(`${API_URL}api/v1/staffs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Staff API response:', response.data)

      const staffList = extractArray(response.data, ['staffs', 'staff', 'users'])

      setStaff(staffList)
    } catch (error) {
      console.error('Staff Error:', error)

      setError(error.response?.data?.message || 'Unable to load staff members.')
    }
  }

  // ============================================================
  // GET PRODUCTS
  // ============================================================

  const getProducts = async () => {
    try {
      const token = getToken()

      const response = await axios.get(`${API_URL}api/v1/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Products API response:', response.data)

      const productList = extractArray(response.data, ['products', 'product'])

      setProducts(productList)
    } catch (error) {
      console.error('Products Error:', error)

      setError(error.response?.data?.message || 'Unable to load products.')
    }
  }

  // ============================================================
  // GET CONSUMPTIONS
  // ============================================================

  const getConsumptions = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      }

      const token = getToken()

      const response = await axios.get(`${API_URL}api/v1/product-consumptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Consumption API response:', response.data)

      const records = extractArray(response.data, [
        'consumptions',
        'consumption',
        'records',
        'items',
      ])

      console.log('Consumption records:', records)

      setConsumptions(records)
    } catch (error) {
      console.error('Consumption Error:', error)

      setError(error.response?.data?.message || 'Unable to load product consumption records.')
    } finally {
      setRefreshing(false)
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      await Promise.all([getConsumptions(), getProducts(), getStaff()])

      setLoading(false)
    }

    fetchData()
  }, [])

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleFormChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleItemChange = (index, field, value) => {
    setFormItems((previous) => {
      const updated = [...previous]

      updated[index] = {
        ...updated[index],
        [field]: value,
      }

      return updated
    })
  }

  const addItem = () => {
    setFormItems((previous) => [
      ...previous,
      {
        product_id: '',
        quantity: 1,
      },
    ])
  }

  const removeItem = (index) => {
    if (formItems.length <= 1) {
      return
    }

    setFormItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
  }

  // ============================================================
  // OPEN CREATE MODAL
  // ============================================================

  const openCreateModal = () => {
    setError('')
    setSuccess('')

    setForm({
      staff_id: '',
      reason: '',
      notes: '',
    })

    setFormItems([
      {
        product_id: '',
        quantity: 1,
      },
    ])

    setShowCreateModal(true)
  }

  // ============================================================
  // CREATE CONSUMPTION
  // ============================================================

  const handleCreate = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    // ----------------------------------------------------------
    // STAFF VALIDATION
    // ----------------------------------------------------------

    if (!form.staff_id) {
      setError('Please select a staff member.')
      return
    }

    // ----------------------------------------------------------
    // PRODUCT VALIDATION
    // ----------------------------------------------------------

    const validItems = formItems.filter((item) => item.product_id && Number(item.quantity) > 0)

    if (validItems.length === 0) {
      setError('Please select at least one product and enter a valid quantity.')
      return
    }

    // ----------------------------------------------------------
    // DUPLICATE PRODUCTS
    // ----------------------------------------------------------

    const productIds = validItems.map((item) => String(item.product_id))

    if (new Set(productIds).size !== productIds.length) {
      setError('The same product cannot be added more than once.')
      return
    }

    // ----------------------------------------------------------
    // STOCK CHECK
    // ----------------------------------------------------------

    for (const item of validItems) {
      const product = products.find(
        (productItem) => String(productItem.id) === String(item.product_id),
      )

      if (!product) {
        setError('One of the selected products could not be found.')
        return
      }

      const requestedQuantity = Number(item.quantity)

      const availableQuantity = Number(product.quantity || 0)

      if (requestedQuantity > availableQuantity) {
        setError(`${product.name} only has ${availableQuantity} in stock.`)
        return
      }
    }

    // ----------------------------------------------------------
    // SUBMIT
    // ----------------------------------------------------------

    try {
      setSaving(true)

      const token = getToken()

      const payload = {
        staff_id: Number(form.staff_id),

        reason: form.reason?.trim() || null,

        notes: form.notes?.trim() || null,

        items: validItems.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
        })),
      }

      console.log('Creating product consumption:', payload)

      const response = await axios.post(`${API_URL}api/v1/product-consumptions`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Create consumption response:', response.data)

      // --------------------------------------------------------
      // CLOSE MODAL
      // --------------------------------------------------------

      setShowCreateModal(false)

      // --------------------------------------------------------
      // RESET FORM
      // --------------------------------------------------------

      setForm({
        staff_id: '',
        reason: '',
        notes: '',
      })

      setFormItems([
        {
          product_id: '',
          quantity: 1,
        },
      ])

      // --------------------------------------------------------
      // SUCCESS MESSAGE
      // --------------------------------------------------------

      setSuccess(response.data?.message || 'Product consumption request created successfully.')

      // --------------------------------------------------------
      // VERY IMPORTANT:
      // REFRESH RECORDS AFTER SUCCESSFUL CREATE
      // --------------------------------------------------------

      await Promise.all([getConsumptions(), getProducts()])
    } catch (error) {
      console.error('Create Consumption Error:', error)

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Unable to create product consumption request.',
      )
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // VIEW DETAILS
  // ============================================================

  const handleView = async (id) => {
    setError('')

    try {
      const token = getToken()

      const response = await axios.get(`${API_URL}api/v1/product-consumptions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Consumption details:', response.data)

      const consumption = response.data?.consumption || response.data?.data || response.data

      setSelectedConsumption(consumption)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Consumption details error:', error)

      // --------------------------------------------------------
      // FALLBACK TO EXISTING RECORD
      // --------------------------------------------------------

      const existing = consumptions.find((item) => String(item.id) === String(id))

      if (existing) {
        setSelectedConsumption(existing)
        setShowDetailsModal(true)
      } else {
        setError(error.response?.data?.message || 'Unable to load consumption details.')
      }
    }
  }

  // ============================================================
  // APPROVE
  // ============================================================

  const handleApprove = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to approve this consumption request? Stock will be deducted.',
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      setActionLoading(true)

      const token = getToken()

      const response = await axios.patch(
        `${API_URL}api/v1/product-consumptions/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setSuccess(response.data?.message || 'Product consumption approved successfully.')

      // Refresh both records and stock
      await Promise.all([getConsumptions(), getProducts()])

      // Refresh open details
      if (selectedConsumption?.id && String(selectedConsumption.id) === String(id)) {
        await handleView(id)
      }
    } catch (error) {
      console.error('Approve Consumption Error:', error)

      setError(error.response?.data?.message || 'Unable to approve product consumption.')
    } finally {
      setActionLoading(false)
    }
  }

  // ============================================================
  // OPEN REJECT MODAL
  // ============================================================

  const openRejectModal = (id) => {
    setRejectingId(id)
    setRejectReason('')
    setError('')
    setShowRejectModal(true)
  }

  // ============================================================
  // REJECT
  // ============================================================

  const handleReject = async () => {
    if (!rejectingId) {
      return
    }

    if (!rejectReason.trim()) {
      setError('Please enter a reason for rejecting this request.')
      return
    }

    setError('')
    setSuccess('')

    try {
      setActionLoading(true)

      const token = getToken()

      const response = await axios.patch(
        `${API_URL}api/v1/product-consumptions/${rejectingId}/reject`,
        {
          rejection_reason: rejectReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setSuccess(response.data?.message || 'Product consumption request rejected.')

      setShowRejectModal(false)
      setRejectingId(null)
      setRejectReason('')

      await getConsumptions()

      if (selectedConsumption?.id && String(selectedConsumption.id) === String(rejectingId)) {
        await handleView(rejectingId)
      }
    } catch (error) {
      console.error('Reject Consumption Error:', error)

      setError(error.response?.data?.message || 'Unable to reject product consumption.')
    } finally {
      setActionLoading(false)
    }
  }

  // ============================================================
  // FILTERED RECORDS
  // ============================================================

  const filteredConsumptions = useMemo(() => {
    return consumptions.filter((item) => {
      const staffName = getStaffName(getStaffObject(item)).toLowerCase()

      const reference = String(getReference(item)).toLowerCase()

      const reason = String(item.reason || '').toLowerCase()

      const searchValue = search.trim().toLowerCase()

      const matchesSearch =
        !searchValue ||
        staffName.includes(searchValue) ||
        reference.includes(searchValue) ||
        reason.includes(searchValue) ||
        String(getSaleObject(item)?.receiptNumber || '').toLowerCase().includes(searchValue)

      const itemStaffId = item.staff_id || item.staffId

      const matchesStaff = staffFilter === 'all' || String(itemStaffId) === String(staffFilter)

      const status = item.status || 'pending'

      const matchesStatus = statusFilter === 'all' || status === statusFilter

      let matchesDate = true

      if (dateFilter !== 'all') {
        const rawDate = getDate(item)

        if (rawDate) {
          const itemDate = new Date(rawDate)
          const today = new Date()

          if (dateFilter === 'today') {
            matchesDate = itemDate.toDateString() === today.toDateString()
          }

          if (dateFilter === 'week') {
            const sevenDaysAgo = new Date()

            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            matchesDate = itemDate >= sevenDaysAgo
          }

          if (dateFilter === 'month') {
            matchesDate =
              itemDate.getMonth() === today.getMonth() &&
              itemDate.getFullYear() === today.getFullYear()
          }
        } else {
          matchesDate = false
        }
      }

      return matchesSearch && matchesStaff && matchesStatus && matchesDate
    })
  }, [consumptions, search, staffFilter, statusFilter, dateFilter])

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    const total = consumptions.length

    const pending = consumptions.filter((item) => (item.status || 'pending') === 'pending').length

    const approved = consumptions.filter((item) => item.status === 'approved').length

    const rejected = consumptions.filter((item) => item.status === 'rejected').length

    const totalItems = consumptions.reduce((totalQuantity, consumption) => {
      const items = getItems(consumption)

      return totalQuantity + items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    }, 0)

    const totalCost = consumptions.reduce(
      (totalValue, consumption) => totalValue + getTotalCost(consumption),
      0,
    )

    const staffCount = new Set(
      consumptions.map((item) => item.staff_id || item.staffId).filter(Boolean),
    ).size

    return {
      total,
      pending,
      approved,
      rejected,
      totalItems,
      totalCost,
      staffCount,
    }
  }, [consumptions])

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '24px',
      }}
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="mb-4">
        <CRow className="align-items-center">
          <CCol md={8}>
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 15,
                  background: 'linear-gradient(135deg, #111827, #1f2937)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#e8bd35',
                  boxShadow: '0 8px 20px rgba(17,24,39,.12)',
                }}
              >
                <CIcon icon={cilLayers} size="xl" />
              </div>

              <div>
                <h2
                  className="fw-bold mb-1"
                  style={{
                    color: '#111827',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Product Consumption
                </h2>

                <p
                  className="mb-0"
                  style={{
                    color: '#6b7280',
                  }}
                >
                  Track and manage products taken by staff for salon use.
                </p>
              </div>
            </div>
          </CCol>

          <CCol md={4} className="text-md-end mt-3 mt-md-0">
            <CButton
              onClick={openCreateModal}
              style={{
                background: 'linear-gradient(135deg, #e8bd35, #c9a227)',
                border: 'none',
                color: '#111827',
                fontWeight: 700,
                borderRadius: 10,
                padding: '11px 18px',
                boxShadow: '0 5px 15px rgba(201,162,39,.25)',
              }}
            >
              <CIcon icon={cilPlus} className="me-2" />
              New Consumption
            </CButton>
          </CCol>
        </CRow>
      </div>

      {/* ========================================================
          ALERTS
      ======================================================== */}

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {success && (
        <CAlert color="success" dismissible onClose={() => setSuccess('')}>
          <CIcon icon={cilCheckCircle} className="me-2" />

          {success}
        </CAlert>
      )}

      {/* ========================================================
          KPI CARDS
      ======================================================== */}

      <CRow className="mb-4">
        {/* TOTAL */}

        <CCol xl={3} md={6} className="mb-3">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(17,24,39,.06)',
            }}
          >
            <CCardBody className="p-4">
              <div className="d-flex justify-content-between">
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#6b7280',
                      letterSpacing: '.5px',
                    }}
                  >
                    TOTAL REQUESTS
                  </div>

                  <div
                    className="fw-bold mt-2"
                    style={{
                      fontSize: 29,
                      color: '#111827',
                    }}
                  >
                    {summary.total}
                  </div>

                  <small
                    style={{
                      color: '#9ca3af',
                    }}
                  >
                    All consumption requests
                  </small>
                </div>

                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CIcon icon={cilLayers} />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* PENDING */}

        <CCol xl={3} md={6} className="mb-3">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(17,24,39,.06)',
            }}
          >
            <CCardBody className="p-4">
              <div className="d-flex justify-content-between">
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#6b7280',
                      letterSpacing: '.5px',
                    }}
                  >
                    PENDING
                  </div>

                  <div
                    className="fw-bold mt-2"
                    style={{
                      fontSize: 29,
                      color: '#d97706',
                    }}
                  >
                    {summary.pending}
                  </div>

                  <small
                    style={{
                      color: '#9ca3af',
                    }}
                  >
                    Awaiting approval
                  </small>
                </div>

                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: '#fff7ed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CIcon icon={cilWarning} />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* APPROVED */}

        <CCol xl={3} md={6} className="mb-3">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(17,24,39,.06)',
            }}
          >
            <CCardBody className="p-4">
              <div className="d-flex justify-content-between">
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#6b7280',
                      letterSpacing: '.5px',
                    }}
                  >
                    APPROVED
                  </div>

                  <div
                    className="fw-bold mt-2"
                    style={{
                      fontSize: 29,
                      color: '#059669',
                    }}
                  >
                    {summary.approved}
                  </div>

                  <small
                    style={{
                      color: '#9ca3af',
                    }}
                  >
                    Completed usage
                  </small>
                </div>

                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CIcon icon={cilCheckCircle} />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* UNITS */}

        <CCol xl={3} md={6} className="mb-3">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(17,24,39,.06)',
            }}
          >
            <CCardBody className="p-4">
              <div className="d-flex justify-content-between">
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#6b7280',
                      letterSpacing: '.5px',
                    }}
                  >
                    UNITS REQUESTED
                  </div>

                  <div
                    className="fw-bold mt-2"
                    style={{
                      fontSize: 29,
                      color: '#111827',
                    }}
                  >
                    {summary.totalItems}
                  </div>

                  <small
                    style={{
                      color: '#9ca3af',
                    }}
                  >
                    Total product quantity
                  </small>
                </div>

                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CIcon icon={cilPeople} />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ========================================================
          FILTERS
      ======================================================== */}

      <CCard
        className="border-0 mb-4"
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(17,24,39,.06)',
        }}
      >
        <CCardBody className="p-4">
          <CRow className="align-items-end">
            <CCol xl={4} lg={4} md={6} className="mb-3 mb-xl-0">
              <CFormLabel className="fw-semibold">Search</CFormLabel>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <CIcon
                  icon={cilSearch}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: 12,
                    color: '#9ca3af',
                  }}
                />

                <CFormInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff, reference or reason..."
                  style={{
                    paddingLeft: 42,
                    borderRadius: 10,
                  }}
                />
              </div>
            </CCol>

            <CCol xl={3} lg={3} md={6} className="mb-3 mb-xl-0">
              <CFormLabel className="fw-semibold">Staff</CFormLabel>

              <CFormSelect
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                style={{
                  borderRadius: 10,
                }}
              >
                <option value="all">All Staff</option>

                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {getStaffName(person)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol xl={2} lg={2} md={6} className="mb-3 mb-xl-0">
              <CFormLabel className="fw-semibold">Status</CFormLabel>

              <CFormSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  borderRadius: 10,
                }}
              >
                <option value="all">All Status</option>

                <option value="pending">Pending</option>

                <option value="approved">Approved</option>

                <option value="rejected">Rejected</option>
              </CFormSelect>
            </CCol>

            <CCol xl={2} lg={2} md={6} className="mb-3 mb-xl-0">
              <CFormLabel className="fw-semibold">Period</CFormLabel>

              <CFormSelect
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  borderRadius: 10,
                }}
              >
                <option value="all">All Time</option>

                <option value="today">Today</option>

                <option value="week">Last 7 Days</option>

                <option value="month">This Month</option>
              </CFormSelect>
            </CCol>

            <CCol xl={1} lg={1} md={6}>
              <CButton
                color="light"
                className="w-100"
                disabled={refreshing}
                onClick={() => getConsumptions(true)}
                style={{
                  borderRadius: 10,
                  height: 38,
                }}
              >
                {refreshing ? <CSpinner size="sm" /> : <CIcon icon={cilReload} />}
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ========================================================
          RECORD TABLE
      ======================================================== */}

      <CCard
        className="border-0"
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(17,24,39,.06)',
        }}
      >
        <CCardHeader
          className="bg-white border-0 p-4"
          style={{
            borderRadius: '16px 16px 0 0',
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5
                className="fw-bold mb-1"
                style={{
                  color: '#111827',
                }}
              >
                Consumption Requests
              </h5>

              <small
                style={{
                  color: '#6b7280',
                }}
              >
                {filteredConsumptions.length} record
                {filteredConsumptions.length !== 1 ? 's' : ''} found
              </small>
            </div>

            <CBadge
              style={{
                background: '#f3f4f6',
                color: '#374151',
                padding: '7px 11px',
                borderRadius: 20,
              }}
            >
              {summary.pending} Pending
            </CBadge>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          {loading ? (
            <div
              className="text-center"
              style={{
                padding: 70,
              }}
            >
              <CSpinner />

              <div
                className="mt-3"
                style={{
                  color: '#6b7280',
                }}
              >
                Loading consumption records...
              </div>
            </div>
          ) : filteredConsumptions.length === 0 ? (
            <div
              className="text-center"
              style={{
                padding: 70,
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 18,
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <CIcon
                  icon={cilLayers}
                  size="xl"
                  style={{
                    color: '#9ca3af',
                  }}
                />
              </div>

              <h5 className="fw-bold">No records found</h5>

              <p
                style={{
                  color: '#6b7280',
                  maxWidth: 430,
                  margin: '0 auto 20px',
                }}
              >
                No product consumption records match your current filters.
              </p>

              <CButton
                onClick={openCreateModal}
                style={{
                  background: '#111827',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 10,
                }}
              >
                <CIcon icon={cilPlus} className="me-2" />
                New Consumption
              </CButton>
            </div>
          ) : (
            <div className="table-responsive">
              <CTable hover align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell className="px-4 py-3">Reference</CTableHeaderCell>

                    <CTableHeaderCell>Staff</CTableHeaderCell>

                    <CTableHeaderCell>Products</CTableHeaderCell>

                    <CTableHeaderCell>Reason</CTableHeaderCell>

                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Approved By</CTableHeaderCell>

                    <CTableHeaderCell>Status</CTableHeaderCell>

                    <CTableHeaderCell>Billing</CTableHeaderCell>

                    <CTableHeaderCell className="text-end px-4">Action</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {filteredConsumptions.map((item) => {
                    const items = getItems(item)

                    const status = item.status || 'pending'

                    return (
                      <CTableRow key={item.id}>
                        {/* REFERENCE */}

                        <CTableDataCell className="px-4">
                          <div
                            className="fw-bold"
                            style={{
                              color: '#111827',
                            }}
                          >
                            {getReference(item)}
                          </div>

                          <small
                            style={{
                              color: '#9ca3af',
                            }}
                          >
                            ID #{item.id}
                          </small>
                        </CTableDataCell>

                        {/* STAFF */}

                        <CTableDataCell>
                          <div className="fw-semibold">{getStaffName(getStaffObject(item))}</div>
                        </CTableDataCell>

                        {/* PRODUCTS */}

                        <CTableDataCell>
                          <div className="fw-semibold">
                            {items.length} product
                            {items.length !== 1 ? 's' : ''}
                          </div>

                          {items.slice(0, 2).map((consumptionItem, index) => (
                            <small
                              key={consumptionItem.id || index}
                              className="d-block"
                              style={{
                                color: '#6b7280',
                              }}
                            >
                              {getProductName(getProductObject(consumptionItem))} ×{' '}
                              {consumptionItem.quantity}
                            </small>
                          ))}

                          {items.length > 2 && (
                            <small
                              style={{
                                color: '#c9a227',
                                fontWeight: 600,
                              }}
                            >
                              +{items.length - 2} more
                            </small>
                          )}
                        </CTableDataCell>

                        {/* REASON */}

                        <CTableDataCell>
                          <span
                            style={{
                              color: '#4b5563',
                            }}
                          >
                            {item.reason || '—'}
                          </span>
                        </CTableDataCell>

                        {/* DATE */}

                        <CTableDataCell>
                          <div
                            style={{
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatDate(getDate(item))}
                          </div>
                        </CTableDataCell>

                        <CTableDataCell>
                          {item.status === 'approved' ? (
                            <div>
                              <div className="fw-semibold">{getApprovedByName(item)}</div>

                              {item.approved_at && (
                                <small className="text-medium-emphasis">
                                  {formatDate(item.approved_at)}
                                </small>
                              )}
                            </div>
                          ) : (
                            <span className="text-medium-emphasis">—</span>
                          )}
                        </CTableDataCell>

                        {/* STATUS */}

                        <CTableDataCell>
                          {status === 'pending' && (
                            <CBadge
                              style={{
                                background: '#fff7ed',
                                color: '#c2410c',
                                padding: '7px 10px',
                                borderRadius: 20,
                              }}
                            >
                              Pending
                            </CBadge>
                          )}

                          {status === 'approved' && (
                            <CBadge
                              style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                padding: '7px 10px',
                                borderRadius: 20,
                              }}
                            >
                              <CIcon icon={cilCheckCircle} className="me-1" />
                              Approved
                            </CBadge>
                          )}

                          {status === 'rejected' && (
                            <CBadge
                              style={{
                                background: '#fef2f2',
                                color: '#b91c1c',
                                padding: '7px 10px',
                                borderRadius: 20,
                              }}
                            >
                              Rejected
                            </CBadge>
                          )}
                        </CTableDataCell>

                        {/* BILLING / POS LINK */}

                        <CTableDataCell>
                          {isBilled(item) ? (
                            <div>
                              <CBadge
                                style={{
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  padding: '7px 10px',
                                  borderRadius: 20,
                                }}
                              >
                                Billed in POS
                              </CBadge>
                              <small
                                className="d-block mt-1"
                                style={{ color: '#6b7280' }}
                              >
                                {getSaleObject(item)?.receiptNumber || `Sale #${getSaleId(item)}`}
                              </small>
                            </div>
                          ) : item.status === 'approved' ? (
                            <CBadge
                              style={{
                                background: '#fff8df',
                                color: '#8a6d00',
                                padding: '7px 10px',
                                borderRadius: 20,
                              }}
                            >
                              Ready for POS
                            </CBadge>
                          ) : (
                            <span className="text-medium-emphasis">—</span>
                          )}
                        </CTableDataCell>

                        {/* ACTIONS */}

                        <CTableDataCell className="text-end px-4">
                          <div className="d-flex justify-content-end gap-2">
                            <CButton
                              size="sm"
                              color="light"
                              onClick={() => handleView(item.id)}
                              style={{
                                borderRadius: 8,
                                fontWeight: 600,
                              }}
                            >
                              View
                            </CButton>

                            {status === 'pending' && (
                              <>
                                <CButton
                                  size="sm"
                                  color="success"
                                  variant="outline"
                                  disabled={actionLoading}
                                  onClick={() => handleApprove(item.id)}
                                  style={{
                                    borderRadius: 8,
                                  }}
                                >
                                  <CIcon icon={cilCheck} className="me-1" />
                                  Approve
                                </CButton>

                                <CButton
                                  size="sm"
                                  color="danger"
                                  variant="outline"
                                  disabled={actionLoading}
                                  onClick={() => openRejectModal(item.id)}
                                  style={{
                                    borderRadius: 8,
                                  }}
                                >
                                  <CIcon icon={cilX} className="me-1" />
                                  Reject
                                </CButton>
                              </>
                            )}
                          </div>
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

      {/* ========================================================
          CREATE MODAL
      ======================================================== */}

      <CModal
        visible={showCreateModal}
        onClose={() => !saving && setShowCreateModal(false)}
        size="lg"
        backdrop="static"
      >
        <CModalHeader
          style={{
            background: '#111827',
            color: '#fff',
          }}
        >
          <CModalTitle className="fw-bold">New Product Consumption</CModalTitle>
        </CModalHeader>

        <CForm onSubmit={handleCreate}>
          <CModalBody
            style={{
              background: '#f8fafc',
            }}
          >
            <div
              className="mb-4 p-3"
              style={{
                background: '#fff8df',
                border: '1px solid #f0d978',
                borderRadius: 12,
              }}
            >
              <div className="d-flex">
                <CIcon
                  icon={cilInfo}
                  className="me-2 mt-1"
                  style={{
                    color: '#a17d00',
                  }}
                />

                <div>
                  <strong>Approval Required</strong>

                  <div
                    style={{
                      fontSize: 13,
                      color: '#6b7280',
                    }}
                  >
                    This request will be saved as Pending. Stock will only be deducted after
                    approval. Once approved, the full issued quantity can be billed in POS using its reference number.
                    Stock will not be deducted again when the POS sale is created.
                  </div>
                </div>
              </div>
            </div>

            <CRow>
              {/* STAFF */}

              <CCol md={6} className="mb-3">
                <CFormLabel className="fw-semibold">
                  Staff Member <span className="text-danger">*</span>
                </CFormLabel>

                <CFormSelect
                  value={form.staff_id}
                  onChange={(e) => handleFormChange('staff_id', e.target.value)}
                  style={{
                    borderRadius: 10,
                  }}
                >
                  <option value="">Select staff member</option>

                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {getStaffName(person)}
                    </option>
                  ))}
                </CFormSelect>

                {staff.length === 0 && (
                  <small className="text-danger">No staff members found.</small>
                )}
              </CCol>

              {/* REASON */}

              <CCol md={6} className="mb-3">
                <CFormLabel className="fw-semibold">Reason</CFormLabel>

                <CFormInput
                  value={form.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  placeholder="e.g. Used for client service"
                  style={{
                    borderRadius: 10,
                  }}
                />
              </CCol>
            </CRow>

            {/* PRODUCTS */}

            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="fw-bold mb-1">Products</h6>

                  <small
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    Add the products taken by the staff member.
                  </small>
                </div>

                <CButton
                  type="button"
                  size="sm"
                  onClick={addItem}
                  style={{
                    background: '#111827',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 8,
                  }}
                >
                  <CIcon icon={cilPlus} className="me-1" />
                  Add Product
                </CButton>
              </div>

              {formItems.map((item, index) => {
                const selectedProduct = products.find(
                  (product) => String(product.id) === String(item.product_id),
                )

                return (
                  <div
                    key={index}
                    className="mb-3 p-3"
                    style={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 12,
                    }}
                  >
                    <CRow className="align-items-end">
                      <CCol md={7}>
                        <CFormLabel className="fw-semibold">Product</CFormLabel>

                        <CFormSelect
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          style={{
                            borderRadius: 10,
                          }}
                        >
                          <option value="">Select product</option>

                          {products.map((product) => {
                            const stock = Number(product.quantity || 0)

                            return (
                              <option key={product.id} value={product.id} disabled={stock <= 0}>
                                {product.name} — Stock: {stock}
                              </option>
                            )
                          })}
                        </CFormSelect>

                        {selectedProduct && (
                          <small
                            style={{
                              color: '#6b7280',
                            }}
                          >
                            Available stock: {selectedProduct.quantity}
                          </small>
                        )}
                      </CCol>

                      <CCol md={3}>
                        <CFormLabel className="fw-semibold">Quantity</CFormLabel>

                        <CFormInput
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          style={{
                            borderRadius: 10,
                          }}
                        />
                      </CCol>

                      <CCol md={2}>
                        <CButton
                          type="button"
                          color="danger"
                          variant="outline"
                          className="w-100"
                          disabled={formItems.length === 1}
                          onClick={() => removeItem(index)}
                          style={{
                            borderRadius: 10,
                          }}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CCol>
                    </CRow>
                  </div>
                )
              })}
            </div>

            {/* NOTES */}

            <div className="mt-4">
              <CFormLabel className="fw-semibold">Notes</CFormLabel>

              <CFormTextarea
                rows={3}
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Additional notes..."
                style={{
                  borderRadius: 10,
                }}
              />
            </div>
          </CModalBody>

          <CModalFooter>
            <CButton
              color="light"
              type="button"
              disabled={saving}
              onClick={() => setShowCreateModal(false)}
              style={{
                borderRadius: 10,
              }}
            >
              Cancel
            </CButton>

            <CButton
              type="submit"
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #e8bd35, #c9a227)',
                border: 'none',
                color: '#111827',
                fontWeight: 700,
                borderRadius: 10,
                padding: '10px 20px',
              }}
            >
              {saving ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CIcon icon={cilCheckCircle} className="me-2" />
                  Submit Request
                </>
              )}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* ========================================================
          DETAILS MODAL
      ======================================================== */}

      <CModal visible={showDetailsModal} onClose={() => setShowDetailsModal(false)} size="lg">
        <CModalHeader
          style={{
            background: '#111827',
            color: '#fff',
          }}
        >
          <CModalTitle className="fw-bold">Consumption Details</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {selectedConsumption && (
            <>
              <CRow className="mb-4">
                <CCol md={6}>
                  <small
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    Reference
                  </small>

                  <h5 className="fw-bold mb-0">{getReference(selectedConsumption)}</h5>
                </CCol>

                <CCol md={6}>
                  <small
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    Status
                  </small>

                  <div className="mt-1">
                    {selectedConsumption.status === 'pending' && (
                      <CBadge
                        style={{
                          background: '#fff7ed',
                          color: '#c2410c',
                          padding: '7px 11px',
                          borderRadius: 20,
                        }}
                      >
                        Pending
                      </CBadge>
                    )}

                    {selectedConsumption.status === 'approved' && (
                      <CBadge
                        style={{
                          background: '#ecfdf5',
                          color: '#047857',
                          padding: '7px 11px',
                          borderRadius: 20,
                        }}
                      >
                        Approved
                      </CBadge>
                    )}

                    {selectedConsumption.status === 'rejected' && (
                      <CBadge
                        style={{
                          background: '#fef2f2',
                          color: '#b91c1c',
                          padding: '7px 11px',
                          borderRadius: 20,
                        }}
                      >
                        Rejected
                      </CBadge>
                    )}
                  </div>
                </CCol>
              </CRow>

              <CRow className="mb-4">
                <CCol md={6}>
                  <small
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    Staff
                  </small>

                  <div className="fw-bold">{getStaffName(getStaffObject(selectedConsumption))}</div>
                </CCol>

                <CCol md={6}>
                  <small
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    Requested At
                  </small>

                  <div className="fw-semibold">{formatDate(getDate(selectedConsumption))}</div>
                </CCol>
              </CRow>

              <CRow className="mb-4">
                <CCol md={6}>
                  <small
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    Reason
                  </small>

                  <div>{selectedConsumption.reason || '-'}</div>
                </CCol>

                <CCol md={6}>
                  <small
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    Total Cost
                  </small>

                  <div className="fw-bold">{formatCurrency(getTotalCost(selectedConsumption))}</div>
                </CCol>
              </CRow>
              <div className="detail-item">
                <div className="detail-label">Approved By</div>

                <div className="detail-value">
                  {selectedConsumption?.ApprovedBy?.fullname || '—'}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Approved At</div>

                <div className="detail-value">
                  {selectedConsumption?.approved_at
                    ? formatDate(selectedConsumption.approved_at)
                    : '—'}
                </div>
              </div>

              <div
                className="mt-3 mb-4 p-3"
                style={{
                  background: isBilled(selectedConsumption) ? '#eff6ff' : '#fff8df',
                  border: `1px solid ${isBilled(selectedConsumption) ? '#bfdbfe' : '#f0d978'}`,
                  borderRadius: 12,
                }}
              >
                {isBilled(selectedConsumption) ? (
                  <div>
                    <div className="fw-bold" style={{ color: '#1d4ed8' }}>
                      Billed in POS
                    </div>
                    <div className="small mt-1" style={{ color: '#4b5563' }}>
                      Receipt: {getSaleObject(selectedConsumption)?.receiptNumber || `Sale #${getSaleId(selectedConsumption)}`}
                    </div>
                  </div>
                ) : selectedConsumption.status === 'approved' ? (
                  <div>
                    <div className="fw-bold" style={{ color: '#8a6d00' }}>
                      Approved and ready for POS billing
                    </div>
                    <div className="small mt-1" style={{ color: '#4b5563' }}>
                      Inventory was deducted when this request was approved. POS will not deduct the stock again.
                    </div>
                  </div>
                ) : null}
              </div>

              <h6 className="fw-bold mb-3">Products</h6>

              <div className="table-responsive">
                <CTable bordered hover align="middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Product</CTableHeaderCell>

                      <CTableHeaderCell>Quantity</CTableHeaderCell>

                      <CTableHeaderCell>Unit Cost</CTableHeaderCell>

                      <CTableHeaderCell>Total</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {getItems(selectedConsumption).map((item, index) => {
                      const product = getProductObject(item)

                      const quantity = Number(item.quantity || 0)

                      const unitCost = Number(
                        item.unit_cost || item.unitCost || product?.costPrice || 0,
                      )

                      const total = Number(item.total_cost || item.totalCost || quantity * unitCost)

                      return (
                        <CTableRow key={item.id || index}>
                          <CTableDataCell>
                            <span className="fw-semibold">{getProductName(product)}</span>
                          </CTableDataCell>

                          <CTableDataCell>{quantity}</CTableDataCell>

                          <CTableDataCell>{formatCurrency(unitCost)}</CTableDataCell>

                          <CTableDataCell>
                            <strong>{formatCurrency(total)}</strong>
                          </CTableDataCell>
                        </CTableRow>
                      )
                    })}
                  </CTableBody>
                </CTable>
              </div>

              {selectedConsumption.notes && (
                <div
                  className="mt-4 p-3"
                  style={{
                    background: '#f8fafc',
                    borderRadius: 10,
                  }}
                >
                  <div className="fw-bold mb-1">Notes</div>

                  <div
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    {selectedConsumption.notes}
                  </div>
                </div>
              )}

              {selectedConsumption.status === 'rejected' &&
                selectedConsumption.rejection_reason && (
                  <CAlert color="danger" className="mt-4 mb-0">
                    <strong>Rejection Reason:</strong> {selectedConsumption.rejection_reason}
                  </CAlert>
                )}
            </>
          )}
        </CModalBody>

        <CModalFooter>
          {selectedConsumption?.status === 'pending' && (
            <>
              <CButton
                color="danger"
                variant="outline"
                disabled={actionLoading}
                onClick={() => openRejectModal(selectedConsumption.id)}
                style={{
                  borderRadius: 9,
                }}
              >
                <CIcon icon={cilX} className="me-2" />
                Reject
              </CButton>

              <CButton
                color="success"
                disabled={actionLoading}
                onClick={() => handleApprove(selectedConsumption.id)}
                style={{
                  borderRadius: 9,
                }}
              >
                {actionLoading ? (
                  <CSpinner size="sm" />
                ) : (
                  <>
                    <CIcon icon={cilCheck} className="me-2" />
                    Approve
                  </>
                )}
              </CButton>
            </>
          )}

          <CButton
            color="light"
            onClick={() => setShowDetailsModal(false)}
            style={{
              borderRadius: 9,
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ========================================================
          REJECT MODAL
      ======================================================== */}

      <CModal
        visible={showRejectModal}
        onClose={() => !actionLoading && setShowRejectModal(false)}
        backdrop="static"
      >
        <CModalHeader
          style={{
            background: '#111827',
            color: '#fff',
          }}
        >
          <CModalTitle className="fw-bold">Reject Consumption Request</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CAlert color="warning">
            <CIcon icon={cilWarning} className="me-2" />
            The request will be marked as rejected and stock will not be deducted.
          </CAlert>

          <CFormLabel className="fw-semibold">
            Rejection Reason
            <span className="text-danger"> *</span>
          </CFormLabel>

          <CFormTextarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter the reason for rejecting this request..."
            style={{
              borderRadius: 10,
            }}
          />
        </CModalBody>

        <CModalFooter>
          <CButton
            color="light"
            disabled={actionLoading}
            onClick={() => setShowRejectModal(false)}
            style={{
              borderRadius: 9,
            }}
          >
            Cancel
          </CButton>

          <CButton
            color="danger"
            disabled={actionLoading}
            onClick={handleReject}
            style={{
              borderRadius: 9,
            }}
          >
            {actionLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Rejecting...
              </>
            ) : (
              <>
                <CIcon icon={cilX} className="me-2" />
                Reject Request
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default ProductConsumption
