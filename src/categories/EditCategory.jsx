import React, { useEffect, useState } from 'react'

import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CRow,
  CSpinner,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilCheck } from '@coreui/icons'

import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'

import './Category.css'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API_URL = `${API_ROOT}/api/v1`

const EditCategory = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const token = localStorage.getItem('token')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const category = response.data?.category

        if (!category) {
          throw new Error('Category not found')
        }

        setFormData({
          name: category.name || '',
          description: category.description || '',
          status: category.status || 'active',
        })
      } catch (err) {
        console.error(err)

        setError(err.response?.data?.message || err.message || 'Unable to load category.')
      } finally {
        setLoading(false)
      }
    }

    loadCategory()
  }, [id, token])

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    if (!formData.name.trim()) {
      setError('Category name is required.')
      return
    }

    try {
      setSaving(true)

      await axios.put(
        `${API_URL}/categories/${id}`,
        {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      navigate('/categories')
    } catch (err) {
      console.error(err)

      setError(err.response?.data?.message || 'Unable to update category.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="category-loading-page">
        <CSpinner />
        <span>Loading category...</span>
      </div>
    )
  }

  return (
    <div className="category-form-page">
      <div className="category-form-header">
        <CButton className="back-btn" onClick={() => navigate('/categories')}>
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back
        </CButton>

        <div>
          <div className="category-brand-label">ONISHAKARA GOLD FASHION STORE</div>

          <h2>Edit Category</h2>

          <p>Update category information and status.</p>
        </div>
      </div>

      <CRow className="justify-content-center">
        <CCol lg={8}>
          <CCard className="category-form-card">
            <CCardHeader>
              <strong>Category Information</strong>
            </CCardHeader>

            <CCardBody>
              {error && <CAlert color="danger">{error}</CAlert>}

              <CForm onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label">
                    Category Name
                    <span className="required-star">*</span>
                  </label>

                  <CFormInput
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Description</label>

                  <CFormTextarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    disabled={saving}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Status</label>

                  <CFormSelect
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="active">Active</option>

                    <option value="inactive">Inactive</option>
                  </CFormSelect>
                </div>

                <div className="form-actions">
                  <CButton
                    type="button"
                    className="cancel-btn"
                    onClick={() => navigate('/categories')}
                    disabled={saving}
                  >
                    Cancel
                  </CButton>

                  <CButton type="submit" className="gold-primary-btn" disabled={saving}>
                    {saving ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilCheck} className="me-2" />
                        Save Changes
                      </>
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default EditCategory
