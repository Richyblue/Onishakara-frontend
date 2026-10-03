import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilLockLocked,
  cilUser,
  cilCheckCircle,
  cilWifiSignal0,
  cilCloudDownload,
} from '@coreui/icons'

/*
|--------------------------------------------------------------------------
| ONISHAKARA LOGIN
|--------------------------------------------------------------------------
|
| Online:
|   Backend authenticates the user normally.
|
| Offline Electron:
|   The app checks the locally stored password verifier.
|
| Security:
|   Plain passwords are NEVER stored.
|
| Offline access:
|   7 days from the last successful online authentication.
|
|--------------------------------------------------------------------------
*/

const OFFLINE_AUTH_CACHE_KEY = 'onishakara_offline_auth'
const OFFLINE_ACCESS_DAYS = 7
const PBKDF2_ITERATIONS = 120000

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [isElectron, setIsElectron] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [offlineAuthAvailable, setOfflineAuthAvailable] = useState(false)

  /*
   * This is intentionally enabled by default.
   *
   * It means that after a successful online login,
   * this device can authenticate the same user temporarily
   * when the server is unavailable.
   */
  const [enableOfflineAccess, setEnableOfflineAccess] = useState(true)

  const navigate = useNavigate()

  const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

  const API_URL = `${API_ROOT}/api/auth/login`

  /*
  |--------------------------------------------------------------------------
  | ELECTRON DETECTION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const electronAvailable = typeof window !== 'undefined' && !!window.electronAPI

    setIsElectron(electronAvailable)
  }, [])

  /*
  |--------------------------------------------------------------------------
  | NETWORK STATUS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const updateConnectionStatus = () => {
      setIsOffline(!navigator.onLine)
    }

    updateConnectionStatus()

    window.addEventListener('online', updateConnectionStatus)
    window.addEventListener('offline', updateConnectionStatus)

    return () => {
      window.removeEventListener('online', updateConnectionStatus)
      window.removeEventListener('offline', updateConnectionStatus)
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | CRYPTO HELPERS
  |--------------------------------------------------------------------------
  */

  const bufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer)

    let binary = ''

    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i])
    }

    return window.btoa(binary)
  }

  const base64ToBuffer = (base64) => {
    const binary = window.atob(base64)

    const bytes = new Uint8Array(binary.length)

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }

    return bytes.buffer
  }

  const generateSalt = () => {
    const salt = new Uint8Array(16)

    window.crypto.getRandomValues(salt)

    return bufferToBase64(salt.buffer)
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE PASSWORD VERIFIER
  |--------------------------------------------------------------------------
  */

  const createPasswordVerifier = async (plainPassword, saltBase64) => {
    if (!window.crypto?.subtle) {
      throw new Error('Secure browser cryptography is unavailable.')
    }

    const encoder = new TextEncoder()

    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(plainPassword),
      {
        name: 'PBKDF2',
      },
      false,
      ['deriveBits'],
    )

    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: base64ToBuffer(saltBase64),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      256,
    )

    return bufferToBase64(derivedBits)
  }

  /*
  |--------------------------------------------------------------------------
  | CONSTANT-TIME STRING COMPARISON
  |--------------------------------------------------------------------------
  */

  const secureCompare = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
      return false
    }

    let result = 0

    for (let i = 0; i < a.length; i += 1) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE OFFLINE AUTHENTICATION
  |--------------------------------------------------------------------------
  */

  const saveOfflineAuthentication = async (user, plainPassword) => {
    if (!isElectron) {
      return false
    }

    if (!window.electronAPI?.offlineSaveCache) {
      console.warn('Electron offline cache API unavailable.')

      return false
    }

    try {
      const salt = generateSalt()

      const verifier = await createPasswordVerifier(plainPassword, salt)

      const now = Date.now()

      const expiresAt = now + OFFLINE_ACCESS_DAYS * 24 * 60 * 60 * 1000

      /*
       * Store only what is required for offline authentication.
       *
       * IMPORTANT:
       * The plain password is NOT stored.
       */
      const offlineAuth = {
        version: 1,

        enabled: true,

        email: String(user?.email || email)
          .trim()
          .toLowerCase(),

        user: user || {},

        salt,

        verifier,

        createdAt: new Date(now).toISOString(),

        lastOnlineLoginAt: new Date(now).toISOString(),

        expiresAt: new Date(expiresAt).toISOString(),

        offlineAccessDays: OFFLINE_ACCESS_DAYS,
      }

      await window.electronAPI.offlineSaveCache(OFFLINE_AUTH_CACHE_KEY, offlineAuth)

      setOfflineAuthAvailable(true)

      return true
    } catch (error) {
      console.error('Unable to save offline authentication:', error)

      return false
    }
  }

  /*
  |--------------------------------------------------------------------------
  | GET OFFLINE AUTHENTICATION
  |--------------------------------------------------------------------------
  */

  const getOfflineAuthentication = async () => {
    if (!isElectron) {
      return null
    }

    if (!window.electronAPI?.offlineGetCache) {
      return null
    }

    try {
      return await window.electronAPI.offlineGetCache(OFFLINE_AUTH_CACHE_KEY)
    } catch (error) {
      console.error('Unable to read offline authentication:', error)

      return null
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CHECK WHETHER OFFLINE LOGIN IS AVAILABLE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    const checkOfflineAuthentication = async () => {
      if (!isElectron) {
        return
      }

      const auth = await getOfflineAuthentication()

      if (!mounted) {
        return
      }

      if (!auth?.enabled || !auth?.expiresAt) {
        setOfflineAuthAvailable(false)

        return
      }

      const expiry = new Date(auth.expiresAt).getTime()

      if (!Number.isFinite(expiry) || Date.now() >= expiry) {
        setOfflineAuthAvailable(false)

        return
      }

      setOfflineAuthAvailable(true)
    }

    checkOfflineAuthentication()

    return () => {
      mounted = false
    }
  }, [isElectron])

  /*
  |--------------------------------------------------------------------------
  | OFFLINE LOGIN
  |--------------------------------------------------------------------------
  */

  const handleOfflineLogin = async () => {
    if (!isElectron) {
      setError('Offline login is only available in the Onishakara Electron POS application.')

      return false
    }

    setLoading(true)

    try {
      const cachedAuth = await getOfflineAuthentication()

      if (!cachedAuth) {
        setError(
          'Offline login is not available on this device. Please connect to the server and sign in online first.',
        )

        return false
      }

      if (!cachedAuth.enabled) {
        setError(
          'Offline access has been disabled for this device. Please connect to the server and sign in online.',
        )

        return false
      }

      const expiry = new Date(cachedAuth.expiresAt).getTime()

      if (!Number.isFinite(expiry) || Date.now() >= expiry) {
        setError(
          'Your offline access has expired. Please reconnect to the server and sign in online.',
        )

        setOfflineAuthAvailable(false)

        return false
      }

      const normalizedEmail = email.trim().toLowerCase()

      if (!normalizedEmail || !password) {
        setError('Enter the email address and password used for offline access.')

        return false
      }

      if (
        normalizedEmail !==
        String(cachedAuth.email || '')
          .trim()
          .toLowerCase()
      ) {
        setError('This user is not the offline user registered on this device.')

        return false
      }

      const verifier = await createPasswordVerifier(password, cachedAuth.salt)

      const passwordValid = secureCompare(verifier, cachedAuth.verifier)

      if (!passwordValid) {
        setError('Invalid email or password.')

        return false
      }

      /*
       * Store the user locally so the POS can continue
       * using the same user identity.
       */
      localStorage.setItem('user', JSON.stringify(cachedAuth.user || {}))

      /*
       * We intentionally do not create a fake JWT.
       *
       * The application is now operating offline.
       */
      localStorage.setItem('offlineMode', 'true')

      localStorage.setItem('offlineLoginAt', new Date().toISOString())

      /*
       * Remove stale online token.
       *
       * API requests should not attempt to use an old
       * token while the app is offline.
       */
      localStorage.removeItem('token')

      const role = cachedAuth.user?.role

      /*
       * OFFLINE POS ACCESS
       */
      if (role === 'cashier') {
        navigate('/pos', {
          replace: true,
        })
      } else {
        navigate('/dashboard', {
          replace: true,
        })
      }

      return true
    } catch (error) {
      console.error('Offline login failed:', error)

      setError('Unable to complete offline login. Please reconnect to the server.')

      return false
    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ONLINE LOGIN
  |--------------------------------------------------------------------------
  */

  const handleOnlineLogin = async () => {
    try {
      const response = await axios.post(
        API_URL,
        {
          email: email.trim(),
          password,
        },
        {
          timeout: 12000,
        },
      )

      if (response.data.success && response.data.token) {
        console.log('Onishakara online login successful.')

        const user = response.data.user || {}

        /*
         * Save normal online session.
         */
        localStorage.setItem('token', response.data.token)

        localStorage.setItem('user', JSON.stringify(user))

        /*
         * Make sure the app is no longer considered
         * offline.
         */
        localStorage.removeItem('offlineMode')

        localStorage.removeItem('offlineLoginAt')

        /*
         * Create/update offline credentials.
         */
        if (enableOfflineAccess && isElectron) {
          await saveOfflineAuthentication(user, password)
        }

        /*
         * Role-based redirect.
         */
        if (user?.role === 'cashier') {
          navigate('/pos', {
            replace: true,
          })
        } else {
          navigate('/dashboard', {
            replace: true,
          })
        }

        return true
      }

      setError('Login was not completed. Please try again.')

      return false
    } catch (err) {
      console.error('Online login failed:', err.response?.data || err.message)

      /*
       * Account disabled.
       *
       * DO NOT fall back to offline login here.
       */
      if (err.response?.status === 403) {
        localStorage.removeItem('token')

        localStorage.removeItem('user')

        localStorage.removeItem('expiresAt')

        setError(
          err.response?.data?.message ||
            'Your account has been disabled. Please contact the administrator.',
        )

        return false
      }

      /*
       * Invalid credentials.
       *
       * DO NOT fall back to offline login because
       * the server actually responded.
       */
      if (err.response?.status === 401) {
        setError(err.response?.data?.message || 'Invalid email or password.')

        return false
      }

      /*
       * No server response.
       *
       * This is where we attempt offline authentication.
       */
      if (!err.response) {
        console.log('Server unavailable. Trying offline login...')

        setIsOffline(true)

        if (isElectron && offlineAuthAvailable) {
          return await handleOfflineLogin()
        }

        if (isElectron) {
          setError(
            'The server is currently unavailable and this device has no active offline login. Please connect to the server and sign in online first.',
          )
        } else {
          setError(
            'Unable to connect to the server. Offline login is only available in the Onishakara Electron POS application.',
          )
        }

        return false
      }

      setError(err.response?.data?.message || 'Unable to login. Please try again.')

      return false
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOGIN SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleLogin = async (e) => {
    e.preventDefault()

    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email address and password.')

      return
    }

    setLoading(true)

    try {
      /*
       * If browser already knows there is no network,
       * skip the 12-second Axios timeout and go directly
       * to offline authentication.
       */
      if (isElectron && !navigator.onLine) {
        setIsOffline(true)

        await handleOfflineLogin()

        return
      }

      setIsOffline(false)

      await handleOnlineLogin()
    } finally {
      /*
       * handleOnlineLogin / handleOfflineLogin manage
       * their own loading states, but this keeps the
       * form safe if an unexpected error occurs.
       */
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | OFFLINE EXPIRY DISPLAY
  |--------------------------------------------------------------------------
  */

  const offlineStatusText = useMemo(() => {
    if (!isElectron) {
      return null
    }

    if (isOffline) {
      return 'OFFLINE MODE'
    }

    return 'ONLINE'
  }, [isElectron, isOffline])

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="onishakara-login-page">
      <CContainer fluid className="p-0">
        <CRow className="g-0 min-vh-100">
          {/* =====================================================
              LEFT BRAND PANEL
          ====================================================== */}

          <CCol lg={7} className="d-none d-lg-flex onishakara-brand-panel">
            <div className="brand-overlay">
              {/* LOGO */}

              <div className="onishakara-logo">
                <div className="logo-mark">O</div>

                <div>
                  <div className="logo-title">ONISHAKARA</div>

                  <div className="logo-subtitle">FASHION STORE</div>
                </div>
              </div>

              {/* CONTENT */}

              <div className="brand-content">
                <div className="brand-badge">
                  <span className="badge-dot"></span>
                  PREMIUM FASHION RETAIL
                </div>

                <h1>
                  Run your store.
                  <br />
                  <span>Smarter.</span>
                </h1>

                <p>
                  Manage your fashion products, inventory, purchases, customers and sales from one
                  powerful retail POS platform.
                </p>

                {/* FEATURES */}

                <div className="feature-list">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <CIcon icon={cilCheckCircle} />
                    </div>

                    <div>
                      <strong>Powerful POS</strong>

                      <span>Fast and reliable fashion sales processing</span>
                    </div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-icon">
                      <CIcon icon={cilCheckCircle} />
                    </div>

                    <div>
                      <strong>Smart Inventory</strong>

                      <span>Track products, variants and stock levels</span>
                    </div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-icon">
                      <CIcon icon={cilCheckCircle} />
                    </div>

                    <div>
                      <strong>Secure & Reliable</strong>

                      <span>Continue selling even when your server is unavailable</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="brand-footer">
                <span>© {new Date().getFullYear()} Onishakara Fashion Store</span>

                <span className="footer-divider">|</span>

                <span>Powered by Bluesplash IT Solution</span>
              </div>
            </div>
          </CCol>

          {/* =====================================================
              RIGHT LOGIN PANEL
          ====================================================== */}

          <CCol xs={12} lg={5} className="onishakara-login-panel">
            <div className="login-wrapper">
              {/* MOBILE LOGO */}

              <div className="mobile-logo d-lg-none">
                <div className="logo-mark">O</div>

                <div>
                  <div className="logo-title">ONISHAKARA</div>

                  <div className="logo-subtitle"> FASHION STORE</div>
                </div>
              </div>

              <CCard className="login-card border-0">
                <CCardBody className="p-0">
                  {/* CONNECTION STATUS */}

                  {isElectron && (
                    <div className={`connection-status ${isOffline ? 'offline' : 'online'}`}>
                      <span className="connection-dot"></span>

                      <span>{offlineStatusText}</span>

                      {isOffline && <span className="connection-note">Sales can continue</span>}
                    </div>
                  )}

                  {/* HEADING */}

                  <div className="login-heading">
                    <div className="welcome-label">WELCOME BACK</div>

                    <h2>Sign in to your account</h2>

                    <p>Enter your credentials to access the Onishakara retail management system.</p>
                  </div>

                  {/* ERROR */}

                  {error && (
                    <div className="login-error">
                      <div className="error-icon">!</div>

                      <div>
                        <strong>Login unsuccessful</strong>

                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {/* OFFLINE NOTICE */}

                  {isOffline && isElectron && offlineAuthAvailable && (
                    <div className="offline-notice">
                      <div className="offline-notice-icon">
                        <CIcon icon={cilCloudDownload} />
                      </div>

                      <div>
                        <strong>Offline access available</strong>

                        <span>
                          The server is unavailable. You can sign in using your temporary offline
                          access.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* FORM */}

                  <CForm onSubmit={handleLogin}>
                    {/* EMAIL */}

                    <div className="form-field">
                      <label>Email Address</label>

                      <CInputGroup className="premium-input">
                        <CInputGroupText>
                          <CIcon icon={cilUser} />
                        </CInputGroupText>

                        <CFormInput
                          type="email"
                          placeholder="Enter your email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                      </CInputGroup>
                    </div>

                    {/* PASSWORD */}

                    <div className="form-field">
                      <div className="password-label">
                        <label>Password</label>

                        <button
                          type="button"
                          className="forgot-password"
                          onClick={() => {
                            setError('Please contact your administrator to reset your password.')
                          }}
                          disabled={loading}
                        >
                          Forgot password?
                        </button>
                      </div>

                      <CInputGroup className="premium-input">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>

                        <CFormInput
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                        />

                        <CInputGroupText
                          className="password-toggle"
                          onClick={() => !loading && setShowPassword(!showPassword)}
                        >
                          <span>{showPassword ? 'HIDE' : 'SHOW'}</span>
                        </CInputGroupText>
                      </CInputGroup>
                    </div>

                    {/* OFFLINE ACCESS */}

                    {isElectron && (
                      <div className="offline-access-option">
                        <label>
                          <input
                            type="checkbox"
                            checked={enableOfflineAccess}
                            onChange={(e) => setEnableOfflineAccess(e.target.checked)}
                            disabled={loading}
                          />

                          <span>Enable temporary offline access on this device</span>
                        </label>

                        <small>
                          Allows this user to sign in for up to {OFFLINE_ACCESS_DAYS} days when the
                          server is unavailable.
                        </small>
                      </div>
                    )}

                    {/* LOGIN BUTTON */}

                    <CButton type="submit" className="login-button w-100" disabled={loading}>
                      {loading ? (
                        <>
                          <CSpinner size="sm" className="me-2" />

                          {isOffline ? 'Signing in offline...' : 'Signing in...'}
                        </>
                      ) : (
                        <>
                          {isOffline ? 'Continue Offline' : 'Sign In'}

                          <span className="button-arrow">→</span>
                        </>
                      )}
                    </CButton>
                  </CForm>

                  {/* SECURITY */}

                  <div className="secure-login">
                    <div className="secure-icon">
                      <CIcon icon={isOffline ? cilCloudDownload : cilLockLocked} />
                    </div>

                    <div>
                      <strong>{isOffline ? 'Offline Secure Access' : 'Secure Login'}</strong>

                      <span>
                        {isOffline
                          ? 'Your credentials are verified locally on this device.'
                          : 'Your account information is protected.'}
                      </span>
                    </div>
                  </div>

                  {/* MOBILE FOOTER */}

                  <div className="mobile-footer d-lg-none">Powered by Bluesplash IT Solution</div>
                </CCardBody>
              </CCard>
            </div>
          </CCol>
        </CRow>
      </CContainer>

      {/* ============================================================
          STYLES
      ============================================================ */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .onishakara-login-page {
          min-height: 100vh;

          background:
            #f7f6f2;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* ============================================================
           LEFT BRAND PANEL
        ============================================================ */

        .onishakara-brand-panel {
          position: relative;

          min-height: 100vh;

          background:
            radial-gradient(
              circle at 85% 15%,
              rgba(212, 175, 55, 0.12),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #0b0b0b 0%,
              #151515 52%,
              #080808 100%
            );

          overflow: hidden;

          color: #ffffff;
        }

        .onishakara-brand-panel::before {
          content: "";

          position: absolute;

          width: 620px;
          height: 620px;

          border-radius: 50%;

          border:
            1px solid
            rgba(212, 175, 55, 0.08);

          top: -300px;
          right: -250px;
        }

        .onishakara-brand-panel::after {
          content: "";

          position: absolute;

          width: 480px;
          height: 480px;

          border-radius: 50%;

          border:
            1px solid
            rgba(212, 175, 55, 0.07);

          bottom: -250px;
          left: -220px;
        }

        .brand-overlay {
          position: relative;

          z-index: 2;

          width: 100%;
          min-height: 100vh;

          padding:
            55px 8%;

          display: flex;

          flex-direction: column;

          justify-content: space-between;
        }

        /* ============================================================
           LOGO
        ============================================================ */

        .onishakara-logo,
        .mobile-logo {
          display: flex;

          align-items: center;

          gap: 13px;
        }

        .logo-mark {
          width: 50px;
          height: 50px;

          flex-shrink: 0;

          border-radius: 14px;

          display: flex;

          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #f5dc78,
              #d4af37 55%,
              #a98018
            );

          color: #111111;

          font-size: 24px;

          font-weight: 900;

          letter-spacing: -1px;

          box-shadow:
            0 10px 30px
            rgba(212, 175, 55, 0.22);
        }

        .logo-title {
          font-size: 21px;

          line-height: 1;

          letter-spacing: 3px;

          font-weight: 900;
        }

        .logo-subtitle {
          margin-top: 6px;

          font-size: 8px;

          letter-spacing: 2.8px;

          color: #d4af37;

          font-weight: 800;
        }

        /* ============================================================
           BRAND CONTENT
        ============================================================ */

        .brand-content {
          max-width: 650px;

          margin-top: 30px;

          margin-bottom: 30px;
        }

        .brand-badge {
          display: inline-flex;

          align-items: center;

          gap: 9px;

          padding:
            9px 14px;

          border-radius: 100px;

          border:
            1px solid
            rgba(212, 175, 55, 0.2);

          background:
            rgba(212, 175, 55, 0.06);

          color: #d4af37;

          font-size: 10px;

          letter-spacing: 1.2px;

          font-weight: 800;

          margin-bottom: 25px;
        }

        .badge-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #d4af37;

          box-shadow:
            0 0 12px
            rgba(212, 175, 55, 0.75);
        }

        .brand-content h1 {
          font-size:
            clamp(42px, 4.5vw, 70px);

          line-height: 1.04;

          letter-spacing: -2.5px;

          font-weight: 800;

          margin:
            0 0 25px;
        }

        .brand-content h1 span {
          color: #d4af37;
        }

        .brand-content > p {
          max-width: 540px;

          color: #a4a4a4;

          font-size: 16px;

          line-height: 1.8;

          margin-bottom: 35px;
        }

        /* ============================================================
           FEATURES
        ============================================================ */

        .feature-list {
          display: flex;

          flex-direction: column;

          gap: 17px;
        }

        .feature-item {
          display: flex;

          align-items: center;

          gap: 14px;
        }

        .feature-icon {
          width: 34px;
          height: 34px;

          border-radius: 9px;

          display: flex;

          align-items: center;
          justify-content: center;

          background:
            rgba(212, 175, 55, 0.09);

          color: #d4af37;
        }

        .feature-item strong,
        .feature-item span {
          display: block;
        }

        .feature-item strong {
          font-size: 13px;

          margin-bottom: 3px;
        }

        .feature-item span {
          color: #777777;

          font-size: 11px;
        }

        /* ============================================================
           BRAND FOOTER
        ============================================================ */

        .brand-footer {
          display: flex;

          align-items: center;

          gap: 12px;

          color: #626262;

          font-size: 10px;
        }

        .footer-divider {
          color: #333333;
        }

        /* ============================================================
           RIGHT PANEL
        ============================================================ */

        .onishakara-login-panel {
          min-height: 100vh;

          background: #ffffff;

          display: flex;

          align-items: center;

          justify-content: center;

          padding:
            40px 7%;
        }

        .login-wrapper {
          width: 100%;

          max-width: 450px;
        }

        .login-card {
          background: transparent;
        }

        /* ============================================================
           CONNECTION STATUS
        ============================================================ */

        .connection-status {
          display: flex;

          align-items: center;

          gap: 8px;

          width: fit-content;

          padding:
            7px 11px;

          border-radius: 100px;

          margin-bottom: 24px;

          font-size: 9px;

          font-weight: 800;

          letter-spacing: 1px;
        }

        .connection-status.online {
          background: #f2f8f3;

          color: #347a46;

          border:
            1px solid #d8ebdc;
        }

        .connection-status.offline {
          background: #fff8e7;

          color: #9a7417;

          border:
            1px solid #f0dfad;
        }

        .connection-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;
        }

        .online .connection-dot {
          background: #42a85f;

          box-shadow:
            0 0 8px
            rgba(66, 168, 95, 0.5);
        }

        .offline .connection-dot {
          background: #d4af37;

          box-shadow:
            0 0 8px
            rgba(212, 175, 55, 0.5);
        }

        .connection-note {
          margin-left: 4px;

          color: #9a9a9a;

          font-size: 8px;

          letter-spacing: 0;

          font-weight: 500;
        }

        /* ============================================================
           HEADING
        ============================================================ */

        .login-heading {
          margin-bottom: 32px;
        }

        .welcome-label {
          color: #b18a20;

          font-size: 11px;

          font-weight: 800;

          letter-spacing: 2px;

          margin-bottom: 10px;
        }

        .login-heading h2 {
          margin:
            0 0 10px;

          color: #171717;

          font-size: 31px;

          line-height: 1.2;

          font-weight: 800;

          letter-spacing: -0.7px;
        }

        .login-heading p {
          margin: 0;

          color: #777777;

          font-size: 13px;

          line-height: 1.7;
        }

        /* ============================================================
           ERROR
        ============================================================ */

        .login-error {
          display: flex;

          align-items: flex-start;

          gap: 12px;

          padding:
            13px 15px;

          margin-bottom: 22px;

          border-radius: 11px;

          border:
            1px solid #f3cccc;

          background: #fff7f7;

          color: #8a2525;
        }

        .error-icon {
          width: 22px;
          height: 22px;

          flex-shrink: 0;

          border-radius: 50%;

          display: flex;

          align-items: center;
          justify-content: center;

          background: #d64545;

          color: #ffffff;

          font-size: 12px;

          font-weight: 800;
        }

        .login-error strong,
        .login-error span {
          display: block;
        }

        .login-error strong {
          font-size: 12px;

          margin-bottom: 3px;
        }

        .login-error span {
          font-size: 11px;

          line-height: 1.5;
        }

        /* ============================================================
           OFFLINE NOTICE
        ============================================================ */

        .offline-notice {
          display: flex;

          align-items: flex-start;

          gap: 12px;

          padding:
            13px 15px;

          margin-bottom: 22px;

          border-radius: 11px;

          border:
            1px solid #ead9a5;

          background:
            #fffaf0;
        }

        .offline-notice-icon {
          width: 34px;
          height: 34px;

          flex-shrink: 0;

          border-radius: 9px;

          display: flex;

          align-items: center;
          justify-content: center;

          background:
            rgba(212, 175, 55, 0.12);

          color: #a17d17;
        }

        .offline-notice strong,
        .offline-notice span {
          display: block;
        }

        .offline-notice strong {
          color: #6d5512;

          font-size: 11px;

          margin-bottom: 3px;
        }

        .offline-notice span {
          color: #8d815e;

          font-size: 10px;

          line-height: 1.5;
        }

        /* ============================================================
           FORM
        ============================================================ */

        .form-field {
          margin-bottom: 21px;
        }

        .form-field label {
          display: block;

          color: #333333;

          font-size: 12px;

          font-weight: 700;

          margin-bottom: 8px;
        }

        .premium-input {
          height: 52px;

          border:
            1px solid #dedede;

          border-radius: 11px;

          overflow: hidden;

          transition: all 0.2s ease;

          background: #ffffff;
        }

        .premium-input:focus-within {
          border-color: #d0aa31;

          box-shadow:
            0 0 0 3px
            rgba(208, 170, 49, 0.10);
        }

        .premium-input .input-group-text {
          border: 0;

          background: #ffffff;

          color: #999999;

          padding-left: 15px;

          padding-right: 8px;
        }

        .premium-input .form-control {
          border: 0;

          box-shadow: none !important;

          font-size: 13px;

          padding-left: 8px;

          color: #222222;
        }

        .premium-input .form-control::placeholder {
          color: #aaaaaa;
        }

        .password-toggle {
          cursor: pointer;

          padding-right: 15px !important;

          padding-left: 8px !important;

          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #c9a227 !important;
        }

        .password-toggle span {
          font-size: 12px;

          font-weight: 700;

          cursor: pointer;
        }

        .password-label {
          display: flex;

          justify-content: space-between;

          align-items: center;
        }

        .forgot-password {
          border: 0;

          background: transparent;

          padding: 0;

          color: #b08a1e;

          font-size: 11px;

          font-weight: 600;

          cursor: pointer;
        }

        .forgot-password:hover {
          color: #8f6f12;

          text-decoration: underline;
        }

        /* ============================================================
           OFFLINE ACCESS OPTION
        ============================================================ */

        .offline-access-option {
          margin-top: -3px;

          margin-bottom: 23px;

          padding:
            12px 13px;

          border-radius: 10px;

          background:
            #faf9f5;

          border:
            1px solid #eee9dc;
        }

        .offline-access-option label {
          display: flex;

          align-items: center;

          gap: 8px;

          color: #555555;

          font-size: 11px;

          font-weight: 700;

          cursor: pointer;
        }

        .offline-access-option input {
          width: 15px;
          height: 15px;

          accent-color: #c9a227;

          cursor: pointer;
        }

        .offline-access-option small {
          display: block;

          margin-top: 6px;

          padding-left: 23px;

          color: #999999;

          font-size: 9px;

          line-height: 1.5;
        }

        /* ============================================================
           BUTTON
        ============================================================ */

        .login-button {
          height: 54px;

          border: 0 !important;

          border-radius: 11px !important;

          background:
            linear-gradient(
              135deg,
              #e8bd35 0%,
              #c9a227 100%
            ) !important;

          color: #171717 !important;

          font-size: 13px;

          font-weight: 800;

          letter-spacing: 0.3px;

          box-shadow:
            0 9px 25px
            rgba(201, 162, 39, 0.18);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);

          box-shadow:
            0 13px 30px
            rgba(201, 162, 39, 0.25);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.75;
        }

        .button-arrow {
          margin-left: 10px;

          font-size: 17px;
        }

        /* ============================================================
           SECURITY
        ============================================================ */

        .secure-login {
          margin-top: 28px;

          padding: 15px;

          border-radius: 11px;

          background: #f8f8f7;

          display: flex;

          align-items: center;

          gap: 12px;
        }

        .secure-icon {
          width: 34px;
          height: 34px;

          border-radius: 9px;

          display: flex;

          align-items: center;
          justify-content: center;

          background: #eeeeeb;

          color: #a9851c;
        }

        .secure-login strong,
        .secure-login span {
          display: block;
        }

        .secure-login strong {
          font-size: 11px;

          color: #444444;

          margin-bottom: 3px;
        }

        .secure-login span {
          color: #999999;

          font-size: 10px;

          line-height: 1.5;
        }

        /* ============================================================
           MOBILE
        ============================================================ */

        .mobile-logo {
          justify-content: center;

          margin-bottom: 40px;
        }

        .mobile-footer {
          text-align: center;

          margin-top: 30px;

          color: #aaaaaa;

          font-size: 9px;
        }

        /* ============================================================
           RESPONSIVE
        ============================================================ */

        @media (max-width: 991px) {

          .onishakara-login-panel {
            min-height: 100vh;

            padding:
              40px 25px;
          }

          .login-wrapper {
            max-width: 430px;
          }

        }

        @media (max-width: 575px) {

          .onishakara-login-panel {
            padding:
              30px 20px;
          }

          .login-heading h2 {
            font-size: 27px;
          }

          .login-heading {
            margin-bottom: 25px;
          }

          .premium-input {
            height: 50px;
          }

        }

      `}</style>
    </div>
  )
}

export default Login
