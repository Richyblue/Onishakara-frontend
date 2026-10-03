import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import CIcon from '@coreui/icons-react'
import {
  cilArrowRight,
  cilBuilding,
  cilCheckCircle,
  cilCloudDownload,
  cilPencil,
  cilPlus,
  cilRecycle,
  cilSearch,
  cilTrash,
  cilUser,
  cilWallet,
  cilXCircle,
} from '@coreui/icons'

import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import { Link, useNavigate } from 'react-router-dom'

/* -------------------------------------------------------------------------- */
/*                                CONFIG                                      */
/* -------------------------------------------------------------------------- */

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

const PAGE_SIZE = 15

/* -------------------------------------------------------------------------- */
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

const formatCurrency = (value) => {
  const amount = Number(value || 0)

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-NG').format(Number(value || 0))
}

const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  )
}

const getSupplierInitials = (supplier) => {
  const name = supplier?.companyName || supplier?.name || 'Supplier'

  const words = String(name).trim().split(/\s+/).filter(Boolean)

  if (!words.length) return 'S'

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

const getSupplierDisplayName = (supplier) => {
  return supplier?.companyName || supplier?.name || 'Unnamed Supplier'
}

const getSupplierContact = (supplier) => {
  return supplier?.contactPerson || supplier?.phone || supplier?.email || 'No contact information'
}

/* -------------------------------------------------------------------------- */
/*                              COMPONENT                                     */
/* -------------------------------------------------------------------------- */

const Suppliers = () => {
  const navigate = useNavigate()

  const [suppliers, setSuppliers] = useState([])

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState('all')

  const [page, setPage] = useState(1)

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  })

  const [actionLoading, setActionLoading] = useState(null)

  /* ------------------------------------------------------------------------ */
  /*                              FETCH                                       */
  /* ------------------------------------------------------------------------ */

  const fetchSuppliers = useCallback(
    async ({
      requestedPage = page,
      requestedSearch = search,
      requestedStatus = statusFilter,
    } = {}) => {
      try {
        setLoading(true)

        const token = localStorage.getItem('token')

        const response = await axios.get(`${API_URL}/suppliers`, {
          params: {
            page: requestedPage,
            limit: PAGE_SIZE,
            search: requestedSearch.trim(),
            ...(requestedStatus !== 'all' ? { status: requestedStatus } : {}),
          },

          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        })

        const data = response?.data || {}

        const supplierList = Array.isArray(data.suppliers)
          ? data.suppliers
          : Array.isArray(data.data)
            ? data.data
            : []

        setSuppliers(supplierList)

        setPagination({
          total: Number(data?.pagination?.total ?? supplierList.length),

          page: Number(data?.pagination?.page ?? requestedPage),

          limit: Number(data?.pagination?.limit ?? PAGE_SIZE),

          totalPages: Math.max(Number(data?.pagination?.totalPages ?? 1), 1),
        })
      } catch (error) {
        console.error('FETCH SUPPLIERS ERROR:', error)

        Swal.fire({
          icon: 'error',
          title: 'Unable to load suppliers',
          text: getErrorMessage(error, 'Please check your connection and try again.'),
          confirmButtonColor: '#c9a227',
        })
      } finally {
        setLoading(false)
      }
    },
    [page, search, statusFilter],
  )

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  /* ------------------------------------------------------------------------ */
  /*                         SEARCH / FILTER                                  */
  /* ------------------------------------------------------------------------ */

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value)
    setPage(1)
  }

  /* ------------------------------------------------------------------------ */
  /*                              DELETE                                      */
  /* ------------------------------------------------------------------------ */

  const handleDelete = async (supplier) => {
    const supplierName = getSupplierDisplayName(supplier)

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Move supplier to recycle bin?',
      html: `
          <div style="font-size:14px;line-height:1.7">
            <strong>${supplierName}</strong>
            will be moved to the recycle bin.
            <br/>
            You can restore the supplier later.
          </div>
        `,
      showCancelButton: true,
      confirmButtonText: 'Move to Recycle Bin',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b42318',
      cancelButtonColor: '#374151',
      reverseButtons: true,
    })

    if (!result.isConfirmed) return

    try {
      setActionLoading({
        id: supplier.id,
        type: 'delete',
      })

      const token = localStorage.getItem('token')

      await axios.delete(`${API_URL}/suppliers/${supplier.id}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      })

      setSuppliers((current) => current.filter((item) => item.id !== supplier.id))

      setPagination((current) => ({
        ...current,
        total: Math.max(current.total - 1, 0),
      }))

      await Swal.fire({
        icon: 'success',
        title: 'Supplier Removed',
        text: `${supplierName} has been moved to the recycle bin.`,
        timer: 1800,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error('DELETE SUPPLIER ERROR:', error)

      Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: getErrorMessage(error, 'Unable to remove supplier.'),
        confirmButtonColor: '#c9a227',
      })
    } finally {
      setActionLoading(null)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                              EXPORT                                      */
  /* ------------------------------------------------------------------------ */

  const exportSuppliers = () => {
    if (!suppliers.length) {
      Swal.fire({
        icon: 'info',
        title: 'Nothing to export',
        text: 'There are no suppliers currently displayed.',
        confirmButtonColor: '#c9a227',
      })

      return
    }

    const headers = [
      'Supplier',
      'Company',
      'Contact Person',
      'Phone',
      'Email',
      'City',
      'State',
      'Status',
      'Opening Balance',
    ]

    const rows = suppliers.map((supplier) => [
      supplier.name || '',
      supplier.companyName || '',
      supplier.contactPerson || '',
      supplier.phone || '',
      supplier.email || '',
      supplier.city || '',
      supplier.state || '',
      supplier.status || '',
      Number(supplier.openingBalance || 0).toFixed(2),
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const stringValue = String(value ?? '').replace(/"/g, '""')

            return `"${stringValue}"`
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
    link.download = `onishakara-suppliers-${new Date().toISOString().slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  /* ------------------------------------------------------------------------ */
  /*                              SUMMARY                                     */
  /* ------------------------------------------------------------------------ */

  const summary = useMemo(() => {
    const active = suppliers.filter((supplier) => supplier.status === 'active').length

    const inactive = suppliers.filter((supplier) => supplier.status === 'inactive').length

    const openingBalance = suppliers.reduce(
      (total, supplier) => total + Number(supplier.openingBalance || 0),
      0,
    )

    return {
      total: pagination.total,
      active,
      inactive,
      openingBalance,
    }
  }, [suppliers, pagination.total])

  /* ------------------------------------------------------------------------ */
  /*                              PAGINATION                                  */
  /* ------------------------------------------------------------------------ */

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === page) {
      return
    }

    setPage(newPage)
  }

  const paginationItems = useMemo(() => {
    const totalPages = pagination.totalPages

    if (totalPages <= 1) return []

    const items = []

    let start = Math.max(page - 2, 1)

    let end = Math.min(start + 4, totalPages)

    if (end - start < 4) {
      start = Math.max(end - 4, 1)
    }

    for (let current = start; current <= end; current += 1) {
      items.push(current)
    }

    return items
  }, [page, pagination.totalPages])

  /* ------------------------------------------------------------------------ */
  /*                              RENDER                                      */
  /* ------------------------------------------------------------------------ */

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%)',
        paddingBottom: '40px',
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 65%, #111827 100%)',
          borderBottom: '1px solid rgba(201,162,39,0.35)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}
      >
        <CContainer fluid>
          <div
            style={{
              padding: '28px 8px',
            }}
          >
            <CRow className="align-items-center g-3">
              <CCol>
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #c9a227, #e8bd35)',
                      color: '#111827',
                      boxShadow: '0 8px 20px rgba(201,162,39,0.25)',
                    }}
                  >
                    <CIcon icon={cilBuilding} size="xl" />
                  </div>

                  <div>
                    <div
                      style={{
                        color: '#e8bd35',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 1.8,
                        textTransform: 'uppercase',
                        marginBottom: 3,
                      }}
                    >
                      Onishakara Gold
                    </div>

                    <h2
                      style={{
                        color: '#ffffff',
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 26,
                      }}
                    >
                      Suppliers
                    </h2>

                    <div
                      style={{
                        color: '#cbd5e1',
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      Manage suppliers, contacts and supplier accounts
                    </div>
                  </div>
                </div>
              </CCol>

              <CCol xs="12" md="auto">
                <div className="d-flex flex-wrap gap-2">
                  <CButton
                    component={Link}
                    to="/suppliers/recycle-bin"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    <CIcon icon={cilRecycle} className="me-2" />
                    Recycle Bin
                  </CButton>

                  <CButton
                    onClick={exportSuppliers}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    <CIcon icon={cilCloudDownload} className="me-2" />
                    Export
                  </CButton>

                  <CButton
                    component={Link}
                    to="/suppliers/add"
                    style={{
                      background: 'linear-gradient(135deg, #c9a227, #e8bd35)',
                      border: 'none',
                      color: '#111827',
                      fontWeight: 700,
                      boxShadow: '0 6px 18px rgba(201,162,39,0.25)',
                    }}
                  >
                    <CIcon icon={cilPlus} className="me-2" />
                    Add Supplier
                  </CButton>
                </div>
              </CCol>
            </CRow>
          </div>
        </CContainer>
      </div>

      <CContainer
        fluid
        style={{
          paddingTop: 24,
        }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* SUMMARY CARDS                                                    */}
        {/* ---------------------------------------------------------------- */}

        <CRow className="g-3 mb-4">
          <CCol xs="12" sm="6" xl="3">
            <CCard
              className="h-100 border-0"
              style={{
                borderRadius: 16,
                boxShadow: '0 4px 18px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Total Suppliers
                    </div>

                    <div
                      style={{
                        color: '#111827',
                        fontSize: 28,
                        fontWeight: 800,
                        marginTop: 6,
                      }}
                    >
                      {formatNumber(summary.total)}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#fff8dc',
                      color: '#b08a12',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CIcon icon={cilBuilding} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs="12" sm="6" xl="3">
            <CCard
              className="h-100 border-0"
              style={{
                borderRadius: 16,
                boxShadow: '0 4px 18px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Active Suppliers
                    </div>

                    <div
                      style={{
                        color: '#111827',
                        fontSize: 28,
                        fontWeight: 800,
                        marginTop: 6,
                      }}
                    >
                      {formatNumber(summary.active)}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#ecfdf3',
                      color: '#15803d',
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

          <CCol xs="12" sm="6" xl="3">
            <CCard
              className="h-100 border-0"
              style={{
                borderRadius: 16,
                boxShadow: '0 4px 18px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Inactive Suppliers
                    </div>

                    <div
                      style={{
                        color: '#111827',
                        fontSize: 28,
                        fontWeight: 800,
                        marginTop: 6,
                      }}
                    >
                      {formatNumber(summary.inactive)}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#fef2f2',
                      color: '#b42318',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CIcon icon={cilXCircle} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol xs="12" sm="6" xl="3">
            <CCard
              className="h-100 border-0"
              style={{
                borderRadius: 16,
                boxShadow: '0 4px 18px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Opening Balances
                    </div>

                    <div
                      style={{
                        color: '#111827',
                        fontSize: 23,
                        fontWeight: 800,
                        marginTop: 8,
                      }}
                    >
                      {formatCurrency(summary.openingBalance)}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#f1f5f9',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CIcon icon={cilWallet} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* ---------------------------------------------------------------- */}
        {/* MAIN CARD                                                        */}
        {/* ---------------------------------------------------------------- */}

        <CCard
          className="border-0"
          style={{
            borderRadius: 18,
            boxShadow: '0 6px 24px rgba(15,23,42,0.07)',
            overflow: 'hidden',
          }}
        >
          {/* TOOLBAR */}

          <CCardBody
            style={{
              padding: 20,
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <CRow className="g-3 align-items-center">
              <CCol xs="12" lg="7">
                <CInputGroup>
                  <CInputGroupText
                    style={{
                      background: '#ffffff',
                      borderRight: 'none',
                      color: '#64748b',
                    }}
                  >
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>

                  <CFormInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search supplier, company, contact, phone or email..."
                    style={{
                      borderLeft: 'none',
                      minHeight: 44,
                      boxShadow: 'none',
                    }}
                  />
                </CInputGroup>
              </CCol>

              <CCol xs="12" sm="6" lg="3">
                <CFormSelect
                  value={statusFilter}
                  onChange={handleStatusChange}
                  style={{
                    minHeight: 44,
                    borderRadius: 10,
                  }}
                >
                  <option value="all">All Statuses</option>

                  <option value="active">Active</option>

                  <option value="inactive">Inactive</option>
                </CFormSelect>
              </CCol>

              <CCol xs="12" sm="6" lg="2" className="text-sm-end">
                <CButton
                  component={Link}
                  to="/suppliers/add"
                  className="w-100"
                  style={{
                    minHeight: 44,
                    background: '#111827',
                    border: '1px solid #111827',
                    color: '#ffffff',
                    fontWeight: 700,
                    borderRadius: 10,
                  }}
                >
                  <CIcon icon={cilPlus} className="me-2" />
                  New Supplier
                </CButton>
              </CCol>
            </CRow>
          </CCardBody>

          {/* TABLE */}

          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <CTable
              hover
              responsive
              className="mb-0 align-middle"
              style={{
                minWidth: 1050,
              }}
            >
              <CTableHead
                style={{
                  background: '#f8fafc',
                }}
              >
                <CTableRow>
                  <CTableHeaderCell
                    style={{
                      padding: '15px 18px',
                      color: '#475569',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                      fontWeight: 800,
                    }}
                  >
                    Supplier
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{
                      color: '#475569',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                      fontWeight: 800,
                    }}
                  >
                    Contact
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{
                      color: '#475569',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                      fontWeight: 800,
                    }}
                  >
                    Location
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{
                      color: '#475569',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                      fontWeight: 800,
                    }}
                  >
                    Opening Balance
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{
                      color: '#475569',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                      fontWeight: 800,
                    }}
                  >
                    Status
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    className="text-end"
                    style={{
                      color: '#475569',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                      fontWeight: 800,
                      paddingRight: 18,
                    }}
                  >
                    Actions
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {loading ? (
                  <CTableRow>
                    <CTableDataCell
                      colSpan={6}
                      style={{
                        padding: '70px 20px',
                      }}
                    >
                      <div className="text-center">
                        <CSpinner
                          style={{
                            color: '#c9a227',
                          }}
                        />

                        <div
                          style={{
                            marginTop: 14,
                            color: '#64748b',
                            fontSize: 14,
                          }}
                        >
                          Loading suppliers...
                        </div>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ) : suppliers.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell
                      colSpan={6}
                      style={{
                        padding: '70px 20px',
                      }}
                    >
                      <div className="text-center">
                        <div
                          style={{
                            width: 68,
                            height: 68,
                            borderRadius: '50%',
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fff8dc',
                            color: '#b08a12',
                          }}
                        >
                          <CIcon icon={cilBuilding} size="xl" />
                        </div>

                        <h5
                          style={{
                            color: '#111827',
                            fontWeight: 700,
                          }}
                        >
                          No suppliers found
                        </h5>

                        <p
                          style={{
                            color: '#64748b',
                            maxWidth: 460,
                            margin: '0 auto 20px',
                          }}
                        >
                          {search || statusFilter !== 'all'
                            ? 'Try changing your search or filter.'
                            : 'Add your first supplier to begin managing your supplier network.'}
                        </p>

                        {!search && statusFilter === 'all' && (
                          <CButton
                            component={Link}
                            to="/suppliers/add"
                            style={{
                              background: '#c9a227',
                              border: 'none',
                              color: '#111827',
                              fontWeight: 700,
                            }}
                          >
                            <CIcon icon={cilPlus} className="me-2" />
                            Add First Supplier
                          </CButton>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  suppliers.map((supplier) => {
                    const isDeleting =
                      actionLoading?.id === supplier.id && actionLoading?.type === 'delete'

                    const location = [supplier.city, supplier.state].filter(Boolean).join(', ')

                    return (
                      <CTableRow key={supplier.id}>
                        {/* SUPPLIER */}

                        <CTableDataCell
                          style={{
                            padding: '15px 18px',
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                minWidth: 44,
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#111827',
                                color: '#e8bd35',
                                fontWeight: 800,
                                fontSize: 13,
                              }}
                            >
                              {getSupplierInitials(supplier)}
                            </div>

                            <div
                              style={{
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  color: '#111827',
                                  fontWeight: 750,
                                  fontSize: 14,
                                }}
                              >
                                {getSupplierDisplayName(supplier)}
                              </div>

                              <div
                                style={{
                                  color: '#64748b',
                                  fontSize: 12,
                                  marginTop: 3,
                                }}
                              >
                                {supplier.companyName &&
                                supplier.name &&
                                supplier.companyName !== supplier.name
                                  ? supplier.name
                                  : `Supplier #${supplier.id}`}
                              </div>
                            </div>
                          </div>
                        </CTableDataCell>

                        {/* CONTACT */}

                        <CTableDataCell>
                          <div
                            style={{
                              color: '#111827',
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            {getSupplierContact(supplier)}
                          </div>

                          {supplier.email && (
                            <div
                              style={{
                                color: '#64748b',
                                fontSize: 12,
                                marginTop: 3,
                              }}
                            >
                              {supplier.email}
                            </div>
                          )}
                        </CTableDataCell>

                        {/* LOCATION */}

                        <CTableDataCell>
                          <span
                            style={{
                              color: location ? '#334155' : '#94a3b8',
                              fontSize: 13,
                            }}
                          >
                            {location || 'Not provided'}
                          </span>
                        </CTableDataCell>

                        {/* BALANCE */}

                        <CTableDataCell>
                          <div
                            style={{
                              color: '#111827',
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {formatCurrency(supplier.openingBalance)}
                          </div>
                        </CTableDataCell>

                        {/* STATUS */}

                        <CTableDataCell>
                          {supplier.status === 'active' ? (
                            <CBadge
                              style={{
                                background: '#ecfdf3',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                borderRadius: 999,
                                padding: '6px 10px',
                                fontWeight: 700,
                              }}
                            >
                              <CIcon icon={cilCheckCircle} className="me-1" />
                              Active
                            </CBadge>
                          ) : (
                            <CBadge
                              style={{
                                background: '#fef2f2',
                                color: '#b42318',
                                border: '1px solid #fecaca',
                                borderRadius: 999,
                                padding: '6px 10px',
                                fontWeight: 700,
                              }}
                            >
                              <CIcon icon={cilXCircle} className="me-1" />
                              Inactive
                            </CBadge>
                          )}
                        </CTableDataCell>

                        {/* ACTIONS */}

                        <CTableDataCell>
                          <div className="d-flex justify-content-end gap-2">
                            <CButton
                              size="sm"
                              component={Link}
                              to={`/suppliers/${supplier.id}`}
                              style={{
                                background: '#111827',
                                border: '1px solid #111827',
                                color: '#ffffff',
                                borderRadius: 8,
                                fontWeight: 600,
                              }}
                            >
                              View
                              <CIcon icon={cilArrowRight} className="ms-1" />
                            </CButton>

                            <CButton
                              size="sm"
                              component={Link}
                              to={`/suppliers/edit/${supplier.id}`}
                              style={{
                                background: '#fff8dc',
                                border: '1px solid #e5cf78',
                                color: '#8a6b08',
                                borderRadius: 8,
                                fontWeight: 700,
                              }}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>

                            <CButton
                              size="sm"
                              disabled={isDeleting || actionLoading !== null}
                              onClick={() => handleDelete(supplier)}
                              style={{
                                background: '#fff',
                                border: '1px solid #fecaca',
                                color: '#b42318',
                                borderRadius: 8,
                                fontWeight: 700,
                              }}
                            >
                              {isDeleting ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} />}
                            </CButton>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* FOOTER / PAGINATION                                              */}
          {/* ---------------------------------------------------------------- */}

          {!loading && suppliers.length > 0 && (
            <CCardBody
              style={{
                borderTop: '1px solid #e5e7eb',
                padding: '15px 18px',
              }}
            >
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                <div
                  style={{
                    color: '#64748b',
                    fontSize: 13,
                  }}
                >
                  Showing{' '}
                  <strong
                    style={{
                      color: '#111827',
                    }}
                  >
                    {pagination.total === 0 ? 0 : (page - 1) * pagination.limit + 1}
                  </strong>{' '}
                  to{' '}
                  <strong
                    style={{
                      color: '#111827',
                    }}
                  >
                    {Math.min(page * pagination.limit, pagination.total)}
                  </strong>{' '}
                  of{' '}
                  <strong
                    style={{
                      color: '#111827',
                    }}
                  >
                    {formatNumber(pagination.total)}
                  </strong>{' '}
                  suppliers
                </div>

                {pagination.totalPages > 1 && (
                  <div className="d-flex align-items-center gap-1">
                    <CButton
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => goToPage(page - 1)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        color: '#334155',
                      }}
                    >
                      Previous
                    </CButton>

                    {paginationItems.map((item) => (
                      <CButton
                        key={item}
                        size="sm"
                        onClick={() => goToPage(item)}
                        style={{
                          minWidth: 36,
                          background: item === page ? '#c9a227' : '#ffffff',
                          border: item === page ? '1px solid #c9a227' : '1px solid #d1d5db',
                          color: item === page ? '#111827' : '#334155',
                          fontWeight: item === page ? 800 : 500,
                        }}
                      >
                        {item}
                      </CButton>
                    ))}

                    <CButton
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => goToPage(page + 1)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        color: '#334155',
                      }}
                    >
                      Next
                    </CButton>
                  </div>
                )}
              </div>
            </CCardBody>
          )}
        </CCard>
      </CContainer>
    </div>
  )
}

export default Suppliers
