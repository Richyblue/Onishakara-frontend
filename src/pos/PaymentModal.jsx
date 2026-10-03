import { useEffect, useMemo, useState } from 'react'

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
  CAlert,
} from '@coreui/react'

export default function PaymentModal({
  show,
  onHide,
  total,
  onSubmit,
  processing,
  staff = [],
  currentUser,
  cart = [],
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash')

  // =========================================================
  // LEGACY SINGLE SERVICE PROVIDER
  // =========================================================

  const [serviceProviderId, setServiceProviderId] = useState('')

  // =========================================================
  // MULTI-SERVICE STAFF ASSIGNMENTS
  //
  // {
  //   12: "4",
  //   15: "8",
  //   20: "11"
  // }
  //
  // serviceId -> staffId
  // =========================================================

  const [serviceStaffAssignments, setServiceStaffAssignments] = useState({})

  const [serviceType, setServiceType] = useState('in_salon')
  const [note, setNote] = useState('')
  const [standTag, setStandTag] = useState('')
  const [cardNumber, setCardNumber] = useState('')

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
    green: '#16a34a',
    red: '#dc2626',
  }

  // =========================================================
  // DETERMINE IF HOME SERVICE
  // =========================================================

  const isHomeService = serviceType === 'home_service'

  // =========================================================
  // ACTIVE STAFF
  // =========================================================

  const activeStaff = useMemo(() => {
    if (!Array.isArray(staff)) return []

    return staff.filter((item) => {
      const isActive = item.User?.isActive === true || item.User?.isActive === 1

      const fullname = item.User?.fullname?.trim()

      return isActive && fullname
    })
  }, [staff])

  // =========================================================
  // GET SERVICE ID FROM CART ITEM
  //
  // Supports different structures that may exist in the
  // existing POS cart.
  // =========================================================

  const getCartServiceId = (item) => {
    const possibleId =
      item?.serviceId || item?.ServiceId || item?.service?.id || item?.Service?.id || item?.id

    const serviceId = Number(possibleId)

    return Number.isInteger(serviceId) && serviceId > 0 ? serviceId : null
  }

  // =========================================================
  // SERVICES IN CURRENT CART
  //
  // IMPORTANT:
  // Do not identify every item with serviceId as a service
  // unless it actually represents a service.
  // =========================================================

  const cartServices = useMemo(() => {
    if (!Array.isArray(cart)) return []

    return cart.filter((item) => {
      const isService =
        item?.type === 'service' ||
        item?.itemType === 'service' ||
        item?.ServiceId ||
        item?.serviceId

      return isService && getCartServiceId(item)
    })
  }, [cart])

  // =========================================================
  // WHEN HOME SERVICE IS SELECTED
  // CLEAR STAND + CARD
  // =========================================================

  useEffect(() => {
    if (isHomeService) {
      setStandTag('')
      setCardNumber('')
    }
  }, [isHomeService])

  // =========================================================
  // RESET FORM WHEN MODAL OPENS
  // =========================================================

  useEffect(() => {
    if (show) {
      setPaymentMethod('cash')
      setServiceProviderId('')
      setServiceStaffAssignments({})
      setServiceType('in_salon')
      setNote('')
      setStandTag('')
      setCardNumber('')
    }
  }, [show])

  // =========================================================
  // HANDLE STAFF ASSIGNMENT
  // =========================================================

  const handleServiceStaffChange = (serviceId, staffId) => {
    const normalizedServiceId = Number(serviceId)

    setServiceStaffAssignments((prev) => {
      const updated = { ...prev }

      if (!staffId) {
        delete updated[normalizedServiceId]
      } else {
        updated[normalizedServiceId] = String(staffId)
      }

      return updated
    })
  }

  // =========================================================
  // GET STAFF NAME
  // =========================================================

  const getStaffName = (staffId) => {
    const selectedStaff = activeStaff.find((item) => String(item.id) === String(staffId))

    return selectedStaff?.User?.fullname?.trim() || ''
  }

  // =========================================================
  // GET SELECTED STAFF FOR A SERVICE
  //
  // Explicit service assignment has priority.
  //
  // For ONE service only, the legacy provider is also
  // considered an assignment.
  // =========================================================

  const getSelectedStaffForService = (serviceId) => {
    const explicitStaff = serviceStaffAssignments[serviceId]

    if (explicitStaff) {
      return String(explicitStaff)
    }

    if (cartServices.length === 1 && serviceProviderId) {
      return String(serviceProviderId)
    }

    return ''
  }

  // =========================================================
  // CHECK WHETHER EVERY SERVICE HAS A PROVIDER
  // =========================================================

  const unassignedServices = useMemo(() => {
    return cartServices.filter((item) => {
      const serviceId = getCartServiceId(item)

      if (!serviceId) {
        return true
      }

      const selectedStaff = serviceStaffAssignments[serviceId]

      // For a single-service sale, the legacy provider
      // counts as the provider.
      if (!selectedStaff && cartServices.length === 1) {
        return !serviceProviderId
      }

      return !selectedStaff
    })
  }, [cartServices, serviceStaffAssignments, serviceProviderId])

  const hasMultipleServices = cartServices.length > 1

  const hasUnassignedService = cartServices.length > 0 && unassignedServices.length > 0

  // =========================================================
  // HANDLE SUBMIT
  // =========================================================

  const handleSubmit = () => {
    /*
     * Build an assignment for EVERY service.
     *
     * Priority:
     *
     * 1. Per-service provider
     * 2. Legacy provider for single-service sale
     */

    const assignments = []

    cartServices.forEach((item) => {
      const serviceId = getCartServiceId(item)

      if (!serviceId) return

      let selectedStaffId = serviceStaffAssignments[serviceId] || ''

      /*
       * Backward compatibility:
       *
       * If there is only one service and the old
       * Primary Service Provider is selected,
       * use it for that service.
       */

      if (!selectedStaffId && cartServices.length === 1) {
        selectedStaffId = serviceProviderId || ''
      }

      const numericStaffId = Number(selectedStaffId)

      if (Number.isInteger(numericStaffId) && numericStaffId > 0) {
        assignments.push({
          serviceId: Number(serviceId),
          staffId: numericStaffId,
        })
      }
    })

    // =======================================================
    // REMOVE DUPLICATE SERVICE ASSIGNMENTS
    // =======================================================

    const uniqueAssignments = Array.from(
      new Map(assignments.map((assignment) => [String(assignment.serviceId), assignment])).values(),
    )

    // =======================================================
    // FINAL VALIDATION
    // =======================================================

    const missingServices = cartServices.filter((item) => {
      const serviceId = getCartServiceId(item)

      return !uniqueAssignments.some(
        (assignment) => Number(assignment.serviceId) === Number(serviceId),
      )
    })

    if (missingServices.length > 0) {
      return
    }

    // =======================================================
    // LEGACY PROVIDER
    //
    // Keep this because existing backend/POS logic uses it.
    //
    // For a single service, automatically synchronize it
    // with the actual service assignment.
    // =======================================================

    let legacyProviderId = serviceProviderId

    if (cartServices.length === 1 && uniqueAssignments.length === 1) {
      legacyProviderId = String(uniqueAssignments[0].staffId)
    }

    // =======================================================
    // SUBMIT
    // =======================================================

    onSubmit({
      paymentMethod,

      // Existing field preserved
      serviceProviderId: legacyProviderId || '',

      // New multi-service assignment
      serviceStaffAssignments: uniqueAssignments,

      standTag: isHomeService ? '' : standTag,

      cardNumber: isHomeService ? '' : cardNumber,

      note,

      serviceType,
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

  const optionCardStyle = (active) => ({
    flex: 1,
    minHeight: '72px',
    borderRadius: '14px',
    border: active ? `2px solid ${colors.gold}` : `1px solid ${colors.border}`,
    background: active ? 'rgba(232, 189, 53, 0.10)' : '#fff',
    cursor: 'pointer',
    transition: 'all .2s ease',
    boxShadow: active ? '0 5px 16px rgba(232, 189, 53, 0.15)' : 'none',
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
                POS CHECKOUT
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
              }}
            >
              ₦
            </div>
          </div>
        </div>
      </CModalHeader>

      <CModalBody
        style={{
          background: colors.background,
          padding: '22px',
        }}
      >
        {/* =====================================================
            PAYMENT SUMMARY
        ====================================================== */}

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
                  ₦{Number(total).toLocaleString()}
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
                    Sales By
                  </div>

                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#fff',
                    }}
                  >
                    {currentUser?.fullname || 'Current User'}
                  </div>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =====================================================
            SERVICE TYPE
        ====================================================== */}

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
                Service Location
              </div>

              <small style={{ color: colors.muted }}>
                Select where the service will be provided.
              </small>
            </div>

            <div className="d-flex gap-2">
              <div
                style={optionCardStyle(serviceType === 'in_salon')}
                onClick={() => setServiceType('in_salon')}
              >
                <div className="p-3">
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: serviceType === 'in_salon' ? colors.dark : colors.text,
                    }}
                  >
                    In-Salon
                  </div>

                  <small style={{ color: colors.muted }}>Service at the salon</small>
                </div>
              </div>

              <div
                style={optionCardStyle(serviceType === 'home_service')}
                onClick={() => setServiceType('home_service')}
              >
                <div className="p-3">
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: serviceType === 'home_service' ? colors.dark : colors.text,
                    }}
                  >
                    Home Service
                  </div>

                  <small style={{ color: colors.muted }}>Service at customer's location</small>
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>

        {/* =====================================================
            HOME SERVICE NOTICE
        ====================================================== */}

        {isHomeService && (
          <CAlert
            className="mb-3 border-0"
            style={{
              borderRadius: '14px',
              background: 'rgba(232, 189, 53, 0.12)',
              border: '1px solid rgba(232, 189, 53, 0.35)',
              color: colors.dark,
            }}
          >
            <div className="d-flex align-items-start gap-2">
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  minWidth: '30px',
                  borderRadius: '9px',
                  background: colors.gold,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                }}
              >
                !
              </div>

              <div>
                <strong>Home Service Selected</strong>

                <div
                  className="small mt-1"
                  style={{
                    color: colors.muted,
                  }}
                >
                  Stand number and card number are not required for home services.
                </div>
              </div>
            </div>
          </CAlert>
        )}

        {/* =====================================================
            SERVICE STAFF ASSIGNMENT
        ====================================================== */}

        {cartServices.length > 0 && (
          <CCard className="border-0 mb-3" style={sectionCardStyle}>
            <CCardBody style={{ padding: '18px' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: colors.text,
                    }}
                  >
                    Service Providers
                  </div>

                  <small
                    style={{
                      color: colors.muted,
                    }}
                  >
                    Assign the staff member who will receive commission for each service.
                  </small>
                </div>

                {hasMultipleServices && (
                  <div
                    style={{
                      padding: '6px 10px',
                      borderRadius: '999px',
                      background: hasUnassignedService
                        ? 'rgba(220, 38, 38, .08)'
                        : 'rgba(22, 163, 74, .08)',
                      color: hasUnassignedService ? colors.red : colors.green,
                      fontSize: '11px',
                      fontWeight: '700',
                    }}
                  >
                    {hasUnassignedService
                      ? `${unassignedServices.length} Unassigned`
                      : 'All Assigned'}
                  </div>
                )}
              </div>

              <div className="d-flex flex-column gap-3">
                {cartServices.map((item, index) => {
                  const serviceId = getCartServiceId(item)

                  const selectedStaffId = getSelectedStaffForService(serviceId)

                  const serviceName =
                    item.name ||
                    item.serviceName ||
                    item.Service?.name ||
                    item.service?.name ||
                    `Service ${index + 1}`

                  const quantity = Number(item.quantity || 1)

                  /*
                   * Use subtotal directly when available.
                   *
                   * This avoids multiplying an already
                   * calculated subtotal by quantity.
                   */
                  const rawSubtotal = item.subtotal ?? item.Subtotal

                  const rawPrice = item.price ?? item.Price ?? 0

                  const itemTotal =
                    rawSubtotal !== undefined ? Number(rawSubtotal) : Number(rawPrice) * quantity

                  return (
                    <div
                      key={`${serviceId}-${index}`}
                      style={{
                        padding: '14px',
                        borderRadius: '14px',
                        border: `1px solid ${
                          selectedStaffId ? 'rgba(22, 163, 74, .25)' : colors.border
                        }`,
                        background: selectedStaffId ? 'rgba(22, 163, 74, .025)' : '#fff',
                      }}
                    >
                      <CRow className="align-items-center">
                        <CCol md={6} className="mb-3 mb-md-0">
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '700',
                              color: colors.text,
                            }}
                          >
                            {serviceName}
                          </div>

                          <div className="d-flex align-items-center gap-2 mt-1">
                            <small
                              style={{
                                color: colors.muted,
                              }}
                            >
                              Qty: {quantity}
                            </small>

                            <span
                              style={{
                                color: colors.border,
                              }}
                            >
                              •
                            </span>

                            <small
                              style={{
                                color: colors.dark,
                                fontWeight: '700',
                              }}
                            >
                              ₦{itemTotal.toLocaleString()}
                            </small>
                          </div>

                          {selectedStaffId && (
                            <div
                              className="mt-2"
                              style={{
                                fontSize: '11px',
                                color: colors.green,
                                fontWeight: '600',
                              }}
                            >
                              ✓ {getStaffName(selectedStaffId)} assigned
                            </div>
                          )}
                        </CCol>

                        <CCol md={6}>
                          <label
                            className="form-label mb-1"
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: colors.muted,
                              textTransform: 'uppercase',
                              letterSpacing: '.5px',
                            }}
                          >
                            Service Provider
                          </label>

                          <CFormSelect
                            value={selectedStaffId}
                            onChange={(e) => handleServiceStaffChange(serviceId, e.target.value)}
                            style={selectStyle}
                          >
                            <option value="">Select Staff</option>

                            {activeStaff.map((staffItem) => (
                              <option key={staffItem.id} value={staffItem.id}>
                                {staffItem.User.fullname.trim()}
                              </option>
                            ))}
                          </CFormSelect>
                        </CCol>
                      </CRow>
                    </div>
                  )
                })}
              </div>

              {/* =================================================
                  SINGLE SERVICE LEGACY PROVIDER
              ================================================== */}

              {cartServices.length === 1 && (
                <div
                  className="mt-3"
                  style={{
                    paddingTop: '14px',
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  <small
                    style={{
                      color: colors.muted,
                    }}
                  >
                    For a single service, you can use either the provider above or the existing
                    Primary Service Provider selection below.
                  </small>
                </div>
              )}

              {hasMultipleServices && (
                <div
                  className="mt-3"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(232, 189, 53, 0.08)',
                    border: '1px solid rgba(232, 189, 53, 0.25)',
                  }}
                >
                  <small
                    style={{
                      color: colors.dark,
                    }}
                  >
                    <strong>Multiple services:</strong> assign each service to the staff member who
                    actually performed it.
                  </small>
                </div>
              )}
            </CCardBody>
          </CCard>
        )}

        {/* =====================================================
            PAYMENT DETAILS
        ====================================================== */}

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
                Payment Details
              </div>

              <small style={{ color: colors.muted }}>Select how this sale is being paid.</small>
            </div>

            {/* PAYMENT METHOD */}

            <div className="mb-3">
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
                Payment Method
              </label>

              <CFormSelect
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={selectStyle}
              >
                <option value="cash">Cash</option>

                <option value="transfer">Bank Transfer</option>

                <option value="pos">POS</option>

                <option value="mixed">Mixed Payment</option>
              </CFormSelect>
            </div>

            {/* =================================================
                LEGACY SINGLE PROVIDER
            ================================================== */}

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
                Primary Service Provider
              </label>

              <CFormSelect
                value={serviceProviderId}
                onChange={(e) => setServiceProviderId(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select Staff</option>

                {activeStaff.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.User.fullname.trim()}
                  </option>
                ))}
              </CFormSelect>

              <small
                className="d-block mt-2"
                style={{
                  color: colors.muted,
                }}
              >
                For existing single-provider sales, this field continues to work as before. For
                multiple services, use the provider selector above.
              </small>
            </div>
          </CCardBody>
        </CCard>

        {/* =====================================================
            STAND + CARD
        ====================================================== */}

        {!isHomeService && (
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
                  Salon Assignment
                </div>

                <small
                  style={{
                    color: colors.muted,
                  }}
                >
                  Assign the stand and customer card.
                </small>
              </div>

              <CRow>
                <CCol md={6} className="mb-3 mb-md-0">
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
                    Stand Tag
                  </label>

                  <CFormSelect
                    value={standTag}
                    onChange={(e) => setStandTag(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Select Stand</option>

                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={`Stand ${i + 1}`}>
                        Stand {i + 1}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={6}>
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
                    Card Number
                  </label>

                  <CFormSelect
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Select Card</option>

                    {[...Array(100)].map((_, i) => {
                      const number = String(i + 1).padStart(3, '0')

                      return (
                        <option key={i + 1} value={number}>
                          Card #{number}
                        </option>
                      )
                    })}
                  </CFormSelect>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        )}

        {/* =====================================================
            REMARKS
        ====================================================== */}

        <CCard className="border-0" style={sectionCardStyle}>
          <CCardBody style={{ padding: '18px' }}>
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
              placeholder={isHomeService ? 'Optional home service remarks...' : 'Optional note...'}
              style={{
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                resize: 'vertical',
                boxShadow: 'none',
              }}
            />
          </CCardBody>
        </CCard>
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
          disabled={processing || hasUnassignedService}
          onClick={handleSubmit}
          style={{
            minWidth: '190px',
            height: '46px',
            borderRadius: '12px',
            background: hasUnassignedService
              ? '#d1d5db'
              : `linear-gradient(135deg, ${colors.gold}, ${colors.goldDark})`,
            border: 'none',
            color: hasUnassignedService ? '#6b7280' : colors.dark,
            fontWeight: '800',
            boxShadow: hasUnassignedService ? 'none' : '0 6px 18px rgba(232, 189, 53, 0.25)',
          }}
        >
          {processing ? (
            <span className="d-flex align-items-center justify-content-center gap-2">
              <span className="spinner-border spinner-border-sm" role="status" />
              Processing...
            </span>
          ) : hasUnassignedService ? (
            <>Assign Staff First</>
          ) : (
            <>
              Complete Sale&nbsp; • &nbsp;₦
              {Number(total).toLocaleString()}
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
