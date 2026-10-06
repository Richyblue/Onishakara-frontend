import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
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
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilCheck, cilPlus, cilSave, cilTrash } from '@coreui/icons'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'

const API_ROOT = import.meta.env.VITE_BACKEND_URL
const API_URL = `${API_ROOT}api/v1`

const createEmptyItem = () => ({
  clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  productId: '',
  variantId: '',
  quantity: 1,
  costPrice: 0,
})

const getProductList = (response) => {
  const data = response?.data

  if (Array.isArray(data)) return data

  if (Array.isArray(data?.products)) return data.products

  if (Array.isArray(data?.data)) return data.data

  if (Array.isArray(data?.rows)) return data.rows

  return []
}

const getSupplierList = (response) => {
  const data = response?.data

  if (Array.isArray(data)) return data

  if (Array.isArray(data?.suppliers)) return data.suppliers

  if (Array.isArray(data?.data)) return data.data

  if (Array.isArray(data?.rows)) return data.rows

  return []
}

const money = (value) => {
  const amount = Number(value || 0)

  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const numberValue = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) return 0

  return number
}

const getProductVariants = (product) => {
  if (!product) return []

  if (Array.isArray(product.Variants)) {
    return product.Variants
  }

  if (Array.isArray(product.variants)) {
    return product.variants
  }

  return []
}

const getProductCost = (product) => {
  if (!product) return 0

  return numberValue(
    product.costPrice ?? product.cost_price ?? product.purchasePrice ?? product.purchase_price ?? 0,
  )
}

const getVariantCost = (variant, product) => {
  if (!variant) {
    return getProductCost(product)
  }

  return numberValue(
    variant.costPrice ??
      variant.cost_price ??
      variant.purchasePrice ??
      variant.purchase_price ??
      getProductCost(product),
  )
}

const getVariantName = (variant) => {
  if (!variant) return ''

  const parts = []

  if (variant.size) {
    parts.push(`Size: ${variant.size}`)
  }

  if (variant.color) {
    parts.push(`Color: ${variant.color}`)
  }

  if (!parts.length && variant.name) {
    return variant.name
  }

  if (!parts.length && variant.sku) {
    return variant.sku
  }

  return parts.join(' / ')
}

const getAuthConfig = () => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('authToken')

  if (!token) {
    return {}
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

const AddPurchase = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])

const savingRef = useRef(false)
const idempotencyKeyRef = useRef(null)

  const [form, setForm] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: '',
    discount: 0,
    tax: 0,
    shippingCost: 0,
    otherCharges: 0,
    amountPaid: 0,
    paymentMethod: 'cash',
    notes: '',
  })

  const [items, setItems] = useState([createEmptyItem()])

  const [loadingProductDetails, setLoadingProductDetails] = useState(false)

  // ------------------------------------------------------------
  // LOAD SUPPLIERS + PRODUCTS
  // ------------------------------------------------------------

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    setError('')

    try {
      const config = getAuthConfig()

      const [supplierResponse, productResponse] = await Promise.all([
        axios.get(`${API_URL}/suppliers?limit=1000&status=active`, config),
        axios.get(`${API_URL}/products?limit=1000&status=active`, config),
      ])

      const supplierList = getSupplierList(supplierResponse)
      const productList = getProductList(productResponse)

      setSuppliers(
        supplierList.filter(
          (supplier) => String(supplier.status || 'active').toLowerCase() !== 'inactive',
        ),
      )

      setProducts(
        productList.filter(
          (product) => String(product.status || 'active').toLowerCase() !== 'inactive',
        ),
      )
    } catch (err) {
      console.error('Failed to load purchase data:', err)

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Unable to load suppliers and products.'

      setError(message)

      Swal.fire({
        icon: 'error',
        title: 'Unable to load data',
        text: message,
      })
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------------------------------------
  // FORM HANDLERS
  // ------------------------------------------------------------

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // ------------------------------------------------------------
  // PRODUCT DETAILS
  // ------------------------------------------------------------

  const getSelectedProduct = (productId) => {
    return products.find((product) => Number(product.id) === Number(productId))
  }

  const fetchProductDetailsIfNeeded = async (productId) => {
    const existingProduct = getSelectedProduct(productId)

    if (existingProduct && Array.isArray(existingProduct.Variants)) {
      return existingProduct
    }

    try {
      setLoadingProductDetails(true)

      const response = await axios.get(`${API_URL}/products/${productId}`, getAuthConfig())

      const responseData = response?.data

      const detailedProduct = responseData?.product || responseData?.data || responseData

      if (detailedProduct && detailedProduct.id) {
        setProducts((previous) =>
          previous.map((product) =>
            Number(product.id) === Number(productId)
              ? {
                  ...product,
                  ...detailedProduct,
                  Variants:
                    detailedProduct.Variants || detailedProduct.variants || product.Variants || [],
                }
              : product,
          ),
        )

        return detailedProduct
      }
    } catch (err) {
      console.error('Unable to load product details:', err)
    } finally {
      setLoadingProductDetails(false)
    }

    return existingProduct
  }

  // ------------------------------------------------------------
  // ITEM HANDLERS
  // ------------------------------------------------------------

  const handleProductChange = async (clientId, productId) => {
    const selectedProduct = getSelectedProduct(productId)

    const variants = getProductVariants(selectedProduct)

    setItems((previous) =>
      previous.map((item) => {
        if (item.clientId !== clientId) return item

        return {
          ...item,
          productId,
          variantId: '',
          costPrice: variants.length > 0 ? 0 : getProductCost(selectedProduct),
        }
      }),
    )

    if (productId) {
      const detailedProduct = await fetchProductDetailsIfNeeded(productId)

      if (!detailedProduct) return

      const detailedVariants = getProductVariants(detailedProduct)

      setItems((previous) =>
        previous.map((item) => {
          if (item.clientId !== clientId) return item

          return {
            ...item,
            costPrice: detailedVariants.length > 0 ? 0 : getProductCost(detailedProduct),
          }
        }),
      )
    }
  }

  const handleVariantChange = (clientId, variantId) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.clientId !== clientId) return item

        const product = getSelectedProduct(item.productId)

        const variants = getProductVariants(product)

        const variant = variants.find((entry) => Number(entry.id) === Number(variantId))

        return {
          ...item,
          variantId,
          costPrice: getVariantCost(variant, product),
        }
      }),
    )
  }

  const handleItemChange = (clientId, field, value) => {
    setItems((previous) =>
      previous.map((item) =>
        item.clientId === clientId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )
  }

  const addItem = () => {
    setItems((previous) => [...previous, createEmptyItem()])
  }

  const removeItem = (clientId) => {
    if (items.length === 1) {
      Swal.fire({
        icon: 'info',
        title: 'At least one item is required',
        text: 'A purchase must contain at least one product.',
      })

      return
    }

    setItems((previous) => previous.filter((item) => item.clientId !== clientId))
  }

  // ------------------------------------------------------------
  // CALCULATIONS
  // ------------------------------------------------------------

  const calculatedItems = useMemo(() => {
    return items.map((item) => {
      const quantity = Math.max(0, numberValue(item.quantity))
      const costPrice = Math.max(0, numberValue(item.costPrice))

      return {
        ...item,
        quantity,
        costPrice,
        subtotal: quantity * costPrice,
      }
    })
  }, [items])

  const subtotal = useMemo(() => {
    return calculatedItems.reduce((total, item) => total + numberValue(item.subtotal), 0)
  }, [calculatedItems])

  const discount = Math.max(0, numberValue(form.discount))
  const tax = Math.max(0, numberValue(form.tax))
  const shippingCost = Math.max(0, numberValue(form.shippingCost))
  const otherCharges = Math.max(0, numberValue(form.otherCharges))

  const totalAmount = Math.max(0, subtotal - discount + tax + shippingCost + otherCharges)

  const amountPaid = Math.max(0, numberValue(form.amountPaid))

  const balanceDue = Math.max(0, totalAmount - amountPaid)

  const paymentStatus = useMemo(() => {
    if (amountPaid <= 0) return 'unpaid'

    if (amountPaid >= totalAmount && totalAmount > 0) {
      return 'paid'
    }

    return 'partial'
  }, [amountPaid, totalAmount])

  // ------------------------------------------------------------
  // VALIDATION
  // ------------------------------------------------------------

  const validatePurchase = () => {
    setError('')

    if (!form.supplierId) {
      setError('Please select a supplier.')
      return false
    }

    if (!form.purchaseDate) {
      setError('Please select the purchase date.')
      return false
    }

    if (!items.length) {
      setError('Please add at least one product.')
      return false
    }

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index]

      if (!item.productId) {
        setError(`Please select a product for item ${index + 1}.`)
        return false
      }

      const product = getSelectedProduct(item.productId)
      const variants = getProductVariants(product)

      if (variants.length > 0 && !item.variantId) {
        setError(`Please select a variant for "${product?.name || `item ${index + 1}`}".`)
        return false
      }

      if (numberValue(item.quantity) <= 0) {
        setError(`Quantity must be greater than zero for item ${index + 1}.`)
        return false
      }

      if (numberValue(item.costPrice) < 0) {
        setError(`Cost price cannot be negative for item ${index + 1}.`)
        return false
      }
    }

    if (discount > subtotal) {
      setError('Discount cannot be greater than the purchase subtotal.')
      return false
    }

    if (amountPaid > totalAmount) {
      setError('Amount paid cannot be greater than the purchase total.')
      return false
    }

    return true
  }

  // ------------------------------------------------------------
  // DUPLICATE CHECK
  // ------------------------------------------------------------

  const hasDuplicateItems = () => {
    const seen = new Set()

    for (const item of items) {
      const key = `${Number(item.productId)}-${Number(item.variantId || 0)}`

      if (seen.has(key)) {
        return true
      }

      seen.add(key)
    }

    return false
  }

  // ------------------------------------------------------------
  // SAVE PURCHASE
  // ------------------------------------------------------------
  const savePurchase = async (status = 'draft') => {
    // Prevent multiple submissions before React has time to update state
    if (savingRef.current) return
  
    savingRef.current = true
    setSaving(true)
    setError('')
  
    try {
      if (!validatePurchase()) {
        return
      }
  
      if (hasDuplicateItems()) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'Duplicate Items',
          text: 'Some products appear more than once. Do you want to continue?',
          showCancelButton: true,
          confirmButtonText: 'Continue',
          cancelButtonText: 'Cancel',
        })
  
        if (!result.isConfirmed) {
          return
        }
      }
  
      if (status === 'received') {
        const confirmation = await Swal.fire({
          icon: 'question',
          title: 'Receive Purchase?',
          text: 'This will immediately update your stock. Continue?',
          showCancelButton: true,
          confirmButtonText: 'Yes, Receive',
          cancelButtonText: 'Cancel',
        })
  
        if (!confirmation.isConfirmed) {
          return
        }
      }
  
      // ---------------------------------------------------------
      // Generate ONE idempotency key for this purchase submission.
      // It stays the same if the request needs to be retried.
      // ---------------------------------------------------------
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID()
      }
  
      const payload = {
        supplierId: Number(form.supplierId),
        purchaseDate: form.purchaseDate,
        invoiceNumber: form.invoiceNumber.trim() || null,
        discount,
        tax,
        shippingCost,
        otherCharges,
        amountPaid,
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim() || null,
        status,
  
        // Optional: also send it in the body
        // Backend will primarily read the header.
        idempotencyKey: idempotencyKeyRef.current,
  
        items: calculatedItems.map((item) => ({
          productId: Number(item.productId),
          variantId: item.variantId
            ? Number(item.variantId)
            : null,
          productName: item.productName,
          variantName: item.variantName || null,
          quantity: Number(item.quantity),
          costPrice: Number(item.costPrice),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal || 0),
          total: Number(item.total || 0),
        })),
      }
  
      // ---------------------------------------------------------
      // Send the same idempotency key with the request.
      // This prevents duplicate purchases if the user clicks
      // multiple times or the request is accidentally repeated.
      // ---------------------------------------------------------
      const authConfig = getAuthConfig()
  
      const response = await axios.post(
        `${API_URL}/purchases`,
        payload,
        {
          ...authConfig,
          headers: {
            ...(authConfig?.headers || {}),
            'X-Idempotency-Key': idempotencyKeyRef.current,
          },
        }
      )
  
      const createdPurchase =
        response?.data?.purchase ||
        response?.data?.data ||
        response?.data
  
      const purchaseId =
        createdPurchase?.id ||
        response?.data?.id
  
      await Swal.fire({
        icon: response?.data?.duplicate
          ? 'info'
          : 'success',
  
        title: response?.data?.duplicate
          ? 'Purchase Already Saved'
          : status === 'received'
            ? 'Purchase Received'
            : 'Purchase Saved',
  
        text: response?.data?.duplicate
          ? 'This purchase was already processed.'
          : 'Purchase has been saved successfully.',
  
        confirmButtonText: 'OK',
      })
  
      // ---------------------------------------------------------
      // Clear the key only after the purchase has successfully
      // completed. This ensures a retry of the same request uses
      // the same key.
      // ---------------------------------------------------------
      idempotencyKeyRef.current = null
  
      if (purchaseId) {
        navigate(`/purchases/${purchaseId}`)
      } else {
        navigate('/purchases')
      }
  
    } catch (err) {
      console.error('Save purchase error:', err)
  
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save purchase.'
  
      setError(message)
  
      await Swal.fire({
        icon: 'error',
        title: 'Unable to Save Purchase',
        text: message,
      })
  
    } finally {
      // Always unlock, including when validation/confirmation
      // returns early.
      savingRef.current = false
      setSaving(false)
    }
  }

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '70vh' }}
      >
        <div className="text-center">
          <CSpinner
            style={{
              width: '3rem',
              height: '3rem',
              color: '#b8860b',
            }}
          />

          <div className="mt-3 fw-semibold" style={{ color: '#444' }}>
            Loading purchase workspace...
          </div>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <div className="container-fluid pb-5">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div
            className="text-uppercase small fw-bold"
            style={{
              color: '#b8860b',
              letterSpacing: '1.5px',
            }}
          >
            Inventory Management
          </div>

          <h2
            className="fw-bold mb-1"
            style={{
              color: '#171717',
            }}
          >
            New Purchase
          </h2>

          <div className="text-medium-emphasis">Record stock received from a supplier.</div>
        </div>

        <CButton
          color="light"
          className="border shadow-sm"
          onClick={() => navigate('/purchases')}
          disabled={saving}
        >
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back to Purchases
        </CButton>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')} className="shadow-sm">
          <strong>Unable to continue:</strong> {error}
        </CAlert>
      )}

      <CForm>
        <CRow className="g-4">
          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <CCol xs={12} lg={8}>
            {/* -----------------------------------------------
                PURCHASE INFORMATION
            ------------------------------------------------ */}

            <CCard
              className="border-0 shadow-sm mb-4"
              style={{
                borderRadius: '14px',
              }}
            >
              <CCardHeader
                className="bg-white border-bottom py-3"
                style={{
                  borderTopLeftRadius: '14px',
                  borderTopRightRadius: '14px',
                }}
              >
                <div className="fw-bold">Purchase Information</div>

                <small className="text-medium-emphasis">
                  Supplier and purchase reference details
                </small>
              </CCardHeader>

              <CCardBody>
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel className="fw-semibold">
                      Supplier <span className="text-danger">*</span>
                    </CFormLabel>

                    <CFormSelect
                      name="supplierId"
                      value={form.supplierId}
                      onChange={handleFormChange}
                      disabled={saving}
                    >
                      <option value="">Select supplier</option>

                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                          {supplier.companyName ? ` — ${supplier.companyName}` : ''}
                        </option>
                      ))}
                    </CFormSelect>

                    {!suppliers.length && (
                      <small className="text-danger d-block mt-1">No active suppliers found.</small>
                    )}
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel className="fw-semibold">
                      Purchase Date <span className="text-danger">*</span>
                    </CFormLabel>

                    <CFormInput
                      type="date"
                      name="purchaseDate"
                      value={form.purchaseDate}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel className="fw-semibold">Invoice Number</CFormLabel>

                    <CFormInput
                      type="text"
                      name="invoiceNumber"
                      value={form.invoiceNumber}
                      onChange={handleFormChange}
                      placeholder="Optional"
                      disabled={saving}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* -----------------------------------------------
                PURCHASE ITEMS
            ------------------------------------------------ */}

            <CCard
              className="border-0 shadow-sm mb-4"
              style={{
                borderRadius: '14px',
              }}
            >
              <CCardHeader
                className="bg-white border-bottom d-flex justify-content-between align-items-center py-3"
                style={{
                  borderTopLeftRadius: '14px',
                  borderTopRightRadius: '14px',
                }}
              >
                <div>
                  <div className="fw-bold">Purchase Items</div>

                  <small className="text-medium-emphasis">
                    Add products and their supplier cost
                  </small>
                </div>

                <CButton
                  size="sm"
                  style={{
                    background: '#b8860b',
                    borderColor: '#b8860b',
                    color: '#fff',
                  }}
                  onClick={addItem}
                  disabled={saving}
                >
                  <CIcon icon={cilPlus} className="me-1" />
                  Add Product
                </CButton>
              </CCardHeader>

              <CCardBody className="p-0">
                <div className="table-responsive">
                  <CTable hover align="middle" className="mb-0" style={{ minWidth: '850px' }}>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Product</CTableHeaderCell>

                        <CTableHeaderCell style={{ width: '190px' }}>Variant</CTableHeaderCell>

                        <CTableHeaderCell style={{ width: '110px' }}>Qty</CTableHeaderCell>

                        <CTableHeaderCell style={{ width: '160px' }}>Cost Price</CTableHeaderCell>

                        <CTableHeaderCell className="text-end" style={{ width: '160px' }}>
                          Subtotal
                        </CTableHeaderCell>

                        <CTableHeaderCell style={{ width: '60px' }} />
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {calculatedItems.map((item, index) => {
                        const product = getSelectedProduct(item.productId)

                        const variants = getProductVariants(product)

                        return (
                          <CTableRow key={item.clientId}>
                            {/* PRODUCT */}

                            <CTableDataCell>
                              <CFormSelect
                                value={item.productId}
                                onChange={(event) =>
                                  handleProductChange(item.clientId, event.target.value)
                                }
                                disabled={saving}
                              >
                                <option value="">Select product</option>

                                {products.map((productOption) => (
                                  <option key={productOption.id} value={productOption.id}>
                                    {productOption.name}
                                    {productOption.sku ? ` — ${productOption.sku}` : ''}
                                  </option>
                                ))}
                              </CFormSelect>

                              {product && (
                                <small className="text-medium-emphasis d-block mt-1">
                                  Stock: {Number(product.quantity || 0).toLocaleString()}
                                </small>
                              )}
                            </CTableDataCell>

                            {/* VARIANT */}

                            <CTableDataCell>
                              {variants.length > 0 ? (
                                <CFormSelect
                                  value={item.variantId}
                                  onChange={(event) =>
                                    handleVariantChange(item.clientId, event.target.value)
                                  }
                                  disabled={saving || !item.productId || loadingProductDetails}
                                >
                                  <option value="">Select variant</option>

                                  {variants.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                      {getVariantName(variant)}
                                      {variant.sku ? ` — ${variant.sku}` : ''}
                                    </option>
                                  ))}
                                </CFormSelect>
                              ) : (
                                <span className="text-medium-emphasis small">No variant</span>
                              )}
                            </CTableDataCell>

                            {/* QUANTITY */}

                            <CTableDataCell>
                              <CFormInput
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={item.quantity}
                                onChange={(event) =>
                                  handleItemChange(item.clientId, 'quantity', event.target.value)
                                }
                                disabled={saving}
                              />
                            </CTableDataCell>

                            {/* COST */}

                            <CTableDataCell>
                              <CInputGroup>
                                <CInputGroupText>₦</CInputGroupText>

                                <CFormInput
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.costPrice}
                                  onChange={(event) =>
                                    handleItemChange(item.clientId, 'costPrice', event.target.value)
                                  }
                                  disabled={saving}
                                />
                              </CInputGroup>
                            </CTableDataCell>

                            {/* SUBTOTAL */}

                            <CTableDataCell className="text-end fw-semibold">
                              {money(item.subtotal)}
                            </CTableDataCell>

                            {/* REMOVE */}

                            <CTableDataCell className="text-center">
                              <CButton
                                color="danger"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.clientId)}
                                disabled={saving || items.length === 1}
                                title="Remove item"
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                </div>

                <div className="p-3 border-top bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-medium-emphasis">
                      {items.length} {items.length === 1 ? 'item' : 'items'} added
                    </div>

                    <div className="fw-bold">
                      Subtotal: <span style={{ color: '#b8860b' }}>{money(subtotal)}</span>
                    </div>
                  </div>
                </div>
              </CCardBody>
            </CCard>

            {/* -----------------------------------------------
                NOTES
            ------------------------------------------------ */}

            <CCard
              className="border-0 shadow-sm"
              style={{
                borderRadius: '14px',
              }}
            >
              <CCardHeader
                className="bg-white border-bottom py-3"
                style={{
                  borderTopLeftRadius: '14px',
                  borderTopRightRadius: '14px',
                }}
              >
                <div className="fw-bold">Purchase Notes</div>
              </CCardHeader>

              <CCardBody>
                <CFormTextarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="Add any notes about this purchase..."
                  disabled={saving}
                />
              </CCardBody>
            </CCard>
          </CCol>

          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <CCol xs={12} lg={4}>
            {/* -----------------------------------------------
                PURCHASE SUMMARY
            ------------------------------------------------ */}

            <CCard
              className="border-0 shadow-sm mb-4"
              style={{
                borderRadius: '14px',
                overflow: 'hidden',
              }}
            >
              <CCardHeader
                className="py-3"
                style={{
                  background: '#171717',
                  color: '#fff',
                }}
              >
                <div className="fw-bold">Purchase Summary</div>

                <small style={{ color: '#cfcfcf' }}>Review purchase charges</small>
              </CCardHeader>

              <CCardBody>
                {/* SUBTOTAL */}

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-medium-emphasis">Subtotal</span>

                  <strong>{money(subtotal)}</strong>
                </div>

                {/* DISCOUNT */}

                <div className="mb-3">
                  <CFormLabel className="small fw-semibold">Discount</CFormLabel>

                  <CInputGroup>
                    <CInputGroupText>₦</CInputGroupText>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      name="discount"
                      value={form.discount}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </CInputGroup>
                </div>

                {/* TAX */}

                <div className="mb-3">
                  <CFormLabel className="small fw-semibold">Tax</CFormLabel>

                  <CInputGroup>
                    <CInputGroupText>₦</CInputGroupText>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      name="tax"
                      value={form.tax}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </CInputGroup>
                </div>

                {/* SHIPPING */}

                <div className="mb-3">
                  <CFormLabel className="small fw-semibold">Shipping Cost</CFormLabel>

                  <CInputGroup>
                    <CInputGroupText>₦</CInputGroupText>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      name="shippingCost"
                      value={form.shippingCost}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </CInputGroup>
                </div>

                {/* OTHER CHARGES */}

                <div className="mb-4">
                  <CFormLabel className="small fw-semibold">Other Charges</CFormLabel>

                  <CInputGroup>
                    <CInputGroupText>₦</CInputGroupText>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      name="otherCharges"
                      value={form.otherCharges}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </CInputGroup>
                </div>

                <hr />

                {/* TOTAL */}

                <div
                  className="d-flex justify-content-between align-items-center p-3 rounded mb-4"
                  style={{
                    background: '#f8f4e8',
                  }}
                >
                  <div>
                    <div className="small text-medium-emphasis">Total Purchase</div>

                    <div
                      className="fs-4 fw-bold"
                      style={{
                        color: '#9b7200',
                      }}
                    >
                      {money(totalAmount)}
                    </div>
                  </div>

                  <CBadge
                    style={{
                      background:
                        paymentStatus === 'paid'
                          ? '#198754'
                          : paymentStatus === 'partial'
                            ? '#b8860b'
                            : '#6c757d',
                    }}
                  >
                    {paymentStatus.toUpperCase()}
                  </CBadge>
                </div>

                {/* AMOUNT PAID */}

                <div className="mb-3">
                  <CFormLabel className="fw-semibold">Amount Paid</CFormLabel>

                  <CInputGroup>
                    <CInputGroupText>₦</CInputGroupText>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      name="amountPaid"
                      value={form.amountPaid}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </CInputGroup>
                </div>

                {/* PAYMENT METHOD */}

                <div className="mb-3">
                  <CFormLabel className="fw-semibold">Payment Method</CFormLabel>

                  <CFormSelect
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleFormChange}
                    disabled={saving}
                  >
                    <option value="cash">Cash</option>

                    <option value="transfer">Bank Transfer</option>

                    <option value="pos">POS</option>

                    <option value="bank">Bank</option>

                    <option value="mixed">Mixed</option>

                    <option value="credit">Credit</option>
                  </CFormSelect>
                </div>

                {/* BALANCE */}

                <div className="d-flex justify-content-between py-3 border-top">
                  <span className="fw-semibold">Balance Due</span>

                  <strong
                    style={{
                      color: balanceDue > 0 ? '#dc3545' : '#198754',
                    }}
                  >
                    {money(balanceDue)}
                  </strong>
                </div>
              </CCardBody>
            </CCard>

            {/* -----------------------------------------------
                ACTIONS
            ------------------------------------------------ */}

            <CCard
              className="border-0 shadow-sm"
              style={{
                borderRadius: '14px',
              }}
            >
              <CCardBody>
                <CButton
                  className="w-100 mb-3"
                  style={{
                    background: '#171717',
                    borderColor: '#171717',
                    color: '#fff',
                    minHeight: '48px',
                  }}
                  onClick={() => savePurchase('draft')}
                  disabled={saving}
                >
                  {saving ? (
                    <CSpinner size="sm" className="me-2" />
                  ) : (
                    <CIcon icon={cilSave} className="me-2" />
                  )}
                  Save Draft
                </CButton>

                <CButton
                  className="w-100 mb-3"
                  style={{
                    background: '#b8860b',
                    borderColor: '#b8860b',
                    color: '#fff',
                    minHeight: '48px',
                  }}
                  onClick={() => savePurchase('received')}
                  disabled={saving}
                >
                  {saving ? (
                    <CSpinner size="sm" className="me-2" />
                  ) : (
                    <CIcon icon={cilCheck} className="me-2" />
                  )}
                  Save & Receive
                </CButton>

                <CButton
                  color="light"
                  className="w-100 border"
                  onClick={() => navigate('/purchases')}
                  disabled={saving}
                >
                  Cancel
                </CButton>
              </CCardBody>
            </CCard>

            {/* -----------------------------------------------
                INFORMATION
            ------------------------------------------------ */}

            <div
              className="mt-3 p-3 rounded"
              style={{
                background: '#fafafa',
                border: '1px solid #e5e5e5',
              }}
            >
              <div className="fw-semibold mb-2">Purchase Workflow</div>

              <div className="small text-medium-emphasis">
                <div className="mb-2">
                  <strong>Draft:</strong> saves the purchase without increasing stock.
                </div>

                <div>
                  <strong>Receive:</strong> records the purchase and increases product stock
                  immediately.
                </div>
              </div>
            </div>
          </CCol>
        </CRow>
      </CForm>
    </div>
  )
}

export default AddPurchase
