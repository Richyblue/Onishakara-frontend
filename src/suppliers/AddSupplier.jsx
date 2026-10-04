import React, { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft,
  cilBuilding,
  cilCheck,
  cilLocationPin,
  cilSave,
  cilUser,
  cilWallet,
} from '@coreui/icons'

import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
  CSpinner,
} from '@coreui/react'

import { Link, useNavigate } from 'react-router-dom'

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const API_ROOT = import.meta.env.VITE_BACKEND_URL

const API_URL = `${API_ROOT}api/v1`

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const initialForm = {
  name: '',
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  taxNumber: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  openingBalance: '0',
  notes: '',
  status: 'active',
}

const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  )
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

const AddSupplier = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  /* ------------------------------------------------------------------------ */
  /* INPUT HANDLER                                                             */
  /* ------------------------------------------------------------------------ */

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (errorMessage) {
      setErrorMessage('')
    }
  }

  /* ------------------------------------------------------------------------ */
  /* VALIDATION                                                                */
  /* ------------------------------------------------------------------------ */

  const validateForm = () => {
    if (!form.name.trim()) {
      return 'Supplier name is required.'
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Please enter a valid email address.'
    }

    if (form.openingBalance !== '' && Number(form.openingBalance) < 0) {
      return 'Opening balance cannot be negative.'
    }

    if (form.accountNumber && !/^[0-9A-Za-z\- ]+$/.test(form.accountNumber.trim())) {
      return 'Please enter a valid account number.'
    }

    return null
  }

  /* ------------------------------------------------------------------------ */
  /* SUBMIT                                                                    */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    try {
      setSaving(true)
      setErrorMessage('')

      const token = localStorage.getItem('token')

      const payload = {
        name: form.name.trim(),
        companyName: form.companyName.trim() || null,
        contactPerson: form.contactPerson.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || 'Nigeria',
        taxNumber: form.taxNumber.trim() || null,
        bankName: form.bankName.trim() || null,
        accountNumber: form.accountNumber.trim() || null,
        accountName: form.accountName.trim() || null,
        openingBalance: Number(form.openingBalance || 0),
        notes: form.notes.trim() || null,
        status: form.status,
      }

      const response = await axios.post(`${API_URL}/suppliers`, payload, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          : {
              'Content-Type': 'application/json',
            },
      })

      const supplier = response?.data?.supplier

      await Swal.fire({
        icon: 'success',
        title: 'Supplier Created',
        text: `${
          supplier?.companyName || supplier?.name || form.name
        } has been added successfully.`,
        confirmButtonText: 'Continue',
        confirmButtonColor: '#c9a227',
      })

      navigate('/suppliers')
    } catch (error) {
      console.error('CREATE SUPPLIER ERROR:', error)

      const message = getErrorMessage(error, 'Unable to create supplier.')

      setErrorMessage(message)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /* RESET                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleReset = () => {
    if (
      !Object.entries(form).some(
        ([key, value]) =>
          key !== 'country' &&
          key !== 'status' &&
          String(value).trim() !== '' &&
          String(value) !== '0',
      )
    ) {
      return
    }

    Swal.fire({
      icon: 'warning',
      title: 'Clear form?',
      text: 'All supplier information entered on this page will be cleared.',
      showCancelButton: true,
      confirmButtonText: 'Clear Form',
      cancelButtonText: 'Keep Editing',
      confirmButtonColor: '#b42318',
      cancelButtonColor: '#374151',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setForm(initialForm)
        setErrorMessage('')
      }
    })
  }

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        paddingBottom: 50,
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

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
                      width: 50,
                      height: 50,
                      minWidth: 50,
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
                      Add Supplier
                    </h2>

                    <div
                      style={{
                        color: '#cbd5e1',
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      Register a new supplier for your fashion inventory
                    </div>
                  </div>
                </div>
              </CCol>

              <CCol xs="12" md="auto">
                <CButton
                  component={Link}
                  to="/suppliers"
                  disabled={saving}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    fontWeight: 650,
                    borderRadius: 9,
                  }}
                >
                  <CIcon icon={cilArrowLeft} className="me-2" />
                  Back to Suppliers
                </CButton>
              </CCol>
            </CRow>
          </div>
        </CContainer>
      </div>

      <CContainer
        fluid
        style={{
          paddingTop: 25,
          maxWidth: 1250,
        }}
      >
        <CForm onSubmit={handleSubmit}>
          {/* ---------------------------------------------------------------- */}
          {/* ERROR                                                            */}
          {/* ---------------------------------------------------------------- */}

          {errorMessage && (
            <CAlert
              color="danger"
              dismissible
              onClose={() => setErrorMessage('')}
              style={{
                borderRadius: 12,
                border: '1px solid #fecaca',
                marginBottom: 20,
              }}
            >
              <strong>Unable to save supplier.</strong>
              <div
                style={{
                  marginTop: 3,
                }}
              >
                {errorMessage}
              </div>
            </CAlert>
          )}

          <CRow className="g-4">
            {/* ============================================================ */}
            {/* LEFT COLUMN                                                   */}
            {/* ============================================================ */}

            <CCol xs="12" lg="8">
              {/* ---------------------------------------------------------- */}
              {/* BASIC INFORMATION                                           */}
              {/* ---------------------------------------------------------- */}

              <CCard
                className="border-0 mb-4"
                style={{
                  borderRadius: 16,
                  boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
                }}
              >
                <CCardBody style={{ padding: 25 }}>
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff8dc',
                        color: '#a57d05',
                      }}
                    >
                      <CIcon icon={cilUser} />
                    </div>

                    <div>
                      <h5
                        style={{
                          margin: 0,
                          color: '#111827',
                          fontWeight: 750,
                        }}
                      >
                        Basic Information
                      </h5>

                      <div
                        style={{
                          color: '#64748b',
                          fontSize: 12,
                          marginTop: 3,
                        }}
                      >
                        Primary supplier and contact details
                      </div>
                    </div>
                  </div>

                  <CRow className="g-3">
                    <CCol md="6">
                      <CFormLabel>
                        Supplier Name{' '}
                        <span
                          style={{
                            color: '#b42318',
                          }}
                        >
                          *
                        </span>
                      </CFormLabel>

                      <CFormInput
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Royal Fashion Supplier"
                        required
                        disabled={saving}
                        autoComplete="organization"
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />

                      <small className="text-body-secondary">
                        The main name used to identify this supplier.
                      </small>
                    </CCol>

                    <CCol md="6">
                      <CFormLabel>Company Name</CFormLabel>

                      <CFormInput
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        placeholder="e.g. Royal Fashion Nigeria Ltd"
                        disabled={saving}
                        autoComplete="organization"
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>

                    <CCol md="6">
                      <CFormLabel>Contact Person</CFormLabel>

                      <CFormInput
                        name="contactPerson"
                        value={form.contactPerson}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        disabled={saving}
                        autoComplete="name"
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>

                    <CCol md="6">
                      <CFormLabel>Phone Number</CFormLabel>

                      <CFormInput
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="e.g. 08012345678"
                        disabled={saving}
                        autoComplete="tel"
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>

                    <CCol xs="12">
                      <CFormLabel>Email Address</CFormLabel>

                      <CFormInput
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="supplier@example.com"
                        disabled={saving}
                        autoComplete="email"
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              {/* ---------------------------------------------------------- */}
              {/* ADDRESS                                                     */}
              {/* ---------------------------------------------------------- */}

              <CCard
                className="border-0 mb-4"
                style={{
                  borderRadius: 16,
                  boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
                }}
              >
                <CCardBody style={{ padding: 25 }}>
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f1f5f9',
                        color: '#334155',
                      }}
                    >
                      <CIcon icon={cilLocationPin} />
                    </div>

                    <div>
                      <h5
                        style={{
                          margin: 0,
                          color: '#111827',
                          fontWeight: 750,
                        }}
                      >
                        Address & Location
                      </h5>

                      <div
                        style={{
                          color: '#64748b',
                          fontSize: 12,
                          marginTop: 3,
                        }}
                      >
                        Supplier business and delivery location
                      </div>
                    </div>
                  </div>

                  <CRow className="g-3">
                    <CCol xs="12">
                      <CFormLabel>Address</CFormLabel>

                      <CFormTextarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Enter supplier address"
                        disabled={saving}
                        rows={3}
                        style={{
                          borderRadius: 9,
                          resize: 'vertical',
                        }}
                      />
                    </CCol>

                    <CCol md="4">
                      <CFormLabel>City</CFormLabel>

                      <CFormInput
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Lagos"
                        disabled={saving}
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>

                    <CCol md="4">
                      <CFormLabel>State</CFormLabel>

                      <CFormInput
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="Lagos"
                        disabled={saving}
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>

                    <CCol md="4">
                      <CFormLabel>Country</CFormLabel>

                      <CFormInput
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        placeholder="Nigeria"
                        disabled={saving}
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              {/* ---------------------------------------------------------- */}
              {/* BANKING                                                     */}
              {/* ---------------------------------------------------------- */}

              <CCard
                className="border-0 mb-4"
                style={{
                  borderRadius: 16,
                  boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
                }}
              >
                <CCardBody style={{ padding: 25 }}>
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff8dc',
                        color: '#a57d05',
                      }}
                    >
                      <CIcon icon={cilWallet} />
                    </div>

                    <div>
                      <h5
                        style={{
                          margin: 0,
                          color: '#111827',
                          fontWeight: 750,
                        }}
                      >
                        Financial Information
                      </h5>

                      <div
                        style={{
                          color: '#64748b',
                          fontSize: 12,
                          marginTop: 3,
                        }}
                      >
                        Banking and supplier account information
                      </div>
                    </div>
                  </div>

                  <CRow className="g-3">
                    <CCol md="6">
                      <CFormLabel>Tax Number</CFormLabel>

                      <CFormInput
                        name="taxNumber"
                        value={form.taxNumber}
                        onChange={handleChange}
                        placeholder="Optional"
                        disabled={saving}
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>

                    <CCol md="6">
                      <CFormLabel>Bank Name</CFormLabel>

                      <CFormInput
                        name="bankName"
                        value={form.bankName}
                        onChange={handleChange}
                        placeholder="e.g. GTBank"
                        disabled={saving}
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>

                    <CCol md="6">
                      <CFormLabel>Account Number</CFormLabel>

                      <CFormInput
                        name="accountNumber"
                        value={form.accountNumber}
                        onChange={handleChange}
                        placeholder="Enter account number"
                        disabled={saving}
                        inputMode="numeric"
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>

                    <CCol md="6">
                      <CFormLabel>Account Name</CFormLabel>

                      <CFormInput
                        name="accountName"
                        value={form.accountName}
                        onChange={handleChange}
                        placeholder="Account holder name"
                        disabled={saving}
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />
                    </CCol>

                    <CCol xs="12">
                      <CFormLabel>Opening Balance</CFormLabel>

                      <CFormInput
                        type="number"
                        min="0"
                        step="0.01"
                        name="openingBalance"
                        value={form.openingBalance}
                        onChange={handleChange}
                        placeholder="0.00"
                        disabled={saving}
                        style={{
                          minHeight: 46,
                          borderRadius: 9,
                        }}
                      />

                      <small className="text-body-secondary">
                        Use this when the supplier already has an outstanding balance before using
                        Onishakara Gold POS.
                      </small>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              {/* ---------------------------------------------------------- */}
              {/* NOTES                                                       */}
              {/* ---------------------------------------------------------- */}

              <CCard
                className="border-0"
                style={{
                  borderRadius: 16,
                  boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
                }}
              >
                <CCardBody style={{ padding: 25 }}>
                  <CFormLabel>Internal Notes</CFormLabel>

                  <CFormTextarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Add any useful notes about this supplier..."
                    disabled={saving}
                    rows={5}
                    style={{
                      borderRadius: 9,
                      resize: 'vertical',
                    }}
                  />
                </CCardBody>
              </CCard>
            </CCol>

            {/* ============================================================ */}
            {/* RIGHT COLUMN                                                  */}
            {/* ============================================================ */}

            <CCol xs="12" lg="4">
              <div
                style={{
                  position: 'sticky',
                  top: 20,
                }}
              >
                {/* -------------------------------------------------------- */}
                {/* SUPPLIER SUMMARY                                          */}
                {/* -------------------------------------------------------- */}

                <CCard
                  className="border-0 mb-4"
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 6px 24px rgba(15,23,42,0.07)',
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #111827, #1f2937)',
                      padding: 22,
                      borderBottom: '3px solid #c9a227',
                    }}
                  >
                    <div
                      style={{
                        color: '#e8bd35',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      Supplier Preview
                    </div>

                    <div
                      style={{
                        marginTop: 15,
                        width: 58,
                        height: 58,
                        borderRadius: 15,
                        background: 'linear-gradient(135deg, #c9a227, #e8bd35)',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        fontWeight: 800,
                      }}
                    >
                      {form.name
                        ? form.name
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join('')
                            .toUpperCase()
                        : 'S'}
                    </div>

                    <div
                      style={{
                        color: '#ffffff',
                        fontSize: 18,
                        fontWeight: 750,
                        marginTop: 15,
                      }}
                    >
                      {form.companyName || form.name || 'New Supplier'}
                    </div>

                    <div
                      style={{
                        color: '#cbd5e1',
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      {form.contactPerson || 'Contact person not provided'}
                    </div>
                  </div>

                  <CCardBody
                    style={{
                      padding: 20,
                    }}
                  >
                    <div className="mb-3">
                      <div
                        style={{
                          color: '#64748b',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.7,
                        }}
                      >
                        Phone
                      </div>

                      <div
                        style={{
                          color: '#111827',
                          fontWeight: 650,
                          marginTop: 4,
                        }}
                      >
                        {form.phone || 'Not provided'}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div
                        style={{
                          color: '#64748b',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.7,
                        }}
                      >
                        Email
                      </div>

                      <div
                        style={{
                          color: '#111827',
                          fontWeight: 650,
                          marginTop: 4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {form.email || 'Not provided'}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: '#64748b',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.7,
                        }}
                      >
                        Opening Balance
                      </div>

                      <div
                        style={{
                          color: '#111827',
                          fontSize: 19,
                          fontWeight: 800,
                          marginTop: 4,
                        }}
                      >
                        ₦
                        {Number(form.openingBalance || 0).toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </CCardBody>
                </CCard>

                {/* -------------------------------------------------------- */}
                {/* STATUS                                                    */}
                {/* -------------------------------------------------------- */}

                <CCard
                  className="border-0 mb-4"
                  style={{
                    borderRadius: 16,
                    boxShadow: '0 5px 22px rgba(15,23,42,0.06)',
                  }}
                >
                  <CCardBody
                    style={{
                      padding: 22,
                    }}
                  >
                    <CFormLabel>Supplier Status</CFormLabel>

                    <CFormSelect
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      disabled={saving}
                      style={{
                        minHeight: 46,
                        borderRadius: 9,
                      }}
                    >
                      <option value="active">Active</option>

                      <option value="inactive">Inactive</option>
                    </CFormSelect>

                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 10,
                        background: form.status === 'active' ? '#ecfdf3' : '#fef2f2',
                        color: form.status === 'active' ? '#166534' : '#991b1b',
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      {form.status === 'active'
                        ? 'This supplier will be available for purchases and inventory receiving.'
                        : 'This supplier will remain in the system but should not normally be used for new purchases.'}
                    </div>
                  </CCardBody>
                </CCard>

                {/* -------------------------------------------------------- */}
                {/* ACTIONS                                                   */}
                {/* -------------------------------------------------------- */}

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
                      type="submit"
                      disabled={saving}
                      className="w-100 mb-2"
                      style={{
                        minHeight: 48,
                        background: 'linear-gradient(135deg, #c9a227, #e8bd35)',
                        border: 'none',
                        color: '#111827',
                        fontWeight: 800,
                        borderRadius: 10,
                        boxShadow: '0 7px 18px rgba(201,162,39,0.20)',
                      }}
                    >
                      {saving ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          Saving Supplier...
                        </>
                      ) : (
                        <>
                          <CIcon icon={cilSave} className="me-2" />
                          Save Supplier
                        </>
                      )}
                    </CButton>

                    <CButton
                      type="button"
                      disabled={saving}
                      onClick={handleReset}
                      className="w-100"
                      style={{
                        minHeight: 45,
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        color: '#334155',
                        fontWeight: 650,
                        borderRadius: 10,
                      }}
                    >
                      Clear Form
                    </CButton>

                    <div
                      style={{
                        marginTop: 15,
                        paddingTop: 15,
                        borderTop: '1px solid #e5e7eb',
                        color: '#64748b',
                        fontSize: 11,
                        lineHeight: 1.6,
                      }}
                    >
                      <strong
                        style={{
                          color: '#334155',
                        }}
                      >
                        Note:
                      </strong>{' '}
                      Supplier information can be edited later. Opening balance should only
                      represent an existing balance before purchases are recorded in the system.
                    </div>
                  </CCardBody>
                </CCard>
              </div>
            </CCol>
          </CRow>
        </CForm>
      </CContainer>
    </div>
  )
}

export default AddSupplier
