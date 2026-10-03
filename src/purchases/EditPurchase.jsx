import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormInput,
  CFormLabel,
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
import { cilArrowLeft, cilPlus, cilSave, cilTrash } from '@coreui/icons'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useNavigate, useParams } from 'react-router-dom'

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
const API_URL = `${API_ROOT}/api/v1`

const money = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const numberValue = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const getData = (response, key) => {
  const data = response?.data

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.rows)) return data.rows

  return []
}

const getPurchase = (response) => {
  const data = response?.data

  return data?.purchase || data?.data?.purchase || data?.data || data || null
}

const EditPurchase = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const token = localStorage.getItem('token')

  const axiosConfig = useMemo(
    () => ({
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }),
    [token],
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])

  const [purchase, setPurchase] = useState(null)

  const [supplierId, setSupplierId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')

  const [items, setItems] = useState([])

  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)
  const [otherCharges, setOtherCharges] = useState(0)

  const [amountPaid, setAmountPaid] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  const loadPurchase = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await axios.get(`${API_URL}/purchases/${id}`, axiosConfig)

      const data = getPurchase(response)

      if (!data) {
        throw new Error('Purchase was not found.')
      }

      if (String(data.status).toLowerCase() !== 'draft') {
        await Swal.fire({
          icon: 'info',
          title: 'Purchase Cannot Be Edited',
          text: 'Only draft purchases can be edited.',
          confirmButtonColor: '#b08d2c',
        })

        navigate(`/purchases/${id}`)
        return
      }

      setPurchase(data)

      setSupplierId(String(data.supplierId || data.Supplier?.id || ''))

      const date = data.purchaseDate ? new Date(data.purchaseDate) : new Date()

      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        setPurchaseDate(`${year}-${month}-${day}`)
      }

      setInvoiceNumber(data.invoiceNumber || '')

      const purchaseItems = Array.isArray(data.Items)
        ? data.Items
        : Array.isArray(data.items)
          ? data.items
          : []

      setItems(
        purchaseItems.map((item) => ({
          id: item.id,
          productId: String(item.productId || item.Product?.id || ''),
          variantId: item.variantId ? String(item.variantId) : '',
          productName: item.productName || item.Product?.name || '',
          variantName:
            item.variantName ||
            [item.Variant?.size, item.Variant?.color].filter(Boolean).join(' / '),
          quantity: numberValue(item.quantity),
          costPrice: numberValue(item.costPrice),
        })),
      )

      setDiscount(numberValue(data.discount))
      setTax(numberValue(data.tax))
      setShippingCost(numberValue(data.shippingCost))
      setOtherCharges(numberValue(data.otherCharges))
      setAmountPaid(numberValue(data.amountPaid))
      setPaymentMethod(data.paymentMethod || 'cash')
      setNotes(data.notes || '')
    } catch (err) {
      console.error('Load purchase error:', err)

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Unable to load purchase.',
      )
    } finally {
      setLoading(false)
    }
  }, [id, axiosConfig, navigate])

  const loadProductsAndSuppliers = useCallback(async () => {
    try {
      const [supplierResponse, productResponse] = await Promise.all([
        axios.get(`${API_URL}/suppliers?limit=1000&status=active`, axiosConfig),
        axios.get(`${API_URL}/products?limit=1000&status=active`, axiosConfig),
      ])

      setSuppliers(getData(supplierResponse, 'suppliers'))
      setProducts(getData(productResponse, 'products'))
    } catch (err) {
      console.error('Load purchase options error:', err)

      setError(
        err?.response?.data?.message || err?.message || 'Unable to load products and suppliers.',
      )
    }
  }, [axiosConfig])

  useEffect(() => {
    loadProductsAndSuppliers()
    loadPurchase()
  }, [loadProductsAndSuppliers, loadPurchase])

  const getProduct = (productId) =>
    products.find((product) => String(product.id) === String(productId))

  const getVariants = (product) => {
    if (!product) return []

    return Array.isArray(product.Variants)
      ? product.Variants
      : Array.isArray(product.variants)
        ? product.variants
        : []
  }

  const getVariantName = (variant) =>
    [variant?.size, variant?.color].filter(Boolean).join(' / ') || variant?.name || 'Default'

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        productId: '',
        variantId: '',
        productName: '',
        variantName: '',
        quantity: 1,
        costPrice: 0,
      },
    ])
  }

  const removeItem = (index) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item

        if (field === 'productId') {
          const product = getProduct(value)

          const variants = getVariants(product)

          return {
            ...item,
            productId: value,
            productName: product?.name || '',
            variantId: '',
            variantName: '',
            costPrice: numberValue(product?.costPrice),
            quantity: item.quantity || 1,
            hasVariants: variants.length > 0,
          }
        }

        if (field === 'variantId') {
          const product = getProduct(item.productId)
          const variant = getVariants(product).find((v) => String(v.id) === String(value))

          return {
            ...item,
            variantId: value,
            variantName: getVariantName(variant),
            costPrice: numberValue(variant?.costPrice ?? product?.costPrice),
          }
        }

        return {
          ...item,
          [field]: field === 'quantity' || field === 'costPrice' ? numberValue(value) : value,
        }
      }),
    )
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + numberValue(item.quantity) * numberValue(item.costPrice),
        0,
      ),
    [items],
  )

  const total = Math.max(
    0,
    subtotal -
      numberValue(discount) +
      numberValue(tax) +
      numberValue(shippingCost) +
      numberValue(otherCharges),
  )

  const balanceDue = Math.max(0, total - numberValue(amountPaid))

  const paymentStatus =
    numberValue(amountPaid) <= 0 ? 'unpaid' : numberValue(amountPaid) >= total ? 'paid' : 'partial'

  const validate = () => {
    if (!supplierId) {
      return 'Please select a supplier.'
    }

    if (!purchaseDate) {
      return 'Please select the purchase date.'
    }

    if (!items.length) {
      return 'Please add at least one product.'
    }

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]

      if (!item.productId) {
        return `Please select a product for item ${i + 1}.`
      }

      const product = getProduct(item.productId)
      const variants = getVariants(product)

      if (variants.length && !item.variantId) {
        return `Please select a variant for ${product?.name || `item ${i + 1}`}.`
      }

      if (numberValue(item.quantity) <= 0) {
        return `Quantity must be greater than zero for item ${i + 1}.`
      }

      if (numberValue(item.costPrice) < 0) {
        return `Cost price cannot be negative for item ${i + 1}.`
      }
    }

    if (numberValue(discount) > subtotal) {
      return 'Discount cannot be greater than the subtotal.'
    }

    if (numberValue(amountPaid) > total) {
      return 'Amount paid cannot be greater than the purchase total.'
    }

    return null
  }

  const savePurchase = async () => {
    const validationError = validate()

    if (validationError) {
      Swal.fire({
        icon: 'warning',
        title: 'Check Purchase',
        text: validationError,
        confirmButtonColor: '#b08d2c',
      })

      return
    }

    try {
      setSaving(true)

      const payload = {
        supplierId: Number(supplierId),
        purchaseDate,
        invoiceNumber: invoiceNumber.trim() || null,

        status: 'draft',

        discount: numberValue(discount),
        tax: numberValue(tax),
        shippingCost: numberValue(shippingCost),
        otherCharges: numberValue(otherCharges),

        amountPaid: numberValue(amountPaid),
        paymentMethod,
        notes: notes.trim() || null,

        items: items.map((item) => ({
          productId: Number(item.productId),
          variantId: item.variantId ? Number(item.variantId) : null,
          productName: item.productName,
          variantName: item.variantName || null,
          quantity: numberValue(item.quantity),
          costPrice: numberValue(item.costPrice),
          subtotal: numberValue(item.quantity) * numberValue(item.costPrice),
          discount: 0,
          total: numberValue(item.quantity) * numberValue(item.costPrice),
        })),
      }

      await axios.put(`${API_URL}/purchases/${id}`, payload, axiosConfig)

      await Swal.fire({
        icon: 'success',
        title: 'Purchase Updated',
        text: 'The draft purchase has been updated successfully.',
        confirmButtonColor: '#b08d2c',
      })

      navigate(`/purchases/${id}`)
    } catch (err) {
      console.error('Update purchase error:', err)

      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Unable to update purchase.',
        confirmButtonColor: '#b08d2c',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '70vh' }}
      >
        <div className="text-center">
          <CSpinner className="mb-3" />
          <div>Loading purchase...</div>
        </div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <CContainer fluid className="py-4">
        <CButton color="light" onClick={() => navigate('/purchases')} className="mb-3">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Back to Purchases
        </CButton>

        <CAlert color="danger">{error || 'Purchase not found.'}</CAlert>
      </CContainer>
    )
  }

  return (
    <div
      style={{
        background: '#f5f5f3',
        minHeight: '100vh',
        paddingBottom: 40,
      }}
    >
      <style>
        {`
          .edit-purchase-header {
            background: linear-gradient(135deg, #111 0%, #292929 100%);
            color: #fff;
            border-radius: 14px;
            padding: 24px;
            box-shadow: 0 8px 25px rgba(0,0,0,.08);
          }

          .gold-btn {
            background: #b08d2c;
            border-color: #b08d2c;
            color: #fff;
          }

          .gold-btn:hover {
            background: #8c6f20;
            border-color: #8c6f20;
            color: #fff;
          }

          .section-title {
            font-weight: 700;
            color: #171717;
          }

          .summary-box {
            background: #111;
            color: #fff;
            border-radius: 12px;
            padding: 18px;
          }

          .summary-line {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,.12);
          }

          .summary-line:last-child {
            border-bottom: 0;
          }

          .total-value {
            color: #d6b65a;
            font-size: 25px;
            font-weight: 800;
          }
        `}
      </style>

      <CContainer fluid className="py-4">
        <div className="edit-purchase-header mb-4">
          <CRow className="align-items-center">
            <CCol md={8}>
              <div
                style={{
                  color: '#d6b65a',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                }}
              >
                ONISHAKARA GOLD
              </div>

              <h3 className="mb-1 mt-1">Edit Purchase</h3>

              <div style={{ color: '#bbb' }}>{purchase.purchaseNumber}</div>
            </CCol>

            <CCol md={4} className="text-md-end mt-3 mt-md-0">
              <CBadge color="warning" className="me-2">
                DRAFT
              </CBadge>

              <CButton color="light" onClick={() => navigate(`/purchases/${id}`)}>
                <CIcon icon={cilArrowLeft} className="me-1" />
                Back
              </CButton>
            </CCol>
          </CRow>
        </div>

        <CRow className="g-4">
          <CCol lg={8}>
            {/* BASIC INFORMATION */}
            <CCard className="border-0 shadow-sm mb-4">
              <CCardHeader className="bg-white border-0 px-4 pt-4">
                <h5 className="section-title mb-0">Purchase Information</h5>
              </CCardHeader>

              <CCardBody className="px-4">
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel>Supplier *</CFormLabel>

                    <CFormSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                      <option value="">Select supplier</option>

                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                          {supplier.companyName ? ` — ${supplier.companyName}` : ''}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Purchase Date *</CFormLabel>

                    <CFormInput
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Invoice Number</CFormLabel>

                    <CFormInput
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Optional"
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* ITEMS */}
            <CCard className="border-0 shadow-sm mb-4">
              <CCardHeader className="bg-white border-0 px-4 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="section-title mb-0">Purchase Items</h5>

                  <CButton size="sm" className="gold-btn" onClick={addItem}>
                    <CIcon icon={cilPlus} className="me-1" />
                    Add Product
                  </CButton>
                </div>
              </CCardHeader>

              <CCardBody className="px-3">
                <div className="table-responsive">
                  <CTable align="middle">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Product</CTableHeaderCell>

                        <CTableHeaderCell>Variant</CTableHeaderCell>

                        <CTableHeaderCell style={{ minWidth: 100 }}>Qty</CTableHeaderCell>

                        <CTableHeaderCell style={{ minWidth: 150 }}>Cost Price</CTableHeaderCell>

                        <CTableHeaderCell className="text-end">Total</CTableHeaderCell>

                        <CTableHeaderCell />
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {items.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell
                            colSpan={6}
                            className="text-center py-5 text-medium-emphasis"
                          >
                            No products added yet.
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        items.map((item, index) => {
                          const product = getProduct(item.productId)

                          const variants = getVariants(product)

                          const lineTotal = numberValue(item.quantity) * numberValue(item.costPrice)

                          return (
                            <CTableRow key={item.id || `purchase-item-${index}`}>
                              <CTableDataCell style={{ minWidth: 240 }}>
                                <CFormSelect
                                  value={item.productId}
                                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                >
                                  <option value="">Select product</option>

                                  {products.map((productOption) => (
                                    <option key={productOption.id} value={productOption.id}>
                                      {productOption.name}
                                      {productOption.sku ? ` — ${productOption.sku}` : ''}
                                    </option>
                                  ))}
                                </CFormSelect>
                              </CTableDataCell>

                              <CTableDataCell style={{ minWidth: 180 }}>
                                {variants.length > 0 ? (
                                  <CFormSelect
                                    value={item.variantId}
                                    onChange={(e) => updateItem(index, 'variantId', e.target.value)}
                                  >
                                    <option value="">Select variant</option>

                                    {variants.map((variant) => (
                                      <option key={variant.id} value={variant.id}>
                                        {getVariantName(variant)}
                                      </option>
                                    ))}
                                  </CFormSelect>
                                ) : (
                                  <span className="text-medium-emphasis">No variant</span>
                                )}
                              </CTableDataCell>

                              <CTableDataCell>
                                <CFormInput
                                  type="number"
                                  min="0.001"
                                  step="0.001"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                />
                              </CTableDataCell>

                              <CTableDataCell>
                                <CFormInput
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.costPrice}
                                  onChange={(e) => updateItem(index, 'costPrice', e.target.value)}
                                />
                              </CTableDataCell>

                              <CTableDataCell className="text-end fw-bold">
                                {money(lineTotal)}
                              </CTableDataCell>

                              <CTableDataCell className="text-end">
                                <CButton
                                  color="danger"
                                  variant="ghost"
                                  onClick={() => removeItem(index)}
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          )
                        })
                      )}
                    </CTableBody>
                  </CTable>
                </div>
              </CCardBody>
            </CCard>

            {/* CHARGES */}
            <CCard className="border-0 shadow-sm mb-4">
              <CCardHeader className="bg-white border-0 px-4 pt-4">
                <h5 className="section-title mb-0">Charges & Payment</h5>
              </CCardHeader>

              <CCardBody className="px-4">
                <CRow className="g-3">
                  <CCol md={3}>
                    <CFormLabel>Discount</CFormLabel>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Tax</CFormLabel>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                    />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Shipping</CFormLabel>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                    />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Other Charges</CFormLabel>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel>Amount Paid</CFormLabel>

                    <CFormInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel>Payment Method</CFormLabel>

                    <CFormSelect
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="transfer">Transfer</option>
                      <option value="pos">POS</option>
                      <option value="bank">Bank</option>
                      <option value="mixed">Mixed</option>
                      <option value="credit">Credit</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={12}>
                    <CFormLabel>Notes</CFormLabel>

                    <textarea
                      className="form-control"
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional purchase notes..."
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <div className="d-flex justify-content-end gap-2">
              <CButton color="light" onClick={() => navigate(`/purchases/${id}`)} disabled={saving}>
                Cancel
              </CButton>

              <CButton className="gold-btn" onClick={savePurchase} disabled={saving}>
                {saving ? (
                  <CSpinner size="sm" className="me-2" />
                ) : (
                  <CIcon icon={cilSave} className="me-2" />
                )}
                Save Changes
              </CButton>
            </div>
          </CCol>

          {/* SUMMARY */}
          <CCol lg={4}>
            <CCard className="border-0 shadow-sm sticky-lg-top">
              <CCardHeader className="bg-white border-0 px-4 pt-4">
                <h5 className="section-title mb-0">Purchase Summary</h5>
              </CCardHeader>

              <CCardBody className="px-4">
                <div className="summary-box">
                  <div className="summary-line">
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </div>

                  <div className="summary-line">
                    <span>Discount</span>
                    <strong>{money(discount)}</strong>
                  </div>

                  <div className="summary-line">
                    <span>Tax</span>
                    <strong>{money(tax)}</strong>
                  </div>

                  <div className="summary-line">
                    <span>Shipping</span>
                    <strong>{money(shippingCost)}</strong>
                  </div>

                  <div className="summary-line">
                    <span>Other Charges</span>
                    <strong>{money(otherCharges)}</strong>
                  </div>

                  <div className="mt-3">
                    <div className="small text-uppercase">Total</div>

                    <div className="total-value">{money(total)}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Amount Paid</span>
                    <strong className="text-success">{money(amountPaid)}</strong>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span>Balance Due</span>

                    <strong className={balanceDue > 0 ? 'text-danger' : 'text-success'}>
                      {money(balanceDue)}
                    </strong>
                  </div>

                  <div className="d-flex justify-content-between">
                    <span>Payment Status</span>
                    <CBadge
                      color={
                        paymentStatus === 'paid'
                          ? 'success'
                          : paymentStatus === 'partial'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {paymentStatus.toUpperCase()}
                    </CBadge>
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default EditPurchase
