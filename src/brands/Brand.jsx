import React, { useCallback, useEffect, useMemo, useState } from 'react'

import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'

import {
  cilCheckCircle,
  cilCloudDownload,
  cilPencil,
  cilPlus,
  cilSearch,
  cilTrash,
  cilXCircle,
} from '@coreui/icons'

import axios from 'axios'
import { useNavigate } from 'react-router-dom'

import '../categories/Category.css'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

const Brand = () => {
  const navigate = useNavigate()

  const token = localStorage.getItem('token')

  const [brands, setBrands] = useState([])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState('')

  const loadBrands = useCallback(async () => {
    try {
      setError('')

      if (!brands.length) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      const response = await axios.get(`${API_URL}/brands`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search: search || undefined,
          status: status || undefined,
        },
      })

      setBrands(response.data?.brands || [])
    } catch (err) {
      console.error(err)

      setError(err.response?.data?.message || 'Unable to load brands.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, status, token])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBrands()
    }, 250)

    return () => clearTimeout(timer)
  }, [loadBrands])

  const stats = useMemo(() => {
    const total = brands.length

    const active = brands.filter((item) => item.status === 'active').length

    const inactive = brands.filter((item) => item.status === 'inactive').length

    const products = brands.reduce((sum, item) => sum + Number(item.productCount || 0), 0)

    return {
      total,
      active,
      inactive,
      products,
    }
  }, [brands])

  const toggleStatus = async (brand) => {
    try {
      await axios.put(
        `${API_URL}/brands/${brand.id}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      await loadBrands()
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to update brand status.')
    }
  }

  const deleteBrand = async (brand) => {
    const confirmed = window.confirm(
      `Delete "${brand.name}"?\n\nThis can only be deleted if no products are assigned to it.`,
    )

    if (!confirmed) return

    try {
      await axios.delete(`${API_URL}/brands/${brand.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await loadBrands()
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete brand.')
    }
  }

  return (
    <div className="category-page">
      <div className="category-page-header">
        <div>
          <div className="category-brand-label">ONISHAKARA GOLD FASHION STORE</div>

          <h2>Product Brands</h2>

          <p>Manage the brands available in your fashion inventory.</p>
        </div>

        <CButton className="gold-primary-btn" onClick={() => navigate('/brands/add')}>
          <CIcon icon={cilPlus} className="me-2" />
          Add Brand
        </CButton>
      </div>

      <CRow className="g-3 mb-4">
        <CCol md={3}>
          <div className="category-stat-card">
            <span>Total Brands</span>
            <strong>{stats.total}</strong>
          </div>
        </CCol>

        <CCol md={3}>
          <div className="category-stat-card active">
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>
        </CCol>

        <CCol md={3}>
          <div className="category-stat-card inactive">
            <span>Inactive</span>
            <strong>{stats.inactive}</strong>
          </div>
        </CCol>

        <CCol md={3}>
          <div className="category-stat-card products">
            <span>Products Assigned</span>
            <strong>{stats.products}</strong>
          </div>
        </CCol>
      </CRow>

      <CCard className="category-main-card">
        <CCardHeader className="category-toolbar">
          <div className="category-search">
            <CIcon icon={cilSearch} />

            <CFormInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand..."
            />
          </div>

          <CFormSelect
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="category-status-filter"
          >
            <option value="">All Status</option>

            <option value="active">Active</option>

            <option value="inactive">Inactive</option>
          </CFormSelect>
        </CCardHeader>

        <CCardBody>
          {error && <div className="category-error">{error}</div>}

          {loading ? (
            <div className="category-loading">
              <CSpinner />
              <span>Loading brands...</span>
            </div>
          ) : brands.length === 0 ? (
            <div className="category-empty">
              <div className="category-empty-icon">
                <CIcon icon={cilCloudDownload} />
              </div>

              <h4>No brands found</h4>

              <p>Add your first fashion brand to start organizing your products.</p>

              <CButton className="gold-primary-btn" onClick={() => navigate('/brands/add')}>
                <CIcon icon={cilPlus} className="me-2" />
                Create Brand
              </CButton>
            </div>
          ) : (
            <div className="table-responsive">
              <CTable hover align="middle" className="category-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>

                    <CTableHeaderCell>Brand</CTableHeaderCell>

                    <CTableHeaderCell>Description</CTableHeaderCell>

                    <CTableHeaderCell>Products</CTableHeaderCell>

                    <CTableHeaderCell>Status</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {brands.map((brand, index) => (
                    <CTableRow key={brand.id}>
                      <CTableDataCell>{index + 1}</CTableDataCell>

                      <CTableDataCell>
                        <div className="category-name-cell">
                          <div className="category-avatar">
                            {brand.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <strong>{brand.name}</strong>

                            <small>ID #{brand.id}</small>
                          </div>
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <span className="category-description">
                          {brand.description || 'No description'}
                        </span>
                      </CTableDataCell>

                      <CTableDataCell>
                        <strong>{brand.productCount || 0}</strong>
                      </CTableDataCell>

                      <CTableDataCell>
                        {brand.status === 'active' ? (
                          <CBadge color="success" className="status-badge">
                            <CIcon icon={cilCheckCircle} className="me-1" />
                            Active
                          </CBadge>
                        ) : (
                          <CBadge color="secondary" className="status-badge">
                            <CIcon icon={cilXCircle} className="me-1" />
                            Inactive
                          </CBadge>
                        )}
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="category-actions">
                          <CButton
                            size="sm"
                            className="action-edit"
                            onClick={() => navigate(`/brands/edit/${brand.id}`)}
                          >
                            <CIcon icon={cilPencil} />
                          </CButton>

                          <CButton
                            size="sm"
                            className="action-status"
                            onClick={() => toggleStatus(brand)}
                          >
                            {brand.status === 'active' ? (
                              <CIcon icon={cilXCircle} />
                            ) : (
                              <CIcon icon={cilCheckCircle} />
                            )}
                          </CButton>

                          <CButton
                            size="sm"
                            className="action-delete"
                            onClick={() => deleteBrand(brand)}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {refreshing && (
                <div className="category-refreshing">
                  <CSpinner size="sm" />
                  Updating...
                </div>
              )}
            </div>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default Brand
