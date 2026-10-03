import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CTable,
} from '@coreui/react'

export default function ShowHeldSalesModal({ show, onHide, heldSales = [], onRestore }) {
  return (
    <CModal visible={show} onClose={onHide} size="xl" alignment="center" backdrop="static">
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
                POS TRANSACTIONS
              </div>

              <CModalTitle
                style={{
                  color: '#fff',
                  fontSize: '21px',
                  fontWeight: '700',
                  margin: 0,
                }}
              >
                Held Transactions
              </CModalTitle>

              <div
                style={{
                  color: '#9ca3af',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                View and restore transactions that were placed on hold.
              </div>
            </div>

            {/* COUNT */}

            <div
              style={{
                minWidth: '52px',
                height: '46px',
                padding: '0 12px',
                borderRadius: '13px',
                background: 'rgba(232, 189, 53, 0.14)',
                border: '1px solid rgba(232, 189, 53, 0.30)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e8bd35',
                fontSize: '18px',
                fontWeight: '800',
              }}
            >
              {heldSales.length}
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
        {/* SUMMARY BAR */}

        <div
          className="mb-3"
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '14px',
            padding: '14px 18px',
            boxShadow: '0 3px 12px rgba(17, 24, 39, 0.04)',
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '600',
                }}
              >
                Held Sales
              </div>

              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#111827',
                  marginTop: '2px',
                }}
              >
                {heldSales.length}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#9ca3af',
                    marginLeft: '5px',
                  }}
                >
                  {heldSales.length === 1 ? 'transaction' : 'transactions'}
                </span>
              </div>
            </div>

            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(232, 189, 53, 0.12)',
                color: '#c9a227',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
              }}
            >
              ⏸
            </div>
          </div>
        </div>

        {/* =====================================================
            TABLE
        ====================================================== */}

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 5px 18px rgba(17, 24, 39, 0.05)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <CTable
              hover
              responsive
              className="mb-0 align-middle"
              style={{
                minWidth: '850px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#111827',
                    color: '#fff',
                  }}
                >
                  <th
                    style={{
                      padding: '14px 16px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.6px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Hold No
                  </th>

                  <th
                    style={{
                      padding: '14px 16px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.6px',
                      fontWeight: '700',
                    }}
                  >
                    Customer
                  </th>

                  <th
                    className="text-center"
                    style={{
                      padding: '14px 16px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.6px',
                      fontWeight: '700',
                    }}
                  >
                    Items
                  </th>

                  <th
                    className="text-end"
                    style={{
                      padding: '14px 16px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.6px',
                      fontWeight: '700',
                    }}
                  >
                    Amount
                  </th>

                  <th
                    style={{
                      padding: '14px 16px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.6px',
                      fontWeight: '700',
                    }}
                  >
                    Date
                  </th>

                  <th
                    className="text-center"
                    style={{
                      padding: '14px 16px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '.6px',
                      fontWeight: '700',
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {heldSales.length > 0 ? (
                  heldSales.map((sale) => (
                    <tr
                      key={sale.id}
                      style={{
                        borderBottom: '1px solid #f0f1f3',
                      }}
                    >
                      {/* HOLD NUMBER */}

                      <td
                        style={{
                          padding: '16px',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: '800',
                            color: '#111827',
                            fontSize: '13px',
                          }}
                        >
                          {sale.holdNumber}
                        </div>

                        <small
                          style={{
                            color: '#9ca3af',
                            fontSize: '10px',
                          }}
                        >
                          Transaction #{sale.id}
                        </small>
                      </td>

                      {/* CUSTOMER */}

                      <td
                        style={{
                          padding: '16px',
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              minWidth: '34px',
                              borderRadius: '10px',
                              background: '#f3f4f6',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '13px',
                            }}
                          >
                            {(sale.Customer?.fullname || 'W').charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: '600',
                                color: '#111827',
                                fontSize: '13px',
                              }}
                            >
                              {sale.Customer?.fullname || 'Walk-in'}
                            </div>

                            {!sale.Customer?.fullname && (
                              <small
                                style={{
                                  color: '#9ca3af',
                                  fontSize: '10px',
                                }}
                              >
                                No customer assigned
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ITEMS */}

                      <td
                        className="text-center"
                        style={{
                          padding: '16px',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            minWidth: '32px',
                            height: '28px',
                            padding: '0 9px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            background: '#f3f4f6',
                            color: '#111827',
                            fontSize: '12px',
                            fontWeight: '700',
                          }}
                        >
                          {sale.items?.length || 0}
                        </span>
                      </td>

                      {/* AMOUNT */}

                      <td
                        className="text-end"
                        style={{
                          padding: '16px',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: '800',
                            color: '#111827',
                            fontSize: '14px',
                          }}
                        >
                          ₦{Number(sale.totalAmount).toLocaleString()}
                        </div>
                      </td>

                      {/* DATE */}

                      <td
                        style={{
                          padding: '16px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#374151',
                          }}
                        >
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </div>

                        <small
                          style={{
                            fontSize: '10px',
                            color: '#9ca3af',
                          }}
                        >
                          {new Date(sale.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </td>

                      {/* RESTORE */}

                      <td
                        className="text-center"
                        style={{
                          padding: '16px',
                        }}
                      >
                        <CButton
                          size="sm"
                          onClick={() => onRestore(sale)}
                          style={{
                            minWidth: '100px',
                            height: '36px',
                            borderRadius: '9px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #e8bd35, #c9a227)',
                            color: '#111827',
                            fontWeight: '800',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(232, 189, 53, 0.20)',
                          }}
                        >
                          ↻&nbsp; Restore
                        </CButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div
                        style={{
                          padding: '60px 20px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 15px',
                            borderRadius: '18px',
                            background: '#f3f4f6',
                            color: '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '26px',
                          }}
                        >
                          ⏸
                        </div>

                        <h6
                          style={{
                            color: '#111827',
                            fontWeight: '700',
                            marginBottom: '5px',
                          }}
                        >
                          No Held Transactions
                        </h6>

                        <div
                          style={{
                            color: '#9ca3af',
                            fontSize: '12px',
                          }}
                        >
                          Transactions placed on hold will appear here.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </CTable>
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
        <div
          className="me-auto"
          style={{
            fontSize: '11px',
            color: '#9ca3af',
          }}
        >
          Select <strong style={{ color: '#6b7280' }}>Restore</strong> to return a held transaction
          to the POS.
        </div>

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
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
