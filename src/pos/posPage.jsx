import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  cilBarcode,
  cilCart,
  cilChart,
  cilCheck,
  cilPeople,
  cilNotes,
  cilPlus,
  cilPrint,
  cilTrash,
  cilUser,
} from '@coreui/icons'
import axios from 'axios'
import {
  CButton,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import CustomerSearchModal from '../pos/CustomerSearchModal'
import PaymentModal from '../pos/PaymentModal'
import ReceiptModal from '../pos/ReceiptModal'
import HoldSaleModal from '../pos/HoldSaleModal'
import NewCustomerModal from '../pos/NewCustomerModal'
import LoyaltyLookupModal from '../pos/LoyaltyLookUpModal'
import BarcodeModal from '../pos/BarcodeModal'
import ClearCartModal from '../pos/ClearCartModal'
import DailyReportModal from '../pos/DailyReport'
import ShowHeldSalesModal from './ShowHeldSalesModal'
import LogoutButton from '../auth/logout'

const API_ROOT = import.meta.env.VITE_BACKEND_URL
const API_URL = `${API_ROOT}api/v1`

const POSPage = () => {
  const navigate = useNavigate()
  const [windowMode, setWindowMode] = useState('cashier')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  }, [])
  const cartKey = `pos_cart_${user?.id || 'cashier'}`
  const [products, setProducts] = useState([]),
    [categories, setCategories] = useState([]),
    [customers, setCustomers] = useState([]),
    [staff, setStaff] = useState([]),
    [settings, setSettings] = useState(null)
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(cartKey) || '[]')
    } catch {
      return []
    }
  })
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('all'),
    [loading, setLoading] = useState(true),
    [processing, setProcessing] = useState(false)
  const [customer, setCustomer] = useState(null),
    [discount, setDiscount] = useState(0),
    [paymentMethod, setPaymentMethod] = useState('cash'),
    [usePoints, setUsePoints] = useState(false),
    [redeemPoints, setRedeemPoints] = useState(0)
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine),
    [queueCount, setQueueCount] = useState(0),
    [syncing, setSyncing] = useState(false)
  const [showCustomer, setShowCustomer] = useState(false),
    [showNewCustomer, setShowNewCustomer] = useState(false),
    [showPayment, setShowPayment] = useState(false),
    [showReceipt, setShowReceipt] = useState(false),
    [showReceiptSearch, setShowReceiptSearch] = useState(false),
    [showHold, setShowHold] = useState(false),
    [showHeld, setShowHeld] = useState(false),
    [showLoyalty, setShowLoyalty] = useState(false),
    [showBarcode, setShowBarcode] = useState(false),
    [showClear, setShowClear] = useState(false),
    [showReport, setShowReport] = useState(false),
    [showVariant, setShowVariant] = useState(false)
  const [variantProduct, setVariantProduct] = useState(null),
    [variant, setVariant] = useState(null),
    [sale, setSale] = useState(null),
    [receiptSearch, setReceiptSearch] = useState(''),
    [receiptResults, setReceiptResults] = useState([]),
    [receiptLoading, setReceiptLoading] = useState(false),
    [heldSales, setHeldSales] = useState([]),
    [report, setReport] = useState({}),
    [reportLoading, setReportLoading] = useState(false),
    [cardNumber, setCardNumber] = useState(''),
    [cardResult, setCardResult] = useState(null)
  const syncRef = useRef(false),
    soundRef = useRef(null),
    soundPlaying = useRef(false)
  const cfg = () => ({
    headers: localStorage.getItem('token')
      ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
      : {},
  })
  const cache = async (k, v) => {
    try {
      await window.electronAPI?.offlineSaveCache?.(k, v)
    } catch {}
  }
  const readCache = async (k) => {
    try {
      return await window.electronAPI?.offlineGetCache?.(k)
    } catch {
      return null
    }
  }
  const load = useCallback(async () => {
    setLoading(true)
    const get = async (path, key, setter, transform = (x) => x) => {
      try {
        const r = await axios.get(`${API_URL}/${path}`, cfg())
        const data = transform(r.data)
        setter(data)
        await cache(key, data)
      } catch (e) {
        const c = await readCache(key)
        if (Array.isArray(c)) setter(c)
      }
    }
    await Promise.all([
      get('products', 'products', setProducts, (d) =>
        Array.isArray(d?.products) ? d.products : Array.isArray(d) ? d : [],
      ),
      get('categories', 'categories', setCategories, (d) =>
        (Array.isArray(d?.categories) ? d.categories : Array.isArray(d) ? d : []).filter(
          (x) => x?.status !== 'inactive',
        ),
      ),
      get('customers', 'customers', setCustomers, (d) =>
        Array.isArray(d?.customers) ? d.customers : Array.isArray(d) ? d : [],
      ),
      get('staffs', 'staff', setStaff, (d) =>
        Array.isArray(d?.staffs) ? d.staffs : Array.isArray(d) ? d : [],
      ),
    ])
    try {
      const r = await axios.get(`${API_URL}/settings/1`, cfg())
      setSettings(r.data?.settings || r.data)
      await cache('settings', r.data?.settings || r.data)
    } catch {
      const c = await readCache('settings')
      if (c) setSettings(c)
    }
    setLoading(false)
  }, [])
  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    if (!window.electronAPI) return

    const loadWindowMode = async () => {
      const result = await window.electronAPI.getWindowMode()

      if (result?.success) {
        setWindowMode(result.mode)
      }
    }

    loadWindowMode()

    const removeListener = window.electronAPI.onWindowModeChanged((mode) => {
      setWindowMode(mode)
    })

    return () => {
      if (typeof removeListener === 'function') {
        removeListener()
      }
    }
  }, [])
  useEffect(() => localStorage.setItem(cartKey, JSON.stringify(cart)), [cart, cartKey])
  const variants = (p) =>
    Array.isArray(p?.Variants) ? p.Variants : Array.isArray(p?.variants) ? p.variants : []
  const catName = (p) =>
    p?.Category?.name ||
    p?.category?.name ||
    categories.find((c) => Number(c.id) === Number(p?.categoryId))?.name ||
    'Uncategorized'
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter(
      (p) =>
        p &&
        p.status !== 'inactive' &&
        (category === 'all' || String(p.categoryId) === String(category)) &&
        (!q ||
          [p.name, p.sku, p.barcode, catName(p), p.Brand?.name, p.brand?.name]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))),
    )
  }, [products, categories, category, search])
  const subtotal = cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 0), 0)
  const pointsDiscount = usePoints ? Math.min(Number(redeemPoints || 0), subtotal) : 0
  const total = Math.max(0, subtotal - Number(discount || 0) - pointsDiscount)
  const addSound = () => {
    if (!soundRef.current) soundRef.current = new Audio('/sounds/beep.wav')
    if (soundPlaying.current) return
    soundPlaying.current = true
    soundRef.current.currentTime = 0
    soundRef.current.play().catch(() => {})
    setTimeout(() => {
      soundPlaying.current = false
    }, 120)
  }
  const key = (i) => `${i.productId || i.id}:${i.variantId || 'base'}`
  const add = (p, v = null) => {
    const stock = Number(v?.quantity ?? p?.quantity ?? 0)
    if (stock <= 0) return alert('This item is out of stock.')
    const item = {
      id: p.id,
      productId: p.id,
      variantId: v?.id || null,
      name: p.name,
      sku: v?.sku || p.sku || '',
      barcode: v?.barcode || p.barcode || '',
      size: v?.size || null,
      color: v?.color || null,
      price: Number(v?.sellingPrice ?? p.sellingPrice ?? 0),
      quantity: 1,
      availableStock: stock,
      type: 'product',
    }
    addSound()
    setCart((c) => {
      const old = c.find((x) => key(x) === key(item))
      if (!old) return [...c, item]
      if (Number(old.quantity) >= Number(old.availableStock)) return c
      return c.map((x) => (key(x) === key(item) ? { ...x, quantity: x.quantity + 1 } : x))
    })
  }
  const selectProduct = (p) => {
    const vs = variants(p)
    if (vs.length) {
      setVariantProduct(p)
      setVariant(null)
      setShowVariant(true)
    } else add(p)
  }
  const inc = (i) =>
    setCart((c) =>
      c.map((x) =>
        key(x) === key(i)
          ? { ...x, quantity: Math.min(Number(x.quantity) + 1, Number(x.availableStock)) }
          : x,
      ),
    )
  const dec = (i) =>
    setCart((c) =>
      c
        .map((x) => (key(x) === key(i) ? { ...x, quantity: x.quantity - 1 } : x))
        .filter((x) => x.quantity > 0),
    )
  const remove = (i) => setCart((c) => c.filter((x) => key(x) !== key(i)))
  const clearPOS = () => {
    setCart([])
    setDiscount(0)
    setRedeemPoints(0)
    setUsePoints(false)
    setCustomer(null)
    localStorage.removeItem(cartKey)
  }
  const localId = () =>
    `LOCAL-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  const refreshQueue = async () => {
    try {
      setQueueCount(Number((await window.electronAPI?.offlineQueueCount?.()) || 0))
    } catch {}
  }
  const sync = useCallback(async () => {
    if (!navigator.onLine || syncRef.current || !window.electronAPI?.offlineGetQueue) return
    syncRef.current = true
    setSyncing(true)
    try {
      const q = await window.electronAPI.offlineGetQueue()
      for (const item of (Array.isArray(q) ? q : []).filter(
        (x) => x?.type === 'sale' && x?.status === 'pending',
      )) {
        try {
          await axios.post(`${API_URL}/sales`, item.payload || {}, { ...cfg(), timeout: 12000 })
          await window.electronAPI.offlineRemoveQueue(item.id)
        } catch (e) {
          await window.electronAPI.offlineIncrementAttempts(
            item.id,
            e?.response?.data?.message || e?.message || 'Sync failed',
          )
        }
      }
      await refreshQueue()
    } finally {
      syncRef.current = false
      setSyncing(false)
    }
  }, [])
  useEffect(() => {
    refreshQueue()
    const on = () => {
        setOnline(true)
        setTimeout(sync, 500)
      },
      off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    const t = setInterval(() => {
      refreshQueue()
      if (navigator.onLine) sync()
    }, 5000)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      clearInterval(t)
    }
  }, [sync])
  useEffect(() => {
    window.electronAPI?.updateCustomerDisplay?.({ cart, subtotal, total, customer })
  }, [cart, subtotal, total, customer])
  const complete = async (pd) => {
    if (!cart.length) return alert('Cart is empty')
    setProcessing(true)
    const id = localId()
    const payload = {
      localSaleId: id,
      queuedAt: new Date().toISOString(),
      customerId: customer?.id || null,
      items: cart.map((i) => ({
        productId: Number(i.productId || i.id),
        variantId: i.variantId ? Number(i.variantId) : null,
        quantity: Number(i.quantity),
        price: Number(i.price),
        subtotal: Number(i.price) * Number(i.quantity),
      })),
      discount: Number(discount),
      paymentMethod: pd?.paymentMethod || paymentMethod,
      note: pd?.note?.trim() || null,
      standTag: pd?.standTag?.trim() || null,
      cardNumber: pd?.cardNumber?.trim() || null,
      usePoints: Boolean(usePoints),
      redeemPoints: Number(redeemPoints || 0),
      subtotal: Number(subtotal),
      totalAmount: Number(total),
    }
    try {
      const r = await axios.post(`${API_URL}/sales`, payload, { ...cfg(), timeout: 12000 })
      setSale(r.data?.sale || r.data)
      setShowPayment(false)
      setShowReceipt(true)
      clearPOS()
      refreshQueue()
    } catch (e) {
      if (e?.response) {
        alert(e.response?.data?.message || 'Failed to complete sale')
        return
      }
      try {
        await window.electronAPI.offlineAddQueue('sale', payload)
        const off = {
          id,
          localSaleId: id,
          receiptNumber: `OFF-${id.replace('LOCAL-', '')}`,
          createdAt: new Date().toISOString(),
          offline: true,
          status: 'pending_sync',
          customer,
          Customer: customer,
          subtotal,
          discount,
          totalAmount: total,
          paymentMethod: payload.paymentMethod,
          note: payload.note,
          items: cart,
          SaleItems: cart.map((i) => ({ ...i, subtotal: Number(i.price) * Number(i.quantity) })),
        }
        setSale(off)
        setShowPayment(false)
        setShowReceipt(true)
        clearPOS()
        refreshQueue()
        alert('Server unavailable. Sale saved offline and will synchronize automatically.')
      } catch (q) {
        alert('Sale could not be completed or saved offline.')
      }
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    let barcodeBuffer = ''
    let lastKeyTime = 0

    const handleBarcodeScanner = (e) => {
      // Don't interfere with normal typing in inputs
      const tag = e.target?.tagName

      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return
      }

      const now = Date.now()

      // Barcode scanners type very quickly.
      // If there is a long pause, start a new barcode.
      if (now - lastKeyTime > 100) {
        barcodeBuffer = ''
      }

      lastKeyTime = now

      // Scanner normally finishes with Enter
      if (e.key === 'Enter') {
        const scannedBarcode = barcodeBuffer.trim()

        if (scannedBarcode) {
          handleBarcodeScan(scannedBarcode)
        }

        barcodeBuffer = ''
        return
      }

      // Collect barcode characters
      if (e.key.length === 1) {
        barcodeBuffer += e.key
      }
    }

    window.addEventListener('keydown', handleBarcodeScanner)

    return () => {
      window.removeEventListener('keydown', handleBarcodeScanner)
    }
  }, [products])

  const handleBarcodeScan = (barcode) => {
    const scannedBarcode = String(barcode || '').trim()

    if (!scannedBarcode) return

    // Find product by barcode
    const product = products.find((p) => String(p.barcode || '').trim() === scannedBarcode)

    if (!product) {
      console.warn(`Product not found: ${scannedBarcode}`)

      // Optional notification
      alert(`Product not found\nBarcode: ${scannedBarcode}`)

      return
    }

    // Automatically add product to cart
    selectProduct(product)
  }

  const handleAdminLogin = async () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError('Enter administrator email and password.')
      return
    }

    setAdminLoading(true)
    setAdminError('')

    try {
      const API_URLS = import.meta.env.VITE_BACKEND_URL

      const response = await axios.post(`${API_URLS}api/auth/login`, {
        email: adminEmail.trim(),
        password: adminPassword,
      })

      if (!response.data?.success || !response.data?.token) {
        setAdminError('Unable to authenticate administrator.')
        return
      }

      const user = response.data.user

      console.log('ADMIN LOGIN USER:', user)

      /*
       * Only administrator/manager accounts
       * should be allowed to unlock Admin Mode.
       *
       * Adjust these role names if your database
       * uses different names.
       */
      const allowedRoles = ['admin', 'administrator', 'manager']

      const userRole = String(user?.role || '').toLowerCase()

      if (!allowedRoles.includes(userRole)) {
        setAdminError('Access denied. Administrator privileges are required.')
        return
      }

      /*
       * Authentication succeeded and the user
       * has administrator privileges.
       */

      const electron = window.electronAPI

      if (!electron?.enterAdminMode) {
        setAdminError('Administrator window controls are not available.')
        return
      }

      const result = await electron.enterAdminMode()

      if (!result?.success) {
        setAdminError(result?.error || 'Unable to switch to administrator mode.')
        return
      }

      /*
       * Save the authenticated user.
       * We don't need to replace the existing POS
       * login token because this is the same authentication
       * system.
       */
      localStorage.setItem('adminUser', JSON.stringify(user))

      setShowAdminLogin(false)
      setAdminEmail('')
      setAdminPassword('')
      setAdminError('')
    } catch (error) {
      console.error('Administrator login failed:', error.response?.data || error.message)

      if (error.response?.status === 401) {
        setAdminError(error.response?.data?.message || 'Invalid email or password.')
        return
      }

      if (error.response?.status === 403) {
        setAdminError(
          error.response?.data?.message ||
            'This account is not allowed to access the administrator area.',
        )
        return
      }

      setAdminError(error.response?.data?.message || 'Unable to verify administrator account.')
    } finally {
      setAdminLoading(false)
    }
  }
  const searchReceipts = async () => {
    if (!receiptSearch.trim()) return
    setReceiptLoading(true)
    try {
      const r = await axios.get(`${API_URL}/sales/search`, {
        ...cfg(),
        params: { search: receiptSearch.trim() },
      })
      setReceiptResults(r.data?.sales || [])
    } catch (e) {
      alert(e.response?.data?.message || 'Unable to search receipts')
    } finally {
      setReceiptLoading(false)
    }
  }
  const reprint = async (id) => {
    setReceiptLoading(true)
    try {
      const r = await axios.get(`${API_URL}/sales/reprint/${id}`, cfg())
      setSale(r.data?.sale || r.data)
      setShowReceiptSearch(false)
      setShowReceipt(true)
    } catch (e) {
      alert(e.response?.data?.message || 'Unable to load receipt')
    } finally {
      setReceiptLoading(false)
    }
  }
  const daily = async () => {
    setReportLoading(true)
    try {
      const r = await axios.get(`${API_URL}/my-daily-report`, cfg())
      setReport(r.data || {})
      setShowReport(true)
    } catch (e) {
      alert(e.response?.data?.message || 'Unable to load daily report')
    } finally {
      setReportLoading(false)
    }
  }
  const hold = async ({ customerId, note }) => {
    try {
      await axios.post(
        `${API_URL}/held-sales`,
        { customerId, items: cart, subtotal, discount, totalAmount: total, note },
        cfg(),
      )
      clearPOS()
      setShowHold(false)
      alert('Sale held successfully.')
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to hold sale.')
    }
  }
  const getHeld = async () => {
    try {
      const r = await axios.get(`${API_URL}/held-sales`, cfg())
      setHeldSales(r.data?.heldSales || [])
    } catch (e) {
      alert(e.response?.data?.message || 'Unable to load held sales')
    }
  }
  const restore = async (s) => {
    try {
      await axios.put(`${API_URL}/held-sales/restore/${s.id}`, {}, cfg())
      const items = Array.isArray(s.items) ? s.items : JSON.parse(s.items || '[]')
      setCart(items)
      setCustomer(s.Customer || s.customer || null)
      setDiscount(Number(s.discount || 0))
      setShowHeld(false)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to restore sale')
    }
  }
  const loyalty = async () => {
    try {
      const r = await axios.get(`${API_URL}/loyalty-cards/${encodeURIComponent(cardNumber)}`, cfg())
      setCardResult(r.data?.loyaltyCard || r.data)
    } catch (e) {
      alert(e.response?.data?.message || 'Card not found')
    }
  }
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') {
        setShowVariant(false)
        setShowPayment(false)
        setShowCustomer(false)
        setShowHold(false)
        setShowHeld(false)
        setShowReceiptSearch(false)
        setShowBarcode(false)
        setShowClear(false)
        setShowReport(false)
        return
      }
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)
      if (typing) return
      if (e.key === 'F3') {
        e.preventDefault()
        document.getElementById('pos-product-search')?.focus()
      }
      if (e.key === 'F4' && cart.length) {
        e.preventDefault()
        setShowHold(true)
      }
      if (e.key === 'F5') {
        e.preventDefault()
        getHeld()
        setShowHeld(true)
      }
      if (e.key === 'F6') {
        e.preventDefault()
        setShowReceiptSearch(true)
      }
      if (e.key === 'F7' && cart.length) {
        e.preventDefault()
        setShowClear(true)
      }
      if (e.key === 'F8') {
        e.preventDefault()
        setShowBarcode(true)
      }
      if (e.key === 'F9') {
        e.preventDefault()
        daily()
      }
      if (e.key === 'F12' && cart.length) {
        e.preventDefault()
        setShowPayment(true)
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [cart])
  const categoryTabs = [
    { id: 'all', name: 'ALL PRODUCTS' },
    ...categories.map((c) => ({ id: c.id, name: c.name })),
  ]
  return (
    <div
      style={{
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
        background: '#0b0c0e',
        color: '#f5f1e6',
        fontFamily: 'Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        fontSize: 12,
      }}
    >
      <header
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 16px',
          background: '#101114',
          borderBottom: '1px solid #2a2a27',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 215 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#c9a43b',
              color: '#111',
              fontWeight: 950,
            }}
          >
            OG
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 950, letterSpacing: 1 }}>ONISHAKARA GOLD</div>
            <div style={{ marginTop: 5, fontSize: 8, color: '#8c8a82', letterSpacing: 1 }}>
              HAUTE COUTURE • POINT OF SALE
            </div>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '0 12px',
            background: '#191a1c',
            border: '1px solid #35342f',
            borderRadius: 7,
          }}
        >
          <CIcon icon={cilBarcode} style={{ color: '#c9a43b' }} />
          <CFormInput
            id="pos-product-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search garment name, SKU, barcode, or category..."
            style={{
              border: 0,
              outline: 0,
              boxShadow: 'none',
              background: 'transparent',
              color: '#f4f1e8',
              padding: 0,
              fontSize: 11,
            }}
          />
          <span
            style={{
              color: '#77756d',
              fontSize: 8,
              border: '1px solid #3a3934',
              padding: '4px 7px',
              borderRadius: 4,
            }}
          >
            F3
          </span>
        </div>
        <div
          style={{
            minWidth: 118,
            padding: '6px 9px',
            border: `1px solid ${online ? '#304b3a' : '#553536'}`,
            borderRadius: 7,
            background: online ? '#111916' : '#1c1213',
          }}
        >
          <div style={{ color: online ? '#69cf91' : '#e07070', fontSize: 8, fontWeight: 900 }}>
            ● {online ? 'ONLINE' : 'OFFLINE'}
          </div>
          <div style={{ color: '#77756d', fontSize: 7, marginTop: 3 }}>
            {syncing
              ? 'SYNCING SALES...'
              : queueCount
                ? `${queueCount} SALE${queueCount === 1 ? '' : 'S'} PENDING`
                : 'SYNC ACTIVE'}
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 62 }}>
          <div style={{ fontSize: 11, fontWeight: 850 }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 7, color: '#77756d' }}>WAT</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 145 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontWeight: 850 }}>
              {user?.fullname || user?.name || 'Cashier'}
            </div>
            <div style={{ fontSize: 7, color: '#77756d' }}>CASHIER / SALES</div>
          </div>
          <div
            style={{
              width: 31,
              height: 31,
              borderRadius: '50%',
              background: '#c9a43b',
              color: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 950,
            }}
          >
            {(user?.fullname || user?.name || 'C').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>
      <div
        style={{
          height: 'calc(100vh - 64px)',
          display: 'grid',
          gridTemplateColumns: '54px minmax(0,1fr) 390px',
          minHeight: 0,
        }}
      >
        {/* =======================================================
            LEFT NAVIGATION RAIL
        ========================================================= */}
        <aside
          style={{
            background: '#0a0c0f',
            borderRight: '1px solid #24282e',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 5px',
            minHeight: 0,
          }}
        >
          {[
            {
              label: 'REG',
              icon: cilCart,
              active: true,
              onClick: () => navigate('/dashboard'),
            },
            {
              label: 'BOOK',
              icon: cilNotes,
              onClick: () => navigate('/salesReport'),
            },
            {
              label: 'CLIENT',
              icon: cilPeople,
              onClick: () => setShowCustomer(true),
            },
            {
              label: 'LEDGER',
              icon: cilChart,
              onClick: () => {
                daily()
              },
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              style={{
                width: '44px',
                height: '52px',
                marginBottom: '4px',
                border: 0,
                borderRadius: '5px',
                background: item.active ? '#e8bd35' : 'transparent',
                color: item.active ? '#111' : '#737b84',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: item.onClick ? 'pointer' : 'default',
              }}
            >
              <CIcon icon={item.icon} size="sm" />

              <span
                style={{
                  fontSize: '6px',
                  fontWeight: 900,
                  letterSpacing: '.5px',
                }}
              >
                {item.label}
              </span>
            </button>
          ))}

          <div style={{ flex: 1 }} />

          <button
            type="button"
            onClick={() => setShowBarcode(true)}
            style={{
              width: '44px',
              height: '46px',
              border: 0,
              background: 'transparent',
              color: '#777f88',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <CIcon icon={cilBarcode} size="sm" />

            <span
              style={{
                fontSize: '6px',
                fontWeight: 900,
              }}
            >
              SCAN
            </span>
          </button>
          {window.electronAPI && (
            <button
              type="button"
              onClick={() => {
                setAdminError('')
                setAdminPassword('')
                setShowAdminLogin(true)
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #d4af37',
                background: '#151515',
                color: '#d4af37',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ADMIN
            </button>
          )}

          {windowMode === 'admin' && window.electronAPI && (
            <button
              type="button"
              onClick={async () => {
                const result = await window.electronAPI.enterCashierMode()

                if (!result?.success) {
                  console.error('Unable to return to cashier mode:', result?.error)
                  return
                }

                setWindowMode('cashier')
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #d4af37',
                background: '#d4af37',
                color: '#111',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              RETURN TO CASHIER
            </button>
          )}

          <div
            style={{
              width: '38px',
              margin: '3px 0 6px',
              borderTop: '1px solid #252a30',
            }}
          />

          <div
            style={{
              transform: 'scale(.72)',
              transformOrigin: 'bottom center',
            }}
          >
            <LogoutButton />
          </div>
        </aside>

        <main
          style={{
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            background: '#111214',
          }}
        >
          <div
            style={{
              minHeight: 58,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              borderBottom: '1px solid #292a27',
              background: '#151618',
              overflowX: 'auto',
            }}
          >
            {categoryTabs.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  height: 34,
                  padding: '0 13px',
                  whiteSpace: 'nowrap',
                  border:
                    String(category) === String(c.id) ? '1px solid #b58e2e' : '1px solid #343530',
                  borderRadius: 6,
                  background: String(category) === String(c.id) ? '#2a2414' : '#1b1c1e',
                  color: String(category) === String(c.id) ? '#d8b34a' : '#88877f',
                  fontSize: 8,
                  fontWeight: 900,
                }}
              >
                {c.name}
              </button>
            ))}
            <div style={{ flex: 1, minWidth: 10 }} />
            <button
              onClick={() => setShowCustomer(true)}
              style={{
                height: 34,
                padding: '0 10px',
                border: '1px solid #35362f',
                borderRadius: 6,
                background: '#1b1c1e',
                color: '#aaa79c',
                fontSize: 8,
                fontWeight: 800,
              }}
            >
              <CIcon icon={cilPeople} className="me-1" />
              CUSTOMER
            </button>
            <button
              onClick={() => setShowBarcode(true)}
              style={{
                height: 34,
                padding: '0 10px',
                border: '1px solid #35362f',
                borderRadius: 6,
                background: '#1b1c1e',
                color: '#aaa79c',
                fontSize: 8,
                fontWeight: 800,
              }}
            >
              <CIcon icon={cilBarcode} className="me-1" />
              SCAN
            </button>
            <button
              onClick={() => setShowReceiptSearch(true)}
              style={{
                height: 34,
                padding: '0 10px',
                border: '1px solid #35362f',
                borderRadius: 6,
                background: '#1b1c1e',
                color: '#aaa79c',
                fontSize: 8,
                fontWeight: 800,
              }}
            >
              <CIcon icon={cilPrint} className="me-1" />
              REPRINT
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: '#d8b34a', fontWeight: 950, letterSpacing: 1 }}>
                  RETAIL REGISTRY
                </div>
                <div style={{ marginTop: 3, fontSize: 7, color: '#77766f' }}>
                  Select a garment or retail product to add it to the active order.
                </div>
              </div>
              <button
                onClick={() => setShowClear(true)}
                style={{
                  height: 29,
                  padding: '0 9px',
                  border: '1px solid #493033',
                  borderRadius: 5,
                  background: '#211719',
                  color: '#d47777',
                  fontSize: 7,
                  fontWeight: 900,
                }}
              >
                CLEAR CART
              </button>
            </div>
            {loading ? (
              <div style={{ padding: '80px 0', textAlign: 'center', color: '#77766f' }}>
                Loading retail catalogue...
              </div>
            ) : filtered.length ? (
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 9 }}
              >
                {filtered.map((p) => {
                  const vs = variants(p),
                    stock = vs.length
                      ? vs.reduce((s, v) => s + Number(v.quantity || 0), 0)
                      : Number(p.quantity || 0)
                  return (
                    <button
                      key={p.id}
                      disabled={stock <= 0}
                      onClick={() => selectProduct(p)}
                      style={{
                        minHeight: 150,
                        padding: 11,
                        textAlign: 'left',
                        border: '1px solid #30312d',
                        borderRadius: 7,
                        background: stock <= 0 ? '#141517' : '#191a1c',
                        color: '#f0ede5',
                        opacity: stock <= 0 ? 0.5 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 7 }}>
                        <span
                          style={{
                            color: '#8e8b82',
                            fontSize: 7,
                            fontWeight: 950,
                            letterSpacing: 1,
                          }}
                        >
                          {catName(p).toUpperCase()}
                        </span>
                        <span
                          style={{
                            color: stock > 10 ? '#69cf91' : '#d8b34a',
                            fontSize: 6,
                            fontWeight: 900,
                          }}
                        >
                          {stock > 0 ? `${stock} IN STOCK` : 'OUT OF STOCK'}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 13,
                          fontSize: 12,
                          fontWeight: 900,
                          lineHeight: 1.25,
                          minHeight: 31,
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ marginTop: 5, fontSize: 7, color: '#77766f' }}>
                        {p.sku || p.barcode || 'Retail item'}
                        {vs.length ? ` • ${vs.length} variant${vs.length > 1 ? 's' : ''}` : ''}
                      </div>
                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 8,
                          borderTop: '1px solid #2b2c29',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ color: '#d8b34a', fontSize: 12, fontWeight: 950 }}>
                          ₦
                          {Number(
                            vs.length
                              ? Math.min(
                                  ...vs
                                    .filter((v) => Number(v.quantity || 0) > 0)
                                    .map((v) => Number(v.sellingPrice || 0)),
                                )
                              : p.sellingPrice || 0,
                          ).toLocaleString()}
                        </span>
                        <CIcon icon={vs.length ? cilChart : cilPlus} size="sm" />
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: '80px 0', textAlign: 'center', color: '#77766f' }}>
                <CIcon icon={cilCart} size="xl" />
                <div style={{ marginTop: 9, fontWeight: 850 }}>No products found</div>
                <div style={{ fontSize: 8, marginTop: 4 }}>Try another search or category.</div>
              </div>
            )}
          </div>
          <div
            style={{
              height: 38,
              minHeight: 38,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '0 14px',
              background: '#0d0e10',
              borderTop: '1px solid #292a27',
              color: '#706f69',
              fontSize: 7,
            }}
          >
            <span>
              REGISTER: <b style={{ color: '#69cf91' }}>ACTIVE</b>
            </span>
            <span>
              NETWORK:{' '}
              <b style={{ color: online ? '#69cf91' : '#e07070' }}>
                {online ? 'ONLINE' : 'OFFLINE'}
              </b>
            </span>
            <span>
              QUEUE: <b style={{ color: queueCount ? '#d8b34a' : '#69cf91' }}>{queueCount}</b>
            </span>
            <button
              onClick={() => cart.length && setShowHold(true)}
              style={{ border: 0, background: 'transparent', color: '#aaa79c', fontSize: 7 }}
            >
              Hold [F4]
            </button>
            <button
              onClick={() => {
                getHeld()
                setShowHeld(true)
              }}
              style={{ border: 0, background: 'transparent', color: '#aaa79c', fontSize: 7 }}
            >
              Held Sales
            </button>
            <button
              onClick={daily}
              style={{ border: 0, background: 'transparent', color: '#aaa79c', fontSize: 7 }}
            >
              Daily Report
            </button>
            {queueCount > 0 && (
              <button
                onClick={sync}
                disabled={syncing || !online}
                style={{
                  marginLeft: 'auto',
                  border: '1px solid #5a4922',
                  borderRadius: 4,
                  background: '#201b10',
                  color: '#d8b34a',
                  padding: '4px 8px',
                  fontSize: 7,
                  fontWeight: 900,
                }}
              >
                {syncing ? 'SYNCING...' : 'SYNC NOW'}
              </button>
            )}
          </div>
        </main>
        <aside
          style={{
            minWidth: 0,
            minHeight: 0,
            background: '#151618',
            borderLeft: '1px solid #2b2c29',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 13px',
              borderBottom: '1px solid #2a2b28',
              background: '#18191b',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 950 }}>ACTIVE ORDER</div>
                <div style={{ fontSize: 7, color: '#77766f', marginTop: 4 }}>
                  ONISHAKARA GOLD • REGISTER
                </div>
              </div>
              <div
                style={{
                  padding: '5px 8px',
                  border: '1px solid #3a3934',
                  borderRadius: 5,
                  color: '#aaa79c',
                  fontSize: 7,
                  fontWeight: 850,
                }}
              >
                {cart.reduce((s, i) => s + Number(i.quantity || 0), 0)} ITEMS
              </div>
            </div>
            <div
              style={{
                marginTop: 9,
                padding: 8,
                background: '#101112',
                border: '1px solid #2b2c29',
                borderRadius: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 27,
                    height: 27,
                    borderRadius: 5,
                    background: '#29261c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d8b34a',
                  }}
                >
                  <CIcon icon={cilUser} size="sm" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 7, color: '#77766f' }}>CUSTOMER</div>
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 9,
                      fontWeight: 850,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {customer?.fullname || customer?.name || 'Walk-in Customer'}
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomer(true)}
                  style={{
                    border: '1px solid #514524',
                    background: '#211d11',
                    color: '#d8b34a',
                    borderRadius: 4,
                    padding: '5px 7px',
                    fontSize: 7,
                    fontWeight: 900,
                  }}
                >
                  CHANGE
                </button>
              </div>
              {customer && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    paddingTop: 5,
                    borderTop: '1px solid #292a27',
                    color: '#77766f',
                    fontSize: 7,
                  }}
                >
                  <span>{customer.phone || 'No phone'}</span>
                  <span style={{ color: '#d8b34a' }}>{customer.loyaltyPoints || 0} pts</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 8 }}>
            {!cart.length ? (
              <div
                style={{
                  height: '100%',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#686761',
                  textAlign: 'center',
                }}
              >
                <CIcon icon={cilCart} size="xl" />
                <div style={{ fontSize: 9, fontWeight: 850, marginTop: 10 }}>No items in order</div>
                <div style={{ fontSize: 7, marginTop: 4 }}>Select a garment or retail product.</div>
              </div>
            ) : (
              cart.map((i, n) => (
                <div
                  key={key(i)}
                  style={{
                    padding: 9,
                    marginBottom: 6,
                    background: '#101112',
                    border: '1px solid #2b2c29',
                    borderRadius: 6,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div
                      style={{
                        width: 25,
                        height: 25,
                        minWidth: 25,
                        borderRadius: 5,
                        background: '#19231e',
                        color: '#69cf91',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 950,
                      }}
                    >
                      {n + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 850 }}>{i.name}</div>
                      <div style={{ marginTop: 3, fontSize: 6, color: '#69cf91', fontWeight: 900 }}>
                        PRODUCT
                      </div>
                      {(i.size || i.color) && (
                        <div style={{ marginTop: 4, fontSize: 7, color: '#9d9a91' }}>
                          {i.size ? `Size: ${i.size}` : ''}
                          {i.size && i.color ? ' • ' : ''}
                          {i.color ? `Colour: ${i.color}` : ''}
                        </div>
                      )}
                      <div style={{ marginTop: 3, fontSize: 6, color: '#66655f' }}>{i.sku}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#d8b34a', fontSize: 9, fontWeight: 950 }}>
                        ₦{Number(i.price * i.quantity).toLocaleString()}
                      </div>
                      <div style={{ color: '#66655f', fontSize: 6 }}>
                        ₦{Number(i.price).toLocaleString()} each
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 8,
                      paddingTop: 6,
                      borderTop: '1px solid #292a27',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid #343530',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        onClick={() => dec(i)}
                        style={{
                          width: 25,
                          height: 23,
                          border: 0,
                          background: '#1b1c1e',
                          color: '#c4c1b8',
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{ minWidth: 28, textAlign: 'center', fontWeight: 850, fontSize: 8 }}
                      >
                        {i.quantity}
                      </span>
                      <button
                        onClick={() => inc(i)}
                        style={{
                          width: 25,
                          height: 23,
                          border: 0,
                          background: '#1b1c1e',
                          color: '#d8b34a',
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(i)}
                      style={{
                        width: 25,
                        height: 23,
                        border: '1px solid #493033',
                        borderRadius: 4,
                        background: '#211719',
                        color: '#d47777',
                      }}
                    >
                      <CIcon icon={cilTrash} size="sm" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 9, borderTop: '1px solid #2a2b28', background: '#101112' }}>
            {customer && (
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 7 }}
              >
                <button
                  onClick={() => setShowLoyalty(true)}
                  style={{
                    border: '1px solid #343530',
                    background: '#191a1c',
                    color: '#9b9990',
                    borderRadius: 5,
                    padding: 6,
                    fontSize: 7,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'block', color: '#d8b34a', fontWeight: 950 }}>
                    {customer.loyaltyPoints || 0}
                  </span>
                  POINTS / LOYALTY
                </button>
                <button
                  onClick={() => setUsePoints((v) => !v)}
                  style={{
                    border: usePoints ? '1px solid #b58e2e' : '1px solid #343530',
                    background: usePoints ? '#2a2414' : '#191a1c',
                    color: usePoints ? '#d8b34a' : '#9b9990',
                    borderRadius: 5,
                    padding: 6,
                    fontSize: 7,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'block', fontWeight: 950 }}>
                    {usePoints ? 'POINTS ON' : 'POINTS OFF'}
                  </span>
                  REDEEM
                </button>
              </div>
            )}
            {usePoints && customer && (
              <CFormInput
                type="number"
                min="0"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(Math.max(0, Number(e.target.value || 0)))}
                placeholder="Points to redeem"
                style={{
                  height: 29,
                  marginBottom: 7,
                  background: '#191a1c',
                  border: '1px solid #343530',
                  color: '#eeeae0',
                  fontSize: 8,
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#77766f',
                fontSize: 8,
                marginBottom: 5,
              }}
            >
              <span>Subtotal</span>
              <span>₦{Number(subtotal).toLocaleString()}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 5,
              }}
            >
              <span style={{ color: '#77766f', fontSize: 8 }}>Discount</span>
              <CFormInput
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value || 0)))}
                style={{
                  width: 90,
                  height: 25,
                  padding: '2px 6px',
                  background: '#191a1c',
                  border: '1px solid #343530',
                  color: '#eeeae0',
                  fontSize: 8,
                  textAlign: 'right',
                }}
              />
            </div>
            {pointsDiscount > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#d8b34a',
                  fontSize: 8,
                }}
              >
                <span>Points Discount</span>
                <span>- ₦{Number(pointsDiscount).toLocaleString()}</span>
              </div>
            )}
            <div
              style={{
                borderTop: '1px solid #2e2f2b',
                marginTop: 7,
                paddingTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <div>
                <div style={{ color: '#77766f', fontSize: 7 }}>TOTAL DUE</div>
                <div style={{ color: '#d8b34a', fontSize: 24, lineHeight: 1.05, fontWeight: 950 }}>
                  ₦{Number(total).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right', color: '#6e6d66', fontSize: 7 }}>
                LOYALTY EARNED
                <div style={{ color: '#c8c5bb', fontWeight: 900 }}>
                  {Math.floor(total / 1000)} pts
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 5, marginTop: 8 }}>
              <CFormSelect
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  height: 42,
                  background: '#191a1c',
                  color: '#e4e1d8',
                  border: '1px solid #343530',
                  fontSize: 8,
                }}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
                <option value="mixed">Mixed</option>
              </CFormSelect>
              <button
                onClick={() => setShowPayment(true)}
                disabled={processing || !cart.length}
                style={{
                  height: 42,
                  border: 0,
                  borderRadius: 5,
                  background: cart.length ? '#c9a43b' : '#48463e',
                  color: '#111',
                  fontSize: 9,
                  fontWeight: 950,
                }}
              >
                {processing ? 'PROCESSING...' : 'COMPLETE SALE →'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
              <button
                onClick={() => cart.length && setShowHold(true)}
                style={{ border: 0, background: 'transparent', color: '#aaa79c', fontSize: 7 }}
              >
                HOLD [F4]
              </button>
              <button
                onClick={() => cart.length && setShowClear(true)}
                style={{ border: 0, background: 'transparent', color: '#d47777', fontSize: 7 }}
              >
                CLEAR [F7]
              </button>
            </div>
          </div>
        </aside>
      </div>

      <CModal
        visible={showVariant}
        onClose={() => setShowVariant(false)}
        alignment="center"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Select Variant</CModalTitle>
        </CModalHeader>
        <CModalBody style={{ background: '#101114', color: '#f5f1e6' }}>
          {variantProduct && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#d8b34a', fontSize: 9, fontWeight: 900 }}>
                  {catName(variantProduct).toUpperCase()}
                </div>
                <div style={{ fontSize: 18, fontWeight: 950, marginTop: 4 }}>
                  {variantProduct.name}
                </div>
              </div>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}
              >
                {variants(variantProduct).map((v) => {
                  const stock = Number(v.quantity || 0)
                  return (
                    <button
                      key={v.id}
                      disabled={!stock}
                      onClick={() => setVariant(v)}
                      style={{
                        padding: 12,
                        textAlign: 'left',
                        border: variant?.id === v.id ? '1px solid #d8b34a' : '1px solid #30312d',
                        borderRadius: 8,
                        background: variant?.id === v.id ? '#2a2414' : '#191a1c',
                        color: '#f5f1e6',
                        opacity: stock ? 1 : 0.45,
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>
                        {v.size || 'One Size'}
                        {v.color ? ` • ${v.color}` : ''}
                      </div>
                      <div style={{ marginTop: 6, color: '#d8b34a', fontWeight: 900 }}>
                        ₦{Number(v.sellingPrice || 0).toLocaleString()}
                      </div>
                      <div
                        style={{ marginTop: 4, color: stock ? '#69cf91' : '#d47777', fontSize: 8 }}
                      >
                        {stock ? `${stock} available` : 'Out of stock'}
                      </div>
                      {v.sku && (
                        <div style={{ marginTop: 4, color: '#77766f', fontSize: 7 }}>{v.sku}</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter style={{ background: '#101114' }}>
          <CButton color="secondary" onClick={() => setShowVariant(false)}>
            Cancel
          </CButton>
          <button
            disabled={!variant}
            onClick={() => {
              add(variantProduct, variant)
              setShowVariant(false)
              setVariant(null)
              setVariantProduct(null)
            }}
            style={{
              height: 38,
              padding: '0 18px',
              border: 0,
              borderRadius: 5,
              background: variant ? '#c9a43b' : '#48463e',
              color: '#111',
              fontWeight: 950,
            }}
          >
            <CIcon icon={cilCheck} className="me-1" />
            ADD TO ORDER
          </button>
        </CModalFooter>
      </CModal>
      <CustomerSearchModal
        show={showCustomer}
        onHide={() => setShowCustomer(false)}
        customers={customers}
        onSelect={(c) => {
          setCustomer(c)
          setShowCustomer(false)
        }}
      />
      <PaymentModal
        show={showPayment}
        onHide={() => setShowPayment(false)}
        total={total}
        onSubmit={complete}
        processing={processing}
        staff={staff}
        currentUser={user}
        cart={cart}
      />
      <ReceiptModal
        show={showReceipt}
        settings={settings}
        onHide={() => setShowReceipt(false)}
        sale={sale}
      />
      <HoldSaleModal
        show={showHold}
        onHide={() => setShowHold(false)}
        customers={customers}
        total={total}
        cartCount={cart.length}
        onSave={hold}
      />
      <NewCustomerModal
        show={showNewCustomer}
        onHide={() => setShowNewCustomer(false)}
        onSuccess={(c) => {
          setCustomers((x) => [c, ...x])
          setCustomer(c)
          setShowNewCustomer(false)
        }}
      />
      <ShowHeldSalesModal
        show={showHeld}
        onHide={() => setShowHeld(false)}
        heldSales={heldSales}
        onRestore={restore}
      />
      <LoyaltyLookupModal
        visible={showLoyalty}
        onClose={() => setShowLoyalty(false)}
        cardNumber={cardNumber}
        setCardNumber={setCardNumber}
        onSearch={loyalty}
        cardResult={cardResult}
      />
      <BarcodeModal visible={showBarcode} onClose={() => setShowBarcode(false)} />
      <ClearCartModal
        visible={showClear}
        onClose={() => {
          clearPOS()
          setShowClear(false)
        }}
      />
      <DailyReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        report={report}
        loading={reportLoading}
      />
      <CModal
        visible={showReceiptSearch}
        onClose={() => {
          setShowReceiptSearch(false)
          setReceiptSearch('')
          setReceiptResults([])
        }}
        size="lg"
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilPrint} className="me-2" />
            Reprint Receipt
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex gap-2 mb-4">
            <CFormInput
              value={receiptSearch}
              placeholder="Receipt number, customer name or sale ID"
              onChange={(e) => setReceiptSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchReceipts()}
            />
            <CButton
              color="primary"
              onClick={searchReceipts}
              disabled={receiptLoading || !receiptSearch.trim()}
            >
              <CIcon icon={cilChart} className="me-1" />
              Search
            </CButton>
          </div>
          {receiptLoading && <div className="text-center py-4">Searching sales...</div>}
          {receiptResults.map((x) => (
            <div
              key={x.id}
              className="d-flex justify-content-between align-items-center p-3 mb-2"
              style={{ border: '1px solid #e9ecef', borderRadius: 10 }}
            >
              <div>
                <div className="fw-bold">{x.receiptNumber || `SALE-${x.id}`}</div>
                <div className="small text-medium-emphasis">
                  {x.customer?.fullname || x.Customer?.fullname || 'Walk-in Customer'}
                </div>
                <div className="small text-medium-emphasis">
                  {x.createdAt ? new Date(x.createdAt).toLocaleString() : '-'}
                </div>
              </div>
              <div className="text-end">
                <div className="fw-bold mb-2">₦{Number(x.totalAmount || 0).toLocaleString()}</div>
                <CButton color="dark" size="sm" onClick={() => reprint(x.id)}>
                  <CIcon icon={cilPrint} className="me-1" />
                  Reprint
                </CButton>
              </div>
            </div>
          ))}
        </CModalBody>
      </CModal>

      {showAdminLogin && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
        >
          <div
            style={{
              width: '380px',
              maxWidth: '90%',
              background: '#171b20',
              borderRadius: '10px',
              padding: '25px',
              boxShadow: '0 20px 60px rgba(0,0,0,.5)',
              border: '1px solid #30363d',
            }}
          >
            <h3
              style={{
                margin: '0 0 6px',
                color: '#fff',
              }}
            >
              Administrator Access
            </h3>

            <p
              style={{
                color: '#8e969f',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              Enter your administrator credentials to unlock the application.
            </p>

            {adminError && (
              <div
                style={{
                  background: '#35191b',
                  color: '#ff8585',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '13px',
                }}
              >
                {adminError}
              </div>
            )}

            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Administrator password"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdminLogin()
                }
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #363d45',
                background: '#0f1215',
                color: '#fff',
                outline: 'none',
                marginBottom: '15px',
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false)
                  setAdminPassword('')
                  setAdminError('')
                }}
                style={{
                  padding: '10px 15px',
                  borderRadius: '6px',
                  border: '1px solid #363d45',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={adminLoading}
                onClick={handleAdminLogin}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#d4af37',
                  color: '#111',
                  fontWeight: 800,
                  cursor: adminLoading ? 'not-allowed' : 'pointer',
                  opacity: adminLoading ? 0.6 : 1,
                }}
              >
                {adminLoading ? 'Verifying...' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default POSPage
