import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBarcode,
  cilCart,
  cilChart,
  cilCheck,
  cilPeople,
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

const API_ROOT = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')
const API_URL = `${API_ROOT}/api/v1`

const POSPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
    if (!cart.length) {
      alert('Cart is empty')
      return
    }

    if (processing) return

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

        // Keep receipt information
        name: i.name,
        sku: i.sku || '',
        size: i.size || null,
        color: i.color || null,
      })),

      discount: Number(discount || 0),

      paymentMethod: pd?.paymentMethod || paymentMethod,

      note: pd?.note?.trim() || null,

      usePoints: Boolean(usePoints),
      redeemPoints: Number(redeemPoints || 0),

      subtotal: Number(subtotal),
      totalAmount: Number(total),
    }

    try {
      console.log('POS SALE PAYLOAD:', payload)

      const r = await axios.post(`${API_URL}/sales`, payload, {
        ...cfg(),
        timeout: 12000,
      })

      console.log('POS SALE RESPONSE:', r.data)

      /*
       * IMPORTANT:
       * Backend may return:
       *
       * { sale: {...} }
       * or
       * { data: {...} }
       * or
       * the sale object directly.
       */
      const serverSale = r?.data?.sale || r?.data?.data || r?.data

      if (!serverSale) {
        throw new Error('Sale was completed but no receipt data was returned.')
      }

      /*
       * Make sure ReceiptModal receives the items.
       */
      const receiptSale = {
        ...serverSale,

        id: serverSale.id || null,

        receiptNumber: serverSale.receiptNumber || serverSale.receiptNo || `ONI-${Date.now()}`,

        localSaleId: serverSale.localSaleId || id,

        subtotal: Number(serverSale.subtotal ?? subtotal),

        discount: Number(serverSale.discount ?? discount ?? 0),

        totalAmount: Number(serverSale.totalAmount ?? total),

        paymentMethod: serverSale.paymentMethod || payload.paymentMethod,

        customer: serverSale.customer || serverSale.Customer || customer || null,

        Customer: serverSale.Customer || serverSale.customer || customer || null,

        /*
         * Backend names
         */
        SaleItems: Array.isArray(serverSale.SaleItems)
          ? serverSale.SaleItems
          : Array.isArray(serverSale.saleItems)
            ? serverSale.saleItems
            : Array.isArray(serverSale.items)
              ? serverSale.items
              : payload.items,

        /*
         * Also provide lowercase items.
         */
        items: Array.isArray(serverSale.items)
          ? serverSale.items
          : Array.isArray(serverSale.SaleItems)
            ? serverSale.SaleItems
            : Array.isArray(serverSale.saleItems)
              ? serverSale.saleItems
              : payload.items,
      }

      console.log('RECEIPT DATA:', receiptSale)

      /*
       * Set the SALE FIRST.
       */
      setSale(receiptSale)

      /*
       * Close payment.
       */
      setShowPayment(false)

      /*
       * IMPORTANT:
       * Open receipt only after receiptSale has been prepared.
       */
      setShowReceipt(true)

      /*
       * Now clear the POS.
       */
      clearPOS()

      await refreshQueue()

      /*
       * Refresh products so stock immediately reflects
       * the completed sale.
       */
      load()
    } catch (e) {
      console.error('COMPLETE SALE ERROR:', e)

      /*
       * Server responded with an actual error.
       * Do NOT show a fake receipt.
       */
      if (e?.response) {
        alert(e.response?.data?.message || e.response?.data?.error || 'Failed to complete sale')

        return
      }

      /*
       * No server response = network/offline situation.
       */
      try {
        await window.electronAPI?.offlineAddQueue?.('sale', payload)

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

          SaleItems: cart.map((i) => ({
            ...i,

            subtotal: Number(i.price) * Number(i.quantity),
          })),
        }

        console.log('OFFLINE RECEIPT:', off)

        setSale(off)

        setShowPayment(false)

        setShowReceipt(true)

        clearPOS()

        await refreshQueue()

        alert('Server unavailable. Sale saved offline and will synchronize automatically.')
      } catch (q) {
        console.error('OFFLINE SAVE ERROR:', q)

        alert('Sale could not be completed or saved offline.')
      }
    } finally {
      setProcessing(false)
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

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : []

    const keyword = String(search || '')
      .trim()
      .toLowerCase()

    return list.filter((product) => {
      const matchesSearch =
        !keyword ||
        String(product?.name || '')
          .toLowerCase()
          .includes(keyword) ||
        String(product?.sku || '')
          .toLowerCase()
          .includes(keyword) ||
        String(product?.barcode || '')
          .toLowerCase()
          .includes(keyword)

      const matchesCategory =
        category === 'all' ||
        category === '' ||
        category === null ||
        String(product?.categoryId || '') === String(category)

      return matchesSearch && matchesCategory
    })
  }, [products, search, category])
  const categoryTabs = [
    { id: 'all', name: 'ALL PRODUCTS' },
    ...categories.map((c) => ({ id: c.id, name: c.name })),
  ]
  const navigateTo = (path) => {
    window.location.hash = path.startsWith('#') ? path : `#${path}`
  }

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: '⌂',
    },
    {
      label: 'Point of Sale',
      path: '/pos',
      icon: '▣',
      active: true,
    },
    {
      label: 'Products',
      path: '/products',
      icon: '◈',
    },
    {
      label: 'Purchases',
      path: '/purchases',
      icon: '↓',
    },
    {
      label: 'Inventory',
      path: '/stock',
      icon: '▤',
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: '♙',
    },
    {
      label: 'Sales History',
      path: '/sales',
      icon: '▥',
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: '◒',
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: '⚙',
    },
  ]
  // ==========================================================
  // PRODUCT CATALOG
  // Keep the original add/select logic.
  // Products with variants open the variant selector.
  // Products without variants go directly into the cart.
  // ==========================================================

  const getProductStock = (product) => {
    const vs = variants(product)

    if (vs.length > 0) {
      return vs.reduce((sum, v) => sum + Number(v?.quantity || 0), 0)
    }

    return Number(product?.quantity || 0)
  }

  const handleCatalogClick = (product) => {
    if (getProductStock(product) <= 0) {
      alert('This item is out of stock.')
      return
    }

    selectProduct(product)
  }

  return (
    <div
      style={{
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#f5f6f8',
        color: '#171717',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
      }}
    >
      {/* =====================================================
            TOP HEADER
        ====================================================== */}

      <header
        style={{
          height: '64px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '0 18px',
          position: 'relative',
          zIndex: 100,
        }}
      >
        {/* BRAND */}

        <div
          style={{
            width: '205px',
            minWidth: '205px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '7px',
              background: '#d4af37',
              color: '#111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '12px',
            }}
          >
            OG
          </div>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 900,
                letterSpacing: '1px',
                lineHeight: 1,
              }}
            >
              ONISHAKARA
            </div>

            <div
              style={{
                fontSize: '8px',
                color: '#8b8f97',
                marginTop: '5px',
                letterSpacing: '.8px',
              }}
            >
              GOLD FASHION STORE
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div
          style={{
            flex: 1,
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '0 12px',
            border: '1px solid #dfe3e8',
            borderRadius: '8px',
            background: '#ffffff',
          }}
        >
          <CIcon
            icon={cilBarcode}
            style={{
              color: '#b28a18',
              flexShrink: 0,
            }}
          />

          <CFormInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
            placeholder="Search garment name, SKU, textile, or barcode..."
            style={{
              border: 0,
              boxShadow: 'none',
              outline: 0,
              background: 'transparent',
              color: '#111827',
              fontSize: '12px',
              padding: 0,
            }}
          />

          <span
            style={{
              fontSize: '8px',
              color: '#8b8f97',
              border: '1px solid #e5e7eb',
              borderRadius: '5px',
              padding: '3px 7px',
            }}
          >
            F3
          </span>
        </div>

        {/* ONLINE STATUS */}

        <div
          style={{
            minWidth: '105px',
            padding: '6px 9px',
            borderRadius: '7px',
            border: `1px solid ${online ? '#cdebd6' : '#f0cccc'}`,
            background: online ? '#f3fbf5' : '#fff5f5',
          }}
        >
          <div
            style={{
              color: online ? '#18834a' : '#c43d3d',
              fontSize: '9px',
              fontWeight: 800,
            }}
          >
            ● {online ? 'ONLINE' : 'OFFLINE'}
          </div>

          <div
            style={{
              color: '#8b8f97',
              fontSize: '7px',
              marginTop: '3px',
            }}
          >
            {syncing ? 'SYNCING...' : queueCount ? `${queueCount} PENDING` : 'SYNC ACTIVE'}
          </div>
        </div>

        {/* TIME */}

        <div
          style={{
            textAlign: 'center',
            minWidth: '55px',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: '11px',
            }}
          >
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          <div
            style={{
              fontSize: '7px',
              color: '#8b8f97',
            }}
          >
            WAT
          </div>
        </div>

        {/* USER */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              textAlign: 'right',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
              }}
            >
              {user?.fullname || user?.name || 'Cashier'}
            </div>

            <div
              style={{
                fontSize: '7px',
                color: '#8b8f97',
              }}
            >
              CASHIER
            </div>
          </div>

          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#d4af37',
              color: '#111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
            }}
          >
            {(user?.fullname || user?.name || 'C').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* =====================================================
            MAIN AREA
        ====================================================== */}

      <div
        style={{
          height: 'calc(100vh - 64px)',
          display: 'grid',
          gridTemplateColumns: `${sidebarOpen ? '210px' : '0px'} minmax(0, 1fr) 380px`,
          transition: 'grid-template-columns .2s ease',
          minHeight: 0,
        }}
      >
        {/* ===================================================
              SIDEBAR
          ==================================================== */}

        <aside
          style={{
            overflow: 'hidden',
            background: '#ffffff',
            color: '#1f2937',
            borderRight: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              width: '210px',
              height: '100%',
              padding: '16px 10px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: '8px',
                fontWeight: 800,
                color: '#8b8f97',
                letterSpacing: '1.2px',
                padding: '5px 10px 10px',
              }}
            >
              MAIN MENU
            </div>

            {navigationItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigateTo(item.path)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: item.active ? '1px solid #ead9a6' : '1px solid transparent',
                  borderRadius: '7px',
                  background: item.active ? '#fff8df' : 'transparent',
                  color: item.active ? '#9b7412' : '#4b5563',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '0 10px',
                  cursor: 'pointer',
                  marginBottom: '3px',
                  textAlign: 'left',
                  fontSize: '10px',
                  fontWeight: item.active ? 800 : 600,
                }}
              >
                <span
                  style={{
                    width: '25px',
                    height: '25px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: item.active ? '#d4af37' : '#f1f3f5',
                    color: item.active ? '#111111' : '#6b7280',
                    fontWeight: 900,
                  }}
                >
                  {item.icon}
                </span>

                {item.label}
              </button>
            ))}

            <div
              style={{
                marginTop: 'auto',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                style={{
                  width: '100%',
                  height: '36px',
                  border: '1px solid #dfe3e8',
                  borderRadius: '7px',
                  background: '#f8f9fa',
                  color: '#6b7280',
                  fontSize: '8px',
                  cursor: 'pointer',
                }}
              >
                ‹ COLLAPSE MENU
              </button>
            </div>
          </div>
        </aside>

        {/* ===================================================
              PRODUCTS WORKSPACE
          ==================================================== */}

        <main
          style={{
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
            background: '#f7f8fa',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* POS TITLE BAR */}

          <div
            style={{
              background: '#ffffff',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#1f2937',
                }}
              >
                Point of Sale
              </div>

              <div
                style={{
                  fontSize: '8px',
                  color: '#8b8f97',
                  marginTop: '3px',
                  textTransform: 'uppercase',
                  letterSpacing: '.7px',
                }}
              >
                Retail terminal
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '7px',
              }}
            >
              <CButton
                size="sm"
                color="light"
                onClick={() => navigateTo('/dashboard')}
                style={{
                  border: '1px solid #dfe3e8',
                  fontWeight: 700,
                  fontSize: '10px',
                }}
              >
                ⌂ Dashboard
              </CButton>

              <CButton
                size="sm"
                color="light"
                onClick={() => setShowHold(true)}
                style={{
                  border: '1px solid #dfe3e8',
                  fontWeight: 700,
                  fontSize: '10px',
                }}
              >
                Hold Order
              </CButton>

              <CButton
                size="sm"
                style={{
                  background: '#111111',
                  color: '#ffffff',
                  border: 0,
                  fontWeight: 800,
                  fontSize: '10px',
                }}
                onClick={() => clearPOS()}
              >
                + New Sale
              </CButton>
            </div>
          </div>

          {/* CATEGORY BAR */}

          <div
            style={{
              background: '#ffffff',
              borderBottom: '1px solid #e5e7eb',
              padding: '9px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
            }}
          >
            {categoryTabs.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                style={{
                  height: '31px',
                  padding: '0 12px',
                  border:
                    String(category) === String(c.id) ? '1px solid #c39b2d' : '1px solid #e1e4e8',
                  borderRadius: '6px',
                  background: String(category) === String(c.id) ? '#fff8df' : '#ffffff',
                  color: String(category) === String(c.id) ? '#9b7412' : '#6b7280',
                  fontSize: '8px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* PRODUCT AREA */}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
            }}
          >
            {loading ? (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8b8f97',
                }}
              >
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '50px 20px',
                  textAlign: 'center',
                  color: '#8b8f97',
                }}
              >
                No products found.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                  gap: '12px',
                }}
              >
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '9px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 7px rgba(0,0,0,.03)',
                    }}
                  >
                    {/* IMAGE */}

                    <div
                      style={{
                        height: '150px',
                        background: '#f0f1f3',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#a0a4aa',
                            fontSize: '30px',
                            fontWeight: 900,
                          }}
                        >
                          OG
                        </div>
                      )}

                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background:
                            Number(product.quantity || 0) <= Number(product.reorderLevel || 5)
                              ? '#fff1d6'
                              : '#e8f7ed',
                          color:
                            Number(product.quantity || 0) <= Number(product.reorderLevel || 5)
                              ? '#a16d0a'
                              : '#18834a',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          fontSize: '7px',
                          fontWeight: 800,
                        }}
                      >
                        {Number(product.quantity || 0) <= Number(product.reorderLevel || 5)
                          ? `LOW STOCK (${product.quantity || 0})`
                          : `IN STOCK (${product.quantity || 0})`}
                      </div>
                    </div>

                    {/* PRODUCT DETAILS */}

                    <div
                      style={{
                        padding: '10px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#1f2937',
                          minHeight: '30px',
                        }}
                      >
                        {product.name}
                      </div>

                      <div
                        style={{
                          fontSize: '8px',
                          color: '#8b8f97',
                          marginTop: '3px',
                        }}
                      >
                        {product.sku || 'NO SKU'}
                      </div>

                      <div
                        style={{
                          marginTop: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '5px',
                        }}
                      >
                        <strong
                          style={{
                            fontSize: '13px',
                            color: '#111827',
                          }}
                        >
                          ₦{Number(product.sellingPrice || 0).toLocaleString()}
                        </strong>

                        <CButton
                          size="sm"
                          onClick={() => handleCatalogClick(product)}
                          style={{
                            background: '#111111',
                            color: '#ffffff',
                            border: 0,
                            borderRadius: '5px',
                            fontSize: '8px',
                            fontWeight: 800,
                            padding: '6px 9px',
                          }}
                        >
                          + ADD
                        </CButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ===================================================
              RIGHT ORDER PANEL
          ==================================================== */}

        <aside
          style={{
            background: '#ffffff',
            borderLeft: '1px solid #e1e4e8',
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* CUSTOMER */}

          <div
            style={{
              padding: '12px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                fontSize: '8px',
                color: '#8b8f97',
                fontWeight: 800,
                letterSpacing: '.8px',
                marginBottom: '7px',
              }}
            >
              ACTIVE ORDER
            </div>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                  }}
                >
                  {customer?.fullname || customer?.name || 'Walk-in Customer'}
                </div>

                <div
                  style={{
                    color: '#8b8f97',
                    fontSize: '8px',
                    marginTop: '3px',
                  }}
                >
                  {customer?.phone || 'No customer selected'}
                </div>
              </div>

              <CButton
                size="sm"
                color="light"
                onClick={() => setShowCustomer(true)}
                style={{
                  border: '1px solid #e1e4e8',
                  fontSize: '8px',
                  fontWeight: 800,
                }}
              >
                {customer ? 'CHANGE' : '+ CUSTOMER'}
              </CButton>
            </div>
          </div>

          {/* CART HEADER */}

          <div
            style={{
              padding: '11px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: '10px',
              }}
            >
              Garment Registry
            </div>

            <button
              type="button"
              onClick={() => setShowClear(true)}
              style={{
                border: 0,
                background: 'transparent',
                color: '#9b7412',
                fontSize: '8px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              CLEAR ALL
            </button>
          </div>

          {/* CART */}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 12px',
            }}
          >
            {cart.length === 0 ? (
              <div
                style={{
                  padding: '45px 15px',
                  textAlign: 'center',
                  color: '#9ca3af',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    marginBottom: '8px',
                  }}
                >
                  🛍
                </div>

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '11px',
                  }}
                >
                  Your order is empty
                </div>

                <div
                  style={{
                    fontSize: '8px',
                    marginTop: '4px',
                  }}
                >
                  Add products from the registry.
                </div>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={item.variantId || item.productId || item.id || index}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '9px',
                    marginBottom: '7px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: '#1f2937',
                        }}
                      >
                        {item.name || 'Product'}
                      </div>

                      {(item.size || item.color) && (
                        <div
                          style={{
                            color: '#8b8f97',
                            fontSize: '7px',
                            marginTop: '3px',
                          }}
                        >
                          {[item.size, item.color].filter(Boolean).join(' / ')}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(item)}
                      style={{
                        border: 0,
                        background: 'transparent',
                        color: '#a0a4aa',
                        cursor: 'pointer',
                      }}
                    >
                      <CIcon icon={cilTrash} size="sm" />
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => dec(item)}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: '1px solid #dfe3e8',
                          background: '#ffffff',
                          borderRadius: '5px',
                          cursor: 'pointer',
                        }}
                      >
                        −
                      </button>

                      <span
                        style={{
                          width: '25px',
                          textAlign: 'center',
                          fontWeight: 800,
                          fontSize: '9px',
                        }}
                      >
                        {item.quantity || 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => inc(item)}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: '1px solid #dfe3e8',
                          background: '#ffffff',
                          borderRadius: '5px',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                    </div>

                    <strong
                      style={{
                        fontSize: '10px',
                      }}
                    >
                      ₦
                      {Number(
                        Number(item.price || 0) * Number(item.quantity || 0),
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* TOTALS */}

          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              padding: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                color: '#6b7280',
                marginBottom: '6px',
              }}
            >
              <span>Subtotal</span>

              <strong
                style={{
                  color: '#374151',
                }}
              >
                ₦{Number(subtotal || 0).toLocaleString()}
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                color: '#6b7280',
                marginBottom: '8px',
              }}
            >
              <span>Discount</span>

              <strong
                style={{
                  color: '#374151',
                }}
              >
                − ₦{Number(discount || 0).toLocaleString()}
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8f3e3',
                border: '1px solid #ead9a6',
                borderRadius: '7px',
                padding: '10px',
                marginBottom: '9px',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#6b5a24',
                }}
              >
                TOTAL PAYABLE
              </span>

              <strong
                style={{
                  fontSize: '18px',
                  color: '#9b7412',
                }}
              >
                ₦{Number(total || 0).toLocaleString()}
              </strong>
            </div>

            {/* PAYMENT */}

            <CButton
              color="dark"
              className="w-100"
              disabled={!cart.length || processing}
              onClick={() => setShowPayment(true)}
              style={{
                height: '43px',
                background: '#111111',
                border: 0,
                borderRadius: '7px',
                fontSize: '10px',
                fontWeight: 900,
              }}
            >
              {processing
                ? 'PROCESSING...'
                : `COMPLETE SALE — ₦${Number(total || 0).toLocaleString()}`}
            </CButton>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                marginTop: '7px',
              }}
            >
              <CButton
                size="sm"
                color="light"
                onClick={() => setShowReceiptSearch(true)}
                style={{
                  border: '1px solid #e1e4e8',
                  fontSize: '8px',
                  fontWeight: 800,
                }}
              >
                <CIcon icon={cilPrint} className="me-1" />
                Reprint
              </CButton>

              <CButton
                size="sm"
                color="light"
                onClick={() => setShowHeld(true)}
                style={{
                  border: '1px solid #e1e4e8',
                  fontSize: '8px',
                  fontWeight: 800,
                }}
              >
                Held Sales
              </CButton>
            </div>
          </div>
        </aside>
      </div>

      {/* =====================================================
            COLLAPSED SIDEBAR BUTTON
        ====================================================== */}

      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'fixed',
            left: '12px',
            top: '76px',
            zIndex: 200,
            width: '38px',
            height: '38px',
            border: '1px solid #d4af37',
            borderRadius: '7px',
            background: '#ffffff',
            color: '#9b7412',
            cursor: 'pointer',
            fontSize: '18px',
            boxShadow: '0 5px 15px rgba(0,0,0,.12)',
          }}
        >
          ☰
        </button>
      )}

      {/* =====================================================
            MODALS
        ====================================================== */}

      {/* =====================================================
            PRODUCT VARIANT SELECTOR
        ====================================================== */}

      <CModal
        visible={showVariant}
        onClose={() => {
          setShowVariant(false)
          setVariantProduct(null)
          setVariant(null)
        }}
        alignment="center"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>
            Select {variantProduct?.name || 'Product Variant'}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '10px',
            }}
          >
            {variants(variantProduct).map((v) => {
              const stock = Number(v?.quantity || 0)
              const selected = Number(variant?.id) === Number(v?.id)

              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={stock <= 0}
                  onClick={() => setVariant(v)}
                  style={{
                    border: selected ? '2px solid #d4af37' : '1px solid #e5e7eb',
                    borderRadius: '10px',
                    background: selected ? '#fff8df' : '#ffffff',
                    padding: '12px',
                    textAlign: 'left',
                    cursor: stock > 0 ? 'pointer' : 'not-allowed',
                    opacity: stock > 0 ? 1 : .45,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '11px' }}>
                    {[v.size, v.color].filter(Boolean).join(' / ') || 'Standard'}
                  </div>
                  <div style={{ marginTop: 5, fontWeight: 900, fontSize: '13px' }}>
                    ₦{Number(v.sellingPrice ?? variantProduct?.sellingPrice ?? 0).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 5, fontSize: '9px', color: stock > 0 ? '#18834a' : '#b42318' }}>
                    {stock > 0 ? `${stock} IN STOCK` : 'OUT OF STOCK'}
                  </div>
                </button>
              )
            })}
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton
            color="light"
            onClick={() => {
              setShowVariant(false)
              setVariantProduct(null)
              setVariant(null)
            }}
          >
            Cancel
          </CButton>
          <CButton
            color="dark"
            disabled={!variant || Number(variant?.quantity || 0) <= 0}
            onClick={() => {
              add(variantProduct, variant)
              setShowVariant(false)
              setVariantProduct(null)
              setVariant(null)
            }}
          >
            Add to Cart
          </CButton>
        </CModalFooter>
      </CModal>

      <CustomerSearchModal
        show={showCustomer}
        onHide={() => setShowCustomer(false)}
        customers={customers}
        onSelect={(selected) => {
          setCustomer(selected)
          setShowCustomer(false)
        }}
      />

      <PaymentModal
        show={showPayment}
        onHide={() => {
          if (!processing) {
            setShowPayment(false)
          }
        }}
        total={total}
        onSubmit={complete}
        processing={processing}
        currentUser={user}
      />

      {showReceipt && (
        <ReceiptModal
          show={showReceipt}
          sale={sale}
          onHide={() => {
            setShowReceipt(false)
            setSale(null)
          }}
        />
      )}

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

      {/* =====================================================
            REPRINT RECEIPT
        ====================================================== */}

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchReceipts()
                }
              }}
            />

            <CButton
              color="primary"
              onClick={searchReceipts}
              disabled={receiptLoading || !receiptSearch.trim()}
            >
              Search
            </CButton>
          </div>

          {receiptLoading && <div className="text-center py-4">Searching sales...</div>}

          {receiptResults.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '9px',
                padding: '12px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 800,
                  }}
                >
                  {item.receiptNumber || `SALE-${item.id}`}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                  }}
                >
                  {item.customer?.fullname || item.Customer?.fullname || 'Walk-in Customer'}
                </div>

                <div
                  style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                  }}
                >
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                </div>
              </div>

              <div
                style={{
                  textAlign: 'right',
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    marginBottom: '7px',
                  }}
                >
                  ₦{Number(item.totalAmount || 0).toLocaleString()}
                </div>

                <CButton color="dark" size="sm" onClick={() => reprint(item.id)}>
                  <CIcon icon={cilPrint} className="me-1" />
                  Reprint
                </CButton>
              </div>
            </div>
          ))}
        </CModalBody>
      </CModal>
    </div>
  )
}
export default POSPage
