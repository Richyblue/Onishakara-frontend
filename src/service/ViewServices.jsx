import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableRow,
  CTableHead,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CFormInput,
} from '@coreui/react'

import { useState, useEffect } from 'react'

import axios from 'axios'

import Swal from 'sweetalert2'

import * as XLSX from 'xlsx'
import { Link } from 'react-router-dom'

const ViewService = () => {
  const [services, setServices] = useState([])

  const [search, setSearch] = useState('')

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const getServices = async () => {
    const token = localStorage.getItem('token')

    const response = await axios.get(`${API_URL}api/v1/servicess`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    setServices(response.data.services)
  }

  useEffect(() => {
    const fetchData = async () => {
      await getServices()
    }
    fetchData()
  }, [])

  // Delete
  const deleteService = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Service?',
      icon: 'warning',
      showCancelButton: true,
    })

    if (!result.isConfirmed) return

    const token = localStorage.getItem('token')

    await axios.delete(`${API_URL}api/v1/services/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    getServices()
  }

  // Export
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(services)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Services')

    XLSX.writeFile(workbook, 'Services.xlsx')
  }

  const filtered = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '24px',
      }}
    >
      {/* ============================= */}
      {/* PAGE HEADER */}
      {/* ============================= */}

      <div
        style={{
          background: '#111827',
          borderRadius: '18px',
          padding: '24px 28px',
          marginBottom: '24px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(17, 24, 39, 0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(232, 189, 53, 0.08)',
            right: '-60px',
            top: '-80px',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                color: '#e8bd35',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Glamour POS
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '800',
                letterSpacing: '-0.5px',
              }}
            >
              Services
            </h2>

            <p
              style={{
                margin: '6px 0 0',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Manage your salon services, pricing and duration
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '12px 18px',
              minWidth: '130px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '3px',
              }}
            >
              Total Services
            </div>

            <div
              style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#e8bd35',
              }}
            >
              {services.length}
            </div>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* MAIN CARD */}
      {/* ============================= */}

      <CCard
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '18px',
          boxShadow: '0 5px 18px rgba(17, 24, 39, 0.06)',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Card Header */}

        <CCardHeader
          style={{
            background: '#fff',
            borderBottom: '1px solid #edf0f4',
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '15px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h5
                style={{
                  margin: 0,
                  fontWeight: '800',
                  color: '#111827',
                }}
              >
                Service Catalogue
              </h5>

              <small
                style={{
                  color: '#6b7280',
                }}
              >
                View and manage all salon services
              </small>
            </div>

            <CButton
              onClick={exportExcel}
              style={{
                background: 'linear-gradient(135deg, #e8bd35, #c9a227)',
                border: 'none',
                color: '#111827',
                fontWeight: '700',
                borderRadius: '10px',
                padding: '10px 18px',
                boxShadow: '0 4px 10px rgba(201, 162, 39, 0.18)',
              }}
            >
              ↓ Export Excel
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody
          style={{
            padding: '24px',
          }}
        >
          {/* ============================= */}
          {/* SEARCH */}
          {/* ============================= */}

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '22px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.7px',
                    marginBottom: '6px',
                  }}
                >
                  Search Services
                </div>

                <CFormInput
                  placeholder="Search service by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    height: '44px',
                    borderRadius: '10px',
                    border: '1px solid #dfe3e8',
                    boxShadow: 'none',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div
                style={{
                  alignSelf: 'flex-end',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  minWidth: '110px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginBottom: '2px',
                  }}
                >
                  Showing
                </div>

                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: '800',
                    color: '#111827',
                  }}
                >
                  {filtered.length}
                </div>
              </div>
            </div>
          </div>

          {/* ============================= */}
          {/* TABLE */}
          {/* ============================= */}

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            <CTable
              hover
              responsive
              align="middle"
              style={{
                marginBottom: 0,
              }}
            >
              <CTableHead>
                <CTableRow
                  style={{
                    background: '#111827',
                  }}
                >
                  <CTableHeaderCell
                    style={{
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '15px 18px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: 'none',
                    }}
                  >
                    Service
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '15px 18px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: 'none',
                    }}
                  >
                    Price
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '15px 18px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: 'none',
                    }}
                  >
                    Duration
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '15px 18px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: 'none',
                      textAlign: 'right',
                    }}
                  >
                    Actions
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filtered.length > 0 ? (
                  filtered.map((service, index) => (
                    <CTableRow
                      key={service.id}
                      style={{
                        borderBottom: index === filtered.length - 1 ? 'none' : '1px solid #edf0f4',
                      }}
                    >
                      {/* Service Name */}

                      <CTableDataCell
                        style={{
                          padding: '17px 18px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '11px',
                              background: 'linear-gradient(135deg, #111827, #374151)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#e8bd35',
                              fontWeight: '800',
                              fontSize: '15px',
                              flexShrink: 0,
                            }}
                          >
                            {service.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: '700',
                                color: '#111827',
                                fontSize: '14px',
                              }}
                            >
                              {service.name}
                            </div>

                            <div
                              style={{
                                color: '#9ca3af',
                                fontSize: '11px',
                                marginTop: '2px',
                              }}
                            >
                              Service #{service.id}
                            </div>
                          </div>
                        </div>
                      </CTableDataCell>

                      {/* Price */}

                      <CTableDataCell
                        style={{
                          padding: '17px 18px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: '800',
                            color: '#111827',
                          }}
                        >
                          ₦{Number(service.price).toLocaleString()}
                        </span>
                      </CTableDataCell>

                      {/* Duration */}

                      <CTableDataCell
                        style={{
                          padding: '17px 18px',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 11px',
                            borderRadius: '20px',
                            background: '#f3f4f6',
                            color: '#374151',
                            fontSize: '12px',
                            fontWeight: '700',
                          }}
                        >
                          {service.duration} mins
                        </span>
                      </CTableDataCell>

                      {/* Actions */}

                      <CTableDataCell
                        style={{
                          padding: '17px 18px',
                          textAlign: 'right',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                          }}
                        >
                          <Link to={`/editService/${service.id}`}>
                            <CButton
                              size="sm"
                              style={{
                                background: '#fff8e1',
                                color: '#a07800',
                                border: '1px solid #f0d477',
                                borderRadius: '8px',
                                fontWeight: '700',
                                padding: '7px 13px',
                              }}
                            >
                              Edit
                            </CButton>
                          </Link>

                          <CButton
                            size="sm"
                            onClick={() => deleteService(service.id)}
                            style={{
                              background: '#fff1f2',
                              color: '#dc2626',
                              border: '1px solid #fecdd3',
                              borderRadius: '8px',
                              fontWeight: '700',
                              padding: '7px 13px',
                            }}
                          >
                            Delete
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                ) : (
                  <CTableRow>
                    <CTableDataCell
                      colSpan={4}
                      style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '58px',
                          height: '58px',
                          borderRadius: '16px',
                          background: '#f3f4f6',
                          margin: '0 auto 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                        }}
                      >
                        🔎
                      </div>

                      <div
                        style={{
                          fontWeight: '800',
                          color: '#111827',
                          fontSize: '16px',
                        }}
                      >
                        No services found
                      </div>

                      <div
                        style={{
                          color: '#6b7280',
                          fontSize: '13px',
                          marginTop: '5px',
                        }}
                      >
                        Try adjusting your search.
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </div>

          {/* ============================= */}
          {/* FOOTER */}
          {/* ============================= */}

          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#6b7280',
              fontSize: '12px',
            }}
          >
            <span>
              {filtered.length} service{filtered.length !== 1 ? 's' : ''} displayed
            </span>

            <span>Glamour POS • Service Management</span>
          </div>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default ViewService
