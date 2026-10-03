import { useEffect, useRef, useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react'

import axios from 'axios'
import CIcon from '@coreui/icons-react'
import { cilPrint, cilQrCode } from '@coreui/icons'

const StaffIDCardModal = ({ visible, onClose, staff }) => {
  const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
  const API_URL = `${API_ROOT}/api/v1`

  const [loading, setLoading] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [error, setError] = useState('')

  const cardRef = useRef(null)

  // --------------------------------------------------
  // LOAD QR CODE
  // --------------------------------------------------

  useEffect(() => {
    if (!visible || !staff?.id) {
      setQrImage('')
      setQrCode('')
      setError('')
      return
    }

    const loadQRCode = async () => {
      try {
        setLoading(true)
        setError('')

        const token = localStorage.getItem('token')

        if (!token) {
          throw new Error('Authentication token not found')
        }

        const response = await axios.get(`${API_URL}/staff/${staff.id}/qrcode`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setQrImage(response.data?.qrImage || '')
        setQrCode(response.data?.qrCode || '')

        if (!response.data?.qrImage) {
          throw new Error('QR code image was not returned by the server')
        }
      } catch (err) {
        console.error('Failed to load staff QR code:', err)

        setQrImage('')
        setQrCode('')

        setError(
          err?.response?.data?.message || err?.message || 'Unable to generate staff QR code.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadQRCode()
  }, [visible, staff?.id])

  // --------------------------------------------------
  // PRINT CARD
  // --------------------------------------------------

  const printCard = () => {
    const cardHTML = cardRef.current?.outerHTML

    if (!cardHTML) return

    const printWindow = window.open('', '_blank', 'width=600,height=800')

    if (!printWindow) {
      alert('Please allow pop-ups to print the staff ID card.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />

          <title>
            Onishakara Gold Fashion Store - Staff ID Card
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
            }

            body {
              padding: 30px;
            }

            .print-card {
              width: 350px;
              height: 550px;
              margin: 0 auto;
              box-shadow: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @media print {
              @page {
                size: auto;
                margin: 0;
              }

              body {
                padding: 0;
                margin: 0;
              }

              .print-card {
                margin: 0;
              }
            }
          </style>
        </head>

        <body>
          ${cardHTML}

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 300);
            };

            window.onafterprint = function () {
              window.close();
            };
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  // --------------------------------------------------
  // STAFF DATA
  // --------------------------------------------------

  const user = staff?.User || staff?.user || {}

  const fullname = user?.fullname || 'Staff Member'
  const role = user?.role || 'staff'
  const position = staff?.position || 'Staff'
  const phone = user?.phone || ''
  const email = user?.email || ''

  const initials = fullname
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join('')
    .toUpperCase()

  const roleLabel =
    role === 'admin'
      ? 'Administrator'
      : role === 'manager'
        ? 'Manager'
        : role === 'cashier'
          ? 'Cashier'
          : 'Staff'

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" backdrop="static">
      <CModalHeader>
        <CModalTitle className="fw-bold">Staff ID Card</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {error ? (
          <CAlert color="danger">
            <strong>QR Code Error</strong>

            <div className="mt-1">{error}</div>
          </CAlert>
        ) : null}

        <div className="text-center">
          {loading ? (
            <div
              style={{
                padding: '80px 20px',
              }}
            >
              <CSpinner
                style={{
                  width: '3rem',
                  height: '3rem',
                  color: '#b08d2c',
                }}
              />

              <div className="mt-3 text-muted">Generating staff QR code...</div>
            </div>
          ) : (
            <div
              ref={cardRef}
              className="print-card"
              style={{
                width: 350,
                height: 550,
                margin: '0 auto',
                borderRadius: 22,
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                border: '1px solid #d4af37',
                position: 'relative',
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              {/* =========================================
                  GOLD TOP ACCENT
              ========================================== */}

              <div
                style={{
                  height: 7,
                  background: 'linear-gradient(90deg, #8f6b18, #d4af37, #f5df7a, #d4af37, #8f6b18)',
                }}
              />

              {/* =========================================
                  HEADER
              ========================================== */}

              <div
                style={{
                  background: 'linear-gradient(135deg, #0d0d0d 0%, #171717 55%, #242424 100%)',
                  padding: '22px 20px 25px',
                  color: '#ffffff',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    letterSpacing: 2,
                    color: '#d4af37',
                  }}
                >
                  ONISHAKARA
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    marginTop: 4,
                  }}
                >
                  GOLD FASHION STORE
                </div>

                <div
                  style={{
                    fontSize: 9,
                    color: '#cfcfcf',
                    letterSpacing: 1.2,
                    marginTop: 8,
                  }}
                >
                  STAFF IDENTIFICATION CARD
                </div>
              </div>

              {/* =========================================
                  STAFF PROFILE
              ========================================== */}

              <div
                style={{
                  textAlign: 'center',
                  padding: '22px 20px 8px',
                }}
              >
                <div
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                    background: 'linear-gradient(135deg, #f8e7a8, #d4af37)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#171717',
                    fontSize: 27,
                    fontWeight: 900,
                    border: '3px solid #ffffff',
                    boxShadow: '0 5px 15px rgba(212,175,55,0.35)',
                  }}
                >
                  {initials || 'S'}
                </div>

                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 800,
                    color: '#111111',
                    lineHeight: 1.2,
                  }}
                >
                  {fullname}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#8f6b18',
                  }}
                >
                  {position}
                </div>

                <div
                  style={{
                    display: 'inline-block',
                    marginTop: 7,
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: '#f8f3df',
                    color: '#8f6b18',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.7,
                  }}
                >
                  {roleLabel}
                </div>
              </div>

              {/* =========================================
                  QR CODE
              ========================================== */}

              <div
                style={{
                  textAlign: 'center',
                  padding: '8px 20px 0',
                }}
              >
                {qrImage ? (
                  <img
                    src={qrImage}
                    alt="Staff QR Code"
                    style={{
                      width: 155,
                      height: 155,
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 155,
                      height: 155,
                      margin: '0 auto',
                      border: '1px dashed #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: 11,
                    }}
                  >
                    QR CODE UNAVAILABLE
                  </div>
                )}

                {qrCode && (
                  <div
                    style={{
                      fontSize: 8,
                      color: '#6b7280',
                      wordBreak: 'break-all',
                      marginTop: 4,
                      padding: '0 15px',
                    }}
                  >
                    {qrCode}
                  </div>
                )}
              </div>

              {/* =========================================
                  STAFF DETAILS
              ========================================== */}

              {(phone || email) && (
                <div
                  style={{
                    margin: '8px 22px 0',
                    padding: '7px 10px',
                    borderTop: '1px solid #eeeeee',
                    textAlign: 'center',
                  }}
                >
                  {phone && (
                    <div
                      style={{
                        fontSize: 9,
                        color: '#555555',
                        marginBottom: 2,
                      }}
                    >
                      {phone}
                    </div>
                  )}

                  {email && (
                    <div
                      style={{
                        fontSize: 8,
                        color: '#777777',
                        wordBreak: 'break-all',
                      }}
                    >
                      {email}
                    </div>
                  )}
                </div>
              )}

              {/* =========================================
                  FOOTER
              ========================================== */}

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '13px 20px',
                  background: '#111111',
                  borderTop: '3px solid #d4af37',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: '#d4af37',
                    letterSpacing: 1.2,
                    fontWeight: 700,
                  }}
                >
                  STAFF IDENTIFICATION
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: '#ffffff',
                    marginTop: 3,
                  }}
                >
                  Scan QR Code for Attendance
                </div>
              </div>
            </div>
          )}
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Close
        </CButton>

        <CButton
          color="dark"
          disabled={loading || !qrImage}
          onClick={printCard}
          style={{
            background: '#111111',
            borderColor: '#111111',
          }}
        >
          <CIcon icon={cilPrint} className="me-2" />
          Print ID Card
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default StaffIDCardModal
