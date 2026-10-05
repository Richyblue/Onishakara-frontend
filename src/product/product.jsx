import React, { useEffect, useMemo, useState } from 'react'
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

import { successAlert } from 'src/utils/alerts'
import { errorAlert } from 'src/utils/alerts'

// ============================================================
// HELPERS
// ============================================================

const createEmptyVariant = () => ({
  size: '',
  color: '',
  sku: '',
  barcode: '',
  costPrice: '',
  sellingPrice: '',
  quantity: '',
  reorderLevel: 5,
  status: 'active',
})

// ============================================================
// COMPONENT
// ============================================================

const AddProduct = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const token = localStorage.getItem('token')

  const [loading, setLoading] = useState(false)

  const [loadingCategories, setLoadingCategories] = useState(false)

  const [loadingBrands, setLoadingBrands] = useState(false)

  const [categories, setCategories] = useState([])

  const [brands, setBrands] = useState([])

  const [variants, setVariants] = useState([])

  // ==========================================================
  // PRODUCT FORM
  // ==========================================================

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

  // ==========================================================
  // LOAD CATEGORIES + BRANDS
  // ==========================================================

  useEffect(() => {
    loadCategories()
    loadBrands()
  }, [])

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)

      const response = await axios.get(`${API_URL}api/v1/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = response.data

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.data)
            ? data.data
            : []

      setCategories(list)
    } catch (error) {
      console.error('LOAD CATEGORIES ERROR:', error)

      errorAlert(error.response?.data?.message || 'Unable to load categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadBrands = async () => {
    try {
      setLoadingBrands(true)

      const response = await axios.get(`${API_URL}api/v1/brands`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = response.data

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.brands)
          ? data.brands
          : Array.isArray(data?.data)
            ? data.data
            : []

      setBrands(list)
    } catch (error) {
      console.error('LOAD BRANDS ERROR:', error)

      errorAlert(error.response?.data?.message || 'Unable to load brands')
    } finally {
      setLoadingBrands(false)
    }
  }

  // ==========================================================
  // GENERAL FORM CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // ==========================================================
  // IMAGE
  // ==========================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null

    setFormData((prev) => ({
      ...prev,
      image: file,
    }))
  }

  // ==========================================================
  // VARIANT FUNCTIONS
  // ==========================================================

  const addVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant()])
  }

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  const updateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]: value,
            }
          : variant,
      ),
    )
  }

  // ==========================================================
  // PROFIT
  // ==========================================================

  const productProfit = Number(formData.sellingPrice || 0) - Number(formData.costPrice || 0)

  const productProfitMargin =
    Number(formData.costPrice || 0) > 0
      ? ((productProfit / Number(formData.costPrice)) * 100).toFixed(2)
      : '0.00'

  const variantSummary = useMemo(() => {
    let totalQuantity = 0

    variants.forEach((variant) => {
      totalQuantity += Number(variant.quantity || 0)
    })

    return {
      count: variants.length,
      totalQuantity,
    }
  }, [variants])

  // ==========================================================
  // VALIDATE PRODUCT
  // ==========================================================

  const validateProduct = () => {
    if (!formData.name.trim()) {
      errorAlert('Product name is required')
      return false
    }

    if (Number(formData.costPrice || 0) < 0) {
      errorAlert('Cost price cannot be negative')
      return false
    }

    if (Number(formData.sellingPrice || 0) < 0) {
      errorAlert('Selling price cannot be negative')
      return false
    }

    if (Number(formData.quantity || 0) < 0) {
      errorAlert('Quantity cannot be negative')
      return false
    }

    if (Number(formData.reorderLevel || 0) < 0) {
      errorAlert('Reorder level cannot be negative')
      return false
    }

    // --------------------------------------------------------
    // Validate variants
    // --------------------------------------------------------

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i]

      if (!variant.size && !variant.color) {
        errorAlert(`Variant ${i + 1}: Size or color is required`)
        return false
      }

      if (Number(variant.costPrice || 0) < 0) {
        errorAlert(`Variant ${i + 1}: Cost price cannot be negative`)
        return false
      }

      if (Number(variant.sellingPrice || 0) < 0) {
        errorAlert(`Variant ${i + 1}: Selling price cannot be negative`)
        return false
      }

      if (Number(variant.quantity || 0) < 0) {
        errorAlert(`Variant ${i + 1}: Quantity cannot be negative`)
        return false
      }
    }

    return true
  }

  // ==========================================================
  // CREATE VARIANT
  // ==========================================================

  const createVariant = async (productId, variant) => {
    const payload = {
      size: variant.size?.trim() || null,

      color: variant.color?.trim() || null,

      sku: variant.sku?.trim() || null,

      barcode: variant.barcode?.trim() || null,

      costPrice: Number(variant.costPrice || 0),

      sellingPrice: Number(variant.sellingPrice || 0),

      quantity: Number(variant.quantity || 0),

      reorderLevel: Number(variant.reorderLevel || 5),

      status: variant.status || 'active',
    }

    return axios.post(`${API_URL}api/v1/products/${productId}/variants`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateProduct()) {
      return
    }

    try {
      setLoading(true)

      // ------------------------------------------------------
      // CREATE PRODUCT
      // ------------------------------------------------------

      const payload = new FormData()

      payload.append('name', formData.name.trim())

      payload.append('sku', formData.sku.trim())

      payload.append('barcode', formData.barcode.trim())

      if (formData.categoryId) {
        payload.append('categoryId', formData.categoryId)
      }

      if (formData.brandId) {
        payload.append('brandId', formData.brandId)
      }

      payload.append('costPrice', Number(formData.costPrice || 0))

      payload.append('sellingPrice', Number(formData.sellingPrice || 0))

      /*
       * When variants exist, the variant quantities
       * are the actual stock quantities.
       *
       * When no variants exist, use the main
       * product quantity.
       */
      // if (variants.length === 0) {
      //   payload.append('quantity', Number(formData.quantity || 0))
      // } else {
      //   payload.append('quantity', 0)
      // }

      const productQuantity =
        variants.length > 0
          ? variants.reduce((total, variant) => total + Number(variant.quantity || 0), 0)
          : Number(formData.quantity || 0)

      payload.append('quantity', productQuantity)

      payload.append('reorderLevel', Number(formData.reorderLevel || 5))

      payload.append('status', formData.status)

      if (formData.image) {
        payload.append('image', formData.image)
      }

      const response = await axios.post(`${API_URL}api/v1/products`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      const product = response.data?.product || response.data?.data || response.data

      const productId = product?.id

      if (!productId) {
        throw new Error('Product was created but the server did not return the product ID.')
      }

      // ------------------------------------------------------
      // CREATE VARIANTS
      // ------------------------------------------------------

      if (variants.length > 0) {
        const variantResults = []

        for (const variant of variants) {
          const variantResponse = await createVariant(productId, variant)

          variantResults.push(variantResponse)
        }
      }

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      successAlert(
        variants.length > 0
          ? 'Product and variants created successfully'
          : 'Product created successfully',
      )

      // ------------------------------------------------------
      // RESET
      // ------------------------------------------------------

      setFormData({
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

      setVariants([])

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]')

      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error) {
      console.error('CREATE PRODUCT ERROR:', error)

      errorAlert(error.response?.data?.message || error.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // FIELD STYLES
  // ==========================================================

  const inputStyle = {
    minHeight: '46px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
  }

  const labelStyle = {
    fontWeight: '600',
    color: '#374151',
    fontSize: '13px',
  }

  const cardStyle = {
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
    border: '0',
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div
        className="mb-4"
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          borderRadius: '18px',
          padding: '28px 30px',
          color: '#fff',
          boxShadow: '0 8px 30px rgba(17, 24, 39, 0.12)',
        }}
      >
        <CRow className="align-items-center">
          <CCol md={8}>
            <div
              className="mb-2"
              style={{
                color: '#e8bd35',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Inventory Management
            </div>

            <h2
              className="mb-2"
              style={{
                fontWeight: '700',
                letterSpacing: '-0.5px',
              }}
            >
              Add New Product
            </h2>

            <p
              className="mb-0"
              style={{
                color: '#cbd5e1',
                fontSize: '14px',
              }}
            >
              Create a product with category, brand, pricing, inventory and optional product
              variants.
            </p>
          </CCol>

          <CCol md={4} className="text-md-end mt-3 mt-md-0">
            <div
              className="d-inline-flex align-items-center justify-content-center"
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '16px',
                background: 'rgba(232, 189, 53, 0.12)',
                border: '1px solid rgba(232, 189, 53, 0.3)',
                color: '#e8bd35',
                fontSize: '25px',
                fontWeight: '700',
              }}
            >
              +
            </div>
          </CCol>
        </CRow>
      </div>

      <CForm onSubmit={handleSubmit}>
        <CRow>
          {/* ==================================================
              LEFT COLUMN
          =================================================== */}

          <CCol lg={8}>
            {/* =================================================
                PRODUCT INFORMATION
            ================================================== */}

            <CCard className="mb-4" style={cardStyle}>
              <CCardHeader
                className="border-0"
                style={{
                  background: '#fff',
                  padding: '20px 24px 14px',
                }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="me-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '11px',
                      background: '#fff8dc',
                      color: '#c9a227',
                      fontWeight: '700',
                    }}
                  >
                    01
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#111827',
                      }}
                    >
                      Product Information
                    </div>

                    <small
                      style={{
                        color: '#6b7280',
                      }}
                    >
                      Basic identification, category and brand
                    </small>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '8px 24px 26px',
                }}
              >
                <CRow>
                  {/* PRODUCT NAME */}

                  <CCol md={6} className="mb-3">
                    <CFormLabel style={labelStyle}>Product Name</CFormLabel>

                    <CFormInput
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Men's Premium Kaftan"
                      required
                      style={inputStyle}
                    />
                  </CCol>

                  {/* SKU */}

                  <CCol md={3} className="mb-3">
                    <CFormLabel style={labelStyle}>SKU</CFormLabel>

                    <CFormInput
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="SKU"
                      style={inputStyle}
                    />
                  </CCol>

                  {/* BARCODE */}

                  <CCol md={3} className="mb-3">
                    <CFormLabel style={labelStyle}>Barcode</CFormLabel>

                    <CFormInput
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      placeholder="Barcode"
                      style={inputStyle}
                    />
                  </CCol>

                  {/* CATEGORY */}

                  <CCol md={6} className="mb-3">
                    <CFormLabel style={labelStyle}>Category</CFormLabel>

                    <CFormSelect
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
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

                  {/* BRAND */}

                  <CCol md={6} className="mb-3">
                    <CFormLabel style={labelStyle}>Brand</CFormLabel>

                    <CFormSelect
                      name="brandId"
                      value={formData.brandId}
                      onChange={handleChange}
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

            <CCard className="mb-4" style={cardStyle}>
              <CCardHeader
                className="border-0"
                style={{
                  background: '#fff',
                  padding: '20px 24px 14px',
                }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="me-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '11px',
                      background: '#fff8dc',
                      color: '#c9a227',
                      fontWeight: '700',
                    }}
                  >
                    02
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#111827',
                      }}
                    >
                      Pricing
                    </div>

                    <small
                      style={{
                        color: '#6b7280',
                      }}
                    >
                      Configure cost and selling price
                    </small>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '8px 24px 26px',
                }}
              >
                <CRow>
                  <CCol md={6} className="mb-3">
                    <CFormLabel style={labelStyle}>Cost Price</CFormLabel>

                    <CInputGroup>
                      <CInputGroupText>₦</CInputGroupText>

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

                  <CCol md={6} className="mb-3">
                    <CFormLabel style={labelStyle}>Selling Price</CFormLabel>

                    <CInputGroup>
                      <CInputGroupText>₦</CInputGroupText>

                      <CFormInput
                        type="number"
                        min="0"
                        step="0.01"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        style={{
                          ...inputStyle,
                          borderRadius: '0 10px 10px 0',
                        }}
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* PROFIT */}

                <CAlert
                  color="success"
                  className="mt-2 mb-0 border-0"
                  style={{
                    borderRadius: '12px',
                    background: '#f0fdf4',
                    color: '#166534',
                  }}
                >
                  <CRow className="align-items-center">
                    <CCol sm={6}>
                      <small
                        className="d-block"
                        style={{
                          color: '#65a30d',
                          fontWeight: '600',
                        }}
                      >
                        ESTIMATED PROFIT
                      </small>

                      <strong
                        style={{
                          fontSize: '20px',
                          color: '#166534',
                        }}
                      >
                        ₦{productProfit.toLocaleString()}
                      </strong>
                    </CCol>

                    <CCol sm={6} className="mt-2 mt-sm-0 text-sm-end">
                      <small
                        className="d-block"
                        style={{
                          color: '#65a30d',
                          fontWeight: '600',
                        }}
                      >
                        PROFIT MARGIN
                      </small>

                      <strong
                        style={{
                          fontSize: '20px',
                          color: '#166534',
                        }}
                      >
                        {productProfitMargin}%
                      </strong>
                    </CCol>
                  </CRow>
                </CAlert>
              </CCardBody>
            </CCard>

            {/* =================================================
                INVENTORY
            ================================================== */}

            <CCard className="mb-4" style={cardStyle}>
              <CCardHeader
                className="border-0"
                style={{
                  background: '#fff',
                  padding: '20px 24px 14px',
                }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="me-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '11px',
                      background: '#fff8dc',
                      color: '#c9a227',
                      fontWeight: '700',
                    }}
                  >
                    03
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#111827',
                      }}
                    >
                      Inventory
                    </div>

                    <small
                      style={{
                        color: '#6b7280',
                      }}
                    >
                      Configure initial stock
                    </small>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '8px 24px 26px',
                }}
              >
                <CRow>
                  <CCol md={6} className="mb-3 mb-md-0">
                    <CFormLabel style={labelStyle}>Initial Quantity</CFormLabel>

                    <CFormInput
                      type="number"
                      min="0"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      disabled={variants.length > 0}
                      placeholder={variants.length > 0 ? 'Managed by variants' : '0'}
                      style={inputStyle}
                    />

                    {variants.length > 0 && (
                      <small className="text-muted">
                        Product stock will automatically start with the total quantity of all
                        variants. You can still adjust stock later from Stock Management.
                      </small>
                    )}
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel style={labelStyle}>Reorder Level</CFormLabel>

                    <CFormInput
                      type="number"
                      min="0"
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      placeholder="5"
                      style={inputStyle}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* =================================================
                VARIANTS
            ================================================== */}

            <CCard className="mb-4" style={cardStyle}>
              <CCardHeader
                className="border-0"
                style={{
                  background: '#fff',
                  padding: '20px 24px 14px',
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div
                      className="me-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '11px',
                        background: '#fff8dc',
                        color: '#c9a227',
                        fontWeight: '700',
                      }}
                    >
                      04
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#111827',
                        }}
                      >
                        Product Variants
                      </div>

                      <small
                        style={{
                          color: '#6b7280',
                        }}
                      >
                        Sizes, colors and variant-specific stock
                      </small>
                    </div>
                  </div>

                  <CButton
                    type="button"
                    onClick={addVariant}
                    style={{
                      background: '#111827',
                      color: '#e8bd35',
                      border: '0',
                      borderRadius: '9px',
                      fontWeight: '700',
                    }}
                  >
                    + Add Variant
                  </CButton>
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '12px 24px 26px',
                }}
              >
                {variants.length === 0 ? (
                  <div
                    className="text-center"
                    style={{
                      padding: '35px 20px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px dashed #d1d5db',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '30px',
                        color: '#c9a227',
                        marginBottom: '10px',
                      }}
                    >
                      +
                    </div>

                    <div
                      style={{
                        fontWeight: '600',
                        color: '#374151',
                      }}
                    >
                      No variants added
                    </div>

                    <small className="text-muted">
                      Use variants when the product has different sizes, colors or configurations.
                    </small>
                  </div>
                ) : (
                  variants.map((variant, index) => (
                    <div
                      key={index}
                      className="mb-4"
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '14px',
                        padding: '18px',
                        background: '#fafafa',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <CBadge
                            style={{
                              background: '#111827',
                              color: '#e8bd35',
                            }}
                          >
                            VARIANT {index + 1}
                          </CBadge>
                        </div>

                        <CButton
                          type="button"
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(index)}
                        >
                          Remove
                        </CButton>
                      </div>

                      <CRow>
                        {/* SIZE */}

                        <CCol md={3} className="mb-3">
                          <CFormLabel style={labelStyle}>Size</CFormLabel>

                          <CFormInput
                            value={variant.size}
                            onChange={(e) => updateVariant(index, 'size', e.target.value)}
                            placeholder="e.g. XL"
                            style={inputStyle}
                          />
                        </CCol>

                        {/* COLOR */}

                        <CCol md={3} className="mb-3">
                          <CFormLabel style={labelStyle}>Color</CFormLabel>

                          <CFormInput
                            value={variant.color}
                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                            placeholder="e.g. Black"
                            style={inputStyle}
                          />
                        </CCol>

                        {/* SKU */}

                        <CCol md={3} className="mb-3">
                          <CFormLabel style={labelStyle}>Variant SKU</CFormLabel>

                          <CFormInput
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            placeholder="Optional"
                            style={inputStyle}
                          />
                        </CCol>

                        {/* BARCODE */}

                        <CCol md={3} className="mb-3">
                          <CFormLabel style={labelStyle}>Variant Barcode</CFormLabel>

                          <CFormInput
                            value={variant.barcode}
                            onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                            placeholder="Optional"
                            style={inputStyle}
                          />
                        </CCol>

                        {/* COST */}

                        <CCol md={3} className="mb-3">
                          <CFormLabel style={labelStyle}>Cost Price</CFormLabel>

                          <CInputGroup>
                            <CInputGroupText>₦</CInputGroupText>

                            <CFormInput
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.costPrice}
                              onChange={(e) => updateVariant(index, 'costPrice', e.target.value)}
                              placeholder="0"
                              style={{
                                ...inputStyle,
                                borderRadius: '0 10px 10px 0',
                              }}
                            />
                          </CInputGroup>
                        </CCol>

                        {/* SELLING */}

                        <CCol md={3} className="mb-3">
                          <CFormLabel style={labelStyle}>Selling Price</CFormLabel>

                          <CInputGroup>
                            <CInputGroupText>₦</CInputGroupText>

                            <CFormInput
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.sellingPrice}
                              onChange={(e) => updateVariant(index, 'sellingPrice', e.target.value)}
                              placeholder="0"
                              style={{
                                ...inputStyle,
                                borderRadius: '0 10px 10px 0',
                              }}
                            />
                          </CInputGroup>
                        </CCol>

                        {/* QUANTITY */}

                        <CCol md={3} className="mb-3">
                          <CFormLabel style={labelStyle}>Quantity</CFormLabel>

                          <CFormInput
                            type="number"
                            min="0"
                            value={variant.quantity}
                            onChange={(e) => updateVariant(index, 'quantity', e.target.value)}
                            placeholder="0"
                            style={inputStyle}
                          />
                        </CCol>

                        {/* REORDER */}

                        <CCol md={3} className="mb-3">
                          <CFormLabel style={labelStyle}>Reorder Level</CFormLabel>

                          <CFormInput
                            type="number"
                            min="0"
                            value={variant.reorderLevel}
                            onChange={(e) => updateVariant(index, 'reorderLevel', e.target.value)}
                            placeholder="5"
                            style={inputStyle}
                          />
                        </CCol>

                        {/* STATUS */}

                        <CCol md={4} className="mb-3">
                          <CFormLabel style={labelStyle}>Variant Status</CFormLabel>

                          <CFormSelect
                            value={variant.status}
                            onChange={(e) => updateVariant(index, 'status', e.target.value)}
                            style={inputStyle}
                          >
                            <option value="active">Active</option>

                            <option value="inactive">Inactive</option>
                          </CFormSelect>
                        </CCol>
                      </CRow>
                    </div>
                  ))
                )}

                {variants.length > 0 && (
                  <CAlert
                    className="border-0 mb-0"
                    style={{
                      background: '#fff8dc',
                      color: '#7c5b00',
                      borderRadius: '12px',
                    }}
                  >
                    <strong>{variantSummary.count}</strong> variant
                    {variantSummary.count !== 1 ? 's' : ''} configured with{' '}
                    <strong>{variantSummary.totalQuantity}</strong> total units.
                  </CAlert>
                )}
              </CCardBody>
            </CCard>

            {/* =================================================
                PRODUCT IMAGE
            ================================================== */}

            <CCard className="mb-4" style={cardStyle}>
              <CCardHeader
                className="border-0"
                style={{
                  background: '#fff',
                  padding: '20px 24px 14px',
                }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="me-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '11px',
                      background: '#fff8dc',
                      color: '#c9a227',
                      fontWeight: '700',
                    }}
                  >
                    05
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#111827',
                      }}
                    >
                      Product Image
                    </div>

                    <small
                      style={{
                        color: '#6b7280',
                      }}
                    >
                      Upload a product image
                    </small>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '8px 24px 26px',
                }}
              >
                <div
                  style={{
                    border: '1.5px dashed #d1d5db',
                    borderRadius: '14px',
                    padding: '28px',
                    textAlign: 'center',
                    background: '#fafafa',
                  }}
                >
                  <div
                    className="mb-3"
                    style={{
                      fontSize: '30px',
                      color: '#c9a227',
                    }}
                  >
                    +
                  </div>

                  <div
                    className="mb-1"
                    style={{
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    Upload product image
                  </div>

                  <small
                    className="d-block mb-3"
                    style={{
                      color: '#9ca3af',
                    }}
                  >
                    PNG, JPG or JPEG
                  </small>

                  <CFormInput
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{
                      maxWidth: '420px',
                      margin: '0 auto',
                      borderRadius: '10px',
                    }}
                  />

                  {formData.image && (
                    <small
                      className="d-block mt-3"
                      style={{
                        color: '#166534',
                        fontWeight: '600',
                      }}
                    >
                      ✓ {formData.image.name}
                    </small>
                  )}
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* ==================================================
              RIGHT COLUMN
          =================================================== */}

          <CCol lg={4}>
            <CCard
              className="mb-4 border-0"
              style={{
                ...cardStyle,
                position: 'sticky',
                top: '20px',
              }}
            >
              <CCardHeader
                className="border-0"
                style={{
                  background: '#111827',
                  color: '#fff',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#e8bd35',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Product Setup
                </div>

                <div
                  className="mt-1"
                  style={{
                    fontSize: '18px',
                    fontWeight: '700',
                  }}
                >
                  Final Configuration
                </div>
              </CCardHeader>

              <CCardBody
                style={{
                  padding: '22px',
                }}
              >
                {/* STATUS */}

                <div className="mb-4">
                  <CFormLabel style={labelStyle}>Product Status</CFormLabel>

                  <CFormSelect
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="active">Active</option>

                    <option value="inactive">Inactive</option>
                  </CFormSelect>
                </div>

                {/* SUMMARY */}

                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '13px',
                    padding: '16px',
                  }}
                >
                  <div className="d-flex justify-content-between mb-3">
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      Product
                    </span>

                    <strong
                      style={{
                        color: '#111827',
                        fontSize: '13px',
                        textAlign: 'right',
                        maxWidth: '170px',
                      }}
                    >
                      {formData.name || 'Not specified'}
                    </strong>
                  </div>

                  <div className="d-flex justify-content-between mb-3">
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      Category
                    </span>

                    <strong
                      style={{
                        color: '#111827',
                        fontSize: '13px',
                      }}
                    >
                      {categories.find((item) => String(item.id) === String(formData.categoryId))
                        ?.name || 'Not selected'}
                    </strong>
                  </div>

                  <div className="d-flex justify-content-between mb-3">
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      Brand
                    </span>

                    <strong
                      style={{
                        color: '#111827',
                        fontSize: '13px',
                      }}
                    >
                      {brands.find((item) => String(item.id) === String(formData.brandId))?.name ||
                        'Not selected'}
                    </strong>
                  </div>

                  <div className="d-flex justify-content-between mb-3">
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      Quantity
                    </span>

                    <strong
                      style={{
                        color: '#111827',
                        fontSize: '13px',
                      }}
                    >
                      {variants.length > 0
                        ? variantSummary.totalQuantity
                        : formData.quantity || '0'}
                    </strong>
                  </div>

                  <div className="d-flex justify-content-between mb-3">
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      Variants
                    </span>

                    <strong
                      style={{
                        color: '#111827',
                        fontSize: '13px',
                      }}
                    >
                      {variants.length}
                    </strong>
                  </div>

                  <div className="d-flex justify-content-between mb-3">
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      Selling Price
                    </span>

                    <strong
                      style={{
                        color: '#111827',
                        fontSize: '13px',
                      }}
                    >
                      ₦{Number(formData.sellingPrice || 0).toLocaleString()}
                    </strong>
                  </div>

                  <div
                    style={{
                      height: '1px',
                      background: '#e5e7eb',
                      margin: '14px 0',
                    }}
                  />

                  <div className="d-flex justify-content-between">
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      Estimated Profit
                    </span>

                    <strong
                      style={{
                        color: '#15803d',
                        fontSize: '15px',
                      }}
                    >
                      ₦{productProfit.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* SAVE */}

                <CButton
                  type="submit"
                  disabled={loading}
                  className="w-100 mt-4 border-0"
                  style={{
                    minHeight: '50px',
                    borderRadius: '11px',
                    background: 'linear-gradient(135deg, #e8bd35 0%, #c9a227 100%)',
                    color: '#111827',
                    fontWeight: '700',
                    boxShadow: '0 5px 15px rgba(201, 162, 39, 0.25)',
                  }}
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Saving Product...
                    </>
                  ) : (
                    <>Save Product</>
                  )}
                </CButton>

                <small
                  className="d-block text-center mt-3"
                  style={{
                    color: '#9ca3af',
                    lineHeight: '1.5',
                  }}
                >
                  The product will be added to your inventory after saving.
                </small>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CForm>
    </>
  )
}

export default AddProduct
