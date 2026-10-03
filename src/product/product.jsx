import React, { useState } from 'react'
import axios from 'axios'
import { successAlert } from 'src/utils/alerts'
import { errorAlert } from 'src/utils/alerts'

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
} from '@coreui/react'

const AddProduct = () => {
  const [loading, setLoading] = useState(false)
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    reorderLevel: 5,
    status: 'active',
    image: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image: e.target.files[0],
    }))
  }

  const profit = Number(formData.sellingPrice || 0) - Number(formData.costPrice || 0)

  const profitMargin =
    Number(formData.costPrice) > 0 ? ((profit / Number(formData.costPrice)) * 100).toFixed(2) : 0

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const payload = new FormData()

      Object.keys(formData).forEach((key) => {
        payload.append(key, formData[key])
      })

      const response = await axios.post(`${API_URL}api/v1/products`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      successAlert(response.data.message)

      setFormData({
        name: '',
        sku: '',
        barcode: '',
        costPrice: '',
        sellingPrice: '',
        quantity: '',
        reorderLevel: 5,
        status: 'active',
        image: null,
      })
    } catch (error) {
      console.error(error)

      errorAlert(error.response?.data?.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

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
              Create a new product and configure its pricing, inventory and availability.
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
          {/* =====================================================
              LEFT COLUMN
          ====================================================== */}

          <CCol lg={8}>
            {/* =====================================================
                PRODUCT INFORMATION
            ====================================================== */}

            <CCard
              className="mb-4 border-0"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
                overflow: 'hidden',
              }}
            >
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
                      Basic identification details
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
                    <CFormLabel
                      style={{
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                      }}
                    >
                      Product Name
                    </CFormLabel>

                    <CFormInput
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      required
                      style={{
                        minHeight: '46px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </CCol>

                  <CCol md={3} className="mb-3">
                    <CFormLabel
                      style={{
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                      }}
                    >
                      SKU
                    </CFormLabel>

                    <CFormInput
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="SKU"
                      style={{
                        minHeight: '46px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </CCol>

                  <CCol md={3} className="mb-3">
                    <CFormLabel
                      style={{
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                      }}
                    >
                      Barcode
                    </CFormLabel>

                    <CFormInput
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      placeholder="Barcode"
                      style={{
                        minHeight: '46px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* =====================================================
                PRICING
            ====================================================== */}

            <CCard
              className="mb-4 border-0"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
                overflow: 'hidden',
              }}
            >
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
                      Configure product cost and selling price
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
                    <CFormLabel
                      style={{
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                      }}
                    >
                      Cost Price
                    </CFormLabel>

                    <CInputGroup>
                      <CInputGroupText
                        style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          color: '#6b7280',
                          fontWeight: '600',
                        }}
                      >
                        ₦
                      </CInputGroupText>

                      <CFormInput
                        type="number"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        style={{
                          minHeight: '46px',
                          borderRadius: '0 10px 10px 0',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol md={6} className="mb-3">
                    <CFormLabel
                      style={{
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                      }}
                    >
                      Selling Price
                    </CFormLabel>

                    <CInputGroup>
                      <CInputGroupText
                        style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          color: '#6b7280',
                          fontWeight: '600',
                        }}
                      >
                        ₦
                      </CInputGroupText>

                      <CFormInput
                        type="number"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        style={{
                          minHeight: '46px',
                          borderRadius: '0 10px 10px 0',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>

                {/* PROFIT SUMMARY */}

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
                        ₦{profit.toLocaleString()}
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
                        {profitMargin}%
                      </strong>
                    </CCol>
                  </CRow>
                </CAlert>
              </CCardBody>
            </CCard>

            {/* =====================================================
                INVENTORY
            ====================================================== */}

            <CCard
              className="mb-4 border-0"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
                overflow: 'hidden',
              }}
            >
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
                      Configure stock availability
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
                    <CFormLabel
                      style={{
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                      }}
                    >
                      Initial Quantity
                    </CFormLabel>

                    <CFormInput
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="0"
                      style={{
                        minHeight: '46px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel
                      style={{
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '13px',
                      }}
                    >
                      Reorder Level
                    </CFormLabel>

                    <CFormInput
                      type="number"
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      placeholder="5"
                      style={{
                        minHeight: '46px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            {/* =====================================================
                PRODUCT IMAGE
            ====================================================== */}

            <CCard
              className="mb-4 border-0"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
                overflow: 'hidden',
              }}
            >
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
                </div>
              </CCardBody>
            </CCard>
          </CCol>

          {/* =====================================================
              RIGHT COLUMN
          ====================================================== */}

          <CCol lg={4}>
            {/* =====================================================
                PRODUCT SUMMARY
            ====================================================== */}

            <CCard
              className="mb-4 border-0"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
                overflow: 'hidden',
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
                  <CFormLabel
                    style={{
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '13px',
                    }}
                  >
                    Product Status
                  </CFormLabel>

                  <CFormSelect
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    style={{
                      minHeight: '46px',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                    }}
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
                      Quantity
                    </span>

                    <strong
                      style={{
                        color: '#111827',
                        fontSize: '13px',
                      }}
                    >
                      {formData.quantity || '0'}
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
                      ₦{profit.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* SAVE BUTTON */}

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
                    'Save Product'
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
