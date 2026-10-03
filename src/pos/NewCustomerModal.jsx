import { useState } from 'react'
import axios from 'axios'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CRow,
  CCol,
  CAlert,
} from '@coreui/react'

export default function NewCustomerModal({ show, onHide, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('token')

      const response = await axios.post(`${API_URL}api/v1/customers`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      onSuccess(response.data.customer)

      setFormData({
        fullname: '',
        phone: '',
        email: '',
      })

      onHide()
    } catch (error) {
      console.log(error)

      setError(error.response?.data?.message || 'Failed to create customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CModal visible={show} onClose={onHide} size="lg" alignment="center" backdrop="static">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <CModalHeader
        style={{
          background: '#111827',
          color: '#fff',
          borderBottom: 'none',
          padding: '20px 24px',
        }}
      >
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#e8bd35',
                  fontWeight: '700',
                  marginBottom: '4px',
                }}
              >
                CUSTOMER MANAGEMENT
              </div>

              <CModalTitle
                style={{
                  color: '#fff',
                  fontSize: '21px',
                  fontWeight: '700',
                  margin: 0,
                }}
              >
                Add New Customer
              </CModalTitle>

              <div
                style={{
                  color: '#9ca3af',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                Create a customer profile for future transactions.
              </div>
            </div>

            {/* CUSTOMER ICON */}

            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '13px',
                background: 'rgba(232, 189, 53, 0.14)',
                border: '1px solid rgba(232, 189, 53, 0.30)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e8bd35',
                fontSize: '21px',
                fontWeight: '800',
              }}
            >
              +
            </div>
          </div>
        </div>
      </CModalHeader>

      {/* =====================================================
          BODY
      ====================================================== */}

      <CModalBody
        style={{
          background: '#f5f7fb',
          padding: '22px',
        }}
      >
        {/* ERROR */}

        {error && (
          <CAlert
            className="border-0 mb-4"
            style={{
              borderRadius: '13px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
            }}
          >
            <div className="d-flex align-items-start gap-2">
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  minWidth: '28px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '13px',
                }}
              >
                !
              </div>

              <div>
                <div
                  style={{
                    fontWeight: '700',
                    fontSize: '13px',
                    marginBottom: '2px',
                  }}
                >
                  Customer could not be created
                </div>

                <div
                  style={{
                    fontSize: '12px',
                  }}
                >
                  {error}
                </div>
              </div>
            </div>
          </CAlert>
        )}

        {/* =====================================================
            CUSTOMER INFORMATION CARD
        ====================================================== */}

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 5px 18px rgba(17, 24, 39, 0.05)',
          }}
        >
          {/* SECTION TITLE */}

          <div
            className="mb-4"
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
                minWidth: '40px',
                borderRadius: '11px',
                background: 'rgba(232, 189, 53, 0.12)',
                color: '#c9a227',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '800',
              }}
            >
              👤
            </div>

            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#111827',
                }}
              >
                Customer Information
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginTop: '2px',
                }}
              >
                Enter the customer's basic contact information.
              </div>
            </div>
          </div>

          <CRow>
            {/* FULL NAME */}

            <CCol md={12} className="mb-3">
              <label
                className="form-label"
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '.7px',
                }}
              >
                Full Name
                <span style={{ color: '#dc2626', marginLeft: '3px' }}>*</span>
              </label>

              <CFormInput
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                placeholder="Enter customer full name"
                disabled={loading}
                autoFocus
                style={{
                  height: '50px',
                  borderRadius: '12px',
                  border: '1px solid #dfe3e8',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  boxShadow: 'none',
                }}
              />

              <small
                className="d-block mt-2"
                style={{
                  color: '#9ca3af',
                  fontSize: '11px',
                }}
              >
                Use the customer's full name for easy identification.
              </small>
            </CCol>

            {/* PHONE */}

            <CCol md={6} className="mb-3 mb-md-0">
              <label
                className="form-label"
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '.7px',
                }}
              >
                Phone Number
              </label>

              <CFormInput
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08012345678"
                disabled={loading}
                style={{
                  height: '50px',
                  borderRadius: '12px',
                  border: '1px solid #dfe3e8',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  boxShadow: 'none',
                }}
              />

              <small
                className="d-block mt-2"
                style={{
                  color: '#9ca3af',
                  fontSize: '11px',
                }}
              >
                Useful for customer lookup and communication.
              </small>
            </CCol>

            {/* EMAIL */}

            <CCol md={6}>
              <label
                className="form-label"
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '.7px',
                }}
              >
                Email Address
              </label>

              <CFormInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="customer@email.com"
                disabled={loading}
                style={{
                  height: '50px',
                  borderRadius: '12px',
                  border: '1px solid #dfe3e8',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  boxShadow: 'none',
                }}
              />

              <small
                className="d-block mt-2"
                style={{
                  color: '#9ca3af',
                  fontSize: '11px',
                }}
              >
                Optional customer email address.
              </small>
            </CCol>
          </CRow>
        </div>

        {/* =====================================================
            INFORMATION NOTICE
        ====================================================== */}

        <div
          className="mt-3"
          style={{
            background: 'rgba(232, 189, 53, 0.09)',
            border: '1px solid rgba(232, 189, 53, 0.25)',
            borderRadius: '13px',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                minWidth: '26px',
                borderRadius: '8px',
                background: '#e8bd35',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '12px',
              }}
            >
              i
            </div>

            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#111827',
                }}
              >
                Customer Profile
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginTop: '2px',
                }}
              >
                The customer will be available immediately for selection during POS transactions.
              </div>
            </div>
          </div>
        </div>
      </CModalBody>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <CModalFooter
        style={{
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '15px 22px',
        }}
      >
        <CButton
          onClick={onHide}
          disabled={loading}
          style={{
            minWidth: '105px',
            height: '44px',
            borderRadius: '11px',
            background: '#fff',
            color: '#111827',
            border: '1px solid #dfe3e8',
            fontWeight: '600',
          }}
        >
          Cancel
        </CButton>

        <CButton
          onClick={handleSubmit}
          disabled={loading}
          style={{
            minWidth: '175px',
            height: '44px',
            borderRadius: '11px',
            border: 'none',
            background: 'linear-gradient(135deg, #e8bd35, #c9a227)',
            color: '#111827',
            fontWeight: '800',
            boxShadow: '0 6px 18px rgba(232, 189, 53, 0.25)',
          }}
        >
          {loading ? (
            <span className="d-flex align-items-center justify-content-center gap-2">
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              Saving...
            </span>
          ) : (
            <>+&nbsp; Create Customer</>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
