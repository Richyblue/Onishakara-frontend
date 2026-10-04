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

import './Category.css'

const API_ROOT = import.meta.env.VITE_BACKEND_URL

const API_URL = `${API_ROOT}api/v1`

const Category = () => {
  const navigate = useNavigate()

  const token = localStorage.getItem('token')

  const [categories, setCategories] = useState([])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState('')

  const loadCategories = useCallback(async () => {
    try {
      setError('')

      if (!categories.length) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      const response = await axios.get(`${API_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search: search || undefined,
          status: status || undefined,
        },
      })

      setCategories(response.data?.categories || [])
    } catch (err) {
      console.error(err)

      setError(err.response?.data?.message || 'Unable to load categories.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, status, token])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCategories()
    }, 250)

    return () => clearTimeout(timer)
  }, [loadCategories])

  const stats = useMemo(() => {
    const total = categories.length

    const active = categories.filter((item) => item.status === 'active').length

    const inactive = categories.filter((item) => item.status === 'inactive').length

    const products = categories.reduce((sum, item) => sum + Number(item.productCount || 0), 0)

    return {
      total,
      active,
      inactive,
      products,
    }
  }, [categories])

  const toggleStatus = async (category) => {
    try {
      await axios.put(
        `${API_URL}/categories/${category.id}/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      await loadCategories()
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to update category status.')
    }
  }

  const deleteCategory = async (category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\nThis can only be deleted if no products are assigned to it.`,
    )

    if (!confirmed) return

    try {
      await axios.delete(`${API_URL}/categories/${category.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await loadCategories()
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete category.')
    }
  }

  return (
    <div className="category-page">
      {/* HEADER */}

      <div className="category-page-header">
        <div>
          <div className="category-brand-label">ONISHAKARA GOLD FASHION STORE</div>

          <h2>Product Categories</h2>

          <p>Organize your fashion products into clear product categories.</p>
        </div>

        <CButton className="gold-primary-btn" onClick={() => navigate('/Addcategories')}>
          <CIcon icon={cilPlus} className="me-2" />
          Add Category
        </CButton>
      </div>

      {/* STATISTICS */}

      <CRow className="g-3 mb-4">
        <CCol md={3}>
          <div className="category-stat-card">
            <span>Total Categories</span>
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

      {/* MAIN CARD */}

      <CCard className="category-main-card">
        <CCardHeader className="category-toolbar">
          <div className="category-search">
            <CIcon icon={cilSearch} />

            <CFormInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category..."
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
              <span>Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="category-empty">
              <div className="category-empty-icon">
                <CIcon icon={cilCloudDownload} />
              </div>

              <h4>No categories found</h4>

              <p>Create your first product category to start organizing your inventory.</p>

              <CButton className="gold-primary-btn" onClick={() => navigate('/Addcategory')}>
                <CIcon icon={cilPlus} className="me-2" />
                Create Category
              </CButton>
            </div>
          ) : (
            <div className="table-responsive">
              <CTable hover align="middle" className="category-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>

                    <CTableHeaderCell>Category</CTableHeaderCell>

                    <CTableHeaderCell>Description</CTableHeaderCell>

                    <CTableHeaderCell>Products</CTableHeaderCell>

                    <CTableHeaderCell>Status</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {categories.map((category, index) => (
                    <CTableRow key={category.id}>
                      <CTableDataCell>{index + 1}</CTableDataCell>

                      <CTableDataCell>
                        <div className="category-name-cell">
                          <div className="category-avatar">
                            {category.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <strong>{category.name}</strong>

                            <small>ID #{category.id}</small>
                          </div>
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <span className="category-description">
                          {category.description || 'No description'}
                        </span>
                      </CTableDataCell>

                      <CTableDataCell>
                        <strong>{category.productCount || 0}</strong>
                      </CTableDataCell>

                      <CTableDataCell>
                        {category.status === 'active' ? (
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
                            onClick={() => navigate(`/Editcategories/${category.id}`)}
                          >
                            <CIcon icon={cilPencil} />
                          </CButton>

                          <CButton
                            size="sm"
                            className="action-status"
                            onClick={() => toggleStatus(category)}
                          >
                            {category.status === 'active' ? (
                              <CIcon icon={cilXCircle} />
                            ) : (
                              <CIcon icon={cilCheckCircle} />
                            )}
                          </CButton>

                          <CButton
                            size="sm"
                            className="action-delete"
                            onClick={() => deleteCategory(category)}
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

export default Category
