import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CRow,
  CSpinner,
} from '@coreui/react'
import axios from 'axios'
import Swal from 'sweetalert2'

const Settings = () => {
  const API_URL = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '') + '/'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lastSaved, setLastSaved] = useState(null)

  const [formData, setFormData] = useState({
    // =========================================================
    // STORE PROFILE
    // =========================================================
    companyName: 'ONISHAKARA GOLD FASHION STORE',
    companyPhone: '',
    companyEmail: '',
    companyAddress: '',
    timezone: 'Africa/Lagos',

    // =========================================================
    // FINANCIAL
    // =========================================================
    currency: 'NGN',
    currencySymbol: '₦',
    taxRate: 0,
    loyaltyPointRate: 1,

    // =========================================================
    // SALES / POS
    // =========================================================
    autoApproveSales: true,
    allowNegativeStock: false,

    // =========================================================
    // INVENTORY
    // =========================================================
    lowStockThreshold: 5,

    // =========================================================
    // RECEIPT
    // =========================================================
    receiptFooter: '',

    // =========================================================
    // BUSINESS HOURS
    // =========================================================
    openingTime: '08:00',
    closingTime: '17:00',
    workingHours: 8,
    gracePeriod: 15,
  })

  // ---------------------------------------------------------
  // CURRENCY SYMBOLS
  // ---------------------------------------------------------
  const currencySymbols = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
  }

  // ---------------------------------------------------------
  // API CONFIG
  // ---------------------------------------------------------
  const getAuthConfig = () => {
    const token = localStorage.getItem('token')

    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  }

  // ---------------------------------------------------------
  // LOAD SETTINGS
  // ---------------------------------------------------------
  const getSettings = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await axios.get(`${API_URL}api/v1/settings`, getAuthConfig())

      const settings = response?.data?.settings || response?.data?.data || {}

      setFormData((previous) => ({
        ...previous,
        ...settings,

        // Make sure numeric fields remain numbers
        taxRate: settings.taxRate !== undefined ? Number(settings.taxRate) : previous.taxRate,

        loyaltyPointRate:
          settings.loyaltyPointRate !== undefined
            ? Number(settings.loyaltyPointRate)
            : previous.loyaltyPointRate,

        lowStockThreshold:
          settings.lowStockThreshold !== undefined
            ? Number(settings.lowStockThreshold)
            : previous.lowStockThreshold,

        workingHours:
          settings.workingHours !== undefined
            ? Number(settings.workingHours)
            : previous.workingHours,

        gracePeriod:
          settings.gracePeriod !== undefined ? Number(settings.gracePeriod) : previous.gracePeriod,

        taxRate: settings.taxRate !== undefined ? Number(settings.taxRate) : previous.taxRate,
      }))
    } catch (err) {
      console.error('Failed to load settings:', err)

      setError(err?.response?.data?.message || 'Unable to load store settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getSettings()
  }, [])

  // ---------------------------------------------------------
  // HANDLE INPUT
  // ---------------------------------------------------------
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // ---------------------------------------------------------
  // HANDLE CURRENCY
  // ---------------------------------------------------------
  const handleCurrencyChange = (event) => {
    const currency = event.target.value

    setFormData((previous) => ({
      ...previous,
      currency,
      currencySymbol: currencySymbols[currency] || previous.currencySymbol,
    }))
  }

  // ---------------------------------------------------------
  // VALIDATE SETTINGS
  // ---------------------------------------------------------
  const validateSettings = () => {
    if (!String(formData.companyName || '').trim()) {
      return 'Store name is required.'
    }

    const taxRate = Number(formData.taxRate)

    if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      return 'Tax rate must be between 0% and 100%.'
    }

    const loyaltyPointRate = Number(formData.loyaltyPointRate)

    if (Number.isNaN(loyaltyPointRate) || loyaltyPointRate < 0) {
      return 'Loyalty point rate cannot be negative.'
    }

    const lowStockThreshold = Number(formData.lowStockThreshold)

    if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      return 'Low-stock threshold cannot be negative.'
    }

    const workingHours = Number(formData.workingHours)

    if (Number.isNaN(workingHours) || workingHours < 0 || workingHours > 24) {
      return 'Working hours must be between 0 and 24.'
    }

    const gracePeriod = Number(formData.gracePeriod)

    if (Number.isNaN(gracePeriod) || gracePeriod < 0) {
      return 'Grace period cannot be negative.'
    }

    return null
  }

  // ---------------------------------------------------------
  // SAVE SETTINGS
  // ---------------------------------------------------------
  const saveSettings = async (event) => {
    event.preventDefault()

    const validationError = validateSettings()

    if (validationError) {
      setError(validationError)

      await Swal.fire({
        icon: 'warning',
        title: 'Check Settings',
        text: validationError,
        confirmButtonColor: '#b08d57',
      })

      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        companyName: String(formData.companyName || '').trim(),
        companyPhone: String(formData.companyPhone || '').trim(),
        companyEmail: String(formData.companyEmail || '').trim(),
        companyAddress: String(formData.companyAddress || '').trim(),

        currency: formData.currency,
        currencySymbol: formData.currencySymbol,

        taxRate: Number(formData.taxRate || 0),
        loyaltyPointRate: Number(formData.loyaltyPointRate || 0),

        lowStockThreshold: Number(formData.lowStockThreshold || 0),
        allowNegativeStock: Boolean(formData.allowNegativeStock),

        autoApproveSales: Boolean(formData.autoApproveSales),

        receiptFooter: String(formData.receiptFooter || '').trim(),

        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        workingHours: Number(formData.workingHours || 0),
        gracePeriod: Number(formData.gracePeriod || 0),

        timezone: formData.timezone,
      }

      const response = await axios.put(`${API_URL}api/v1/settings`, payload, getAuthConfig())

      const savedSettings = response?.data?.settings || response?.data?.data || payload

      setFormData((previous) => ({
        ...previous,
        ...savedSettings,
      }))

      setLastSaved(new Date())

      await Swal.fire({
        icon: 'success',
        title: 'Settings Saved',
        text: 'Your Onishakara store settings have been updated successfully.',
        confirmButtonColor: '#b08d57',
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error('Failed to update settings:', err)

      const message =
        err?.response?.data?.message || 'Settings could not be updated. Please try again.'

      setError(message)

      await Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: message,
        confirmButtonColor: '#b08d57',
      })
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------
  // RESET LOCAL FORM TO DEFAULTS
  // ---------------------------------------------------------
  const resetForm = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Reset Form?',
      text: 'This will restore the form to the recommended Onishakara defaults. Nothing will be saved until you click Save Settings.',
      showCancelButton: true,
      confirmButtonText: 'Reset',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b08d57',
    })

    if (!result.isConfirmed) return

    setFormData({
      companyName: 'ONISHAKARA GOLD FASHION STORE',
      companyPhone: '',
      companyEmail: '',
      companyAddress: '',
      timezone: 'Africa/Lagos',

      currency: 'NGN',
      currencySymbol: '₦',
      taxRate: 0,
      loyaltyPointRate: 1,

      autoApproveSales: true,
      allowNegativeStock: false,

      lowStockThreshold: 5,

      receiptFooter: 'Thank you for shopping with Onishakara Gold Fashion Store.',

      openingTime: '08:00',
      closingTime: '17:00',
      workingHours: 8,
      gracePeriod: 15,
    })

    setError('')
  }

  // ---------------------------------------------------------
  // STORE STATUS
  // ---------------------------------------------------------
  const storeStatus = useMemo(() => {
    const name = String(formData.companyName || '').trim()

    if (!name) {
      return {
        text: 'Incomplete',
        color: 'warning',
      }
    }

    return {
      text: 'Configured',
      color: 'success',
    }
  }, [formData.companyName])

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: '65vh' }}
      >
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mb-3"
          style={{
            width: 64,
            height: 64,
            background: '#161616',
            border: '1px solid #b08d57',
          }}
        >
          <CSpinner
            size="sm"
            style={{
              color: '#d4af37',
            }}
          />
        </div>

        <div className="fw-semibold">Loading Store Settings</div>

        <small className="text-medium-emphasis">Preparing your retail configuration...</small>
      </div>
    )
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="settings-page pb-5">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <CCard
        className="border-0 shadow-sm mb-4 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #111111 0%, #242424 60%, #111111 100%)',
          color: '#fff',
        }}
      >
        <CCardBody className="p-4 p-lg-5">
          <CRow className="align-items-center">
            <CCol lg={8}>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{
                    width: 58,
                    height: 58,
                    background: 'rgba(212,175,55,.12)',
                    border: '1px solid rgba(212,175,55,.45)',
                    color: '#d4af37',
                    fontSize: 25,
                    fontWeight: 700,
                  }}
                >
                  OG
                </div>

                <div>
                  <div
                    className="text-uppercase small fw-semibold mb-1"
                    style={{
                      color: '#d4af37',
                      letterSpacing: '2px',
                    }}
                  >
                    Administration
                  </div>

                  <h3 className="mb-1 fw-bold">Store Settings</h3>

                  <div
                    style={{
                      color: 'rgba(255,255,255,.68)',
                    }}
                  >
                    Configure your fashion retail, POS, inventory and receipt operations.
                  </div>
                </div>
              </div>
            </CCol>

            <CCol lg={4} className="mt-4 mt-lg-0 d-flex justify-content-lg-end">
              <div className="text-lg-end">
                <div className="small mb-2 opacity-75">Configuration Status</div>

                <CBadge color={storeStatus.color} className="px-3 py-2 rounded-pill">
                  {storeStatus.text}
                </CBadge>

                {lastSaved && (
                  <div className="small mt-2" style={{ color: 'rgba(255,255,255,.55)' }}>
                    Last saved{' '}
                    {lastSaved.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')} className="shadow-sm">
          <strong>Settings Error:</strong> {error}
        </CAlert>
      )}

      <CForm onSubmit={saveSettings}>
        {/* =====================================================
            1. STORE PROFILE
        ====================================================== */}
        <CCard className="border-0 shadow-sm mb-4">
          <CCardHeader className="bg-white border-bottom p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold fs-5">Store Profile</div>

                <small className="text-medium-emphasis">
                  Basic information displayed throughout your retail system.
                </small>
              </div>

              <CBadge
                className="rounded-pill px-3 py-2"
                style={{
                  background: 'rgba(176,141,87,.12)',
                  color: '#8b6b36',
                }}
              >
                STORE
              </CBadge>
            </div>
          </CCardHeader>

          <CCardBody className="p-4">
            <CRow className="g-4">
              <CCol md={6}>
                <CFormInput
                  label="Store Name"
                  name="companyName"
                  value={formData.companyName || ''}
                  onChange={handleChange}
                  required
                  placeholder="ONISHAKARA GOLD FASHION STORE"
                />
              </CCol>

              <CCol md={6}>
                <CFormInput
                  label="Store Phone"
                  name="companyPhone"
                  value={formData.companyPhone || ''}
                  onChange={handleChange}
                  placeholder="+234..."
                />
              </CCol>

              <CCol md={6}>
                <CFormInput
                  type="email"
                  label="Store Email"
                  name="companyEmail"
                  value={formData.companyEmail || ''}
                  onChange={handleChange}
                  placeholder="store@example.com"
                />
              </CCol>

              <CCol md={6}>
                <CFormSelect
                  label="Business Timezone"
                  name="timezone"
                  value={formData.timezone || 'Africa/Lagos'}
                  onChange={handleChange}
                  options={[
                    {
                      label: 'Africa/Lagos — Nigeria',
                      value: 'Africa/Lagos',
                    },
                    {
                      label: 'UTC',
                      value: 'UTC',
                    },
                  ]}
                />
              </CCol>

              <CCol xs={12}>
                <CFormTextarea
                  rows={3}
                  label="Store Address"
                  name="companyAddress"
                  value={formData.companyAddress || ''}
                  onChange={handleChange}
                  placeholder="Enter the full store address..."
                />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =====================================================
            2. CURRENCY & FINANCIAL
        ====================================================== */}
        <CCard className="border-0 shadow-sm mb-4">
          <CCardHeader className="bg-white border-bottom p-4">
            <div className="fw-bold fs-5">Currency & Financial Settings</div>

            <small className="text-medium-emphasis">
              Configure how prices, taxes and loyalty points are handled.
            </small>
          </CCardHeader>

          <CCardBody className="p-4">
            <CRow className="g-4">
              <CCol md={4}>
                <CFormSelect
                  label="Store Currency"
                  name="currency"
                  value={formData.currency || 'NGN'}
                  onChange={handleCurrencyChange}
                  options={[
                    {
                      label: 'Nigerian Naira — NGN',
                      value: 'NGN',
                    },
                    {
                      label: 'US Dollar — USD',
                      value: 'USD',
                    },
                    {
                      label: 'British Pound — GBP',
                      value: 'GBP',
                    },
                    {
                      label: 'Euro — EUR',
                      value: 'EUR',
                    },
                  ]}
                />
              </CCol>

              <CCol md={4}>
                <CFormInput
                  label="Currency Symbol"
                  name="currencySymbol"
                  value={formData.currencySymbol || ''}
                  onChange={handleChange}
                  maxLength={5}
                />
              </CCol>

              <CCol md={4}>
                <CFormInput
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  label="Tax / VAT Rate (%)"
                  name="taxRate"
                  value={formData.taxRate ?? 0}
                  onChange={handleChange}
                />

                <small className="text-medium-emphasis">
                  Set to 0 if tax is not being automatically applied.
                </small>
              </CCol>

              <CCol md={6}>
                <CFormInput
                  type="number"
                  min="0"
                  step="0.01"
                  label="Loyalty Point Rate"
                  name="loyaltyPointRate"
                  value={formData.loyaltyPointRate ?? 0}
                  onChange={handleChange}
                />

                <small className="text-medium-emphasis">
                  Points awarded according to your configured loyalty rules.
                </small>
              </CCol>

              <CCol md={6}>
                <div
                  className="h-100 rounded-3 p-3"
                  style={{
                    background: '#faf8f3',
                    border: '1px solid #eee5d5',
                  }}
                >
                  <div className="small text-medium-emphasis mb-1">Current Currency</div>

                  <div className="fs-4 fw-bold">
                    {formData.currencySymbol} {formData.currency}
                  </div>

                  <div className="small text-medium-emphasis mt-1">
                    Used across POS, receipts and sales records.
                  </div>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =====================================================
            3. SALES & POS
        ====================================================== */}
        <CCard className="border-0 shadow-sm mb-4">
          <CCardHeader className="bg-white border-bottom p-4">
            <div className="fw-bold fs-5">Sales & POS Controls</div>

            <small className="text-medium-emphasis">
              Control how sales are processed at the fashion-store POS.
            </small>
          </CCardHeader>

          <CCardBody className="p-4">
            <CRow className="g-3">
              <CCol md={6}>
                <div
                  className="rounded-3 p-3 h-100"
                  style={{
                    border: '1px solid #e9e9e9',
                    background: '#fff',
                  }}
                >
                  <CFormCheck
                    label="Automatically Approve Sales"
                    name="autoApproveSales"
                    checked={Boolean(formData.autoApproveSales)}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis d-block mt-2">
                    Completed POS transactions are automatically marked as approved.
                  </small>
                </div>
              </CCol>

              <CCol md={6}>
                <div
                  className="rounded-3 p-3 h-100"
                  style={{
                    border: '1px solid #e9e9e9',
                    background: '#fff',
                  }}
                >
                  <CFormCheck
                    label="Allow Negative Stock"
                    name="allowNegativeStock"
                    checked={Boolean(formData.allowNegativeStock)}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis d-block mt-2">
                    Recommended: keep this disabled to prevent selling items that are not available
                    in inventory.
                  </small>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =====================================================
            4. INVENTORY
        ====================================================== */}
        <CCard className="border-0 shadow-sm mb-4">
          <CCardHeader className="bg-white border-bottom p-4">
            <div className="fw-bold fs-5">Inventory Management</div>

            <small className="text-medium-emphasis">
              Configure stock alert behaviour for products and variants.
            </small>
          </CCardHeader>

          <CCardBody className="p-4">
            <CRow className="g-4">
              <CCol md={6}>
                <CFormInput
                  type="number"
                  min="0"
                  step="1"
                  label="Default Low-Stock Threshold"
                  name="lowStockThreshold"
                  value={formData.lowStockThreshold ?? 0}
                  onChange={handleChange}
                />

                <small className="text-medium-emphasis">
                  Products are considered low-stock when available quantity reaches this level.
                </small>
              </CCol>

              <CCol md={6}>
                <div
                  className="rounded-3 p-3 h-100"
                  style={{
                    background: '#faf8f3',
                    border: '1px solid #eee5d5',
                  }}
                >
                  <div className="fw-semibold mb-1">Recommended Inventory Policy</div>

                  <div className="small text-medium-emphasis">
                    Keep negative stock disabled and maintain product-specific reorder levels for
                    high-value fashion items.
                  </div>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =====================================================
            5. RECEIPT
        ====================================================== */}
        <CCard className="border-0 shadow-sm mb-4">
          <CCardHeader className="bg-white border-bottom p-4">
            <div className="fw-bold fs-5">Receipt & Printing</div>

            <small className="text-medium-emphasis">
              Configure the message printed at the bottom of customer receipts.
            </small>
          </CCardHeader>

          <CCardBody className="p-4">
            <CFormTextarea
              rows={4}
              label="Receipt Footer Message"
              name="receiptFooter"
              value={formData.receiptFooter || ''}
              onChange={handleChange}
              placeholder="Thank you for shopping with Onishakara Gold Fashion Store."
              maxLength={500}
            />

            <div className="d-flex justify-content-between mt-2">
              <small className="text-medium-emphasis">
                Keep your receipt message short and professional.
              </small>

              <small className="text-medium-emphasis">
                {(formData.receiptFooter || '').length}/500
              </small>
            </div>

            {/* Receipt Preview */}
            <div className="mt-4">
              <div className="small fw-semibold text-uppercase mb-2">Receipt Preview</div>

              <div
                className="mx-auto p-4 rounded-3"
                style={{
                  maxWidth: 360,
                  background: '#fff',
                  border: '1px dashed #cfcfcf',
                  fontFamily: 'monospace',
                }}
              >
                <div className="text-center">
                  <div className="fw-bold">
                    {formData.companyName || 'ONISHAKARA GOLD FASHION STORE'}
                  </div>

                  {formData.companyPhone && <div className="small">{formData.companyPhone}</div>}

                  <div className="my-3 border-bottom" />

                  <div className="d-flex justify-content-between small">
                    <span>ITEM</span>
                    <span>AMOUNT</span>
                  </div>

                  <div className="border-bottom my-2" />

                  <div className="d-flex justify-content-between small">
                    <span>Sample Product</span>
                    <span>{formData.currencySymbol}0.00</span>
                  </div>

                  <div className="border-bottom my-3" />

                  <div className="d-flex justify-content-between fw-bold">
                    <span>TOTAL</span>
                    <span>{formData.currencySymbol}0.00</span>
                  </div>

                  <div className="mt-4 small text-center">
                    {formData.receiptFooter || 'Thank you for shopping with us.'}
                  </div>
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>

        {/* =====================================================
            6. BUSINESS HOURS
        ====================================================== */}
        <CCard className="border-0 shadow-sm mb-4">
          <CCardHeader className="bg-white border-bottom p-4">
            <div className="fw-bold fs-5">Business Hours</div>

            <small className="text-medium-emphasis">
              Define your normal store operating schedule.
            </small>
          </CCardHeader>

          <CCardBody className="p-4">
            <CRow className="g-4">
              <CCol md={3}>
                <CFormInput
                  type="time"
                  label="Opening Time"
                  name="openingTime"
                  value={formData.openingTime || ''}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={3}>
                <CFormInput
                  type="time"
                  label="Closing Time"
                  name="closingTime"
                  value={formData.closingTime || ''}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={3}>
                <CFormInput
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  label="Working Hours"
                  name="workingHours"
                  value={formData.workingHours ?? 0}
                  onChange={handleChange}
                />
              </CCol>

              <CCol md={3}>
                <CFormInput
                  type="number"
                  min="0"
                  label="Grace Period (Minutes)"
                  name="gracePeriod"
                  value={formData.gracePeriod ?? 0}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =====================================================
            7. SYSTEM SUMMARY
        ====================================================== */}
        <CCard className="border-0 shadow-sm mb-4">
          <CCardHeader className="bg-white border-bottom p-4">
            <div className="fw-bold fs-5">Configuration Summary</div>
          </CCardHeader>

          <CCardBody className="p-4">
            <CRow className="g-3">
              <CCol sm={6} lg={3}>
                <div
                  className="rounded-3 p-3"
                  style={{
                    background: '#f8f8f8',
                  }}
                >
                  <small className="text-medium-emphasis">Currency</small>

                  <div className="fw-bold mt-1">
                    {formData.currencySymbol} {formData.currency}
                  </div>
                </div>
              </CCol>

              <CCol sm={6} lg={3}>
                <div
                  className="rounded-3 p-3"
                  style={{
                    background: '#f8f8f8',
                  }}
                >
                  <small className="text-medium-emphasis">Tax Rate</small>

                  <div className="fw-bold mt-1">{Number(formData.taxRate || 0).toFixed(2)}%</div>
                </div>
              </CCol>

              <CCol sm={6} lg={3}>
                <div
                  className="rounded-3 p-3"
                  style={{
                    background: '#f8f8f8',
                  }}
                >
                  <small className="text-medium-emphasis">Low Stock Alert</small>

                  <div className="fw-bold mt-1">{formData.lowStockThreshold} units</div>
                </div>
              </CCol>

              <CCol sm={6} lg={3}>
                <div
                  className="rounded-3 p-3"
                  style={{
                    background: '#f8f8f8',
                  }}
                >
                  <small className="text-medium-emphasis">Negative Stock</small>

                  <div className="fw-bold mt-1">
                    {formData.allowNegativeStock ? 'Allowed' : 'Blocked'}
                  </div>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =====================================================
            SAVE BAR
        ====================================================== */}
        <div
          className="sticky-bottom py-3"
          style={{
            background: 'rgba(255,255,255,.94)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #e8e8e8',
            zIndex: 10,
          }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="fw-semibold">Store configuration</div>

              <small className="text-medium-emphasis">
                Review your settings before saving changes.
              </small>
            </div>

            <div className="d-flex gap-2">
              <CButton
                type="button"
                color="light"
                className="px-4"
                onClick={resetForm}
                disabled={saving}
              >
                Restore Defaults
              </CButton>

              <CButton
                type="submit"
                className="px-4 fw-semibold"
                disabled={saving}
                style={{
                  background: '#111111',
                  borderColor: '#111111',
                  color: '#d4af37',
                }}
              >
                {saving ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Saving Settings...
                  </>
                ) : (
                  'Save Store Settings'
                )}
              </CButton>
            </div>
          </div>
        </div>
      </CForm>
    </div>
  )
}

export default Settings
