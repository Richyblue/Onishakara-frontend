import React, { useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'
import {
  cilArrowLeft,
  cilCheckCircle,
  cilLockLocked,
  cilPeople,
  cilShieldAlt,
  cilUser,
  cilUserPlus,
  cilPhone,
  cilEnvelopeClosed,
  cilBriefcase,
  cilMoney,
  cilEye,
  cilEyeSlash,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'

// ============================================================
// API
// ============================================================

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

// ============================================================
// COMPONENT
// ============================================================

const AddStaff = () => {
  const navigate = useNavigate()

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  }, [])

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    position: '',
    salary: '',
    employmentType: 'salary',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ==========================================================
  // HANDLE INPUT
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (error) {
      setError('')
    }
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    const fullname = formData.fullname.trim()
    const email = formData.email.trim()
    const password = formData.password

    if (!fullname) {
      return 'Please enter the staff full name.'
    }

    if (!email) {
      return 'Please enter the staff email address.'
    }

    if (!email.includes('@')) {
      return 'Please enter a valid email address.'
    }

    if (!password) {
      return 'Please enter a password.'
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters long.'
    }

    if (!formData.role) {
      return 'Please select a staff role.'
    }

    if (formData.salary !== '') {
      const salary = Number(formData.salary)

      if (Number.isNaN(salary) || salary < 0) {
        return 'Please enter a valid salary amount.'
      }
    }

    return null
  }

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (saving) return

    setError('')

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)

      await Swal.fire({
        icon: 'warning',
        title: 'Check your details',
        text: validationError,
        confirmButtonColor: '#b8860b',
      })

      return
    }

    const token = localStorage.getItem('token')

    if (!token) {
      setError('Your session has expired. Please login again.')

      await Swal.fire({
        icon: 'error',
        title: 'Session expired',
        text: 'Please login again to continue.',
        confirmButtonColor: '#b8860b',
      })

      navigate('/login')
      return
    }

    try {
      setSaving(true)

      const payload = {
        fullname: formData.fullname.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        position: formData.position.trim(),
        salary: formData.salary === '' ? null : Number(formData.salary),
        employmentType: formData.employmentType || 'salary',
      }

      const response = await axios.post(`${API_URL}/staff`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },

        timeout: 15000,
      })

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to create staff')
      }

      const createdStaff = response.data?.staff

      const createdUser = response.data?.user

      const qrCode = response.data?.qrCode || createdStaff?.qrCode || ''

      // ------------------------------------------------------
      // Reset form
      // ------------------------------------------------------

      setFormData({
        fullname: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        position: '',
        salary: '',
        employmentType: 'salary',
      })

      // ------------------------------------------------------
      // Success
      // ------------------------------------------------------

      await Swal.fire({
        icon: 'success',
        title: 'Staff Created Successfully',
        html: `
          <div style="text-align:left;">
            <p style="margin-bottom:8px;">
              <strong>${createdUser?.fullname || formData.fullname}</strong>
              has been added to Onishakara Gold Fashion Store.
            </p>

            ${
              createdUser?.email
                ? `
                  <p style="margin-bottom:6px;">
                    <strong>Email:</strong>
                    ${createdUser.email}
                  </p>
                `
                : ''
            }

            ${
              createdUser?.role
                ? `
                  <p style="margin-bottom:6px;">
                    <strong>Role:</strong>
                    ${createdUser.role}
                  </p>
                `
                : ''
            }

            ${
              qrCode
                ? `
                  <p style="margin-top:12px;margin-bottom:0;">
                    <strong>Staff QR:</strong>
                    ${qrCode}
                  </p>
                `
                : ''
            }
          </div>
        `,
        confirmButtonText: 'View Staff',
        showCancelButton: true,
        cancelButtonText: 'Add Another',
        confirmButtonColor: '#b8860b',
        cancelButtonColor: '#343a40',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/staff')
        }
      })
    } catch (err) {
      console.error('CREATE STAFF ERROR:', err)

      let message = 'Unable to create staff. Please try again.'

      if (err?.response?.status === 409) {
        message = err?.response?.data?.message || 'Email already exists.'
      } else if (err?.response?.data?.message) {
        message = err.response.data.message
      } else if (err?.message) {
        message = err.message
      }

      setError(message)

      await Swal.fire({
        icon: 'error',
        title: 'Staff Creation Failed',
        text: message,
        confirmButtonColor: '#b8860b',
      })
    } finally {
      setSaving(false)
    }
  }

  // ==========================================================
  // BACK
  // ==========================================================

  const handleBack = () => {
    if (saving) return

    navigate('/staff')
  }

  // ==========================================================
  // ROLE LABEL
  // ==========================================================

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrator',
      manager: 'Manager',
      cashier: 'Cashier',
      staff: 'Staff',
    }

    return labels[role] || role
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0b0b0b 0%, #151515 45%, #0b0b0b 100%)',
        color: '#fff',
        padding: '24px',
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: '1px solid rgba(212,175,55,.35)',
              background: 'rgba(212,175,55,.08)',
              color: '#d4af37',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: saving ? 0.5 : 1,
            }}
          >
            <CIcon icon={cilArrowLeft} />
          </button>

          <div>
            <div
              style={{
                fontSize: '12px',
                letterSpacing: '4px',
                color: '#d4af37',
                fontWeight: 700,
              }}
            >
              ONISHAKARA
            </div>

            <div
              style={{
                fontSize: '23px',
                fontWeight: 800,
                letterSpacing: '1px',
              }}
            >
              GOLD FASHION STORE
            </div>

            <div
              style={{
                fontSize: '13px',
                color: '#999',
                marginTop: '3px',
              }}
            >
              Staff Management / Add New Staff
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,.08)',
            background: 'rgba(255,255,255,.03)',
          }}
        >
          <CIcon
            icon={cilShieldAlt}
            style={{
              color: '#d4af37',
            }}
          />

          <span
            style={{
              color: '#aaa',
              fontSize: '13px',
            }}
          >
            Secure Staff Account
          </span>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {error && (
          <CAlert
            color="danger"
            dismissible
            onClose={() => setError('')}
            style={{
              borderRadius: '12px',
              marginBottom: '20px',
            }}
          >
            {error}
          </CAlert>
        )}

        <CRow className="g-4">
          {/* =================================================
              MAIN FORM
          ================================================== */}

          <CCol lg={8}>
            <CCard
              style={{
                background: 'rgba(20,20,20,.96)',
                border: '1px solid rgba(212,175,55,.18)',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,.35)',
              }}
            >
              <CCardHeader
                style={{
                  background: 'linear-gradient(90deg, rgba(212,175,55,.13), rgba(212,175,55,.03))',
                  borderBottom: '1px solid rgba(212,175,55,.14)',
                  padding: '20px 24px',
                  color: '#fff',
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
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(212,175,55,.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#d4af37',
                    }}
                  >
                    <CIcon icon={cilUserPlus} />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '17px',
                        fontWeight: 700,
                      }}
                    >
                      Create Staff Account
                    </div>

                    <div
                      style={{
                        color: '#888',
                        fontSize: '12px',
                        marginTop: '3px',
                      }}
                    >
                      Add a new team member to your fashion store
                    </div>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '28px',
                }}
              >
                <CForm onSubmit={handleSubmit}>
                  {/* =========================================
                      PERSONAL INFORMATION
                  ========================================== */}

                  <SectionTitle
                    number="01"
                    icon={cilUser}
                    title="Personal Information"
                    description="Basic information for the staff account"
                  />

                  <CRow className="g-3 mb-4">
                    <CCol md={6}>
                      <FieldLabel>Full Name</FieldLabel>

                      <CFormInput
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        disabled={saving}
                        autoComplete="name"
                        style={inputStyle}
                      />
                    </CCol>

                    <CCol md={6}>
                      <FieldLabel>Email Address</FieldLabel>

                      <CFormInput
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="staff@example.com"
                        disabled={saving}
                        autoComplete="email"
                        style={inputStyle}
                      />
                    </CCol>

                    <CCol md={6}>
                      <FieldLabel>Phone Number</FieldLabel>

                      <CFormInput
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="080XXXXXXXX"
                        disabled={saving}
                        autoComplete="tel"
                        style={inputStyle}
                      />
                    </CCol>

                    <CCol md={6}>
                      <FieldLabel>Password</FieldLabel>

                      <div
                        style={{
                          position: 'relative',
                        }}
                      >
                        <CFormInput
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Minimum 6 characters"
                          disabled={saving}
                          autoComplete="new-password"
                          style={{
                            ...inputStyle,
                            paddingRight: '48px',
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          disabled={saving}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'transparent',
                            color: '#999',
                            cursor: 'pointer',
                          }}
                        >
                          <CIcon icon={showPassword ? cilEyeSlash : cilEye} />
                        </button>
                      </div>

                      <small
                        style={{
                          color: '#777',
                          display: 'block',
                          marginTop: '6px',
                        }}
                      >
                        Minimum 6 characters
                      </small>
                    </CCol>
                  </CRow>

                  {/* =========================================
                      ACCESS & ROLE
                  ========================================== */}

                  <SectionTitle
                    number="02"
                    icon={cilShieldAlt}
                    title="System Access"
                    description="Control what the staff member can access"
                  />

                  <CRow className="g-3 mb-4">
                    <CCol md={6}>
                      <FieldLabel>Role</FieldLabel>

                      <CFormSelect
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={saving}
                        style={selectStyle}
                      >
                        {currentUser?.role === 'admin' && (
                          <option value="admin">Administrator</option>
                        )}

                        <option value="manager">Manager</option>

                        <option value="cashier">Cashier</option>

                        <option value="staff">Staff</option>
                      </CFormSelect>
                    </CCol>

                    <CCol md={6}>
                      <FieldLabel>Position</FieldLabel>

                      <CFormInput
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        placeholder="e.g. Sales Associate"
                        disabled={saving}
                        style={inputStyle}
                      />

                      <small
                        style={{
                          color: '#777',
                          display: 'block',
                          marginTop: '6px',
                        }}
                      >
                        Example: Store Manager, Sales Associate, Cashier, Inventory Officer
                      </small>
                    </CCol>
                  </CRow>

                  {/* =========================================
                      EMPLOYMENT
                  ========================================== */}

                  <SectionTitle
                    number="03"
                    icon={cilBriefcase}
                    title="Employment Details"
                    description="Store employment and salary information"
                  />

                  <CRow className="g-3">
                    <CCol md={6}>
                      <FieldLabel>Employment Type</FieldLabel>

                      <CFormSelect
                        name="employmentType"
                        value={formData.employmentType}
                        onChange={handleChange}
                        disabled={saving}
                        style={selectStyle}
                      >
                        <option value="salary">Salary Based</option>
                      </CFormSelect>

                      <small
                        style={{
                          color: '#777',
                          display: 'block',
                          marginTop: '6px',
                        }}
                      >
                        Additional employment structures can be added later if required.
                      </small>
                    </CCol>

                    <CCol md={6}>
                      <FieldLabel>Monthly Salary</FieldLabel>

                      <div
                        style={{
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#d4af37',
                            fontWeight: 700,
                            zIndex: 2,
                          }}
                        >
                          ₦
                        </span>

                        <CFormInput
                          type="number"
                          name="salary"
                          value={formData.salary}
                          onChange={handleChange}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          disabled={saving}
                          style={{
                            ...inputStyle,
                            paddingLeft: '32px',
                          }}
                        />
                      </div>
                    </CCol>
                  </CRow>

                  {/* =========================================
                      ACTIONS
                  ========================================== */}

                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,.08)',
                      marginTop: '30px',
                      paddingTop: '24px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <CButton
                      type="button"
                      onClick={handleBack}
                      disabled={saving}
                      style={{
                        border: '1px solid rgba(255,255,255,.15)',
                        background: 'transparent',
                        color: '#bbb',
                        borderRadius: '10px',
                        padding: '11px 22px',
                      }}
                    >
                      Cancel
                    </CButton>

                    <CButton
                      type="submit"
                      disabled={saving}
                      style={{
                        border: 'none',
                        background: 'linear-gradient(135deg, #d4af37, #a67c00)',
                        color: '#090909',
                        borderRadius: '10px',
                        padding: '11px 25px',
                        fontWeight: 800,
                        minWidth: '180px',
                      }}
                    >
                      {saving ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          Creating Staff...
                        </>
                      ) : (
                        <>
                          <CIcon icon={cilCheckCircle} className="me-2" />
                          Create Staff
                        </>
                      )}
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>

          {/* =================================================
              SUMMARY SIDEBAR
          ================================================== */}

          <CCol lg={4}>
            <div
              style={{
                position: 'sticky',
                top: '20px',
              }}
            >
              {/* ACCOUNT PREVIEW */}

              <CCard
                style={{
                  background: 'linear-gradient(145deg, #1b1b1b, #101010)',
                  border: '1px solid rgba(212,175,55,.18)',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  marginBottom: '18px',
                }}
              >
                <CCardBody
                  style={{
                    padding: '25px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      marginBottom: '22px',
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #d4af37, #8d6800)',
                        color: '#111',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: 900,
                      }}
                    >
                      {formData.fullname ? formData.fullname.trim().charAt(0).toUpperCase() : 'S'}
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#fff',
                        }}
                      >
                        {formData.fullname || 'New Staff Member'}
                      </div>

                      <div
                        style={{
                          color: '#888',
                          fontSize: '12px',
                          marginTop: '3px',
                        }}
                      >
                        {formData.position || 'Position not set'}
                      </div>
                    </div>
                  </div>

                  <SummaryRow
                    icon={cilShieldAlt}
                    label="Role"
                    value={getRoleLabel(formData.role)}
                  />

                  <SummaryRow icon={cilBriefcase} label="Employment" value="Salary Based" />

                  <SummaryRow
                    icon={cilMoney}
                    label="Salary"
                    value={
                      formData.salary
                        ? `₦${Number(formData.salary).toLocaleString()}`
                        : 'Not specified'
                    }
                  />
                </CCardBody>
              </CCard>

              {/* SECURITY */}

              <CCard
                style={{
                  background: 'rgba(20,20,20,.96)',
                  border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: '18px',
                  marginBottom: '18px',
                }}
              >
                <CCardBody
                  style={{
                    padding: '22px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(212,175,55,.1)',
                        color: '#d4af37',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CIcon icon={cilLockLocked} />
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        Account Security
                      </div>

                      <div
                        style={{
                          color: '#777',
                          fontSize: '11px',
                        }}
                      >
                        Protected access
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#888',
                      lineHeight: 1.7,
                    }}
                  >
                    The staff member will receive a secure login account based on the selected
                    system role.
                  </div>
                </CCardBody>
              </CCard>

              {/* STORE INFO */}

              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(212,175,55,.14)',
                  background: 'rgba(212,175,55,.04)',
                }}
              >
                <div
                  style={{
                    color: '#d4af37',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    fontWeight: 800,
                    marginBottom: '8px',
                  }}
                >
                  ONISHAKARA
                </div>

                <div
                  style={{
                    color: '#fff',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  Gold Fashion Store
                </div>

                <div
                  style={{
                    color: '#777',
                    fontSize: '12px',
                    lineHeight: 1.6,
                  }}
                >
                  Staff accounts are used for secure store operations, sales accountability and
                  system access management.
                </div>
              </div>
            </div>
          </CCol>
        </CRow>
      </div>
    </div>
  )
}

// ============================================================
// SECTION TITLE
// ============================================================

const SectionTitle = ({ number, icon, title, description }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '11px',
          background: 'rgba(212,175,55,.1)',
          border: '1px solid rgba(212,175,55,.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d4af37',
          fontSize: '12px',
          fontWeight: 800,
        }}
      >
        {number}
      </div>

      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CIcon
            icon={icon}
            style={{
              color: '#d4af37',
            }}
          />

          <span
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {title}
          </span>
        </div>

        <div
          style={{
            color: '#777',
            fontSize: '12px',
            marginTop: '3px',
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// FIELD LABEL
// ============================================================

const FieldLabel = ({ children }) => {
  return (
    <CFormLabel
      style={{
        color: '#ccc',
        fontSize: '12px',
        fontWeight: 700,
        marginBottom: '8px',
      }}
    >
      {children}
    </CFormLabel>
  )
}

// ============================================================
// SUMMARY ROW
// ============================================================

const SummaryRow = ({ icon, label, value }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        padding: '13px 0',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          color: '#888',
          fontSize: '12px',
        }}
      >
        <CIcon
          icon={icon}
          style={{
            color: '#d4af37',
          }}
        />

        {label}
      </div>

      <div
        style={{
          color: '#ddd',
          fontSize: '12px',
          fontWeight: 700,
          textAlign: 'right',
        }}
      >
        {value}
      </div>
    </div>
  )
}

// ============================================================
// INPUT STYLES
// ============================================================

const inputStyle = {
  background: '#111',
  border: '1px solid rgba(255,255,255,.12)',
  color: '#fff',
  borderRadius: '10px',
  minHeight: '44px',
  boxShadow: 'none',
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
}

// ============================================================
// EXPORT
// ============================================================

export default AddStaff
