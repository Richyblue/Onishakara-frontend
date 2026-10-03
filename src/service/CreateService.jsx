import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CButton,
  CRow,
  CCol,
} from '@coreui/react'

const CreateService = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [name, setName] = useState('')

  const [price, setPrice] = useState('')

  const [duration, setDuration] = useState('')

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      await axios.post(
        `${API_URL}api/v1/services`,
        {
          name,
          price,
          duration,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Service created successfully',
      })

      setName('')
      setPrice('')
      setDuration('')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100%',
        paddingBottom: '30px',
      }}
    >
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div
        className="mb-4"
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          borderRadius: '18px',
          padding: '28px 30px',
          color: '#fff',
          boxShadow: '0 8px 30px rgba(17, 24, 39, 0.12)',
        }}
      >
        <CRow className="align-items-center">
          <CCol md={8}>
            <div
              className="mb-2"
              style={{
                color: '#e8bd35',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1.6px',
                textTransform: 'uppercase',
              }}
            >
              Service Management
            </div>

            <h2
              className="mb-2"
              style={{
                fontWeight: '700',
                letterSpacing: '-0.6px',
              }}
            >
              Create Service
            </h2>

            <p
              className="mb-0"
              style={{
                color: '#cbd5e1',
                fontSize: '14px',
                maxWidth: '620px',
              }}
            >
              Add a new salon service with its pricing and estimated service duration.
            </p>
          </CCol>

          <CCol md={4} className="text-md-end mt-3 mt-md-0">
            <div
              className="d-inline-flex align-items-center justify-content-center"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(232, 189, 53, 0.12)',
                border: '1px solid rgba(232, 189, 53, 0.3)',
                color: '#e8bd35',
                fontSize: '28px',
                fontWeight: '300',
              }}
            >
              +
            </div>
          </CCol>
        </CRow>
      </div>

      <CRow>
        {/* =====================================================
            FORM
        ====================================================== */}

        <CCol lg={8}>
          <CCard
            className="border-0 mb-4"
            style={{
              borderRadius: '17px',
              boxShadow: '0 5px 25px rgba(15, 23, 42, 0.07)',
              overflow: 'hidden',
            }}
          >
            <CCardHeader
              className="border-0"
              style={{
                background: '#fff',
                padding: '22px 25px',
              }}
            >
              <div className="d-flex align-items-center">
                <div
                  className="me-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#fff8dc',
                    color: '#c9a227',
                    fontWeight: '700',
                  }}
                >
                  01
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: '700',
                      color: '#111827',
                    }}
                  >
                    Service Information
                  </div>

                  <small
                    style={{
                      color: '#6b7280',
                    }}
                  >
                    Configure the service details
                  </small>
                </div>
              </div>
            </CCardHeader>

            <CCardBody
              style={{
                padding: '4px 25px 28px',
              }}
            >
              <CForm onSubmit={handleSubmit}>
                <CRow>
                  {/* SERVICE NAME */}

                  <CCol md={12} className="mb-4">
                    <CFormInput
                      label="Service Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Haircut & Styling"
                      required
                      style={{
                        minHeight: '48px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}
                    />

                    <small
                      className="d-block mt-2"
                      style={{
                        color: '#9ca3af',
                        fontSize: '11px',
                      }}
                    >
                      Enter the name customers and staff will see for this service.
                    </small>
                  </CCol>

                  {/* PRICE */}

                  <CCol md={6} className="mb-4">
                    <CFormInput
                      type="number"
                      label="Service Price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                      style={{
                        minHeight: '48px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </CCol>

                  {/* DURATION */}

                  <CCol md={6} className="mb-4">
                    <CFormInput
                      type="number"
                      label="Duration (mins)"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 45"
                      required
                      style={{
                        minHeight: '48px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </CCol>
                </CRow>

                {/* =====================================================
                    ACTION AREA
                ====================================================== */}

                <div
                  className="d-flex justify-content-end align-items-center mt-2 pt-4"
                  style={{
                    borderTop: '1px solid #eef0f3',
                  }}
                >
                  <CButton
                    type="submit"
                    disabled={loading}
                    className="border-0"
                    style={{
                      minWidth: '170px',
                      minHeight: '48px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #e8bd35 0%, #c9a227 100%)',
                      color: '#111827',
                      fontWeight: '700',
                      boxShadow: '0 5px 15px rgba(201, 162, 39, 0.25)',
                    }}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Saving...
                      </>
                    ) : (
                      'Save Service'
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>

        {/* =====================================================
            SERVICE PREVIEW
        ====================================================== */}

        <CCol lg={4}>
          <CCard
            className="border-0"
            style={{
              borderRadius: '17px',
              boxShadow: '0 5px 25px rgba(15, 23, 42, 0.07)',
              overflow: 'hidden',
            }}
          >
            <CCardHeader
              className="border-0"
              style={{
                background: '#111827',
                color: '#fff',
                padding: '21px',
              }}
            >
              <div
                style={{
                  color: '#e8bd35',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '1.4px',
                  textTransform: 'uppercase',
                }}
              >
                Preview
              </div>

              <div
                className="mt-1"
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                }}
              >
                Service Summary
              </div>
            </CCardHeader>

            <CCardBody
              style={{
                padding: '22px',
              }}
            >
              {/* SERVICE NAME */}

              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '13px',
                  padding: '18px',
                  marginBottom: '16px',
                }}
              >
                <small
                  className="d-block mb-1"
                  style={{
                    color: '#9ca3af',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.7px',
                  }}
                >
                  Service
                </small>

                <div
                  style={{
                    color: '#111827',
                    fontSize: '16px',
                    fontWeight: '700',
                    minHeight: '24px',
                  }}
                >
                  {name || 'Service name'}
                </div>
              </div>

              {/* PRICE */}

              <div
                className="d-flex justify-content-between align-items-center py-3"
                style={{
                  borderBottom: '1px solid #eef0f3',
                }}
              >
                <div>
                  <small
                    className="d-block"
                    style={{
                      color: '#9ca3af',
                      fontSize: '11px',
                    }}
                  >
                    Price
                  </small>

                  <strong
                    style={{
                      color: '#111827',
                      fontSize: '17px',
                    }}
                  >
                    ₦{Number(price || 0).toLocaleString()}
                  </strong>
                </div>

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#fff8dc',
                    color: '#c9a227',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                  }}
                >
                  ₦
                </div>
              </div>

              {/* DURATION */}

              <div
                className="d-flex justify-content-between align-items-center py-3"
                style={{
                  borderBottom: '1px solid #eef0f3',
                }}
              >
                <div>
                  <small
                    className="d-block"
                    style={{
                      color: '#9ca3af',
                      fontSize: '11px',
                    }}
                  >
                    Duration
                  </small>

                  <strong
                    style={{
                      color: '#111827',
                      fontSize: '17px',
                    }}
                  >
                    {duration || '0'}{' '}
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#6b7280',
                      }}
                    >
                      mins
                    </span>
                  </strong>
                </div>

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#f3f4f6',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}
                >
                  TIME
                </div>
              </div>

              {/* INFORMATION */}

              <div
                className="mt-4"
                style={{
                  background: '#fffaf0',
                  border: '1px solid #f5e6b3',
                  borderRadius: '12px',
                  padding: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#7c6414',
                  }}
                >
                  Service setup
                </div>

                <div
                  className="mt-1"
                  style={{
                    fontSize: '11px',
                    lineHeight: '1.6',
                    color: '#8a7a42',
                  }}
                >
                  The service will be available in the system after it has been successfully
                  created.
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default CreateService
