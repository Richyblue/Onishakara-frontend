import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilPencil,
  cilUserPlus,
  cilPeople,
  cilShieldAlt,
  cilBriefcase,
  cilCheckCircle,
  cilXCircle,
  cilReload,
} from '@coreui/icons'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CFormInput,
  CFormSelect,
  CButton,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'

import { Link } from 'react-router-dom'
import StaffIDCardModal from '../components/StaffIdCardModal'

// ============================================================
// API
// ============================================================

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

// ============================================================
// VIEW STAFF
// ============================================================

const ViewStaff = () => {
  const [staffs, setStaffs] = useState([])

  const [search, setSearch] = useState('')

  const [roleFilter, setRoleFilter] = useState('')

  const [employmentFilter, setEmploymentFilter] = useState('')

  const [statusFilter, setStatusFilter] = useState('')

  const [selectedStaff, setSelectedStaff] = useState(null)

  const [showIDCard, setShowIDCard] = useState(false)

  const [loading, setLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState('')

  // ==========================================================
  // GET STAFF
  // ==========================================================

  const getStaff = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      setError('')

      const token = localStorage.getItem('token')

      if (!token) {
        setError('Your session has expired. Please login again.')

        return
      }

      const response = await axios.get(`${API_URL}/staffs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      })

      const staffList = Array.isArray(response.data?.staffs) ? response.data.staffs : []

      setStaffs(staffList)
    } catch (err) {
      console.error('GET STAFF ERROR:', err)

      const message = err?.response?.data?.message || 'Unable to load staff records.'

      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    getStaff()
  }, [getStaff])

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {
    const total = staffs.length

    const active = staffs.filter((staff) => staff.User?.isActive === true).length

    const inactive = staffs.filter((staff) => staff.User?.isActive !== true).length

    const payroll = staffs.reduce(
      (totalSalary, staff) => totalSalary + Number(staff.salary || 0),
      0,
    )

    return {
      total,
      active,
      inactive,
      payroll,
    }
  }, [staffs])

  // ==========================================================
  // FILTER STAFF
  // ==========================================================

  const filteredStaffs = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return staffs.filter((staff) => {
      const fullname = staff.User?.fullname?.toLowerCase() || ''

      const email = staff.User?.email?.toLowerCase() || ''

      const phone = staff.User?.phone?.toLowerCase() || ''

      const position = staff.position?.toLowerCase() || ''

      const matchesSearch =
        !searchValue ||
        fullname.includes(searchValue) ||
        email.includes(searchValue) ||
        phone.includes(searchValue) ||
        position.includes(searchValue)

      const matchesRole = !roleFilter || staff.User?.role === roleFilter

      const matchesEmployment = !employmentFilter || staff.employmentType === employmentFilter

      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && staff.User?.isActive === true) ||
        (statusFilter === 'inactive' && staff.User?.isActive !== true)

      return matchesSearch && matchesRole && matchesEmployment && matchesStatus
    })
  }, [staffs, search, roleFilter, employmentFilter, statusFilter])

  // ==========================================================
  // TOGGLE STAFF STATUS
  // ==========================================================

  const toggleStaffStatus = async (staff) => {
    const currentStatus = staff.User?.isActive === true

    const action = currentStatus ? 'Deactivate' : 'Activate'

    const result = await Swal.fire({
      title: `${action} Staff?`,
      html: `
          <p style="margin-bottom:6px;">
            Are you sure you want to
            <strong>${action.toLowerCase()}</strong>
            this staff account?
          </p>

          <p style="margin:0;color:#888;">
            ${staff.User?.fullname || 'Staff member'}
          </p>
        `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: action,
      cancelButtonText: 'Cancel',
      confirmButtonColor: currentStatus ? '#dc3545' : '#198754',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}/staff/${staff.id}/status`,
        {
          isActive: !currentStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        },
      )

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Staff ${action.toLowerCase()}d successfully.`,
        confirmButtonColor: '#b8860b',
      })

      await getStaff(false)
    } catch (err) {
      console.error('STAFF STATUS ERROR:', err)

      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err?.response?.data?.message || 'Unable to update staff status.',
        confirmButtonColor: '#b8860b',
      })
    }
  }

  // ==========================================================
  // OPEN ID CARD
  // ==========================================================

  const openIDCard = (staff) => {
    setSelectedStaff(staff)
    setShowIDCard(true)
  }

  // ==========================================================
  // CLOSE ID CARD
  // ==========================================================

  const closeIDCard = () => {
    setShowIDCard(false)
    setSelectedStaff(null)
  }

  // ==========================================================
  // ROLE LABEL
  // ==========================================================

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrator',
      manager: 'Manager',
      cashier: 'Cashier',
      staff: 'Staff',
    }

    return roles[role] || role || 'Staff'
  }

  // ==========================================================
  // EMPLOYMENT LABEL
  // ==========================================================

  const getEmploymentLabel = (employmentType) => {
    if (!employmentType) {
      return 'Salary Based'
    }

    if (employmentType === 'salary') {
      return 'Salary Based'
    }

    return employmentType.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const formatMoney = (amount) => {
    const value = Number(amount || 0)

    return `₦${value.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearch('')
    setRoleFilter('')
    setEmploymentFilter('')
    setStatusFilter('')
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        minHeight: '100%',
        paddingBottom: '30px',
      }}
    >
      {/* ====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              letterSpacing: '4px',
              color: '#b8860b',
              fontWeight: 800,
              marginBottom: '5px',
            }}
          >
            ONISHAKARA
          </div>

          <h2
            style={{
              margin: 0,
              fontWeight: 800,
              color: '#222',
            }}
          >
            Staff Management
          </h2>

          <div
            style={{
              color: '#777',
              fontSize: '13px',
              marginTop: '5px',
            }}
          >
            Manage store staff, roles, salaries and account access.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <CButton
            color="light"
            onClick={() => getStaff(false)}
            disabled={refreshing}
            style={{
              border: '1px solid #ddd',
            }}
          >
            {refreshing ? (
              <CSpinner size="sm" className="me-2" />
            ) : (
              <CIcon icon={cilReload} className="me-2" />
            )}
            Refresh
          </CButton>

          <Link to="/addStaff">
            <CButton
              style={{
                background: 'linear-gradient(135deg,#d4af37,#a67c00)',
                border: 'none',
                color: '#111',
                fontWeight: 800,
              }}
            >
              <CIcon icon={cilUserPlus} className="me-2" />
              Add Staff
            </CButton>
          </Link>
        </div>
      </div>

      {/* ====================================================
          STATISTICS
      ===================================================== */}

      <CRow className="g-3 mb-4">
        <CCol sm={6} lg={3}>
          <StatCard icon={cilPeople} label="Total Staff" value={statistics.total} />
        </CCol>

        <CCol sm={6} lg={3}>
          <StatCard icon={cilCheckCircle} label="Active Staff" value={statistics.active} positive />
        </CCol>

        <CCol sm={6} lg={3}>
          <StatCard icon={cilXCircle} label="Inactive Staff" value={statistics.inactive} negative />
        </CCol>

        <CCol sm={6} lg={3}>
          <StatCard
            icon={cilBriefcase}
            label="Monthly Payroll"
            value={formatMoney(statistics.payroll)}
          />
        </CCol>
      </CRow>

      {/* ====================================================
          FILTER CARD
      ===================================================== */}

      <CCard
        className="mb-4"
        style={{
          border: '1px solid #e8e8e8',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        <CCardHeader
          style={{
            background: '#fff',
            borderBottom: '1px solid #eee',
            fontWeight: 800,
          }}
        >
          Staff Directory
        </CCardHeader>

        <CCardBody>
          <CRow className="g-3">
            <CCol md={5} lg={4}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>

                <CFormInput
                  placeholder="Search name, email, phone or position..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>

            <CCol md={3} lg={2.5}>
              <CFormSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>

                <option value="admin">Administrator</option>

                <option value="manager">Manager</option>

                <option value="cashier">Cashier</option>

                <option value="staff">Staff</option>
              </CFormSelect>
            </CCol>

            <CCol md={3} lg={2.5}>
              <CFormSelect
                value={employmentFilter}
                onChange={(e) => setEmploymentFilter(e.target.value)}
              >
                <option value="">All Employment</option>

                <option value="salary">Salary Based</option>
              </CFormSelect>
            </CCol>

            <CCol md={3} lg={2}>
              <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>

                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </CFormSelect>
            </CCol>

            <CCol md="auto" className="d-flex align-items-center">
              {(search || roleFilter || employmentFilter || statusFilter) && (
                <CButton color="light" onClick={resetFilters}>
                  Clear
                </CButton>
              )}
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ====================================================
          ERROR
      ===================================================== */}

      {error && (
        <CCard
          className="mb-4"
          style={{
            border: '1px solid #f1b0b7',
            background: '#fff5f5',
          }}
        >
          <CCardBody>
            <div
              style={{
                color: '#842029',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '15px',
              }}
            >
              <span>{error}</span>

              <CButton size="sm" color="danger" variant="outline" onClick={() => getStaff()}>
                Retry
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* ====================================================
          TABLE
      ===================================================== */}

      <CCard
        style={{
          border: '1px solid #e8e8e8',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        <CCardBody className="p-0">
          {loading ? (
            <div
              style={{
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '12px',
                color: '#777',
              }}
            >
              <CSpinner
                style={{
                  color: '#b8860b',
                }}
              />

              <span>Loading staff records...</span>
            </div>
          ) : filteredStaffs.length === 0 ? (
            <div
              style={{
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '10px',
                padding: '30px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                }}
              >
                <CIcon icon={cilPeople} size="xl" />
              </div>

              <h5
                style={{
                  margin: 0,
                }}
              >
                No Staff Found
              </h5>

              <p
                style={{
                  margin: 0,
                  color: '#888',
                  textAlign: 'center',
                }}
              >
                {staffs.length === 0
                  ? 'No staff accounts have been created yet.'
                  : 'No staff match your current filters.'}
              </p>

              {staffs.length > 0 && (
                <CButton size="sm" color="light" onClick={resetFilters}>
                  Clear Filters
                </CButton>
              )}
            </div>
          ) : (
            <CTable hover responsive align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Staff</CTableHeaderCell>

                  <CTableHeaderCell>Position</CTableHeaderCell>

                  <CTableHeaderCell>Role</CTableHeaderCell>

                  <CTableHeaderCell>Employment</CTableHeaderCell>

                  <CTableHeaderCell>Salary</CTableHeaderCell>

                  <CTableHeaderCell>Status</CTableHeaderCell>

                  <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredStaffs.map((staff) => {
                  const user = staff.User

                  const isActive = user?.isActive === true

                  return (
                    <CTableRow key={staff.id}>
                      {/* STAFF */}

                      <CTableDataCell>
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
                              minWidth: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg,#d4af37,#a67c00)',
                              color: '#111',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                            }}
                          >
                            {user?.fullname?.charAt(0)?.toUpperCase() || 'S'}
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: '#222',
                              }}
                            >
                              {user?.fullname || 'Unnamed Staff'}
                            </div>

                            <div
                              style={{
                                fontSize: '11px',
                                color: '#888',
                                marginTop: '2px',
                              }}
                            >
                              {user?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </CTableDataCell>

                      {/* POSITION */}

                      <CTableDataCell>
                        <span
                          style={{
                            color: '#555',
                          }}
                        >
                          {staff.position || 'Not specified'}
                        </span>
                      </CTableDataCell>

                      {/* ROLE */}

                      <CTableDataCell>
                        <CBadge
                          color={
                            user?.role === 'admin'
                              ? 'dark'
                              : user?.role === 'manager'
                                ? 'warning'
                                : user?.role === 'cashier'
                                  ? 'info'
                                  : 'secondary'
                          }
                        >
                          {getRoleLabel(user?.role)}
                        </CBadge>
                      </CTableDataCell>

                      {/* EMPLOYMENT */}

                      <CTableDataCell>
                        <span
                          style={{
                            fontSize: '13px',
                            color: '#555',
                          }}
                        >
                          {getEmploymentLabel(staff.employmentType)}
                        </span>
                      </CTableDataCell>

                      {/* SALARY */}

                      <CTableDataCell>
                        <strong>{formatMoney(staff.salary)}</strong>
                      </CTableDataCell>

                      {/* STATUS */}

                      <CTableDataCell>
                        <CBadge color={isActive ? 'success' : 'danger'} shape="rounded-pill">
                          {isActive ? 'Active' : 'Inactive'}
                        </CBadge>
                      </CTableDataCell>

                      {/* ACTIONS */}

                      <CTableDataCell>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* ID CARD */}

                          <CButton
                            size="sm"
                            color="dark"
                            onClick={() => openIDCard(staff)}
                            title="View ID Card"
                          >
                            ID Card
                          </CButton>

                          {/* EDIT */}

                          <Link to={`/editStaff/${staff.id}`}>
                            <CButton size="sm" color="warning" title="Edit Staff">
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </Link>

                          {/* STATUS */}

                          <CButton
                            size="sm"
                            color={isActive ? 'danger' : 'success'}
                            variant="outline"
                            onClick={() => toggleStaffStatus(staff)}
                            title={isActive ? 'Deactivate Staff' : 'Activate Staff'}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>

        {!loading && filteredStaffs.length > 0 && (
          <div
            style={{
              padding: '13px 18px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#777',
              fontSize: '12px',
            }}
          >
            <span>
              Showing <strong>{filteredStaffs.length}</strong> of <strong>{staffs.length}</strong>{' '}
              staff members
            </span>

            <span>
              Active:{' '}
              <strong
                style={{
                  color: '#198754',
                }}
              >
                {statistics.active}
              </strong>
            </span>
          </div>
        )}
      </CCard>

      {/* ====================================================
          ID CARD MODAL
      ===================================================== */}

      <StaffIDCardModal visible={showIDCard} onClose={closeIDCard} staff={selectedStaff} />
    </div>
  )
}

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({ icon, label, value, positive, negative }) => {
  return (
    <CCard
      style={{
        border: '1px solid #e8e8e8',
        borderRadius: '14px',
        height: '100%',
      }}
    >
      <CCardBody>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '12px',
                color: '#777',
                marginBottom: '7px',
              }}
            >
              {label}
            </div>

            <div
              style={{
                fontSize: '23px',
                fontWeight: 800,
                color: '#222',
              }}
            >
              {value}
            </div>
          </div>

          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: positive ? '#eaf7ef' : negative ? '#fff0f0' : '#fff8e1',
              color: positive ? '#198754' : negative ? '#dc3545' : '#b8860b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CIcon icon={icon} />
          </div>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ViewStaff
