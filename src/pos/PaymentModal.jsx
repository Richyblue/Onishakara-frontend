import { useEffect, useState } from 'react'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
  CFormTextarea,
  CRow,
  CCol,
  CCard,
  CCardBody,
} from '@coreui/react'

export default function PaymentModal({ show, onHide, total, onSubmit, processing, currentUser }) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [note, setNote] = useState('')

  // =========================================================
  // COLORS
  // =========================================================

  const colors = {
    dark: '#111827',
    darkSoft: '#1f2937',
    gold: '#e8bd35',
    goldDark: '#c9a227',
    background: '#f5f7fb',
    border: '#e5e7eb',
    muted: '#6b7280',
    text: '#111827',
    white: '#ffffff',
  }

  // =========================================================
  // RESET PAYMENT FORM WHEN MODAL OPENS
  // =========================================================

  useEffect(() => {
    if (show) {
      setPaymentMethod('cash')
      setNote('')
    }
  }, [show])

  // =========================================================
  // SUBMIT PAYMENT
  // =========================================================

  const handleSubmit = () => {
    onSubmit({
      paymentMethod,
      note,
    })
  }

  // =========================================================
  // STYLES
  // =========================================================

  const selectStyle = {
    minHeight: '48px',
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: 'none',
  }

  const sectionCardStyle = {
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 4px 18px rgba(17, 24, 39, 0.05)',
    background: '#fff',
  }

  const paymentOptionStyle = (active) => ({
    flex: 1,
    minHeight: '78px',
    borderRadius: '14px',
    border: active ? `2px solid ${colors.gold}` : `1px solid ${colors.border}`,
    background: active ? 'rgba(232, 189, 53, 0.10)' : '#fff',
    cursor: processing ? 'default' : 'pointer',
    transition: 'all .2s ease',
    boxShadow: active ? '0 5px 16px rgba(232, 189, 53, 0.15)' : 'none',
    opacity: processing ? 0.7 : 1,
  })

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <CModal visible={show} onClose={onHide} alignment="center" size="lg" backdrop="static">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <CModalHeader
        style={{
          background: colors.dark,
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
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: colors.gold,
                  fontWeight: '700',
                  marginBottom: '4px',
                }}
              >
                ONISHAKARA GOLD FASHION STORE
              </div>

              <CModalTitle
                style={{
                  color: '#fff',
                  fontSize: '22px',
                  fontWeight: '700',
                  margin: 0,
                }}
              >
                Complete Payment
              </CModalTitle>
            </div>

            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(232, 189, 53, 0.14)',
                border: '1px solid rgba(232, 189, 53, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '21px',
                color: colors.gold,
                fontWeight: '800',
              }}
            >
              ₦
            </div>
          </div>
        </div>
      </CModalHeader>

      {/* =====================================================
          BODY
      ====================================================== */}

      <CModalBody
        style={{
          background: colors.background,
          padding: '22px',
        }}
      >
        {/* ===================================================
            PAYMENT SUMMARY
        ==================================================== */}

        <CCard
          className="border-0 mb-4"
          style={{
            borderRadius: '18px',
            overflow: 'hidden',
            background: colors.dark,
            color: '#fff',
            boxShadow: '0 10px 30px rgba(17, 24, 39, 0.16)',
          }}
        >
          <CCardBody style={{ padding: '20px' }}>
            <CRow className="align-items-center">
              <CCol xs={7}>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: '700',
                  }}
                >
                  Amount Payable
                </div>

                <div
                  style={{
                    fontSize: '30px',
                    fontWeight: '800',
                    color: colors.gold,
                    marginTop: '5px',
                    letterSpacing: '-1px',
                  }}
                >
                  ₦{Number(total || 0).toLocaleString()}
                </div>
              </CCol>

              <CCol xs={5}>
                <div
                  style={{
                    paddingLeft: '18px',
                    borderLeft: '1px solid rgba(255,255,255,.12)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: '700',
                    }}
                  >
                    Cashier
                  </div>

                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#fff',
                    }}
                  >
                    {currentUser?.fullname || currentUser?.name || 'Current User'}
                  </div>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* ===================================================
            PAYMENT METHOD
        ==================================================== */}

        <CCard className="border-0 mb-3" style={sectionCardStyle}>
          <CCardBody style={{ padding: '18px' }}>
            <div className="mb-3">
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: colors.text,
                }}
              >
                Payment Method
              </div>

              <small style={{ color: colors.muted }}>
                Select how the customer is paying for this purchase.
              </small>
            </div>

            {/* PAYMENT OPTIONS */}

            <div className="d-flex flex-column flex-md-row gap-2 mb-3">
              {/* CASH */}

              <div
                style={paymentOptionStyle(paymentMethod === 'cash')}
                onClick={() => {
                  if (!processing) {
                    setPaymentMethod('cash')
                  }
                }}
              >
                <div className="p-3">
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: paymentMethod === 'cash' ? colors.dark : colors.text,
                    }}
                  >
                    Cash
                  </div>

                  <small style={{ color: colors.muted }}>Customer pays with cash</small>
                </div>
              </div>

              {/* TRANSFER */}

              <div
                style={paymentOptionStyle(paymentMethod === 'transfer')}
                onClick={() => {
                  if (!processing) {
                    setPaymentMethod('transfer')
                  }
                }}
              >
                <div className="p-3">
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: paymentMethod === 'transfer' ? colors.dark : colors.text,
                    }}
                  >
                    Bank Transfer
                  </div>

                  <small style={{ color: colors.muted }}>Direct bank transfer</small>
                </div>
              </div>

              {/* POS */}

              <div
                style={paymentOptionStyle(paymentMethod === 'pos')}
                onClick={() => {
                  if (!processing) {
                    setPaymentMethod('pos')
                  }
                }}
              >
                <div className="p-3">
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: paymentMethod === 'pos' ? colors.dark : colors.text,
                    }}
                  >
                    POS
                  </div>

                  <small style={{ color: colors.muted }}>Card / POS terminal</small>
                </div>
              </div>

              {/* MIXED */}

              <div
                style={paymentOptionStyle(paymentMethod === 'mixed')}
                onClick={() => {
                  if (!processing) {
                    setPaymentMethod('mixed')
                  }
                }}
              >
                <div className="p-3">
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: paymentMethod === 'mixed' ? colors.dark : colors.text,
                    }}
                  >
                    Mixed
                  </div>

                  <small style={{ color: colors.muted }}>More than one payment method</small>
                </div>
              </div>
            </div>

            {/* SELECT VERSION */}

            <div>
              <label
                className="form-label"
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '.5px',
                }}
              >
                Selected Payment Method
              </label>

              <CFormSelect
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={processing}
                style={selectStyle}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Bank Transfer</option>
                <option value="pos">POS</option>
                <option value="mixed">Mixed Payment</option>
              </CFormSelect>
            </div>
          </CCardBody>
        </CCard>

        {/* ===================================================
            PAYMENT INFORMATION
        ==================================================== */}

        <CCard className="border-0 mb-3" style={sectionCardStyle}>
          <CCardBody style={{ padding: '18px' }}>
            <div className="mb-3">
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: colors.text,
                }}
              >
                Sale Information
              </div>

              <small style={{ color: colors.muted }}>
                Add any useful information about this transaction.
              </small>
            </div>

            {/* PAYMENT METHOD DISPLAY */}

            <div
              className="d-flex justify-content-between align-items-center mb-3"
              style={{
                padding: '13px 15px',
                borderRadius: '12px',
                background: '#f9fafb',
                border: `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: colors.muted,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                Payment Method
              </span>

              <span
                style={{
                  fontSize: '14px',
                  color: colors.dark,
                  fontWeight: '700',
                }}
              >
                {paymentMethod === 'cash'
                  ? 'Cash'
                  : paymentMethod === 'transfer'
                    ? 'Bank Transfer'
                    : paymentMethod === 'pos'
                      ? 'POS'
                      : 'Mixed Payment'}
              </span>
            </div>

            {/* REMARKS */}

            <div>
              <label
                className="form-label"
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '.5px',
                }}
              >
                Remarks
              </label>

              <CFormTextarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={processing}
                placeholder="Optional note about this sale..."
                style={{
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  resize: 'vertical',
                  boxShadow: 'none',
                }}
              />
            </div>
          </CCardBody>
        </CCard>

        {/* ===================================================
            TRANSACTION NOTICE
        ==================================================== */}

        <div
          className="d-flex align-items-center gap-2"
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(232, 189, 53, 0.08)',
            border: '1px solid rgba(232, 189, 53, 0.25)',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              minWidth: '30px',
              borderRadius: '9px',
              background: colors.gold,
              color: colors.dark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
            }}
          >
            ✓
          </div>

          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: colors.dark,
              }}
            >
              Ready to complete sale
            </div>

            <small style={{ color: colors.muted }}>
              Confirm the payment method before completing this transaction.
            </small>
          </div>
        </div>
      </CModalBody>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <CModalFooter
        style={{
          background: '#fff',
          borderTop: `1px solid ${colors.border}`,
          padding: '16px 22px',
        }}
      >
        <CButton
          onClick={onHide}
          disabled={processing}
          style={{
            minWidth: '110px',
            height: '46px',
            borderRadius: '12px',
            background: '#fff',
            color: colors.dark,
            border: `1px solid ${colors.border}`,
            fontWeight: '600',
          }}
        >
          Cancel
        </CButton>

        <CButton
          disabled={processing}
          onClick={handleSubmit}
          style={{
            minWidth: '200px',
            height: '46px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldDark})`,
            border: 'none',
            color: colors.dark,
            fontWeight: '800',
            boxShadow: '0 6px 18px rgba(232, 189, 53, 0.25)',
          }}
        >
          {processing ? (
            <span className="d-flex align-items-center justify-content-center gap-2">
              <span className="spinner-border spinner-border-sm" role="status" />
              Processing...
            </span>
          ) : (
            <>
              Complete Sale&nbsp; • &nbsp;₦
              {Number(total || 0).toLocaleString()}
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
