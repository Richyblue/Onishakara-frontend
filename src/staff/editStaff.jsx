import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilSave, cilLockLocked } from '@coreui/icons'

import { useNavigate, useParams } from 'react-router-dom'

const EditStaff = () => {
  const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
  const API_URL = `${API_ROOT}/api/v1`

  const { id } = useParams()
  const navigate = useNavigate()

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showPassword, setShowPassword] = useState(false)

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

  // --------------------------------------------------
  // HANDLE INPUT
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // --------------------------------------------------
  // FETCH STAFF
  // --------------------------------------------------

  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await axios.get(`${API_URL}/staff/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const staff = response.data?.staff

      if (!staff) {
        throw new Error('Staff record not found')
      }

      const user = staff.User || staff.user || {}

      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        role: user.role || 'staff',
        position: staff.position || '',
        salary: staff.salary !== null && staff.salary !== undefined ? staff.salary : '',
        employmentType: staff.employmentType || 'salary',
      })
    } catch (err) {
      console.error('FETCH STAFF ERROR:', err)

      const message = err?.response?.data?.message || err?.message || 'Unable to load staff details'

      setError(message)

      Swal.fire({
        icon: 'error',
        title: 'Unable to Load Staff',
        text: message,
        confirmButtonColor: '#b08d2c',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchStaff()
    }
  }, [id])

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const validateForm = () => {
    const fullname = formData.fullname.trim()
    const email = formData.email.trim()
    const phone = formData.phone.trim()
    const position = formData.position.trim()

    if (!fullname) {
      Swal.fire({
        icon: 'warning',
        title: 'Full Name Required',
        text: 'Please enter the staff full name.',
        confirmButtonColor: '#b08d2c',
      })
      return false
    }

    if (!email) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Required',
        text: 'Please enter the staff email address.',
        confirmButtonColor: '#b08d2c',
      })
      return false
    }

    if (!position) {
      Swal.fire({
        icon: 'warning',
        title: 'Position Required',
        text: 'Please enter the staff position.',
        confirmButtonColor: '#b08d2c',
      })
      return false
    }

    if (
      formData.salary !== '' &&
      (Number.isNaN(Number(formData.salary)) || Number(formData.salary) < 0)
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Salary',
        text: 'Salary must be a valid amount.',
        confirmButtonColor: '#b08d2c',
      })
      return false
    }

    if (formData.password && formData.password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Too Short',
        text: 'The new password must contain at least 6 characters.',
        confirmButtonColor: '#b08d2c',
      })
      return false
    }

    return true
  }

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSaving(true)

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Authentication token not found')
      }

      // Only send fields supported by the new fashion-retail backend.
      const payload = {
        fullname: formData.fullname.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        position: formData.position.trim(),
        salary: formData.salary === '' || formData.salary === null ? null : Number(formData.salary),
        employmentType: 'salary',
      }

      // Only send password when the user actually entered a new one.
      if (formData.password.trim()) {
        payload.password = formData.password.trim()
      }

      await axios.put(`${API_URL}/staff/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await Swal.fire({
        icon: 'success',
        title: 'Staff Updated',
        text: 'Staff information has been updated successfully.',
        confirmButtonColor: '#b08d2c',
      })

      navigate('/viewStaff')
    } catch (err) {
      console.error('UPDATE STAFF ERROR:', err)

      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err?.response?.data?.message || err?.message || 'Failed to update staff.',
        confirmButtonColor: '#b08d2c',
      })
    } finally {
      setSaving(false)
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <CSpinner
            style={{
              width: '3rem',
              height: '3rem',
              color: '#b08d2c',
            }}
          />

          <div className="mt-3 text-medium-emphasis">Loading staff information...</div>
        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <CCard className="border-0 shadow-sm">
        <CCardBody className="p-4">
          <CAlert color="danger" className="mb-4">
            <strong>Unable to load staff.</strong>
            <div className="mt-1">{error}</div>
          </CAlert>

          <CButton color="dark" onClick={() => navigate('/viewStaff')}>
            <CIcon icon={cilArrowLeft} className="me-2" />
            Back to Staff
          </CButton>
        </CCardBody>
      </CCard>
    )
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="container-fluid px-0">
      {/* HEADER */}
      <CCard
        className="border-0 shadow-sm mb-4"
        style={{
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        <CCardHeader
          className="border-0 py-4"
          style={{
            background: 'linear-gradient(135deg, #111111 0%, #1d1d1d 60%, #292929 100%)',
            color: '#fff',
          }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div
                className="text-uppercase small fw-semibold mb-1"
                style={{
                  color: '#c9a227',
                  letterSpacing: '1.5px',
                }}
              >
                Onishakara Gold Fashion Store
              </div>

              <h3 className="mb-1 fw-bold">Edit Staff</h3>

              <div className="text-white-50">Update staff account and employment information</div>
            </div>

            <CButton
              color="light"
              variant="outline"
              onClick={() => navigate('/viewStaff')}
              disabled={saving}
            >
              <CIcon icon={cilArrowLeft} className="me-2" />
              Back to Staff
            </CButton>
          </div>
        </CCardHeader>
      </CCard>

      {/* FORM */}
      <CCard
        className="border-0 shadow-sm"
        style={{
          borderRadius: '14px',
        }}
      >
        <CCardBody className="p-4 p-lg-5">
          <CForm onSubmit={handleSubmit}>
            {/* PERSONAL INFORMATION */}

            <div className="mb-4">
              <h5 className="fw-bold mb-1">Personal Information</h5>

              <p className="text-medium-emphasis mb-0">
                Update the staff member's basic information.
              </p>
            </div>

            <CRow className="g-4">
              <CCol md={6}>
                <CFormInput
                  label="Full Name"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </CCol>

              <CCol md={6}>
                <CFormInput
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="staff@example.com"
                  required
                />
              </CCol>

              <CCol md={6}>
                <CFormInput
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="080XXXXXXXX"
                />
              </CCol>

              <CCol md={6}>
                <CFormSelect label="Role" name="role" value={formData.role} onChange={handleChange}>
                  {currentUser?.role === 'admin' && <option value="admin">Administrator</option>}

                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="staff">Staff</option>
                </CFormSelect>

                <div className="small text-medium-emphasis mt-1">
                  Controls the staff member's system access level.
                </div>
              </CCol>
            </CRow>

            <hr className="my-5" />

            {/* PASSWORD */}

            <div className="mb-4">
              <h5 className="fw-bold mb-1">Security</h5>

              <p className="text-medium-emphasis mb-0">
                Leave the password blank if you do not want to change it.
              </p>
            </div>

            <CRow>
              <CCol md={6}>
                <CFormInput
                  type={showPassword ? 'text' : 'password'}
                  label="New Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                />

                <div className="d-flex justify-content-between align-items-center mt-2">
                  <div className="small text-medium-emphasis">Minimum 6 characters</div>

                  <CButton
                    type="button"
                    color="dark"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <CIcon icon={cilLockLocked} className="me-1" />
                    {showPassword ? 'Hide' : 'Show'}
                  </CButton>
                </div>
              </CCol>
            </CRow>

            <hr className="my-5" />

            {/* EMPLOYMENT */}

            <div className="mb-4">
              <h5 className="fw-bold mb-1">Employment Details</h5>

              <p className="text-medium-emphasis mb-0">
                Manage the staff member's position and salary information.
              </p>
            </div>

            <CRow className="g-4">
              <CCol md={6}>
                <CFormInput
                  label="Position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g. Sales Associate"
                  required
                />
              </CCol>

              <CCol md={6}>
                <CInputGroup>
                  <CInputGroupText>₦</CInputGroupText>

                  <CFormInput
                    type="number"
                    min="0"
                    step="0.01"
                    label="Salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </CInputGroup>

                <div className="small text-medium-emphasis mt-1">Monthly salary amount.</div>
              </CCol>

              <CCol md={6}>
                <CFormSelect label="Employment Type" name="employmentType" value="salary" disabled>
                  <option value="salary">Salary</option>
                </CFormSelect>

                <div className="small text-medium-emphasis mt-1">
                  Onishakara staff records currently use salary-based employment.
                </div>
              </CCol>
            </CRow>

            {/* ACTIONS */}

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-5 pt-4 border-top">
              <CButton
                type="button"
                color="secondary"
                variant="outline"
                onClick={() => navigate('/viewStaff')}
                disabled={saving}
              >
                Cancel
              </CButton>

              <CButton
                type="submit"
                color="dark"
                disabled={saving}
                style={{
                  minWidth: '180px',
                  background: '#111',
                  borderColor: '#111',
                }}
              >
                {saving ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilSave} className="me-2" />
                    Save Changes
                  </>
                )}
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default EditStaff
