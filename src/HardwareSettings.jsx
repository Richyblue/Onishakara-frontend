import React, { useEffect, useState } from 'react'

import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'

const HardwareSettings = () => {
  const [printers, setPrinters] = useState([])

  const [selectedPrinter, setSelectedPrinter] = useState('')

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [testing, setTesting] = useState(false)

  const [message, setMessage] = useState('')

  const [error, setError] = useState('')

  // ==========================================
  // LOAD PRINTERS
  // ==========================================

  const loadPrinters = async () => {
    if (!window.electronAPI?.getPrinters) {
      setError('Hardware controls are only available in the Glamour POS desktop application.')

      setLoading(false)

      return
    }

    try {
      setLoading(true)

      setError('')

      const availablePrinters = await window.electronAPI.getPrinters()

      setPrinters(availablePrinters || [])

      const savedPrinter = await window.electronAPI.getSelectedPrinter()

      if (savedPrinter) {
        setSelectedPrinter(savedPrinter)
      } else {
        const defaultPrinter = availablePrinters?.find((printer) => printer.isDefault)

        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name)
        }
      }
    } catch (err) {
      console.error('LOAD PRINTERS ERROR:', err)

      setError(err.message || 'Unable to load printers.')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadPrinters()
  }, [])

  // ==========================================
  // SAVE PRINTER
  // ==========================================

  const handleSavePrinter = async () => {
    if (!selectedPrinter) {
      setError('Please select a printer.')

      return
    }

    try {
      setSaving(true)

      setError('')

      setMessage('')

      await window.electronAPI.setSelectedPrinter(selectedPrinter)

      setMessage('Receipt printer saved successfully.')

      await loadPrinters()
    } catch (err) {
      console.error('SAVE PRINTER ERROR:', err)

      setError(err.message || 'Unable to save printer.')
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // TEST PRINT
  // ==========================================

  const handleTestPrint = async () => {
    try {
      setTesting(true)

      setError('')

      setMessage('')

      await window.electronAPI.testPrint()

      setMessage('Test print sent successfully.')
    } catch (err) {
      console.error('TEST PRINT ERROR:', err)

      setError(err.message || 'Test print failed.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div
      style={{
        padding: '20px',
      }}
    >
      <CRow>
        <CCol xs={12} lg={8}>
          <CCard
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
            }}
          >
            <CCardHeader
              style={{
                background: '#111827',
                color: '#ffffff',
                padding: '18px 20px',
              }}
            >
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                }}
              >
                Hardware & Printer Settings
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginTop: '4px',
                }}
              >
                Manage printers and POS hardware
              </div>
            </CCardHeader>

            <CCardBody
              style={{
                padding: '22px',
              }}
            >
              {message && (
                <CAlert color="success" dismissible onClose={() => setMessage('')}>
                  {message}
                </CAlert>
              )}

              {error && (
                <CAlert color="danger" dismissible onClose={() => setError('')}>
                  {error}
                </CAlert>
              )}

              {/* ============================= */}
              {/* RECEIPT PRINTER */}
              {/* ============================= */}

              <div
                style={{
                  marginBottom: '25px',
                }}
              >
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    marginBottom: '5px',
                    color: '#111827',
                  }}
                >
                  Receipt Printer
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '14px',
                  }}
                >
                  Select the printer Glamour POS should use for customer receipts.
                </div>

                {loading ? (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                    }}
                  >
                    <CSpinner />

                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#6b7280',
                      }}
                    >
                      Detecting printers...
                    </div>
                  </div>
                ) : (
                  <>
                    <CFormSelect
                      value={selectedPrinter}
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                      size="lg"
                    >
                      <option value="">Select receipt printer</option>

                      {printers.map((printer) => (
                        <option key={printer.name} value={printer.name}>
                          {printer.displayName}

                          {printer.isDefault ? ' — Default' : ''}
                        </option>
                      ))}
                    </CFormSelect>

                    {printers.length === 0 && (
                      <div
                        style={{
                          marginTop: '10px',
                          fontSize: '12px',
                          color: '#dc2626',
                        }}
                      >
                        No printers were detected on this computer.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ============================= */}
              {/* SELECTED PRINTER */}
              {/* ============================= */}

              {selectedPrinter && (
                <div
                  style={{
                    padding: '15px',
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginBottom: '4px',
                    }}
                  >
                    SELECTED RECEIPT PRINTER
                  </div>

                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#111827',
                    }}
                  >
                    {selectedPrinter}
                  </div>

                  <div
                    style={{
                      marginTop: '5px',
                      fontSize: '11px',
                      color: '#16a34a',
                      fontWeight: 700,
                    }}
                  >
                    ● Ready to use
                  </div>
                </div>
              )}

              {/* ============================= */}
              {/* ACTIONS */}
              {/* ============================= */}

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <CButton color="dark" onClick={loadPrinters} disabled={loading}>
                  {loading ? <CSpinner size="sm" /> : '↻'} Refresh Printers
                </CButton>

                <CButton
                  style={{
                    background: 'linear-gradient(135deg, #e8bd35, #c9a227)',
                    border: 'none',
                    color: '#111827',
                    fontWeight: 800,
                  }}
                  onClick={handleSavePrinter}
                  disabled={saving || !selectedPrinter}
                >
                  {saving ? <CSpinner size="sm" /> : '✓'} Save Printer
                </CButton>

                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={handleTestPrint}
                  disabled={testing || !selectedPrinter}
                >
                  {testing ? <CSpinner size="sm" /> : '🖨'} Test Print
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* ================================ */}
        {/* HARDWARE INFORMATION */}
        {/* ================================ */}

        <CCol xs={12} lg={4}>
          <CCard
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            <CCardHeader
              style={{
                background: '#111827',
                color: '#ffffff',
                fontWeight: 800,
              }}
            >
              Hardware
            </CCardHeader>

            <CCardBody>
              <div
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  Thermal Printer
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: selectedPrinter ? '#16a34a' : '#dc2626',
                    marginTop: '4px',
                  }}
                >
                  {selectedPrinter ? '● Configured' : '● Not configured'}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  Cash Drawer
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: selectedPrinter ? '#16a34a' : '#6b7280',
                    marginTop: '4px',
                  }}
                >
                  {selectedPrinter
                    ? '● Connected through receipt printer'
                    : '● Waiting for printer'}
                </div>
              </div>

              <div
                style={{
                  paddingTop: '12px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  Verifone P400
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '4px',
                  }}
                >
                  ● Payment integration not configured
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default HardwareSettings
