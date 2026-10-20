import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import {
  cilArrowLeft,
  cilCheckAlt,
  cilCloudUpload,
  cilImage,
  cilPlus,
  cilReload,
  cilSave,
  cilTrash,
  cilX,
} from '@coreui/icons'

import CIcon from '@coreui/icons-react'

import { successAlert, errorAlert } from '../utils/alerts'

const API_URL = import.meta.env.VITE_BACKEND_URL

const api = (path) => `${API_URL}${path}`

const money = (value) =>
  Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const getToken = () => localStorage.getItem('token')

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
})

const emptyVariant = {
  id: null,
  size: '',
  color: '',
  sku: '',
  barcode: '',
  costPrice: '',
  sellingPrice: '',
  quantity: 0,
  reorderLevel: 5,
  image: null,
  status: 'active',
}

const EditProduct = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stockSaving, setStockSaving] = useState(false)
  const [variantSaving, setVariantSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])

  const [product, setProduct] = useState(null)

  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const imageInputRef = React.useRef(null)
  const MAX_IMAGES = 8
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    costPrice: '',
    sellingPrice: '',
    reorderLevel: 5,
    status: 'active',
  })

  const [stockForm, setStockForm] = useState({
    quantity: '',
    reason: '',
    notes: '',
  })

  const [variantForm, setVariantForm] = useState(emptyVariant)
  const [editingVariantId, setEditingVariantId] = useState(null)

  /* =========================================================
     LOAD PRODUCT
  ========================================================= */

  const getProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await axios.get(api(`api/v1/products/${id}`), authConfig())

      const data = response?.data?.product || response?.data?.data || response?.data

      if (!data) {
        throw new Error('Product data was not returned.')
      }

      setProduct(data)

      setFormData({
        name: data.name || '',
        sku: data.sku || '',
        barcode: data.barcode || '',
        categoryId: data.categoryId || '',
        brandId: data.brandId || '',
        costPrice: data.costPrice ?? '',
        sellingPrice: data.sellingPrice ?? '',
        reorderLevel: data.reorderLevel ?? 5,
        status: data.status || 'active',
      })

      const rawImages = data.images ?? data.productImages ?? data.image ?? data.imageUrl ?? data.image_url ?? []
      const imageList = (Array.isArray(rawImages) ? rawImages : rawImages ? [rawImages] : [])
        .map((item) => typeof item === 'string' ? item : item?.url || item?.imageUrl || item?.image_url || item?.image)
        .filter(Boolean)
        .slice(0, MAX_IMAGES)

      setExistingImages(imageList)
      setNewImages([])
      setImagePreviews(imageList.map((url) => ({ url, source: 'existing' })))
    } catch (err) {
      console.error('GET PRODUCT ERROR:', err)

      const message = err?.response?.data?.message || err?.message || 'Failed to load product.'

      setError(message)
      errorAlert(message)
    } finally {
      setLoading(false)
    }
  }, [id])

  /* =========================================================
     LOAD CATEGORIES
  ========================================================= */

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(api('api/v1/categories'), authConfig())

      const data = response?.data

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.data)
            ? data.data
            : []

      setCategories(list)
    } catch (err) {
      console.error('CATEGORY ERROR:', err)
    }
  }, [])

  /* =========================================================
     LOAD BRANDS
  ========================================================= */

  const fetchBrands = useCallback(async () => {
    try {
      const response = await axios.get(api('api/v1/brands'), authConfig())

      const data = response?.data

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.brands)
          ? data.brands
          : Array.isArray(data?.data)
            ? data.data
            : []

      setBrands(list)
    } catch (err) {
      console.error('BRAND ERROR:', err)
    }
  }, [])

  useEffect(() => {
    getProduct()
    fetchCategories()
    fetchBrands()
  }, [getProduct, fetchCategories, fetchBrands])

  /* =========================================================
     PRODUCT HELPERS
  ========================================================= */

  const variants = useMemo(() => {
    if (!product) return []

    return Array.isArray(product?.Variants)
      ? product.Variants
      : Array.isArray(product?.variants)
        ? product.variants
        : []
  }, [product])

  const currentQuantity = Number(product?.quantity || 0)

  const totalVariantStock = useMemo(
    () => variants.reduce((sum, variant) => sum + Number(variant?.quantity || 0), 0),
    [variants],
  )

  const hasVariants = variants.length > 0

  const profit = useMemo(() => {
    return Number(formData.sellingPrice || 0) - Number(formData.costPrice || 0)
  }, [formData.costPrice, formData.sellingPrice])

  const margin = useMemo(() => {
    const selling = Number(formData.sellingPrice || 0)

    if (!selling) return 0

    return (profit / selling) * 100
  }, [profit, formData.sellingPrice])

  /* =========================================================
     FORM
  ========================================================= */

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  /* =========================================================
     IMAGE
  ========================================================= */

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (!selectedFiles.length) return

    const validFiles = []
    for (const file of selectedFiles) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        errorAlert(`${file.name}: use JPG, PNG or WEBP images.`)
        continue
      }
      if (file.size > MAX_IMAGE_SIZE) {
        errorAlert(`${file.name}: image must not exceed 5MB.`)
        continue
      }
      validFiles.push(file)
    }

    const availableSlots = MAX_IMAGES - existingImages.length - newImages.length
    if (availableSlots <= 0) {
      errorAlert(`You can upload a maximum of ${MAX_IMAGES} product images.`)
      event.target.value = ''
      return
    }
    if (validFiles.length > availableSlots) {
      errorAlert(`Only ${availableSlots} more image(s) can be added. Maximum: ${MAX_IMAGES}.`)
    }

    const accepted = validFiles.slice(0, availableSlots)
    setNewImages((previous) => [...previous, ...accepted])
    setImagePreviews((previous) => [
      ...previous,
      ...accepted.map((file) => ({ url: URL.createObjectURL(file), name: file.name, size: file.size, source: 'new', file })),
    ])
    event.target.value = ''
  }

  const removeImage = (index) => {
    const target = imagePreviews[index]
    if (!target) return
    if (target.source === 'new') {
      setNewImages((previous) => previous.filter((file) => file !== target.file))
      if (target.url?.startsWith('blob:')) URL.revokeObjectURL(target.url)
    } else {
      setExistingImages((previous) => previous.filter((url) => url !== target.url))
    }
    setImagePreviews((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
  }

  const clearNewImages = () => {
    imagePreviews.filter((item) => item.source === 'new').forEach((item) => {
      if (item.url?.startsWith('blob:')) URL.revokeObjectURL(item.url)
    })
    setNewImages([])
    setImagePreviews((previous) => previous.filter((item) => item.source === 'existing'))
  }

  /* =========================================================
     SAVE PRODUCT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const name = formData.name.trim()

    if (!name) {
      setError('Product name is required.')
      return
    }

    if (Number(formData.sellingPrice || 0) < 0) {
      setError('Selling price cannot be negative.')
      return
    }

    if (Number(formData.costPrice || 0) < 0) {
      setError('Cost price cannot be negative.')
      return
    }

    try {
      setSaving(true)

      const payload = new FormData()

      payload.append('name', name)
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

      payload.append('reorderLevel', Number(formData.reorderLevel || 0))

      payload.append('status', formData.status)

      /*
       * IMPORTANT:
       * quantity is intentionally NOT sent here.
       *
       * Stock changes must go through the stock adjustment
       * endpoint so StockMovements remains accurate.
       */

      // New files are sent as repeated `images` fields. The API should preserve
      // existing image URLs supplied below and save the uploaded files.
      newImages.forEach((file) => payload.append('images', file))
      payload.append('existingImages', JSON.stringify(existingImages))

      const response = await axios.put(api(`api/v1/products/${id}`), payload, {
        ...authConfig(),
        headers: {
          ...authConfig().headers,
          'Content-Type': 'multipart/form-data',
        },
      })

      const updated = response?.data?.product || response?.data?.data || response?.data

      if (updated && typeof updated === 'object') {
        setProduct((previous) => ({
          ...previous,
          ...updated,
        }))
      }

      setSuccess('Product updated successfully.')
      successAlert('Product updated successfully.')

      await getProduct()
    } catch (err) {
      console.error('UPDATE PRODUCT ERROR:', err)

      const message = err?.response?.data?.message || 'Failed to update product.'

      setError(message)
      errorAlert(message)
    } finally {
      setSaving(false)
    }
  }

  /* =========================================================
     STOCK ADJUSTMENT
  ========================================================= */

  const handleStockAdjustment = async (event) => {
    event.preventDefault()

    const quantity = Number(stockForm.quantity)

    if (!Number.isFinite(quantity) || quantity === 0) {
      errorAlert('Enter a valid stock quantity.')
      return
    }

    if (!stockForm.reason.trim()) {
      errorAlert('Please enter a reason for the stock adjustment.')
      return
    }

    const newQuantity = currentQuantity + quantity

    if (newQuantity < 0) {
      errorAlert(`Stock cannot go below zero. Current stock is ${currentQuantity}.`)
      return
    }

    try {
      setStockSaving(true)
      setError('')

      /*
       * Backend expects:
       *
       * {
       *   quantity: 25,
       *   reason: "Physical stock count",
       *   notes: "..."
       * }
       *
       * Positive = add
       * Negative = remove
       */

      await axios.patch(
        api(`/api/v1/stock/${id}`),
        {
          quantity,
          reason: stockForm.reason.trim(),
          notes: stockForm.notes.trim() || null,
        },
        authConfig(),
      )

      setStockForm({
        quantity: '',
        reason: '',
        notes: '',
      })

      successAlert('Stock adjusted successfully.')

      await getProduct()
    } catch (err) {
      console.error('STOCK ADJUSTMENT ERROR:', err)

      const message = err?.response?.data?.message || 'Failed to adjust stock.'

      setError(message)
      errorAlert(message)
    } finally {
      setStockSaving(false)
    }
  }

  /* =========================================================
     VARIANT FORM
  ========================================================= */

  const resetVariantForm = () => {
    setVariantForm({ ...emptyVariant })
    setEditingVariantId(null)
  }

  const startEditVariant = (variant) => {
    setEditingVariantId(variant.id)

    setVariantForm({
      id: variant.id,
      size: variant.size || '',
      color: variant.color || '',
      sku: variant.sku || '',
      barcode: variant.barcode || '',
      costPrice: variant.costPrice ?? '',
      sellingPrice: variant.sellingPrice ?? '',
      quantity: Number(variant.quantity || 0),
      reorderLevel: Number(variant.reorderLevel || 5),
      image: null,
      status: variant.status || 'active',
    })

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    })
  }

  const handleVariantChange = (field, value) => {
    setVariantForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  /* =========================================================
     ADD / UPDATE VARIANT
  ========================================================= */

  const saveVariant = async (event) => {
    event.preventDefault()

    if (!variantForm.size.trim() && !variantForm.color.trim()) {
      errorAlert('Enter at least a size or color for the variant.')
      return
    }

    if (Number(variantForm.sellingPrice || 0) < 0 || Number(variantForm.costPrice || 0) < 0) {
      errorAlert('Prices cannot be negative.')
      return
    }

    try {
      setVariantSaving(true)

      const payload = {
        size: variantForm.size.trim() || null,
        color: variantForm.color.trim() || null,
        sku: variantForm.sku.trim() || null,
        barcode: variantForm.barcode.trim() || null,
        costPrice: Number(variantForm.costPrice || 0),
        sellingPrice: Number(variantForm.sellingPrice || 0),
        reorderLevel: Number(variantForm.reorderLevel || 0),
        status: variantForm.status,
      }

      /*
       * We deliberately DO NOT send quantity when editing
       * a variant.
       *
       * Variant stock should eventually have its own
       * StockMovement workflow.
       */

      if (editingVariantId) {
        await axios.put(api(`api/v1/products/variants/${editingVariantId}`), payload, authConfig())

        successAlert('Variant updated successfully.')
      } else {
        await axios.post(api(`api/v1/products/${id}/variants`), payload, authConfig())

        successAlert('Variant added successfully.')
      }

      resetVariantForm()

      await getProduct()
    } catch (err) {
      console.error('VARIANT ERROR:', err)

      const message = err?.response?.data?.message || 'Unable to save variant.'

      setError(message)
      errorAlert(message)
    } finally {
      setVariantSaving(false)
    }
  }

  /* =========================================================
     DELETE VARIANT
  ========================================================= */

  const deleteVariant = async (variantId) => {
    const confirmed = window.confirm(
      'Delete this variant? This action should only be used when the variant is no longer required.',
    )

    if (!confirmed) return

    try {
      await axios.delete(api(`api/v1/products/${id}/variants/${variantId}`), authConfig())

      successAlert('Variant deleted successfully.')

      await getProduct()
    } catch (err) {
      console.error('DELETE VARIANT ERROR:', err)

      errorAlert(err?.response?.data?.message || 'Failed to delete variant.')
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <CSpinner />
          <div className="mt-3 text-body-secondary">Loading product...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <CContainer className="py-4">
        <CAlert color="danger">Product could not be loaded.</CAlert>

        <CButton color="dark" onClick={() => navigate('/products')}>
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back to Products
        </CButton>
      </CContainer>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #090909 0%, #111111 45%, #191919 100%)',
        color: '#f5f5f5',
        paddingBottom: 50,
      }}
    >
      <CContainer fluid className="px-3 px-lg-4 py-4">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/products')}
              style={{
                border: 0,
                background: 'transparent',
                color: '#d4af37',
                padding: 0,
                marginBottom: 10,
              }}
            >
              <CIcon icon={cilArrowLeft} className="me-2" />
              Back to Products
            </button>

            <h2
              className="mb-1"
              style={{
                fontWeight: 800,
                letterSpacing: 0.4,
              }}
            >
              Edit Product
            </h2>

            <div style={{ color: '#999' }}>
              Update product information, pricing, stock and variants.
            </div>
          </div>

          <CBadge
            color={formData.status === 'active' ? 'success' : 'secondary'}
            className="px-3 py-2"
            style={{
              fontSize: 13,
              borderRadius: 20,
            }}
          >
            {formData.status === 'active' ? 'ACTIVE PRODUCT' : 'INACTIVE PRODUCT'}
          </CBadge>
        </div>

        {error && (
          <CAlert color="danger" dismissible onClose={() => setError('')}>
            {error}
          </CAlert>
        )}

        {success && (
          <CAlert color="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </CAlert>
        )}

        <CRow className="g-4">
          {/* ===================================================
              LEFT
          =================================================== */}

          <CCol lg={8}>
            {/* PRODUCT INFORMATION */}

            <CCard className="border-0 shadow-lg mb-4">
              <CCardHeader
                style={{
                  background: '#151515',
                  color: '#d4af37',
                  borderBottom: '1px solid #292929',
                  fontWeight: 700,
                }}
              >
                Product Information
              </CCardHeader>

              <CCardBody
                style={{
                  background: '#111',
                  color: '#ffffff',
                }}
              >
                <CForm onSubmit={handleSubmit}>
                  <CRow className="g-3">
                    <CCol md={12}>
                      <CFormLabel>Product Name *</CFormLabel>

                      <CFormInput
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="e.g. Premium Leather Handbag"
                        required
                      />
                    </CCol>

                    <CCol md={6}>
                      <CFormLabel>SKU</CFormLabel>

                      <CFormInput
                        value={formData.sku}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        placeholder="ONI-HBG-001"
                      />
                    </CCol>

                    <CCol md={6}>
                      <CFormLabel>Barcode</CFormLabel>

                      <CFormInput
                        value={formData.barcode}
                        onChange={(e) => handleChange('barcode', e.target.value)}
                        placeholder="Scan or enter barcode"
                      />
                    </CCol>

                    <CCol md={6}>
                      <CFormLabel>Category</CFormLabel>

                      <CFormSelect
                        value={formData.categoryId}
                        onChange={(e) => handleChange('categoryId', e.target.value)}
                      >
                        <option value="">Select category</option>

                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>

                    <CCol md={6}>
                      <CFormLabel>Brand</CFormLabel>

                      <CFormSelect
                        value={formData.brandId}
                        onChange={(e) => handleChange('brandId', e.target.value)}
                      >
                        <option value="">Select brand</option>

                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>

                    <CCol md={6}>
                      <CFormLabel>Status</CFormLabel>

                      <CFormSelect
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                      >
                        <option value="active">Active</option>

                        <option value="inactive">Inactive</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  {/* PRICING */}

                  <div className="mt-4 pt-4 border-top border-secondary">
                    <h5 className="mb-3">
                      <span style={{ color: '#d4af37' }}>Pricing</span>
                    </h5>

                    <CRow className="g-3">
                      <CCol md={6}>
                        <CFormLabel>Cost Price</CFormLabel>

                        <CInputGroup>
                          <CInputGroupText>₦</CInputGroupText>

                          <CFormInput
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.costPrice}
                            onChange={(e) => handleChange('costPrice', e.target.value)}
                          />
                        </CInputGroup>
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel>Selling Price</CFormLabel>

                        <CInputGroup>
                          <CInputGroupText>₦</CInputGroupText>

                          <CFormInput
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.sellingPrice}
                            onChange={(e) => handleChange('sellingPrice', e.target.value)}
                          />
                        </CInputGroup>
                      </CCol>

                      <CCol md={6}>
                        <div
                          className="p-3 rounded"
                          style={{
                            background: '#181818',
                            border: '1px solid #2d2d2d',
                            color: '#ffffff',
                          }}
                        >
                          <small className="text-body-secondary">Expected Profit</small>

                          <div className="fs-4 fw-bold" style={{ color: '#d4af37' }}>
                            ₦{money(profit)}
                          </div>
                        </div>
                      </CCol>

                      <CCol md={6}>
                        <div
                          className="p-3 rounded"
                          style={{
                            background: '#181818',
                            border: '1px solid #2d2d2d',
                            color: '#ffffff',
                          }}
                        >
                          <small className="text-body-secondary">Profit Margin</small>

                          <div className="fs-4 fw-bold">{margin.toFixed(1)}%</div>
                        </div>
                      </CCol>
                    </CRow>
                  </div>

                  {/* SAVE */}

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <CButton
                      type="button"
                      color="secondary"
                      variant="outline"
                      onClick={() => navigate('/products')}
                    >
                      <CIcon icon={cilX} className="me-2" />
                      Cancel
                    </CButton>

                    <CButton
                      type="submit"
                      style={{
                        background: 'linear-gradient(135deg,#d4af37,#f3d77a)',
                        color: '#111',
                        border: 0,
                        fontWeight: 700,
                      }}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CIcon icon={cilSave} className="me-2" />
                          Save Product
                        </>
                      )}
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>

            {/* =================================================
                INVENTORY
            ================================================= */}

            <CCard className="border-0 shadow-lg mb-4">
              <CCardHeader
                style={{
                  background: '#151515',
                  color: '#d4af37',
                  borderBottom: '1px solid #292929',
                  fontWeight: 700,
                }}
              >
                Inventory Management
              </CCardHeader>

              <CCardBody style={{ background: '#111', color: '#ffffff', }}>
                <CRow className="g-3 mb-4">
                  <CCol md={4}>
                    <div className="p-3 rounded bg-dark">
                      <small className="text-body-secondary">Current Stock</small>

                      <div className="fs-3 fw-bold">{currentQuantity}</div>
                    </div>
                  </CCol>

                  <CCol md={4}>
                    <div className="p-3 rounded bg-dark">
                      <small className="text-body-secondary">Reorder Level</small>

                      <div className="fs-3 fw-bold">{Number(formData.reorderLevel || 0)}</div>
                    </div>
                  </CCol>

                  <CCol md={4}>
                    <div className="p-3 rounded bg-dark">
                      <small className="text-body-secondary">Stock Status</small>

                      <div className="mt-2">
                        {currentQuantity <= 0 ? (
                          <CBadge color="danger">OUT OF STOCK</CBadge>
                        ) : currentQuantity <= Number(formData.reorderLevel || 0) ? (
                          <CBadge color="warning">LOW STOCK</CBadge>
                        ) : (
                          <CBadge color="success">IN STOCK</CBadge>
                        )}
                      </div>
                    </div>
                  </CCol>
                </CRow>

                <div
                  className="p-4 rounded"
                  style={{
                    background: '#181818',
                    border: '1px solid #303030',
                  }}
                >
                  <h6 className="fw-bold mb-1">Adjust Stock</h6>

                  <p className="text-body-secondary small mb-4">
                    Positive quantity adds stock. Negative quantity removes stock. Every adjustment
                    is recorded in stock history.
                  </p>

                  <CForm onSubmit={handleStockAdjustment}>
                    <CRow className="g-3">
                      <CCol md={4}>
                        <CFormLabel>Quantity Adjustment</CFormLabel>

                        <CFormInput
                          type="number"
                          step="1"
                          value={stockForm.quantity}
                          onChange={(e) =>
                            setStockForm((previous) => ({
                              ...previous,
                              quantity: e.target.value,
                            }))
                          }
                          placeholder="+10 or -5"
                        />
                      </CCol>

                      <CCol md={8}>
                        <CFormLabel>Reason *</CFormLabel>

                        <CFormInput
                          value={stockForm.reason}
                          onChange={(e) =>
                            setStockForm((previous) => ({
                              ...previous,
                              reason: e.target.value,
                            }))
                          }
                          placeholder="Purchase received, physical count, damaged stock..."
                        />
                      </CCol>

                      <CCol md={12}>
                        <CFormLabel>Notes</CFormLabel>

                        <CFormTextarea
                          rows={2}
                          value={stockForm.notes}
                          onChange={(e) =>
                            setStockForm((previous) => ({
                              ...previous,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Optional notes..."
                        />
                      </CCol>

                      <CCol md={12}>
                        <CButton
                          type="submit"
                          disabled={stockSaving}
                          style={{
                            background: 'linear-gradient(135deg,#d4af37,#f3d77a)',
                            color: '#111',
                            border: 0,
                            fontWeight: 700,
                          }}
                        >
                          {stockSaving ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <CIcon icon={cilReload} className="me-2" />
                              Adjust Stock
                            </>
                          )}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </div>

                <div
                  className="mt-3 p-3 rounded"
                  style={{
                    background: '#201d14',
                    border: '1px solid #5d4d20',
                  }}
                >
                  <small style={{ color: '#d4af37' }}>
                    <strong>Important:</strong> Do not change product quantity from the normal
                    product edit form. Use this inventory adjustment workflow so stock movements
                    remain traceable.
                  </small>
                </div>
              </CCardBody>
            </CCard>

            {/* =================================================
                VARIANTS
            ================================================= */}

            <CCard className="border-0 shadow-lg mb-4">
              <CCardHeader
                style={{
                  background: '#151515',
                  color: '#d4af37',
                  borderBottom: '1px solid #292929',
                  fontWeight: 700,
                }}
              >
                Product Variants
              </CCardHeader>

              <CCardBody style={{ background: '#111', color: '#ffffff', }}>
                {hasVariants ? (
                  <div className="table-responsive mb-4">
                    <CTable
                      hover
                      responsive
                      align="middle"
                      className="mb-0"
                      style={{
                        color: '#eee',
                        background: '#151515',
                      }}
                    >
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Size</CTableHeaderCell>

                          <CTableHeaderCell>Color</CTableHeaderCell>

                          <CTableHeaderCell>SKU</CTableHeaderCell>

                          <CTableHeaderCell>Price</CTableHeaderCell>

                          <CTableHeaderCell>Stock</CTableHeaderCell>

                          <CTableHeaderCell>Status</CTableHeaderCell>

                          <CTableHeaderCell>Actions</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>

                      <CTableBody>
                        {variants.map((variant) => (
                          <CTableRow key={variant.id}>
                            <CTableDataCell>{variant.size || '—'}</CTableDataCell>

                            <CTableDataCell>{variant.color || '—'}</CTableDataCell>

                            <CTableDataCell>{variant.sku || '—'}</CTableDataCell>

                            <CTableDataCell>₦{money(variant.sellingPrice)}</CTableDataCell>

                            <CTableDataCell>
                              <strong>{Number(variant.quantity || 0)}</strong>
                            </CTableDataCell>

                            <CTableDataCell>
                              <CBadge color={variant.status === 'active' ? 'success' : 'secondary'}>
                                {variant.status || 'active'}
                              </CBadge>
                            </CTableDataCell>

                            <CTableDataCell>
                              <div className="d-flex gap-1">
                                <CButton
                                  size="sm"
                                  color="warning"
                                  variant="outline"
                                  onClick={() => startEditVariant(variant)}
                                >
                                  Edit
                                </CButton>

                                <CButton
                                  size="sm"
                                  color="danger"
                                  variant="outline"
                                  onClick={() => deleteVariant(variant.id)}
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </div>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>
                ) : (
                  <div
                    className="text-center py-4 mb-4 rounded"
                    style={{
                      background: '#181818',
                      border: '1px dashed #3b3b3b',
                    }}
                  >
                    <div
                      className="mb-2"
                      style={{
                        color: '#d4af37',
                        fontSize: 28,
                      }}
                    >
                      +
                    </div>

                    <div className="fw-bold">No variants yet</div>

                    <div className="text-body-secondary small">
                      Add sizes, colors or other product variations below.
                    </div>
                  </div>
                )}

                {/* VARIANT FORM */}

                <div
                  className="p-4 rounded"
                  style={{
                    background: '#181818',
                    border: '1px solid #303030',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1 fw-bold">
                        {editingVariantId ? 'Edit Variant' : 'Add Variant'}
                      </h6>

                      <small className="text-body-secondary">
                        {editingVariantId
                          ? 'Update this product variant.'
                          : 'Create a size/color variant for this product.'}
                      </small>
                    </div>

                    {editingVariantId && (
                      <CButton
                        size="sm"
                        color="secondary"
                        variant="outline"
                        onClick={resetVariantForm}
                      >
                        Cancel Edit
                      </CButton>
                    )}
                  </div>

                  <CForm onSubmit={saveVariant}>
                    <CRow className="g-3">
                      <CCol md={6}>
                        <CFormLabel>Size</CFormLabel>

                        <CFormInput
                          value={variantForm.size}
                          onChange={(e) => handleVariantChange('size', e.target.value)}
                          placeholder="S, M, L, XL, 42..."
                        />
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel>Color</CFormLabel>

                        <CFormInput
                          value={variantForm.color}
                          onChange={(e) => handleVariantChange('color', e.target.value)}
                          placeholder="Black, Gold, Brown..."
                        />
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel>Variant SKU</CFormLabel>

                        <CFormInput
                          value={variantForm.sku}
                          onChange={(e) => handleVariantChange('sku', e.target.value)}
                          placeholder="ONI-HBG-001-BLK"
                        />
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel>Variant Barcode</CFormLabel>

                        <CFormInput
                          value={variantForm.barcode}
                          onChange={(e) => handleVariantChange('barcode', e.target.value)}
                          placeholder="Variant barcode"
                        />
                      </CCol>

                      <CCol md={4}>
                        <CFormLabel>Cost Price</CFormLabel>

                        <CFormInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={variantForm.costPrice}
                          onChange={(e) => handleVariantChange('costPrice', e.target.value)}
                        />
                      </CCol>

                      <CCol md={4}>
                        <CFormLabel>Selling Price</CFormLabel>

                        <CFormInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={variantForm.sellingPrice}
                          onChange={(e) => handleVariantChange('sellingPrice', e.target.value)}
                        />
                      </CCol>

                      <CCol md={4}>
                        <CFormLabel>Reorder Level</CFormLabel>

                        <CFormInput
                          type="number"
                          min="0"
                          step="1"
                          value={variantForm.reorderLevel}
                          onChange={(e) => handleVariantChange('reorderLevel', e.target.value)}
                        />
                      </CCol>

                      <CCol md={6}>
                        <CFormLabel>Status</CFormLabel>

                        <CFormSelect
                          value={variantForm.status}
                          onChange={(e) => handleVariantChange('status', e.target.value)}
                        >
                          <option value="active">Active</option>

                          <option value="inactive">Inactive</option>
                        </CFormSelect>
                      </CCol>

                      <CCol md={12}>
                        <div className="d-flex justify-content-end">
                          <CButton
                            type="submit"
                            disabled={variantSaving}
                            style={{
                              background: 'linear-gradient(135deg,#d4af37,#f3d77a)',
                              color: '#111',
                              border: 0,
                              fontWeight: 700,
                            }}
                          >
                            {variantSaving ? (
                              <>
                                <CSpinner size="sm" className="me-2" />
                                Saving...
                              </>
                            ) : editingVariantId ? (
                              <>
                                <CIcon icon={cilCheckAlt} className="me-2" />
                                Update Variant
                              </>
                            ) : (
                              <>
                                <CIcon icon={cilPlus} className="me-2" />
                                Add Variant
                              </>
                            )}
                          </CButton>
                        </div>
                      </CCol>
                    </CRow>
                  </CForm>
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* ===================================================
              RIGHT SIDEBAR
          =================================================== */}

          <CCol lg={4}>
            {/* IMAGE */}

            <CCard className="border-0 shadow-lg mb-4">
              <CCardHeader
                style={{
                  background: '#151515',
                  color: '#d4af37',
                  borderBottom: '1px solid #292929',
                  fontWeight: 700,
                }}
              >
                Product Image
              </CCardHeader>

              <CCardBody
                style={{
                  background: '#111',
                  color: '#ffffff',
                }}
              >
                <div
                  className="rounded-4 p-3 mb-3"
                  style={{ background: '#181818', border: '1px dashed #6d5a25' }}
                >
                  <div className="text-center py-3">
                    <CIcon icon={cilCloudUpload} size="3xl" style={{ color: '#d4af37' }} />
                    <h6 className="mt-3 mb-1">Product image gallery</h6>
                    <p className="small text-body-secondary mb-3">
                      Add up to {MAX_IMAGES} images. JPG, PNG or WEBP · maximum 5MB each.
                    </p>
                    <CButton
                      type="button"
                      style={{ background: 'linear-gradient(135deg,#d4af37,#f3d77a)', color: '#111', border: 0, fontWeight: 700 }}
                      onClick={() => imageInputRef.current?.click()}
                      disabled={imagePreviews.length >= MAX_IMAGES}
                    >
                      <CIcon icon={cilPlus} className="me-2" />
                      Add Images
                    </CButton>
                    <input
                      ref={imageInputRef}
                      id="product-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleImageChange}
                      hidden
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-body-secondary">Selected images</small>
                  <CBadge color="secondary">{imagePreviews.length}/{MAX_IMAGES}</CBadge>
                </div>

                {imagePreviews.length ? (
                  <CRow className="g-3">
                    {imagePreviews.map((item, index) => (
                      <CCol xs={6} key={`${item.source}-${item.url}-${index}`}>
                        <div className="rounded-3 overflow-hidden h-100" style={{ background: '#181818', border: '1px solid #333' }}>
                          <div style={{ height: 145, background: '#222', position: 'relative' }}>
                            <img
                              src={item.url}
                              alt={item.name || `${formData.name} image ${index + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            {index === 0 && (
                              <CBadge color="warning" className="position-absolute top-0 start-0 m-2" style={{ color: '#111' }}>
                                Primary
                              </CBadge>
                            )}
                          </div>
                          <div className="p-2">
                            <div className="small text-truncate" title={item.name || item.url}>
                              {item.name || `Product image ${index + 1}`}
                            </div>
                            {item.size ? <small className="text-body-secondary">{(item.size / (1024 * 1024)).toFixed(2)} MB</small> : (
                              <small className="text-body-secondary">Saved image</small>
                            )}
                            <CButton
                              type="button"
                              size="sm"
                              color="danger"
                              variant="outline"
                              className="w-100 mt-2"
                              onClick={() => removeImage(index)}
                            >
                              <CIcon icon={cilTrash} className="me-1" /> Remove
                            </CButton>
                          </div>
                        </div>
                      </CCol>
                    ))}
                  </CRow>
                ) : (
                  <div className="text-center text-body-secondary rounded-3 py-4" style={{ background: '#181818', border: '1px solid #303030' }}>
                    <CIcon icon={cilImage} size="3xl" />
                    <div className="mt-2">No product images yet</div>
                  </div>
                )}

                {newImages.length > 0 && (
                  <CButton type="button" color="secondary" variant="outline" className="w-100 mt-3" onClick={clearNewImages}>
                    Clear newly added images
                  </CButton>
                )}
              </CCardBody>
            </CCard>

            {/* PRODUCT OVERVIEW */}

            <CCard className="border-0 shadow-lg mb-4">
              <CCardHeader
                style={{
                  background: '#151515',
                  color: '#d4af37',
                  borderBottom: '1px solid #292929',
                  fontWeight: 700,
                }}
              >
                Product Overview
              </CCardHeader>

              <CCardBody style={{ background: '#111', color: '#ffffff', }}>
                <div className="mb-3">
                  <small className="text-body-secondary">Product</small>

                  <div className="fw-bold fs-5">{formData.name || 'Unnamed Product'}</div>
                </div>

                <div className="mb-3">
                  <small className="text-body-secondary">SKU</small>

                  <div>{formData.sku || 'Not assigned'}</div>
                </div>

                <div className="mb-3">
                  <small className="text-body-secondary">Current Stock</small>

                  <div
                    className="fw-bold fs-4"
                    style={{
                      color: currentQuantity <= 0 ? '#dc3545' : '#d4af37',
                    }}
                  >
                    {currentQuantity}
                  </div>
                </div>

                <div className="mb-3">
                  <small className="text-body-secondary">Variants</small>

                  <div className="fw-bold">{variants.length}</div>
                </div>

                {hasVariants && (
                  <div className="mb-3">
                    <small className="text-body-secondary">Total Variant Stock</small>

                    <div className="fw-bold">{totalVariantStock}</div>
                  </div>
                )}

                <div>
                  <small className="text-body-secondary">Selling Price</small>

                  <div className="fw-bold fs-4" style={{ color: '#d4af37' }}>
                    ₦{money(formData.sellingPrice)}
                  </div>
                </div>
              </CCardBody>
            </CCard>

            {/* INVENTORY RULE */}

            <div
              className="rounded p-4"
              style={{
                background: 'linear-gradient(135deg,#211c0d,#161616)',
                border: '1px solid #5a4a1d',
              }}
            >
              <div className="fw-bold mb-2" style={{ color: '#d4af37' }}>
                Inventory Control
              </div>

              <div className="small" style={{ color: '#bbb' }}>
                Purchases, sales, returns and manual stock adjustments should be recorded through
                the inventory system. This keeps the stock history accurate.
              </div>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default EditProduct
