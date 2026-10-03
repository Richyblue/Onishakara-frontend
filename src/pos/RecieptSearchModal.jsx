import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CButton,
} from '@coreui/react'

export default function ReceiptSearchModal({
  visible,
  onClose,
  receiptNumber,
  setReceiptNumber,
  onSearch,
}) {
  return (
    <CModal visible={visible} onClose={onClose} alignment="center" size="md" backdrop="static">
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
                POS RECEIPTS
              </div>

              <CModalTitle
                style={{
                  color: '#fff',
                  fontSize: '21px',
                  fontWeight: '700',
                  margin: 0,
                }}
              >
                Reprint Receipt
              </CModalTitle>

              <div
                style={{
                  color: '#9ca3af',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                Find a previous transaction to reprint its receipt.
              </div>
            </div>

            {/* RECEIPT ICON */}

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
                color: '#e8bd35',
                fontSize: '20px',
                fontWeight: '800',
              }}
            >
              ▤
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
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 5px 18px rgba(17, 24, 39, 0.05)',
          }}
        >
          {/* TITLE */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                minWidth: '40px',
                borderRadius: '11px',
                background: 'rgba(232, 189, 53, 0.12)',
                color: '#c9a227',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '800',
              }}
            >
              🔍
            </div>

            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#111827',
                }}
              >
                Find Receipt
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginTop: '2px',
                }}
              >
                Enter the receipt number below.
              </div>
            </div>
          </div>

          {/* RECEIPT NUMBER */}

          <label
            className="form-label"
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '.7px',
            }}
          >
            Receipt Number
          </label>

          <CFormInput
            autoFocus
            size="lg"
            placeholder="e.g. REC-000125"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch()
              }
            }}
            style={{
              height: '50px',
              borderRadius: '12px',
              border: '1px solid #dfe3e8',
              fontSize: '15px',
              fontWeight: '600',
              color: '#111827',
              boxShadow: 'none',
            }}
          />

          <div
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              marginTop: '8px',
            }}
          >
            Enter the receipt number from the original transaction.
          </div>
        </div>
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
          onClick={onClose}
          style={{
            minWidth: '100px',
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
          onClick={onSearch}
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
          🔍&nbsp; Search Receipt
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
