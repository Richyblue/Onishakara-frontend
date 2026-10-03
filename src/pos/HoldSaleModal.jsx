import { useState } from 'react'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormTextarea,
  CFormSelect,
  CCard,
  CCardBody,
  CRow,
  CCol,
} from '@coreui/react'

export default function HoldSaleModal({
  show,
  onHide,
  onSave,
  customers = [],
  total = 0,
  cartCount = 0,
}) {
  const [customerId, setCustomerId] = useState('')
  const [note, setNote] = useState('')

  const handleSave = () => {
    onSave({
      customerId,
      note,
    })

    setCustomerId('')
    setNote('')
  }

  return (
    <CModal visible={show} onClose={onHide} alignment="center" size="lg" backdrop="static">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <CModalHeader
        style={{
          background: '#111827',
          color: '#fff',
          borderBottom: 'none',
          padding: '20px 24px',
        }}
      >
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#e8bd35',
                  fontWeight: '700',
                  marginBottom: '4px',
                }}
              >
                POS TRANSACTION
              </div>

              <CModalTitle
                style={{
                  color: '#fff',
                  fontSize: '21px',
                  fontWeight: '700',
                  margin: 0,
                }}
              >
                Hold Transaction
              </CModalTitle>

              <div
                style={{
                  color: '#9ca3af',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                Save this transaction and continue with another customer.
              </div>
            </div>

            {/* HOLD ICON */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '13px',
                background: 'rgba(232, 189, 53, 0.14)',
                border: '1px solid rgba(232, 189, 53, 0.30)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '21px',
                color: '#e8bd35',
                fontWeight: '800',
              }}
            >
              ⏸
            </div>
          </div>
        </div>
      </CModalHeader>

      {/* =====================================================
          BODY
      ====================================================== */}

      <CModalBody
        style={{
          background: '#f5f7fb',
          padding: '22px',
        }}
      >
        {/* =====================================================
            TRANSACTION SUMMARY
        ====================================================== */}

        <CCard
          className="border-0 mb-4"
          style={{
            borderRadius: '18px',
            overflow: 'hidden',
            background: '#111827',
            color: '#fff',
            boxShadow: '0 10px 28px rgba(17, 24, 39, 0.15)',
          }}
        >
          <CCardBody style={{ padding: '20px' }}>
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#9ca3af',
                fontWeight: '700',
                marginBottom: '14px',
              }}
            >
              Transaction Summary
            </div>

            <CRow className="align-items-center">
              {/* ITEMS */}

              <CCol xs={6}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '11px',
                      background: 'rgba(255,255,255,.08)',
                      border: '1px solid rgba(255,255,255,.10)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#e8bd35',
                      fontWeight: '800',
                      fontSize: '17px',
                    }}
                  >
                    {cartCount}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '.7px',
                      }}
                    >
                      Cart Items
                    </div>

                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        marginTop: '2px',
                      }}
                    >
                      {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
                    </div>
                  </div>
                </div>
              </CCol>

              {/* TOTAL */}

              <CCol xs={6}>
                <div
                  style={{
                    paddingLeft: '20px',
                    borderLeft: '1px solid rgba(255,255,255,.12)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '.7px',
                    }}
                  >
                    Total Amount
                  </div>

                  <div
                    style={{
                      fontSize: '25px',
                      fontWeight: '800',
                      color: '#e8bd35',
                      marginTop: '3px',
                    }}
                  >
                    ₦{Number(total).toLocaleString()}
                  </div>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =====================================================
            CUSTOMER
        ====================================================== */}

        <CCard
          className="border-0 mb-3"
          style={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(17, 24, 39, 0.05)',
            background: '#fff',
          }}
        >
          <CCardBody style={{ padding: '18px' }}>
            <div className="mb-3">
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#111827',
                }}
              >
                Customer Information
              </div>

              <small style={{ color: '#6b7280' }}>
                Link this held transaction to a customer or leave it as a walk-in sale.
              </small>
            </div>

            <label
              className="form-label"
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '.6px',
              }}
            >
              Customer
            </label>

            <CFormSelect
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={{
                height: '48px',
                borderRadius: '12px',
                border: '1px solid #dfe3e8',
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                boxShadow: 'none',
              }}
            >
              <option value="">Walk-in Customer</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullname}
                </option>
              ))}
            </CFormSelect>
          </CCardBody>
        </CCard>

        {/* =====================================================
            HOLD NOTE
        ====================================================== */}

        <CCard
          className="border-0"
          style={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(17, 24, 39, 0.05)',
            background: '#fff',
          }}
        >
          <CCardBody style={{ padding: '18px' }}>
            <div className="mb-3">
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#111827',
                }}
              >
                Hold Note
              </div>

              <small style={{ color: '#6b7280' }}>
                Add a short reason so the transaction can easily be identified later.
              </small>
            </div>

            <CFormTextarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Example: Customer stepped out, returning later..."
              style={{
                borderRadius: '12px',
                border: '1px solid #dfe3e8',
                fontSize: '14px',
                color: '#111827',
                resize: 'vertical',
                boxShadow: 'none',
              }}
            />

            <div
              className="mt-2"
              style={{
                fontSize: '11px',
                color: '#9ca3af',
              }}
            >
              This note will help staff identify the transaction when it is restored.
            </div>
          </CCardBody>
        </CCard>
      </CModalBody>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <CModalFooter
        style={{
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '15px 22px',
        }}
      >
        <CButton
          onClick={onHide}
          style={{
            minWidth: '105px',
            height: '44px',
            borderRadius: '11px',
            background: '#fff',
            color: '#111827',
            border: '1px solid #dfe3e8',
            fontWeight: '600',
          }}
        >
          Cancel
        </CButton>

        <CButton
          onClick={handleSave}
          style={{
            minWidth: '155px',
            height: '44px',
            borderRadius: '11px',
            border: 'none',
            background: 'linear-gradient(135deg, #e8bd35, #c9a227)',
            color: '#111827',
            fontWeight: '800',
            boxShadow: '0 6px 18px rgba(232, 189, 53, 0.25)',
          }}
        >
          ⏸&nbsp; Hold Sale
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
