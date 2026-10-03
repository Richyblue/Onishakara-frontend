import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft,
  cilBuilding,
  cilCheckCircle,
  cilClock,
  cilCloudDownload,
  cilLocationPin,
  cilPencil,
  cilPhone,
  cilReload,
  cilTrash,
  cilUser,
  cilWallet,
  cilXCircle,
} from '@coreui/icons'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
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

import { Link, useNavigate, useParams } from 'react-router-dom'

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const getToken = () => localStorage.getItem('token')

const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  )
}

const extractSupplier = (response) => {
  return response?.data?.supplier || response?.data?.data || response?.data
}

const formatMoney = (value) => {
  const amount = Number(value || 0)

  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatDate = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getPurchaseId = (purchase) => {
  return purchase?.id || purchase?.purchaseId || purchase?.PurchaseId || null
}

const getPurchaseReference = (purchase) => {
  return (
    purchase?.referenceNumber ||
    purchase?.purchaseNumber ||
    purchase?.invoiceNumber ||
    purchase?.reference ||
    purchase?.number ||
    `PUR-${purchase?.id || '—'}`
  )
}

const getPurchaseTotal = (purchase) => {
  return Number(
    purchase?.grandTotal ?? purchase?.totalAmount ?? purchase?.total ?? purchase?.amount ?? 0,
  )
}

const getPurchasePaid = (purchase) => {
  return Number(purchase?.paidAmount ?? purchase?.amountPaid ?? purchase?.paid ?? 0)
}

const getPurchaseOutstanding = (purchase) => {
  if (purchase?.outstandingAmount !== undefined && purchase?.outstandingAmount !== null) {
    return Number(purchase.outstandingAmount)
  }

  return Math.max(getPurchaseTotal(purchase) - getPurchasePaid(purchase), 0)
}

const getPurchaseStatus = (purchase) => {
  const rawStatus = String(purchase?.paymentStatus || purchase?.status || '').toLowerCase()

  if (rawStatus.includes('paid') || rawStatus === 'completed') {
    return 'paid'
  }

  if (rawStatus.includes('partial')) {
    return 'partial'
  }

  if (rawStatus.includes('pending') || rawStatus.includes('unpaid')) {
    return 'unpaid'
  }

  const outstanding = getPurchaseOutstanding(purchase)

  const paid = getPurchasePaid(purchase)

  if (outstanding <= 0 && paid > 0) {
    return 'paid'
  }

  if (paid > 0 && outstanding > 0) {
    return 'partial'
  }

  return 'unpaid'
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

const SupplierDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [supplier, setSupplier] = useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')

  const [search, setSearch] = useState('')

  const [deleting, setDeleting] = useState(false)

  /* ------------------------------------------------------------------------ */
  /* FETCH SUPPLIER                                                            */
  /* ------------------------------------------------------------------------ */

  const fetchSupplier = async (showRefresh = false) => {
    if (!id) {
      setErrorMessage('Supplier ID was not provided.')
      setLoading(false)
      return
    }

    if (!API_ROOT) {
      setErrorMessage('Backend URL is not configured. Please check VITE_BACKEND_URL.')
      setLoading(false)
      return
    }

    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setErrorMessage('')

      const token = getToken()

      const response = await axios.get(`${API_URL}/suppliers/${id}/details`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      })

      const data = extractSupplier(response)

      if (!data) {
        throw new Error('Supplier information was not returned by the server.')
      }

      setSupplier(data)
    } catch (error) {
      console.error('SUPPLIER DETAILS ERROR:', error)

      /*
       * Some older backends may not yet expose
       * /details. Fall back to the normal supplier
       * endpoint so the profile can still be viewed.
       */
      if (error?.response?.status === 404) {
        try {
          const token = getToken()

          const fallbackResponse = await axios.get(`${API_URL}/suppliers/${id}`, {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          })

          const fallbackSupplier = extractSupplier(fallbackResponse)

          setSupplier(fallbackSupplier)

          return
        } catch (fallbackError) {
          console.error('SUPPLIER FALLBACK ERROR:', fallbackError)

          setErrorMessage(getErrorMessage(fallbackError, 'Unable to load supplier.'))

          return
        }
      }

      setErrorMessage(getErrorMessage(error, 'Unable to load supplier.'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSupplier()
  }, [id])

  /* ------------------------------------------------------------------------ */
  /* PURCHASE DATA                                                             */
  /* ------------------------------------------------------------------------ */

  const purchases = useMemo(() => {
    if (!supplier) return []

    return supplier.Purchases || supplier.purchases || supplier.purchaseHistory || []
  }, [supplier])

  const filteredPurchases = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return purchases
    }

    return purchases.filter((purchase) => {
      const reference = getPurchaseReference(purchase).toLowerCase()

      const status = String(purchase?.paymentStatus || purchase?.status || '').toLowerCase()

      return reference.includes(keyword) || status.includes(keyword)
    })
  }, [purchases, search])

  /* ------------------------------------------------------------------------ */
  /* FINANCIAL SUMMARY                                                        */
  /* ------------------------------------------------------------------------ */

  const calculatedTotals = useMemo(() => {
    const totalPurchases = purchases.reduce((sum, purchase) => sum + getPurchaseTotal(purchase), 0)

    const totalPaid = purchases.reduce((sum, purchase) => sum + getPurchasePaid(purchase), 0)

    const outstanding = purchases.reduce(
      (sum, purchase) => sum + getPurchaseOutstanding(purchase),
      0,
    )

    return {
      totalPurchases,
      totalPaid,
      outstanding,
    }
  }, [purchases])

  const totalPurchases = Number(
    supplier?.totalPurchases ??
      supplier?.totalPurchaseAmount ??
      calculatedTotals.totalPurchases ??
      0,
  )

  const totalPaid = Number(
    supplier?.totalPaid ?? supplier?.totalPaidAmount ?? calculatedTotals.totalPaid ?? 0,
  )

  const outstanding = Number(
    supplier?.outstanding ??
      supplier?.outstandingBalance ??
      supplier?.balance ??
      calculatedTotals.outstanding ??
      0,
  )

  const openingBalance = Number(supplier?.openingBalance || 0)

  /* ------------------------------------------------------------------------ */
  /* DELETE SUPPLIER                                                           */
  /* ------------------------------------------------------------------------ */

  const handleDelete = async () => {
    if (!supplier || deleting) return

    const supplierName = supplier.companyName || supplier.name || 'this supplier'

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Supplier?',
      html: `
        <div style="line-height:1.6">
          You are about to remove
          <strong>${supplierName}</strong>
          from your active supplier list.
          <br /><br />
          The supplier will be moved to the
          <strong>Recycle Bin</strong> and can be restored later.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Move to Recycle Bin',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b42318',
      cancelButtonColor: '#374151',
      reverseButtons: true,
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      setDeleting(true)

      const token = getToken()

      await axios.delete(`${API_URL}/suppliers/${id}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      })

      await Swal.fire({
        icon: 'success',
        title: 'Supplier Deleted',
        text: `${supplierName} has been moved to the recycle bin.`,
        confirmButtonColor: '#c9a227',
      })

      navigate('/suppliers')
    } catch (error) {
      console.error('DELETE SUPPLIER ERROR:', error)

      await Swal.fire({
        icon: 'error',
        title: 'Unable to Delete',
        text: getErrorMessage(error, 'The supplier could not be deleted.'),
        confirmButtonColor: '#c9a227',
      })
    } finally {
      setDeleting(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /* EXPORT PURCHASES                                                         */
  /* ------------------------------------------------------------------------ */

  const handleExport = () => {
    if (!filteredPurchases.length) {
      Swal.fire({
        icon: 'info',
        title: 'Nothing to Export',
        text: 'There are no purchase records to export.',
        confirmButtonColor: '#c9a227',
      })

      return
    }

    const headers = ['Reference', 'Date', 'Total', 'Paid', 'Outstanding', 'Status']

    const rows = filteredPurchases.map((purchase) => [
      getPurchaseReference(purchase),
      formatDate(purchase?.purchaseDate || purchase?.date || purchase?.createdAt),
      getPurchaseTotal(purchase).toFixed(2),
      getPurchasePaid(purchase).toFixed(2),
      getPurchaseOutstanding(purchase).toFixed(2),
      getPurchaseStatus(purchase),
    ])

    const csv = [headers, ...rows]
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

    link.download = `${supplier?.name || 'supplier'}-purchases.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  /* ------------------------------------------------------------------------ */
  /* PURCHASE STATUS                                                          */
  /* ------------------------------------------------------------------------ */

  const renderPurchaseStatus = (purchase) => {
    const status = getPurchaseStatus(purchase)

    if (status === 'paid') {
      return (
        <CBadge
          color="success"
          style={{
            padding: '6px 9px',
            borderRadius: 7,
          }}
        >
          Paid
        </CBadge>
      )
    }

    if (status === 'partial') {
      return (
        <CBadge
          color="warning"
          style={{
            padding: '6px 9px',
            borderRadius: 7,
          }}
        >
          Partial
        </CBadge>
      )
    }

    return (
      <CBadge
        color="danger"
        style={{
          padding: '6px 9px',
          borderRadius: 7,
        }}
      >
        Unpaid
      </CBadge>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* LOADING                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <CSpinner
            style={{
              width: 42,
              height: 42,
              color: '#c9a227',
            }}
          />

          <div
            style={{
              marginTop: 15,
              color: '#475569',
              fontWeight: 650,
            }}
          >
            Loading supplier...
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* ERROR STATE                                                              */
  /* ------------------------------------------------------------------------ */

  if (!supplier) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
        }}
      >
        <CContainer
          style={{
            paddingTop: 60,
            maxWidth: 800,
          }}
        >
          <CAlert
            color="danger"
            style={{
              borderRadius: 14,
            }}
          >
            <strong>Unable to load supplier.</strong>

            <div className="mt-1">{errorMessage || 'Supplier was not found.'}</div>
          </CAlert>

          <CButton
            component={Link}
            to="/suppliers"
            style={{
              background: '#111827',
              border: 'none',
              color: '#fff',
              borderRadius: 9,
            }}
          >
            <CIcon icon={cilArrowLeft} className="me-2" />
            Back to Suppliers
          </CButton>
        </CContainer>
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        paddingBottom: 50,
      }}
    >
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <div
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 60%, #111827 100%)',
          borderBottom: '1px solid rgba(201,162,39,0.35)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}
      >
        <CContainer fluid>
          <div
            style={{
              padding: '26px 8px',
            }}
          >
            <CRow className="align-items-center g-3">
              <CCol>
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      minWidth: 56,
                      borderRadius: 15,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #c9a227, #e8bd35)',
                      color: '#111827',
                      fontSize: 20,
                      fontWeight: 800,
                      boxShadow: '0 8px 20px rgba(201,162,39,0.25)',
                    }}
                  >
                    {supplier.name
                      ?.trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join('')
                      .toUpperCase() || 'S'}
                  </div>

                  <div>
                    <div
                      style={{
                        color: '#e8bd35',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 1.8,
                        textTransform: 'uppercase',
                      }}
                    >
                      Onishakara Gold
                    </div>

                    <h2
                      style={{
                        color: '#ffffff',
                        margin: '3px 0 0',
                        fontSize: 25,
                        fontWeight: 750,
                      }}
                    >
                      {supplier.companyName || supplier.name}
                    </h2>

                    <div
                      style={{
                        color: '#cbd5e1',
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      Supplier profile & purchase account
                    </div>
                  </div>
                </div>
              </CCol>

              <CCol xs="12" md="auto">
                <div className="d-flex flex-wrap gap-2">
                  <CButton
                    type="button"
                    onClick={() => navigate('/suppliers')}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      color: '#ffffff',
                      fontWeight: 650,
                      borderRadius: 9,
                    }}
                  >
                    <CIcon icon={cilArrowLeft} className="me-2" />
                    Suppliers
                  </CButton>

                  <CButton
                    component={Link}
                    to={`/suppliers/edit/${id}`}
                    style={{
                      background: '#c9a227',
                      border: 'none',
                      color: '#111827',
                      fontWeight: 750,
                      borderRadius: 9,
                    }}
                  >
                    <CIcon icon={cilPencil} className="me-2" />
                    Edit Supplier
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
          maxWidth: 1350,
          paddingTop: 25,
        }}
      >
        {/* ================================================================== */}
        {/* TOP ACTION ERROR                                                   */}
        {/* ================================================================== */}

        {errorMessage && (
          <CAlert
            color="danger"
            dismissible
            onClose={() => setErrorMessage('')}
            style={{
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            {errorMessage}
          </CAlert>
        )}

        {/* ================================================================== */}
        {/* SUMMARY CARDS                                                      */}
        {/* ================================================================== */}

        <CRow className="g-4 mb-4">
          {/* Total Purchases */}
          <CCol xs="12" sm="6" xl="3">
            <CCard
              className="border-0 h-100"
              style={{
                borderRadius: 15,
                boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody
                style={{
                  padding: 21,
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 11,
                        fontWeight: 750,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      Total Purchases
                    </div>

                    <div
                      style={{
                        color: '#111827',
                        fontSize: 21,
                        fontWeight: 800,
                        marginTop: 7,
                      }}
                    >
                      {formatMoney(totalPurchases)}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      background: '#fff8dc',
                      color: '#a57d05',
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

          {/* Paid */}
          <CCol xs="12" sm="6" xl="3">
            <CCard
              className="border-0 h-100"
              style={{
                borderRadius: 15,
                boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody
                style={{
                  padding: 21,
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 11,
                        fontWeight: 750,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      Total Paid
                    </div>

                    <div
                      style={{
                        color: '#15803d',
                        fontSize: 21,
                        fontWeight: 800,
                        marginTop: 7,
                      }}
                    >
                      {formatMoney(totalPaid)}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
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

          {/* Outstanding */}
          <CCol xs="12" sm="6" xl="3">
            <CCard
              className="border-0 h-100"
              style={{
                borderRadius: 15,
                boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody
                style={{
                  padding: 21,
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 11,
                        fontWeight: 750,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      Outstanding
                    </div>

                    <div
                      style={{
                        color: outstanding > 0 ? '#b42318' : '#15803d',
                        fontSize: 21,
                        fontWeight: 800,
                        marginTop: 7,
                      }}
                    >
                      {formatMoney(outstanding)}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      background: outstanding > 0 ? '#fef2f2' : '#ecfdf3',
                      color: outstanding > 0 ? '#b42318' : '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CIcon icon={outstanding > 0 ? cilClock : cilCheckCircle} />
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* Opening Balance */}
          <CCol xs="12" sm="6" xl="3">
            <CCard
              className="border-0 h-100"
              style={{
                borderRadius: 15,
                boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody
                style={{
                  padding: 21,
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 11,
                        fontWeight: 750,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      Opening Balance
                    </div>

                    <div
                      style={{
                        color: '#111827',
                        fontSize: 21,
                        fontWeight: 800,
                        marginTop: 7,
                      }}
                    >
                      {formatMoney(openingBalance)}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
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

        <CRow className="g-4">
          {/* =============================================================== */}
          {/* SUPPLIER PROFILE                                                */}
          {/* =============================================================== */}

          <CCol xs="12" xl="4">
            <CCard
              className="border-0 mb-4"
              style={{
                borderRadius: 16,
                boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody
                style={{
                  padding: 24,
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5
                    style={{
                      margin: 0,
                      color: '#111827',
                      fontWeight: 750,
                    }}
                  >
                    Supplier Information
                  </h5>

                  <CBadge
                    color={supplier.status === 'active' ? 'success' : 'secondary'}
                    style={{
                      padding: '6px 9px',
                      borderRadius: 7,
                    }}
                  >
                    {supplier.status === 'active' ? 'Active' : 'Inactive'}
                  </CBadge>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 22,
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      minWidth: 58,
                      borderRadius: 15,
                      background: 'linear-gradient(135deg, #c9a227, #e8bd35)',
                      color: '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 850,
                      fontSize: 19,
                    }}
                  >
                    {supplier.name
                      ?.trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join('')
                      .toUpperCase() || 'S'}
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 17,
                        color: '#111827',
                      }}
                    >
                      {supplier.name}
                    </div>

                    {supplier.companyName && (
                      <div
                        style={{
                          color: '#64748b',
                          fontSize: 13,
                          marginTop: 3,
                        }}
                      >
                        {supplier.companyName}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #e5e7eb',
                  }}
                >
                  {/* Contact */}
                  <div
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div className="d-flex gap-3">
                      <CIcon
                        icon={cilUser}
                        style={{
                          color: '#a57d05',
                          marginTop: 2,
                        }}
                      />

                      <div>
                        <div
                          style={{
                            color: '#64748b',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          Contact Person
                        </div>

                        <div
                          style={{
                            color: '#111827',
                            fontWeight: 650,
                            marginTop: 3,
                          }}
                        >
                          {supplier.contactPerson || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div className="d-flex gap-3">
                      <CIcon
                        icon={cilPhone}
                        style={{
                          color: '#a57d05',
                          marginTop: 2,
                        }}
                      />

                      <div>
                        <div
                          style={{
                            color: '#64748b',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          Phone
                        </div>

                        <div
                          style={{
                            color: '#111827',
                            fontWeight: 650,
                            marginTop: 3,
                          }}
                        >
                          {supplier.phone || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div className="d-flex gap-3">
                      <CIcon
                        icon={cilBuilding}
                        style={{
                          color: '#a57d05',
                          marginTop: 2,
                        }}
                      />

                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            color: '#64748b',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          Email
                        </div>

                        <div
                          style={{
                            color: '#111827',
                            fontWeight: 650,
                            marginTop: 3,
                            wordBreak: 'break-word',
                          }}
                        >
                          {supplier.email || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div
                    style={{
                      padding: '16px 0',
                    }}
                  >
                    <div className="d-flex gap-3">
                      <CIcon
                        icon={cilLocationPin}
                        style={{
                          color: '#a57d05',
                          marginTop: 2,
                        }}
                      />

                      <div>
                        <div
                          style={{
                            color: '#64748b',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          Address
                        </div>

                        <div
                          style={{
                            color: '#111827',
                            fontWeight: 600,
                            marginTop: 3,
                            lineHeight: 1.5,
                          }}
                        >
                          {supplier.address || 'Address not provided'}
                        </div>

                        {(supplier.city || supplier.state || supplier.country) && (
                          <div
                            style={{
                              color: '#64748b',
                              fontSize: 13,
                              marginTop: 3,
                            }}
                          >
                            {[supplier.city, supplier.state, supplier.country]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CCardBody>
            </CCard>

            {/* ============================================================= */}
            {/* BANKING                                                        */}
            {/* ============================================================= */}

            <CCard
              className="border-0 mb-4"
              style={{
                borderRadius: 16,
                boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody
                style={{
                  padding: 24,
                }}
              >
                <h5
                  style={{
                    margin: '0 0 18px',
                    color: '#111827',
                    fontWeight: 750,
                  }}
                >
                  Banking Information
                </h5>

                <div className="mb-3">
                  <div
                    style={{
                      color: '#64748b',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Bank
                  </div>

                  <div
                    style={{
                      fontWeight: 650,
                      color: '#111827',
                      marginTop: 4,
                    }}
                  >
                    {supplier.bankName || 'Not provided'}
                  </div>
                </div>

                <div className="mb-3">
                  <div
                    style={{
                      color: '#64748b',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Account Name
                  </div>

                  <div
                    style={{
                      fontWeight: 650,
                      color: '#111827',
                      marginTop: 4,
                    }}
                  >
                    {supplier.accountName || 'Not provided'}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: '#64748b',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Account Number
                  </div>

                  <div
                    style={{
                      fontWeight: 650,
                      color: '#111827',
                      marginTop: 4,
                      letterSpacing: 0.5,
                    }}
                  >
                    {supplier.accountNumber || 'Not provided'}
                  </div>
                </div>
              </CCardBody>
            </CCard>

            {/* ============================================================= */}
            {/* ACTIONS                                                        */}
            {/* ============================================================= */}

            <CCard
              className="border-0"
              style={{
                borderRadius: 16,
                boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody
                style={{
                  padding: 20,
                }}
              >
                <CButton
                  component={Link}
                  to={`/suppliers/edit/${id}`}
                  className="w-100 mb-2"
                  style={{
                    minHeight: 45,
                    background: 'linear-gradient(135deg, #c9a227, #e8bd35)',
                    border: 'none',
                    color: '#111827',
                    fontWeight: 800,
                    borderRadius: 10,
                  }}
                >
                  <CIcon icon={cilPencil} className="me-2" />
                  Edit Supplier
                </CButton>

                <CButton
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="w-100"
                  style={{
                    minHeight: 45,
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    color: '#b42318',
                    fontWeight: 700,
                    borderRadius: 10,
                  }}
                >
                  {deleting ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilTrash} className="me-2" />
                      Move to Recycle Bin
                    </>
                  )}
                </CButton>
              </CCardBody>
            </CCard>
          </CCol>

          {/* =============================================================== */}
          {/* PURCHASE HISTORY                                                 */}
          {/* =============================================================== */}

          <CCol xs="12" xl="8">
            <CCard
              className="border-0"
              style={{
                borderRadius: 16,
                boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
              }}
            >
              <CCardBody
                style={{
                  padding: 24,
                }}
              >
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                  <div>
                    <h5
                      style={{
                        margin: 0,
                        color: '#111827',
                        fontWeight: 750,
                      }}
                    >
                      Purchase History
                    </h5>

                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      Purchases and supplier account activity
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <CButton
                      type="button"
                      onClick={() => fetchSupplier(true)}
                      disabled={refreshing}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        color: '#334155',
                        borderRadius: 8,
                        fontWeight: 650,
                      }}
                    >
                      {refreshing ? (
                        <CSpinner size="sm" className="me-2" />
                      ) : (
                        <CIcon icon={cilReload} className="me-2" />
                      )}
                      Refresh
                    </CButton>

                    <CButton
                      type="button"
                      onClick={handleExport}
                      disabled={!filteredPurchases.length}
                      style={{
                        background: '#111827',
                        border: 'none',
                        color: '#ffffff',
                        borderRadius: 8,
                        fontWeight: 650,
                      }}
                    >
                      <CIcon icon={cilCloudDownload} className="me-2" />
                      Export
                    </CButton>
                  </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <CFormInput
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search purchase reference or status..."
                    style={{
                      minHeight: 44,
                      borderRadius: 9,
                    }}
                  />
                </div>

                {/* Purchase table */}
                {filteredPurchases.length > 0 ? (
                  <div
                    style={{
                      overflowX: 'auto',
                    }}
                  >
                    <CTable hover responsive align="middle" className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Purchase</CTableHeaderCell>

                          <CTableHeaderCell>Date</CTableHeaderCell>

                          <CTableHeaderCell className="text-end">Total</CTableHeaderCell>

                          <CTableHeaderCell className="text-end">Paid</CTableHeaderCell>

                          <CTableHeaderCell className="text-end">Balance</CTableHeaderCell>

                          <CTableHeaderCell>Status</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>

                      <CTableBody>
                        {filteredPurchases.map((purchase, index) => {
                          const purchaseId = getPurchaseId(purchase)

                          return (
                            <CTableRow key={purchaseId || index}>
                              <CTableDataCell>
                                <div
                                  style={{
                                    fontWeight: 750,
                                    color: '#111827',
                                  }}
                                >
                                  {getPurchaseReference(purchase)}
                                </div>

                                {purchase?.supplierInvoiceNumber && (
                                  <div
                                    style={{
                                      color: '#64748b',
                                      fontSize: 11,
                                      marginTop: 3,
                                    }}
                                  >
                                    Invoice: {purchase.supplierInvoiceNumber}
                                  </div>
                                )}
                              </CTableDataCell>

                              <CTableDataCell>
                                <span
                                  style={{
                                    color: '#475569',
                                    fontSize: 13,
                                  }}
                                >
                                  {formatDate(
                                    purchase?.purchaseDate || purchase?.date || purchase?.createdAt,
                                  )}
                                </span>
                              </CTableDataCell>

                              <CTableDataCell className="text-end">
                                <strong>{formatMoney(getPurchaseTotal(purchase))}</strong>
                              </CTableDataCell>

                              <CTableDataCell className="text-end">
                                <span
                                  style={{
                                    color: '#15803d',
                                    fontWeight: 650,
                                  }}
                                >
                                  {formatMoney(getPurchasePaid(purchase))}
                                </span>
                              </CTableDataCell>

                              <CTableDataCell className="text-end">
                                <span
                                  style={{
                                    color:
                                      getPurchaseOutstanding(purchase) > 0 ? '#b42318' : '#15803d',
                                    fontWeight: 700,
                                  }}
                                >
                                  {formatMoney(getPurchaseOutstanding(purchase))}
                                </span>
                              </CTableDataCell>

                              <CTableDataCell>{renderPurchaseStatus(purchase)}</CTableDataCell>
                            </CTableRow>
                          )
                        })}
                      </CTableBody>
                    </CTable>
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '65px 20px',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 13,
                      background: '#f8fafc',
                    }}
                  >
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        margin: '0 auto 15px',
                        borderRadius: 15,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff8dc',
                        color: '#a57d05',
                      }}
                    >
                      <CIcon icon={cilBuilding} size="xl" />
                    </div>

                    <h6
                      style={{
                        color: '#334155',
                        fontWeight: 750,
                      }}
                    >
                      {search ? 'No matching purchases' : 'No purchases yet'}
                    </h6>

                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 13,
                        maxWidth: 420,
                        margin: '0 auto',
                      }}
                    >
                      {search
                        ? 'Try a different purchase reference or status.'
                        : 'Purchase transactions from this supplier will appear here once the Purchases module is connected.'}
                    </div>
                  </div>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default SupplierDetails
