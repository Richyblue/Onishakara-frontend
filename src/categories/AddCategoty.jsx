import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormTextarea,
  CRow,
  CSpinner,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilCheck } from '@coreui/icons'

import axios from 'axios'
import { useNavigate } from 'react-router-dom'

import './Category.css'

const API_ROOT = import.meta.env.VITE_BACKEND_URL

const API_URL = `${API_ROOT}api/v1`

const AddCategory = () => {
  const navigate = useNavigate()

  const token = localStorage.getItem('token')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

      await axios.post(
        `${API_URL}/categories`,
        {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          status: 'active',
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

      setError(err.response?.data?.message || 'Unable to create category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="category-form-page">
      <div className="category-form-header">
        <CButton className="back-btn" onClick={() => navigate('/Addcategories')}>
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back
        </CButton>

        <div>
          <div className="category-brand-label">ONISHAKARA GOLD FASHION STORE</div>

          <h2>Create Category</h2>

          <p>Add a category for your fashion inventory.</p>
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
                    placeholder="e.g. Men's Shirts"
                    disabled={saving}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Description</label>

                  <CFormTextarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe this category..."
                    rows={5}
                    disabled={saving}
                  />
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
                        Create Category
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

export default AddCategory
