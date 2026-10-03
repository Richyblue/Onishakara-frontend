import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CInputGroup,
  CInputGroupText,
  CAlert,
  CSpinner,
  CBadge,
} from '@coreui/react'

import { successAlert, errorAlert } from 'src/utils/alerts'

const EditProduct = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_BACKEND_URL || ''

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingBrands, setLoadingBrands] = useState(false)

  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])

  const [imagePreview, setImagePreview] = useState(null)
  const [existingImage, setExistingImage] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    reorderLevel: 5,
    status: 'active',
    image: null,
  })

  /* =========================================================
     AUTH CONFIG
  ========================================================= */

  const getAuthConfig = () => {
    const token = localStorage.getItem('token')

    return {
      headers: {
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
    }
  }

  /* =========================================================
     GET PRODUCT
  ========================================================= */

  const getProduct = async () => {
    try {
      setFetching(true)

      const response = await axios.get(`${API_URL}api/v1/products/${id}`, getAuthConfig())

      const product = response?.data?.product || response?.data?.data || response?.data

      if (!product) {
        throw new Error('Product data was not returned.')
      }

      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        categoryId: product.categoryId || '',
        brandId: product.brandId || '',
        costPrice: product.costPrice ?? '',
        sellingPrice: product.sellingPrice ?? '',
        quantity: product.quantity ?? '',
        reorderLevel: product.reorderLevel ?? 5,
        status: product.status || 'active',
        image: null,
      })

      /*
       * Support different image field formats that may
       * already exist in the database/API.
       */
      const productImage = product.image || product.imageUrl || product.image_url || null

      setExistingImage(productImage)

      if (productImage) {
        setImagePreview(productImage)
      }
    } catch (error) {
      console.error('Get product error:', error)

      errorAlert(error?.response?.data?.message || 'Failed to load product.')
    } finally {
      setFetching(false)
    }
  }

  /* =========================================================
     GET CATEGORIES
  ========================================================= */

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)

      const response = await axios.get(`${API_URL}api/v1/categories`, getAuthConfig())

      const data = response?.data

      if (Array.isArray(data)) {
        setCategories(data)
      } else if (Array.isArray(data?.categories)) {
        setCategories(data.categories)
      } else if (Array.isArray(data?.data)) {
        setCategories(data.data)
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error('Category fetch error:', error)

      errorAlert(error?.response?.data?.message || 'Unable to load categories.')
    } finally {
      setLoadingCategories(false)
    }
  }

  /* =========================================================
     GET BRANDS
  ========================================================= */

  const fetchBrands = async () => {
    try {
      setLoadingBrands(true)

      const response = await axios.get(`${API_URL}api/v1/brands`, getAuthConfig())

      const data = response?.data

      if (Array.isArray(data)) {
        setBrands(data)
      } else if (Array.isArray(data?.brands)) {
        setBrands(data.brands)
      } else if (Array.isArray(data?.data)) {
        setBrands(data.data)
      } else {
        setBrands([])
      }
    } catch (error) {
      console.error('Brand fetch error:', error)

      errorAlert(error?.response?.data?.message || 'Unable to load brands.')
    } finally {
      setLoadingBrands(false)
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (!id) {
      errorAlert('Product ID is missing.')
      setFetching(false)
      return
    }

    const loadPage = async () => {
      await Promise.all([getProduct(), fetchCategories(), fetchBrands()])
    }

    loadPage()
  }, [id])

  /* =========================================================
     HANDLE INPUT
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  /* =========================================================
     IMAGE
  ========================================================= */

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      errorAlert('Please select a valid image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      errorAlert('Product image must not exceed 5MB.')
      return
    }

    /*
     * Revoke previous object URL if it was a local preview.
     */
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    const preview = URL.createObjectURL(file)

    setFormData((prev) => ({
      ...prev,
      image: file,
    }))

    setImagePreview(preview)
  }

  /* =========================================================
     REMOVE NEW IMAGE
     ========================================================= */

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    setFormData((prev) => ({
      ...prev,
      image: null,
    }))

    /*
     * If there was an existing server image, return to it.
     * Otherwise clear the preview.
     */
    setImagePreview(existingImage || null)
  }

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const costPrice = Number(formData.costPrice || 0)
  const sellingPrice = Number(formData.sellingPrice || 0)
  const quantity = Number(formData.quantity || 0)
  const reorderLevel = Number(formData.reorderLevel || 0)

  const profit = sellingPrice - costPrice

  const profitMargin = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(2) : '0.00'

  const stockValue = costPrice * quantity
  const potentialSales = sellingPrice * quantity
  const potentialProfit = profit * quantity

  const isLowStock = quantity > 0 && reorderLevel > 0 && quantity <= reorderLevel

  /* =========================================================
     FORM COMPLETION
  ========================================================= */

  const completion = useMemo(() => {
    const fields = [
      formData.name.trim(),
      formData.sellingPrice,
      formData.quantity !== '',
      formData.reorderLevel !== '',
    ]

    const completed = fields.filter(Boolean).length

    return Math.round((completed / fields.length) * 100)
  }, [formData])

  /* =========================================================
     MONEY
  ========================================================= */

  const money = (value) =>
    Number(value || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (!formData.name.trim()) {
      errorAlert('Product name is required.')
      return false
    }

    if (costPrice < 0) {
      errorAlert('Cost price cannot be negative.')
      return false
    }

    if (sellingPrice <= 0) {
      errorAlert('Please enter a valid selling price.')
      return false
    }

    if (quantity < 0) {
      errorAlert('Quantity cannot be negative.')
      return false
    }

    if (reorderLevel < 0) {
      errorAlert('Reorder level cannot be negative.')
      return false
    }

    if (formData.sku.trim().length > 100) {
      errorAlert('SKU is too long.')
      return false
    }

    if (formData.barcode.trim().length > 100) {
      errorAlert('Barcode is too long.')
      return false
    }

    return true
  }

  /* =========================================================
     UPDATE PRODUCT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const payload = new FormData()

      payload.append('name', formData.name.trim())

      if (formData.sku.trim()) {
        payload.append('sku', formData.sku.trim())
      }

      if (formData.barcode.trim()) {
        payload.append('barcode', formData.barcode.trim())
      }

      if (formData.categoryId) {
        payload.append('categoryId', formData.categoryId)
      }

      if (formData.brandId) {
        payload.append('brandId', formData.brandId)
      }

      payload.append('costPrice', costPrice)
      payload.append('sellingPrice', sellingPrice)
      payload.append('quantity', quantity)
      payload.append('reorderLevel', reorderLevel)
      payload.append('status', formData.status)

      /*
       * Only send a new image when the user selected one.
       * This prevents accidentally replacing an existing
       * image with an empty value.
       */
      if (formData.image) {
        payload.append('image', formData.image)
      }

      const response = await axios.put(`${API_URL}api/v1/products/${id}`, payload, {
        headers: {
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      })

      successAlert(response?.data?.message || 'Product updated successfully.')

      navigate('/view-products')
    } catch (error) {
      console.error('Update product error:', error)

      errorAlert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Failed to update product.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (fetching) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{
          minHeight: '65vh',
          color: '#777',
        }}
      >
        <div
          style={{
            width: '62px',
            height: '62px',
            borderRadius: '18px',
            background: '#f5edcf',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px',
          }}
        >
          <CSpinner
            style={{
              color: '#b89120',
            }}
          />
        </div>

        <div
          style={{
            fontWeight: '700',
            color: '#333',
          }}
        >
          Loading product...
        </div>

        <small
          style={{
            color: '#999',
            marginTop: '4px',
          }}
        >
          Preparing product information
        </small>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#f5f5f3',
        paddingBottom: '40px',
      }}
    >
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div
        className="mb-4"
        style={{
          background: 'linear-gradient(135deg, #0b0b0b 0%, #171717 55%, #252525 100%)',
          borderRadius: '20px',
          padding: '30px',
          color: '#fff',
          boxShadow: '0 10px 35px rgba(0,0,0,0.14)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            border: '1px solid rgba(212,175,55,0.12)',
            right: '-70px',
            top: '-100px',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            border: '1px solid rgba(212,175,55,0.10)',
            right: '80px',
            bottom: '-80px',
          }}
        />

        <CRow className="align-items-center position-relative">
          <CCol lg={8}>
            <div
              className="mb-2"
              style={{
                color: '#d4af37',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              ONISHAKARA GOLD • INVENTORY
            </div>

            <h2
              className="mb-2"
              style={{
                fontWeight: '800',
                letterSpacing: '-0.7px',
                fontSize: '28px',
              }}
            >
              Edit Product
            </h2>

            <p
              className="mb-0"
              style={{
                color: '#b8b8b8',
                fontSize: '14px',
                maxWidth: '650px',
              }}
            >
              Update product information, pricing, inventory and presentation.
            </p>
          </CCol>

          <CCol lg={4} className="text-lg-end mt-4 mt-lg-0">
            <div
              className="d-inline-flex align-items-center"
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(212,175,55,0.10)',
                border: '1px solid rgba(212,175,55,0.25)',
                color: '#d4af37',
              }}
            >
              <span
                className="me-2"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#d4af37',
                }}
              />

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                EDITING PRODUCT
              </span>
            </div>
          </CCol>
        </CRow>
      </div>

      <CForm onSubmit={handleSubmit}>
        <CRow>
          {/* =====================================================
              LEFT SIDE
          ====================================================== */}

          <CCol xl={8}>
            {/* =================================================
                PRODUCT INFORMATION
            ================================================== */}

            <CCard className="mb-4 border-0" style={cardStyle}>
              <CCardHeader className="border-0" style={headerStyle}>
                <SectionHeader
                  number="01"
                  title="Product Information"
                  description="Update the product identification and classification."
                />
              </CCardHeader>

              <CCardBody style={bodyStyle}>
                <CRow>
                  <CCol md={8} className="mb-4">
                    <FieldLabel required>Product Name</FieldLabel>

                    <CFormInput
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      required
                      style={inputStyle}
                    />
                  </CCol>

                  <CCol md={4} className="mb-4">
                    <FieldLabel>Status</FieldLabel>

                    <CFormSelect
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="active">Active</option>

                      <option value="inactive">Inactive</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={6} className="mb-4">
                    <FieldLabel>SKU</FieldLabel>

                    <CFormInput
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="Product SKU"
                      autoComplete="off"
                      style={inputStyle}
                    />

                    <small className="field-help">
                      Keep your existing SKU unless you intentionally want to change it.
                    </small>
                  </CCol>

                  <CCol md={6} className="mb-4">
                    <FieldLabel>Barcode</FieldLabel>

                    <CInputGroup>
                      <CInputGroupText
                        style={{
                          background: '#fafafa',
                          border: '1px solid #e3e3df',
                          color: '#777',
                        }}
                      >
                        #
                      </CInputGroupText>

                      <CFormInput
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                        placeholder="Barcode"
                        autoComplete="off"
                        style={{
                          ...inputStyle,
                          borderRadius: '0 10px 10px 0',
                        }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol md={6} className="mb-4 mb-md-0">
                    <FieldLabel>Category</FieldLabel>

                    <CFormSelect
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      disabled={loadingCategories}
                      style={inputStyle}
                    >
                      <option value="">
                        {loadingCategories ? 'Loading categories...' : 'Select category'}
                      </option>

                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={6}>
                    <FieldLabel>Brand</FieldLabel>

                    <CFormSelect
                      name="brandId"
                      value={formData.brandId}
                      onChange={handleChange}
                      disabled={loadingBrands}
                      style={inputStyle}
                    >
                      <option value="">
                        {loadingBrands ? 'Loading brands...' : 'Select brand'}
                      </option>

                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* =================================================
                PRICING
            ================================================== */}

            <CCard className="mb-4 border-0" style={cardStyle}>
              <CCardHeader className="border-0" style={headerStyle}>
                <SectionHeader
                  number="02"
                  title="Pricing"
                  description="Update product cost and retail selling price."
                />
              </CCardHeader>

              <CCardBody style={bodyStyle}>
                <CRow>
                  <CCol md={6} className="mb-4">
                    <FieldLabel>Cost Price</FieldLabel>

                    <CInputGroup>
                      <CInputGroupText style={currencyStyle}>₦</CInputGroupText>

                      <CFormInput
                        type="number"
                        min="0"
                        step="0.01"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        style={{
                          ...inputStyle,
                          borderRadius: '0 10px 10px 0',
                        }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol md={6} className="mb-4">
                    <FieldLabel required>Selling Price</FieldLabel>

                    <CInputGroup>
                      <CInputGroupText
                        style={{
                          ...currencyStyle,
                          background: '#111',
                          color: '#d4af37',
                          borderColor: '#111',
                        }}
                      >
                        ₦
                      </CInputGroupText>

                      <CFormInput
                        type="number"
                        min="0"
                        step="0.01"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        required
                        style={{
                          ...inputStyle,
                          borderRadius: '0 10px 10px 0',
                          fontWeight: '700',
                        }}
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* PROFIT */}

                <div
                  style={{
                    borderRadius: '15px',
                    padding: '18px',
                    background:
                      profit >= 0 ? 'linear-gradient(135deg, #f7f4e8, #fffdf5)' : '#fff1f2',
                    border: profit >= 0 ? '1px solid #eee2b6' : '1px solid #fecdd3',
                  }}
                >
                  <CRow>
                    <CCol sm={4} className="mb-3 mb-sm-0">
                      <small className="metric-label">PROFIT / UNIT</small>

                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: '800',
                          color: profit >= 0 ? '#92721b' : '#be123c',
                        }}
                      >
                        ₦{money(profit)}
                      </div>
                    </CCol>

                    <CCol sm={4} className="mb-3 mb-sm-0">
                      <small className="metric-label">PROFIT MARGIN</small>

                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: '800',
                          color: profit >= 0 ? '#92721b' : '#be123c',
                        }}
                      >
                        {profitMargin}%
                      </div>
                    </CCol>

                    <CCol sm={4}>
                      <small className="metric-label">POTENTIAL PROFIT</small>

                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: '800',
                          color: potentialProfit >= 0 ? '#166534' : '#be123c',
                        }}
                      >
                        ₦{money(potentialProfit)}
                      </div>
                    </CCol>
                  </CRow>
                </div>
              </CCardBody>
            </CCard>

            {/* =================================================
                INVENTORY
            ================================================== */}

            <CCard className="mb-4 border-0" style={cardStyle}>
              <CCardHeader className="border-0" style={headerStyle}>
                <SectionHeader
                  number="03"
                  title="Inventory"
                  description="Update current stock and reorder protection."
                />
              </CCardHeader>

              <CCardBody style={bodyStyle}>
                <CRow>
                  <CCol md={6} className="mb-4">
                    <FieldLabel required>Current Quantity</FieldLabel>

                    <CFormInput
                      type="number"
                      min="0"
                      step="1"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                    />

                    <small className="field-help">
                      This updates the product's current stored quantity.
                    </small>
                  </CCol>

                  <CCol md={6} className="mb-4">
                    <FieldLabel required>Reorder Level</FieldLabel>

                    <CFormInput
                      type="number"
                      min="0"
                      step="1"
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                    />
                  </CCol>
                </CRow>

                {isLowStock && (
                  <CAlert
                    className="border-0 mb-3"
                    style={{
                      borderRadius: '12px',
                      background: '#fff7ed',
                      color: '#9a3412',
                    }}
                  >
                    <strong>Low-stock warning:</strong> Current quantity is at or below the reorder
                    level.
                  </CAlert>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '10px',
                  }}
                >
                  <InventoryMetric label="STOCK VALUE" value={`₦${money(stockValue)}`} />

                  <InventoryMetric label="POTENTIAL SALES" value={`₦${money(potentialSales)}`} />

                  <InventoryMetric label="POTENTIAL PROFIT" value={`₦${money(potentialProfit)}`} />
                </div>
              </CCardBody>
            </CCard>

            {/* =================================================
                PRODUCT IMAGE
            ================================================== */}

            <CCard className="mb-4 border-0" style={cardStyle}>
              <CCardHeader className="border-0" style={headerStyle}>
                <SectionHeader
                  number="04"
                  title="Product Image"
                  description="Update the image shown throughout the POS."
                />
              </CCardHeader>

              <CCardBody style={bodyStyle}>
                <div
                  style={{
                    border: '1.5px dashed #d6d6d2',
                    borderRadius: '16px',
                    padding: imagePreview ? '14px' : '32px',
                    textAlign: 'center',
                    background: '#fafaf8',
                  }}
                >
                  {imagePreview ? (
                    <>
                      <div
                        style={{
                          position: 'relative',
                          maxWidth: '320px',
                          margin: '0 auto 15px',
                        }}
                      >
                        <img
                          src={imagePreview}
                          alt={formData.name || 'Product'}
                          style={{
                            width: '100%',
                            height: '290px',
                            objectFit: 'cover',
                            borderRadius: '14px',
                            display: 'block',
                          }}
                        />

                        <button
                          type="button"
                          onClick={removeImage}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(0,0,0,0.8)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '18px',
                          }}
                          title="Remove selected image"
                        >
                          ×
                        </button>
                      </div>

                      <div
                        style={{
                          fontWeight: '700',
                          color: '#333',
                          marginBottom: '4px',
                        }}
                      >
                        {formData.image ? formData.image.name : 'Current product image'}
                      </div>

                      <small
                        style={{
                          color: '#999',
                        }}
                      >
                        Choose another image below to replace it.
                      </small>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: '58px',
                          height: '58px',
                          borderRadius: '16px',
                          background: '#f5edcf',
                          color: '#a68424',
                          margin: '0 auto 15px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '25px',
                          fontWeight: '700',
                        }}
                      >
                        +
                      </div>

                      <div
                        style={{
                          fontWeight: '700',
                          color: '#303030',
                          marginBottom: '5px',
                        }}
                      >
                        No product image
                      </div>

                      <small
                        className="d-block mb-4"
                        style={{
                          color: '#999',
                        }}
                      >
                        Upload a PNG, JPG or JPEG image.
                      </small>
                    </>
                  )}

                  <CFormInput
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageChange}
                    style={{
                      maxWidth: '420px',
                      margin: '0 auto',
                      borderRadius: '10px',
                      background: '#fff',
                    }}
                  />
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* =====================================================
              RIGHT SUMMARY
          ====================================================== */}

          <CCol xl={4}>
            <div
              style={{
                position: 'sticky',
                top: '20px',
              }}
            >
              <CCard
                className="border-0 mb-4"
                style={{
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                }}
              >
                <CCardHeader
                  className="border-0"
                  style={{
                    background: 'linear-gradient(145deg, #0b0b0b, #1d1d1d)',
                    color: '#fff',
                    padding: '22px',
                  }}
                >
                  <div
                    style={{
                      color: '#d4af37',
                      fontSize: '10px',
                      letterSpacing: '1.8px',
                      fontWeight: '800',
                    }}
                  >
                    ONISHAKARA GOLD
                  </div>

                  <div
                    style={{
                      fontSize: '19px',
                      fontWeight: '800',
                      marginTop: '5px',
                    }}
                  >
                    Product Overview
                  </div>

                  <div
                    className="mt-3"
                    style={{
                      height: '5px',
                      borderRadius: '20px',
                      background: '#292929',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${completion}%`,
                        background: 'linear-gradient(90deg, #b78b19, #e5c65a)',
                        borderRadius: '20px',
                        transition: 'width .25s ease',
                      }}
                    />
                  </div>

                  <small
                    className="d-block mt-2"
                    style={{
                      color: '#a8a8a8',
                    }}
                  >
                    {completion}% setup completed
                  </small>
                </CCardHeader>

                <CCardBody
                  style={{
                    padding: '20px',
                  }}
                >
                  {/* IMAGE */}

                  <div
                    className="mb-4"
                    style={{
                      borderRadius: '15px',
                      background: '#f7f7f5',
                      overflow: 'hidden',
                      border: '1px solid #ededeb',
                    }}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={formData.name || 'Product'}
                        style={{
                          width: '100%',
                          height: '210px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '170px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#b7b7b2',
                          fontSize: '13px',
                        }}
                      >
                        No product image
                      </div>
                    )}

                    <div
                      style={{
                        padding: '14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: '800',
                          color: '#181818',
                        }}
                      >
                        {formData.name || 'Product Name'}
                      </div>

                      <div
                        className="mt-1"
                        style={{
                          fontSize: '12px',
                          color: '#888',
                        }}
                      >
                        {formData.sku || 'SKU not specified'}
                      </div>
                    </div>
                  </div>

                  {/* STATUS */}

                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <span
                        style={{
                          color: '#888',
                          fontSize: '12px',
                        }}
                      >
                        Product Status
                      </span>

                      <CBadge
                        style={{
                          background: formData.status === 'active' ? '#ecfdf3' : '#f3f4f6',
                          color: formData.status === 'active' ? '#15803d' : '#6b7280',
                          borderRadius: '20px',
                          padding: '7px 11px',
                        }}
                      >
                        {formData.status === 'active' ? 'Active' : 'Inactive'}
                      </CBadge>
                    </div>
                  </div>

                  {/* SUMMARY */}

                  <div
                    style={{
                      background: '#f8f8f6',
                      borderRadius: '14px',
                      padding: '16px',
                    }}
                  >
                    <SummaryRow
                      label="Category"
                      value={
                        categories.find((item) => String(item.id) === String(formData.categoryId))
                          ?.name || 'Not selected'
                      }
                    />

                    <SummaryRow
                      label="Brand"
                      value={
                        brands.find((item) => String(item.id) === String(formData.brandId))?.name ||
                        'Not selected'
                      }
                    />

                    <SummaryRow label="Quantity" value={`${quantity.toLocaleString()} units`} />

                    <SummaryRow
                      label="Reorder Level"
                      value={`${reorderLevel.toLocaleString()} units`}
                    />

                    <SummaryRow label="Selling Price" value={`₦${money(sellingPrice)}`} />

                    <SummaryRow label="Profit / Unit" value={`₦${money(profit)}`} />

                    <SummaryRow label="Margin" value={`${profitMargin}%`} last />
                  </div>

                  {/* UPDATE BUTTON */}

                  <CButton
                    type="submit"
                    disabled={loading}
                    className="w-100 mt-4 border-0"
                    style={{
                      minHeight: '53px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #e4c04f 0%, #b89120 100%)',
                      color: '#111',
                      fontWeight: '800',
                      boxShadow: '0 8px 20px rgba(184,145,32,0.22)',
                    }}
                  >
                    {loading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Updating Product...
                      </>
                    ) : (
                      <>
                        <span
                          className="me-2"
                          style={{
                            fontSize: '17px',
                          }}
                        >
                          ✓
                        </span>
                        Update Product
                      </>
                    )}
                  </CButton>

                  {/* CANCEL */}

                  <CButton
                    type="button"
                    variant="outline"
                    className="w-100 mt-2"
                    disabled={loading}
                    onClick={() => navigate('/view-products')}
                    style={{
                      minHeight: '45px',
                      borderRadius: '11px',
                      border: '1px solid #deded9',
                      color: '#555',
                      background: '#fff',
                      fontWeight: '600',
                    }}
                  >
                    Cancel
                  </CButton>

                  <div
                    className="text-center mt-3"
                    style={{
                      fontSize: '11px',
                      color: '#999',
                      lineHeight: '1.5',
                    }}
                  >
                    Changes will be saved to the Onishakara Gold inventory.
                  </div>
                </CCardBody>
              </CCard>

              {/* INVENTORY INFO */}

              <CCard
                className="border-0"
                style={{
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
              >
                <CCardBody
                  style={{
                    padding: '18px',
                  }}
                >
                  <div className="d-flex align-items-center mb-3">
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#f6efd5',
                        color: '#9b791c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        marginRight: '10px',
                      }}
                    >
                      i
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: '800',
                          color: '#222',
                          fontSize: '13px',
                        }}
                      >
                        Inventory Note
                      </div>

                      <small
                        style={{
                          color: '#999',
                        }}
                      >
                        Stock management
                      </small>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#777',
                      lineHeight: '1.6',
                    }}
                  >
                    For detailed stock additions, reductions and stock history, use the dedicated
                    inventory adjustment workflow rather than changing quantities repeatedly here.
                  </div>
                </CCardBody>
              </CCard>
            </div>
          </CCol>
        </CRow>
      </CForm>

      {/* =======================================================
          PAGE STYLES
      ======================================================== */}

      <style>
        {`
          .field-help {
            display: block;
            margin-top: 7px;
            color: #999;
            font-size: 11px;
          }

          .metric-label {
            display: block;
            color: #9a8a54;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1px;
            margin-bottom: 3px;
          }

          @media (max-width: 1199px) {
            .position-relative {
              position: relative !important;
            }
          }
        `}
      </style>
    </div>
  )
}

/* ============================================================
   SECTION HEADER
============================================================ */

const SectionHeader = ({ number, title, description }) => (
  <div className="d-flex align-items-center">
    <div
      className="me-3 d-flex align-items-center justify-content-center"
      style={{
        width: '42px',
        height: '42px',
        minWidth: '42px',
        borderRadius: '12px',
        background: 'linear-gradient(145deg, #faf2d5, #f5e9bd)',
        color: '#9a791e',
        fontSize: '12px',
        fontWeight: '800',
      }}
    >
      {number}
    </div>

    <div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: '800',
          color: '#171717',
        }}
      >
        {title}
      </div>

      <small
        style={{
          color: '#999',
          fontSize: '12px',
        }}
      >
        {description}
      </small>
    </div>
  </div>
)

/* ============================================================
   FIELD LABEL
============================================================ */

const FieldLabel = ({ children, required = false }) => (
  <CFormLabel
    style={{
      fontWeight: '700',
      color: '#383838',
      fontSize: '12px',
      marginBottom: '8px',
    }}
  >
    {children}

    {required && (
      <span
        style={{
          color: '#b89120',
          marginLeft: '4px',
        }}
      >
        *
      </span>
    )}
  </CFormLabel>
)

/* ============================================================
   INVENTORY METRIC
============================================================ */

const InventoryMetric = ({ label, value }) => (
  <div
    style={{
      background: '#f8f8f6',
      borderRadius: '12px',
      padding: '13px',
      border: '1px solid #eeeeeb',
    }}
  >
    <small
      style={{
        display: 'block',
        color: '#999',
        fontSize: '9px',
        fontWeight: '800',
        letterSpacing: '.7px',
        marginBottom: '4px',
      }}
    >
      {label}
    </small>

    <strong
      style={{
        color: '#242424',
        fontSize: '13px',
      }}
    >
      {value}
    </strong>
  </div>
)

/* ============================================================
   SUMMARY ROW
============================================================ */

const SummaryRow = ({ label, value, last = false }) => (
  <div
    className="d-flex justify-content-between"
    style={{
      padding: '9px 0',
      borderBottom: last ? 'none' : '1px solid #e9e9e5',
      gap: '15px',
    }}
  >
    <span
      style={{
        color: '#888',
        fontSize: '11px',
      }}
    >
      {label}
    </span>

    <strong
      style={{
        color: '#242424',
        fontSize: '11px',
        textAlign: 'right',
        maxWidth: '170px',
        wordBreak: 'break-word',
      }}
    >
      {value}
    </strong>
  </div>
)

/* ============================================================
   SHARED STYLES
============================================================ */

const cardStyle = {
  borderRadius: '18px',
  boxShadow: '0 5px 25px rgba(0,0,0,0.05)',
  overflow: 'hidden',
}

const headerStyle = {
  background: '#fff',
  padding: '22px 24px 16px',
}

const bodyStyle = {
  padding: '10px 24px 28px',
}

const inputStyle = {
  minHeight: '47px',
  borderRadius: '10px',
  border: '1px solid #e3e3df',
  background: '#fff',
  color: '#222',
  fontSize: '13px',
}

const currencyStyle = {
  background: '#fafaf8',
  border: '1px solid #e3e3df',
  color: '#777',
  fontWeight: '700',
}

export default EditProduct
