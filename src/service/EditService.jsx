import { useState, useEffect } from 'react'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CButton,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react'

import { useParams, useNavigate } from 'react-router-dom'

import axios from 'axios'

import Swal from 'sweetalert2'

const EditService = () => {
  const { id } = useParams()

  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)

  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
  })

  const getService = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/services/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const service = response.data.service

      setFormData({
        name: service.name || '',
        price: service.price || '',
        duration: service.duration || '',
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to load service',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await getService()
    }
    fetchData()
  }, [id])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      const token = localStorage.getItem('token')

      await axios.put(`${API_URL}api/v1/services/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Service updated successfully',
      })

      navigate('/service')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Update failed',
      })
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: '70vh',
          background: '#f5f7fb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '18px',
            padding: '35px 45px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(17, 24, 39, 0.08)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#fff8e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
            }}
          >
            <CSpinner
              size="sm"
              style={{
                color: '#c9a227',
              }}
            />
          </div>

          <div
            style={{
              fontWeight: '700',
              color: '#111827',
              fontSize: '15px',
            }}
          >
            Loading Service
          </div>

          <div
            style={{
              color: '#9ca3af',
              fontSize: '12px',
              marginTop: '4px',
            }}
          >
            Please wait...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '24px',
      }}
    >
      {/* ==========================================
          PAGE HEADER
      ========================================== */}

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
        {/* Decorative circle */}

        <div
          style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'rgba(232, 189, 53, 0.08)',
            right: '-70px',
            top: '-100px',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
          }}
        >
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
            Edit Service
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            Update service information, pricing and duration
          </p>
        </div>
      </div>

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <CRow className="g-4">
        {/* ==========================================
            FORM
        ========================================== */}

        <CCol lg={8}>
          <CCard
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '18px',
              boxShadow: '0 5px 18px rgba(17, 24, 39, 0.06)',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
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
                  alignItems: 'center',
                  gap: '13px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#111827',
                    color: '#e8bd35',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '800',
                  }}
                >
                  ✦
                </div>

                <div>
                  <h5
                    style={{
                      margin: 0,
                      fontWeight: '800',
                      color: '#111827',
                    }}
                  >
                    Service Information
                  </h5>

                  <small
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    Modify the details of this service
                  </small>
                </div>
              </div>
            </CCardHeader>

            <CCardBody
              style={{
                padding: '28px',
              }}
            >
              <CForm onSubmit={handleSubmit}>
                {/* ==========================================
                    SERVICE NAME
                ========================================== */}

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    padding: '20px',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '8px',
                    }}
                  >
                    Service Details
                  </div>

                  <CFormInput
                    label="Service Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{
                      height: '46px',
                      borderRadius: '10px',
                      border: '1px solid #dfe3e8',
                      boxShadow: 'none',
                      fontSize: '14px',
                      background: '#fff',
                    }}
                  />
                </div>

                {/* ==========================================
                    PRICING & DURATION
                ========================================== */}

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    padding: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '15px',
                    }}
                  >
                    Pricing & Duration
                  </div>

                  <CRow className="g-3">
                    <CCol md={6}>
                      <CFormInput
                        type="number"
                        label="Price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        style={{
                          height: '46px',
                          borderRadius: '10px',
                          border: '1px solid #dfe3e8',
                          boxShadow: 'none',
                          fontSize: '14px',
                          background: '#fff',
                        }}
                      />
                    </CCol>

                    <CCol md={6}>
                      <CFormInput
                        type="number"
                        label="Duration (Minutes)"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        style={{
                          height: '46px',
                          borderRadius: '10px',
                          border: '1px solid #dfe3e8',
                          boxShadow: 'none',
                          fontSize: '14px',
                          background: '#fff',
                        }}
                      />
                    </CCol>
                  </CRow>
                </div>

                {/* ==========================================
                    ACTIONS
                ========================================== */}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '28px',
                    paddingTop: '20px',
                    borderTop: '1px solid #edf0f4',
                  }}
                >
                  <CButton
                    type="button"
                    onClick={() => navigate('/service')}
                    disabled={saving}
                    style={{
                      background: '#fff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '10px',
                      padding: '11px 20px',
                      fontWeight: '700',
                    }}
                  >
                    Cancel
                  </CButton>

                  <CButton
                    type="submit"
                    disabled={saving}
                    style={{
                      minWidth: '165px',
                      background: saving ? '#9ca3af' : 'linear-gradient(135deg, #e8bd35, #c9a227)',
                      color: '#111827',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '11px 22px',
                      fontWeight: '800',
                      boxShadow: saving ? 'none' : '0 5px 14px rgba(201, 162, 39, 0.22)',
                    }}
                  >
                    {saving ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <CSpinner size="sm" />
                        Updating...
                      </span>
                    ) : (
                      'Update Service'
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>

        {/* ==========================================
            SERVICE PREVIEW
        ========================================== */}

        <CCol lg={4}>
          <CCard
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '18px',
              boxShadow: '0 5px 18px rgba(17, 24, 39, 0.06)',
              overflow: 'hidden',
              background: '#fff',
              height: '100%',
            }}
          >
            <CCardHeader
              style={{
                background: '#111827',
                color: '#fff',
                border: 'none',
                padding: '20px',
              }}
            >
              <div
                style={{
                  color: '#e8bd35',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '5px',
                }}
              >
                Live Preview
              </div>

              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '800',
                }}
              >
                Service Summary
              </div>
            </CCardHeader>

            <CCardBody
              style={{
                padding: '24px',
              }}
            >
              {/* Service Icon */}

              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '17px',
                  background: 'linear-gradient(135deg, #111827, #374151)',
                  color: '#e8bd35',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '25px',
                  fontWeight: '800',
                  marginBottom: '18px',
                }}
              >
                {formData.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>

              <div
                style={{
                  color: '#9ca3af',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                Service Name
              </div>

              <div
                style={{
                  color: '#111827',
                  fontSize: '20px',
                  fontWeight: '800',
                  marginTop: '4px',
                  marginBottom: '25px',
                  wordBreak: 'break-word',
                }}
              >
                {formData.name || 'Service name'}
              </div>

              {/* Price */}

              <div
                style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '13px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    color: '#6b7280',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.7px',
                    marginBottom: '5px',
                  }}
                >
                  Service Price
                </div>

                <div
                  style={{
                    color: '#111827',
                    fontSize: '23px',
                    fontWeight: '800',
                  }}
                >
                  ₦{formData.price ? Number(formData.price).toLocaleString() : '0'}
                </div>
              </div>

              {/* Duration */}

              <div
                style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '13px',
                }}
              >
                <div
                  style={{
                    color: '#6b7280',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.7px',
                    marginBottom: '5px',
                  }}
                >
                  Duration
                </div>

                <div
                  style={{
                    color: '#111827',
                    fontSize: '20px',
                    fontWeight: '800',
                  }}
                >
                  {formData.duration || '0'}{' '}
                  <span
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: '600',
                    }}
                  >
                    minutes
                  </span>
                </div>
              </div>

              {/* Notice */}

              <div
                style={{
                  marginTop: '20px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#fff8e1',
                  border: '1px solid #f0d477',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '9px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      color: '#a07800',
                      fontSize: '16px',
                    }}
                  >
                    ◆
                  </span>

                  <div
                    style={{
                      color: '#7c5f00',
                      fontSize: '12px',
                      lineHeight: '1.5',
                    }}
                  >
                    Changes will update this service throughout the POS system.
                  </div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default EditService
