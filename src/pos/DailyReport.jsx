import React from 'react'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CButton,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CBadge,
  CSpinner,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'

import {
  cilCash,
  cilChart,
  cilPeople,
  cilCart,
  cilArrowBottom,
  cilCreditCard,
  cilMoney,
  cilTransfer,
} from '@coreui/icons'

/**
 * ============================================================
 * MONEY FORMATTER
 * ============================================================
 */

const formatMoney = (value) => {
  return `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * ============================================================
 * NUMBER FORMATTER
 * ============================================================
 */

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString('en-NG')
}

/**
 * ============================================================
 * STAT CARD
 * ============================================================
 */

const ReportCard = ({ title, value, subtitle, icon, color = 'primary' }) => {
  return (
    <CCard className="border-0 shadow-sm h-100 mb-3">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="small text-body-secondary mb-2">{title}</div>

            <h4 className="fw-bold mb-1">{value}</h4>

            {subtitle && <div className="small text-body-secondary">{subtitle}</div>}
          </div>

          <div className={`bg-${color} bg-opacity-10 rounded-3 p-3`}>
            <CIcon icon={icon} size="lg" className={`text-${color}`} />
          </div>
        </div>
      </CCardBody>
    </CCard>
  )
}

/**
 * ============================================================
 * DAILY REPORT MODAL
 * ============================================================
 */

export default function DailyReportModal({ visible, onClose, report, loading }) {
  /**
   * --------------------------------------------------------
   * NORMALIZED VALUES
   * --------------------------------------------------------
   */

  const grossSales = Number(report?.grossSales ?? report?.mySales ?? 0)

  const totalReturns = Number(report?.totalReturns ?? 0)

  const netSales = Number(report?.netSales ?? grossSales - totalReturns)

  const transactions = Number(report?.totalTransactions ?? report?.myTransactions ?? 0)

  const customers = Number(report?.customersServed ?? report?.myCustomers ?? 0)

  const itemsSold = Number(report?.itemsSold ?? 0)

  const returnedItems = Number(report?.totalReturnedItems ?? 0)

  const averageSale = Number(report?.averageSale ?? 0)

  const cashSales = Number(report?.cashSales ?? 0)

  const transferSales = Number(report?.transferSales ?? 0)

  /**
   * IMPORTANT:
   * Backend now uses "posSales", not "cardSales".
   */
  const posSales = Number(report?.posSales ?? report?.cardSales ?? 0)

  const mixedSales = Number(report?.mixedSales ?? 0)

  return (
    <CModal size="xl" visible={visible} onClose={onClose} alignment="center" backdrop="static">
      {/* =================================================
                HEADER
            ================================================= */}

      <CModalHeader>
        <div>
          <CModalTitle className="fw-bold">Daily Business Report</CModalTitle>

          <div className="small text-body-secondary mt-1">Fashion retail sales performance</div>
        </div>
      </CModalHeader>

      {/* =================================================
                BODY
            ================================================= */}

      <CModalBody>
        {loading ? (
          <div
            className="d-flex flex-column justify-content-center align-items-center"
            style={{
              minHeight: '350px',
            }}
          >
            <CSpinner size="sm" />

            <div className="text-body-secondary mt-3">Generating daily report...</div>
          </div>
        ) : (
          <>
            {/* =========================================
                            MAIN SALES KPIs
                        ========================================= */}

            <CRow className="g-3">
              <CCol xs={12} sm={6} xl={3}>
                <ReportCard
                  title="Gross Sales"
                  value={formatMoney(grossSales)}
                  subtitle="Total sales before returns"
                  icon={cilCash}
                  color="success"
                />
              </CCol>

              <CCol xs={12} sm={6} xl={3}>
                <ReportCard
                  title="Returns"
                  value={formatMoney(totalReturns)}
                  subtitle={`${formatNumber(returnedItems)} item(s) returned`}
                  icon={cilArrowBottom}
                  color="danger"
                />
              </CCol>

              <CCol xs={12} sm={6} xl={3}>
                <ReportCard
                  title="Net Sales"
                  value={formatMoney(netSales)}
                  subtitle="Sales after returns"
                  icon={cilChart}
                  color="primary"
                />
              </CCol>

              <CCol xs={12} sm={6} xl={3}>
                <ReportCard
                  title="Average Sale"
                  value={formatMoney(averageSale)}
                  subtitle="Average transaction value"
                  icon={cilMoney}
                  color="info"
                />
              </CCol>
            </CRow>

            {/* =========================================
                            ACTIVITY KPIs
                        ========================================= */}

            <CRow className="g-3 mt-1">
              <CCol xs={12} sm={4}>
                <ReportCard
                  title="Transactions"
                  value={formatNumber(transactions)}
                  subtitle="Completed sales"
                  icon={cilCart}
                  color="primary"
                />
              </CCol>

              <CCol xs={12} sm={4}>
                <ReportCard
                  title="Customers Served"
                  value={formatNumber(customers)}
                  subtitle="Customers recorded"
                  icon={cilPeople}
                  color="warning"
                />
              </CCol>

              <CCol xs={12} sm={4}>
                <ReportCard
                  title="Items Sold"
                  value={formatNumber(itemsSold)}
                  subtitle="Products sold"
                  icon={cilCart}
                  color="success"
                />
              </CCol>
            </CRow>

            {/* =========================================
                            PAYMENT BREAKDOWN
                        ========================================= */}

            <div className="mt-4 mb-3">
              <h6 className="fw-bold mb-1">Payment Breakdown</h6>

              <div className="small text-body-secondary">Sales grouped by payment method</div>
            </div>

            <CRow className="g-3">
              {/* CASH */}

              <CCol xs={12} sm={6} lg={3}>
                <CCard className="border-0 shadow-sm h-100">
                  <CCardBody>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-success bg-opacity-10 rounded-3 p-3">
                        <CIcon icon={cilCash} size="lg" className="text-success" />
                      </div>

                      <div>
                        <div className="small text-body-secondary">Cash Sales</div>

                        <div className="fw-bold fs-5">{formatMoney(cashSales)}</div>
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>

              {/* TRANSFER */}

              <CCol xs={12} sm={6} lg={3}>
                <CCard className="border-0 shadow-sm h-100">
                  <CCardBody>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-info bg-opacity-10 rounded-3 p-3">
                        <CIcon icon={cilTransfer} size="lg" className="text-info" />
                      </div>

                      <div>
                        <div className="small text-body-secondary">Transfer Sales</div>

                        <div className="fw-bold fs-5">{formatMoney(transferSales)}</div>
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>

              {/* POS */}

              <CCol xs={12} sm={6} lg={3}>
                <CCard className="border-0 shadow-sm h-100">
                  <CCardBody>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                        <CIcon icon={cilCreditCard} size="lg" className="text-primary" />
                      </div>

                      <div>
                        <div className="small text-body-secondary">POS Sales</div>

                        <div className="fw-bold fs-5">{formatMoney(posSales)}</div>
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>

              {/* MIXED */}

              <CCol xs={12} sm={6} lg={3}>
                <CCard className="border-0 shadow-sm h-100">
                  <CCardBody>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                        <CIcon icon={cilMoney} size="lg" className="text-warning" />
                      </div>

                      <div>
                        <div className="small text-body-secondary">Mixed Sales</div>

                        <div className="fw-bold fs-5">{formatMoney(mixedSales)}</div>
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            {/* =========================================
                            CASHIER INFORMATION
                        ========================================= */}

            <CRow className="g-3 mt-2">
              <CCol md={6}>
                <CCard className="border-0 shadow-sm h-100">
                  <CCardBody>
                    <div className="small text-body-secondary mb-2">Cashier</div>

                    <div className="fw-bold fs-5">
                      {report?.cashierName || report?.cashier || 'Current Cashier'}
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol md={6}>
                <CCard className="border-0 shadow-sm h-100">
                  <CCardBody>
                    <div className="small text-body-secondary mb-2">Report Date</div>

                    <div className="fw-bold fs-5">
                      {report?.reportDate ||
                        new Date().toLocaleDateString('en-NG', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            {/* =========================================
                            REPORT SUMMARY
                        ========================================= */}

            <div className="mt-4 p-3 rounded bg-body-tertiary">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <div className="small text-body-secondary">Daily Net Performance</div>

                  <div className="fs-4 fw-bold">{formatMoney(netSales)}</div>
                </div>

                <div className="text-end">
                  <CBadge color="success" shape="rounded-pill" className="px-3 py-2">
                    Fashion Products Only
                  </CBadge>
                </div>
              </div>
            </div>
          </>
        )}
      </CModalBody>

      {/* =================================================
                FOOTER
            ================================================= */}

      <div className="modal-footer">
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Close
        </CButton>
      </div>
    </CModal>
  )
}
