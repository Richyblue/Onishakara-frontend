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
  CFormTextarea,
  CRow,
  CSpinner,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilCheck } from '@coreui/icons'

import axios from 'axios'
import { useNavigate } from 'react-router-dom'

import './Category.css'

const API_ROOT = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
const API_URL = `${API_ROOT}/api/v1`

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const AddCategory = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!image) return

    const objectUrl = URL.createObjectURL(image)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    setError('')

    if (!file) {
      setImage(null)
      setPreview('')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

    if (!allowedTypes.includes(file.type)) {
      setError('Choose a JPG, PNG, WEBP, or AVIF image.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image size must not exceed 5 MB.')
      e.target.value = ''
      return
    }

    setImage(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Category name is required.')
      return
    }

    const token = localStorage.getItem('token')

    if (!token) {
      setError('Your session has expired. Please sign in again.')
      return
    }

    const payload = new FormData()

    payload.append('name', formData.name.trim())
    payload.append('description', formData.description.trim())
    payload.append('status', 'active')

    if (image) {
      payload.append('image', image)
    }

    try {
      setSaving(true)

      await axios.post(`${API_URL}/categories`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      navigate('/categories')
    } catch (err) {
      console.error('Create category error:', err)

      setError(err.response?.data?.message || 'Unable to create category. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="category-form-page">
      <div className="category-form-header">
        <CButton className="back-btn" onClick={() => navigate('/categories')} disabled={saving}>
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back
        </CButton>

        <div>
          <div className="category-brand-label">ONISHAKARA GOLD FASHION STORE</div>

          <h2>Create Category</h2>

          <p>Add a category, description, and image for your fashion storefront.</p>
        </div>
      </div>

      <CRow className="justify-content-center">
        <CCol lg={8}>
          <CCard className="category-form-card">
            <CCardHeader>
              <strong>Category Information</strong>
            </CCardHeader>

            <CCardBody>
              {error && (
                <CAlert color="danger" dismissible onClose={() => setError('')}>
                  {error}
                </CAlert>
              )}

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
                    required
                    maxLength={150}
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

                <div className="mb-4">
                  <label className="form-label">Category Image</label>

                  <CFormInput
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleImageChange}
                    disabled={saving}
                  />

                  <small className="text-body-secondary d-block mt-2">
                    Recommended for your storefront. JPG, PNG, WEBP, or AVIF; maximum 5 MB.
                  </small>

                  {preview && (
                    <div className="category-image-preview mt-3">
                      <img src={preview} alt="Category preview" />

                      <div className="mt-2">
                        <CButton
                          type="button"
                          color="secondary"
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() => {
                            setImage(null)
                            setPreview('')
                          }}
                        >
                          Remove Image
                        </CButton>
                      </div>
                    </div>
                  )}
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
