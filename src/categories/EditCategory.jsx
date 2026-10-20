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

const API_ROOT = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
const API_URL = `${API_ROOT}/api/v1`

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const EditCategory = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  })

  const [currentImage, setCurrentImage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewImage, setPreviewImage] = useState('')
  const [removeImage, setRemoveImage] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadCategory = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const category = response.data?.category

        if (!category) {
          throw new Error('Category not found.')
        }

        if (!mounted) return

        setFormData({
          name: category.name || '',
          description: category.description || '',
          status: category.status || 'active',
        })

        setCurrentImage(category.image || '')
        setPreviewImage(category.image || '')
      } catch (err) {
        console.error('LOAD CATEGORY ERROR:', err)

        if (mounted) {
          setError(err.response?.data?.message || err.message || 'Unable to load category.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadCategory()

    return () => {
      mounted = false
    }
  }, [id, token])

  // Clean up temporary preview URLs.
  useEffect(() => {
    return () => {
      if (previewImage?.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage)
      }
    }
  }, [previewImage])

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    setError('')

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Only JPG, JPEG, PNG and WebP images are allowed.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image size must not exceed 5 MB.')
      e.target.value = ''
      return
    }

    if (previewImage?.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage)
    }

    setImageFile(file)
    setPreviewImage(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  const handleRemoveImage = () => {
    if (previewImage?.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage)
    }

    setImageFile(null)
    setPreviewImage('')
    setRemoveImage(true)
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

      const payload = new FormData()

      payload.append('name', formData.name.trim())
      payload.append('description', formData.description.trim())
      payload.append('status', formData.status)

      if (imageFile) {
        payload.append('image', imageFile)
      } else if (removeImage) {
        // Backend must interpret an empty image field as image removal.
        payload.append('image', '')
      }

      await axios.put(`${API_URL}/categories/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      navigate('/categories')
    } catch (err) {
      console.error('UPDATE CATEGORY ERROR:', err)

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
          <p>Update category details, image and status.</p>
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
                    required
                    disabled={saving}
                    maxLength={100}
                    placeholder="Enter category name"
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
                    placeholder="Describe this category"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Category Image</label>

                  <CFormInput
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={saving}
                  />

                  <small className="text-body-secondary d-block mt-2">
                    JPG, PNG or WebP. Maximum upload size: 5 MB. Uploaded images are converted to
                    WebP by the backend.
                  </small>
                </div>

                {previewImage && (
                  <div className="category-image-preview mb-4">
                    <p className="fw-semibold mb-2">
                      {imageFile ? 'New image preview' : 'Current category image'}
                    </p>

                    <img
                      src={previewImage}
                      alt="Category preview"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />

                    <CButton
                      type="button"
                      color="danger"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={saving}
                      onClick={handleRemoveImage}
                    >
                      Remove Image
                    </CButton>
                  </div>
                )}

                {removeImage && (
                  <CAlert color="warning">
                    The category image will be removed when you save. Choose another image above to
                    replace it.
                  </CAlert>
                )}

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
