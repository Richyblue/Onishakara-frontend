import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Swal from 'sweetalert2'

import CIcon from '@coreui/icons-react'
import {
  cilPencil,
  cilTrash,
  cilCloudDownload,
  cilSearch,
  cilReload,
  cilPlus,
  cilWarning,
  cilCheckCircle,
  cilCart,
  cilFilter,
  cilChevronLeft,
  cilChevronRight,
  cilX,
} from '@coreui/icons'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CFormInput,
  CFormSelect,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CPagination,
  CPaginationItem,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'

import { Link } from 'react-router-dom'

import { successAlert, errorAlert } from 'src/utils/alerts'

const ProductList = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10

  const API_URL = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = (value) => {
    const amount = Number(value || 0)

    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  const getImageUrl = (image) => {
    if (!image) return ''

    const value = String(image).trim()

    if (!value) return ''

    // Full URL
    if (/^https?:\/\//i.test(value)) {
      return value
    }

    // Base64/blob
    if (/^(data:|blob:)/i.test(value)) {
      return value
    }

    // Already starts with /
    if (value.startsWith('/')) {
      return `${API_URL}${value}`
    }

    return `${API_URL}/${value}`
  }

  const getStockStatus = (product) => {
    const quantity = Number(product.quantity || 0)
    const reorderLevel = Number(product.reorderLevel || 0)

    if (quantity <= 0) {
      return 'out'
    }

    if (quantity <= reorderLevel) {
      return 'low'
    }

    return 'healthy'
  }

  // =========================================================
  // FETCH PRODUCTS
  // =========================================================

  const getProducts = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}/api/v1/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const productList = Array.isArray(response.data?.products)
        ? response.data.products
        : Array.isArray(response.data)
          ? response.data
          : []

      setProducts(productList)
    } catch (error) {
      console.error('Failed to fetch products:', error)

      errorAlert(error.response?.data?.message || error.message || 'Unable to load products.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    getProducts()
  }, [])

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const deleteProduct = async (id, productName) => {
    const result = await Swal.fire({
      title: 'Move Product to Recycle Bin?',
      html: `
        <div style="font-size:14px;color:#6b7280;">
          <strong style="color:#111827;">${productName || 'This product'}</strong>
          will be removed from active inventory.
          <br/>
          <span style="display:inline-block;margin-top:8px;">
            You can restore it later from the Recycle Bin.
          </span>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Move to Recycle Bin',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')

      await axios.delete(`${API_URL}/api/v1/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await Swal.fire({
        icon: 'success',
        title: 'Product Deleted',
        text: 'The product has been moved to the Recycle Bin.',
        timer: 1800,
        showConfirmButton: false,
      })

      await getProducts(true)
    } catch (error) {
      console.error('Delete product error:', error)

      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.response?.data?.message || error.message || 'Failed to delete product.',
      })
    }
  }

  // =========================================================
  // FILTERING
  // =========================================================

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || String(product.status || '').toLowerCase() === statusFilter

      const stockStatus = getStockStatus(product)

      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && (stockStatus === 'low' || stockStatus === 'out')) ||
        (stockFilter === 'out' && stockStatus === 'out') ||
        (stockFilter === 'healthy' && stockStatus === 'healthy')

      return matchesSearch && matchesStatus && matchesStock
    })
  }, [products, search, statusFilter, stockFilter])

  // =========================================================
  // RESET PAGINATION WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, stockFilter])

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const totalProducts = products.length

    const activeProducts = products.filter((product) => product.status === 'active').length

    const inactiveProducts = products.filter((product) => product.status !== 'active').length

    const lowStock = products.filter((product) => {
      const quantity = Number(product.quantity || 0)
      const reorderLevel = Number(product.reorderLevel || 0)

      return quantity > 0 && quantity <= reorderLevel
    }).length

    const outOfStock = products.filter((product) => Number(product.quantity || 0) <= 0).length

    const inventoryCostValue = products.reduce(
      (sum, product) => sum + Number(product.costPrice || 0) * Number(product.quantity || 0),
      0,
    )

    const inventoryRetailValue = products.reduce(
      (sum, product) => sum + Number(product.sellingPrice || 0) * Number(product.quantity || 0),
      0,
    )

    const potentialProfit = inventoryRetailValue - inventoryCostValue

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStock,
      outOfStock,
      inventoryCostValue,
      inventoryRetailValue,
      potentialProfit,
    }
  }, [products])

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const safeCurrentPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1

  const currentProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  )

  // =========================================================
  // PAGINATION HELPERS
  // =========================================================

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return

    setCurrentPage(page)
  }

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    const pages = []

    pages.push(1)

    if (safeCurrentPage > 4) {
      pages.push('...')
    }

    const start = Math.max(2, safeCurrentPage - 1)
    const end = Math.min(totalPages - 1, safeCurrentPage + 1)

    for (let page = start; page <= end; page += 1) {
      pages.push(page)
    }

    if (safeCurrentPage < totalPages - 3) {
      pages.push('...')
    }

    pages.push(totalPages)

    return pages
  }

  // =========================================================
  // EXPORT EXCEL
  // =========================================================

  const exportToExcel = () => {
    try {
      const exportData = filteredProducts.map((product) => ({
        Name: product.name || '',
        SKU: product.sku || '',
        Barcode: product.barcode || '',
        CostPrice: Number(product.costPrice || 0),
        SellingPrice: Number(product.sellingPrice || 0),
        Quantity: Number(product.quantity || 0),
        ReorderLevel: Number(product.reorderLevel || 0),
        InventoryCostValue: Number(product.costPrice || 0) * Number(product.quantity || 0),
        InventoryRetailValue: Number(product.sellingPrice || 0) * Number(product.quantity || 0),
        Status: product.status || '',
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)

      const workbook = XLSX.utils.book_new()

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Onishakara Products')

      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      })

      const file = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      })

      saveAs(file, `Onishakara-Gold-Products-${new Date().toISOString().slice(0, 10)}.xlsx`)

      successAlert('Product inventory exported successfully.')
    } catch (error) {
      console.error('Export error:', error)

      errorAlert('Unable to export product inventory.')
    }
  }

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setStockFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || stockFilter !== 'all'

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        minHeight: '100%',
        paddingBottom: '30px',
      }}
    >
      {/* =====================================================
          PREMIUM ONISHAKARA GOLD HEADER
      ====================================================== */}

      <div
        className="mb-4"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 55%, #27272a 100%)',
          borderRadius: '20px',
          padding: '30px',
          color: '#fff',
          boxShadow: '0 12px 35px rgba(0,0,0,0.16)',
        }}
      >
        {/* GOLD DECORATION */}

        <div
          style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            right: '-60px',
            top: '-70px',
            border: '1px solid rgba(232,189,53,0.18)',
            boxShadow: '0 0 0 30px rgba(232,189,53,0.03)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            right: '80px',
            bottom: '-65px',
            background: 'rgba(232,189,53,0.05)',
          }}
        />

        <CRow className="align-items-center position-relative">
          <CCol lg={8}>
            <div
              className="mb-2"
              style={{
                color: '#e8bd35',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              ONISHAKARA GOLD
            </div>

            <h2
              className="mb-2"
              style={{
                fontWeight: '800',
                letterSpacing: '-0.8px',
                fontSize: '28px',
              }}
            >
              Product Inventory
            </h2>

            <p
              className="mb-0"
              style={{
                color: '#a1a1aa',
                fontSize: '14px',
                maxWidth: '650px',
                lineHeight: '1.7',
              }}
            >
              Manage fashion products, pricing, stock levels and inventory performance from one
              place.
            </p>
          </CCol>

          <CCol lg={4} className="text-lg-end mt-4 mt-lg-0">
            <Link
              to="/addProduct"
              style={{
                textDecoration: 'none',
              }}
            >
              <CButton
                className="border-0"
                style={{
                  background: 'linear-gradient(135deg, #e8bd35 0%, #c9a227 100%)',
                  color: '#111827',
                  borderRadius: '11px',
                  fontWeight: '800',
                  padding: '11px 18px',
                  boxShadow: '0 6px 18px rgba(232,189,53,0.22)',
                }}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Add Product
              </CButton>
            </Link>
          </CCol>
        </CRow>
      </div>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <CRow className="mb-4">
        {/* TOTAL PRODUCTS */}

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '16px',
              boxShadow: '0 5px 24px rgba(15,23,42,0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div
                    style={{
                      color: '#71717a',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.7px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Total Products
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      color: '#18181b',
                      fontSize: '28px',
                      fontWeight: '800',
                    }}
                  >
                    {statistics.totalProducts}
                  </div>

                  <div
                    className="mt-1"
                    style={{
                      color: '#a1a1aa',
                      fontSize: '11px',
                    }}
                  >
                    {statistics.activeProducts} active
                  </div>
                </div>

                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '13px',
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c9a227',
                  }}
                >
                  <CIcon icon={cilCart} />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* ACTIVE */}

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '16px',
              boxShadow: '0 5px 24px rgba(15,23,42,0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div
                    style={{
                      color: '#71717a',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.7px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Active Products
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      color: '#15803d',
                      fontSize: '28px',
                      fontWeight: '800',
                    }}
                  >
                    {statistics.activeProducts}
                  </div>

                  <div
                    className="mt-1"
                    style={{
                      color: '#a1a1aa',
                      fontSize: '11px',
                    }}
                  >
                    {statistics.inactiveProducts} inactive
                  </div>
                </div>

                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '13px',
                    background: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#15803d',
                  }}
                >
                  <CIcon icon={cilCheckCircle} />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* LOW STOCK */}

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '16px',
              boxShadow: '0 5px 24px rgba(15,23,42,0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div
                    style={{
                      color: '#71717a',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.7px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Stock Alerts
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      color: '#b45309',
                      fontSize: '28px',
                      fontWeight: '800',
                    }}
                  >
                    {statistics.lowStock}
                  </div>

                  <div
                    className="mt-1"
                    style={{
                      color: '#a1a1aa',
                      fontSize: '11px',
                    }}
                  >
                    {statistics.outOfStock} out of stock
                  </div>
                </div>

                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '13px',
                    background: '#fffbeb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#b45309',
                  }}
                >
                  <CIcon icon={cilWarning} />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* INVENTORY VALUE */}

        <CCol sm={6} xl={3}>
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '16px',
              boxShadow: '0 5px 24px rgba(15,23,42,0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div
                    style={{
                      color: '#71717a',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.7px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Inventory Value
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      color: '#18181b',
                      fontSize: '20px',
                      fontWeight: '800',
                    }}
                  >
                    {formatCurrency(statistics.inventoryRetailValue)}
                  </div>

                  <div
                    className="mt-1"
                    style={{
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {formatCurrency(statistics.potentialProfit)} potential margin
                  </div>
                </div>

                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '13px',
                    background: '#fff8dc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c9a227',
                    fontWeight: '800',
                    fontSize: '18px',
                  }}
                >
                  ₦
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          MAIN INVENTORY CARD
      ====================================================== */}

      <CCard
        className="border-0"
        style={{
          borderRadius: '18px',
          boxShadow: '0 7px 30px rgba(15,23,42,0.07)',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}

        <CCardHeader
          className="border-0"
          style={{
            background: '#fff',
            padding: '22px 24px',
          }}
        >
          <CRow className="align-items-center">
            <CCol lg={6}>
              <div
                style={{
                  color: '#18181b',
                  fontSize: '18px',
                  fontWeight: '800',
                }}
              >
                All Products
              </div>

              <div
                className="mt-1"
                style={{
                  color: '#a1a1aa',
                  fontSize: '12px',
                }}
              >
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? 's' : ''} matching your current view
              </div>
            </CCol>

            <CCol lg={6} className="text-lg-end mt-3 mt-lg-0">
              <CButton
                onClick={() => getProducts(true)}
                disabled={refreshing}
                className="border-0"
                style={{
                  background: '#f4f4f5',
                  color: '#3f3f46',
                  borderRadius: '9px',
                  fontWeight: '700',
                  padding: '9px 14px',
                }}
              >
                {refreshing ? (
                  <CSpinner size="sm" className="me-2" />
                ) : (
                  <CIcon icon={cilReload} className="me-2" />
                )}
                Refresh
              </CButton>

              <CButton
                onClick={exportToExcel}
                className="border-0 ms-2"
                style={{
                  background: '#f0fdf4',
                  color: '#15803d',
                  borderRadius: '9px',
                  fontWeight: '700',
                  padding: '9px 14px',
                }}
              >
                <CIcon icon={cilCloudDownload} className="me-2" />
                Export
              </CButton>
            </CCol>
          </CRow>
        </CCardHeader>

        {/* =====================================================
            FILTER AREA
        ====================================================== */}

        <CCardBody
          style={{
            padding: '0 24px 22px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #fafafa 0%, #f8fafc 100%)',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #eeeeef',
            }}
          >
            <CRow className="align-items-center">
              {/* SEARCH */}

              <CCol xl={6} lg={5} className="mb-3 mb-lg-0">
                <div
                  style={{
                    color: '#52525b',
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '7px',
                  }}
                >
                  Search Inventory
                </div>

                <CInputGroup>
                  <CInputGroupText
                    style={{
                      background: '#fff',
                      border: '1px solid #e4e4e7',
                      borderRight: '0',
                      color: '#a1a1aa',
                    }}
                  >
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>

                  <CFormInput
                    placeholder="Search product, SKU or barcode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      minHeight: '44px',
                      border: '1px solid #e4e4e7',
                      borderLeft: '0',
                      borderRadius: '0 10px 10px 0',
                      background: '#fff',
                      boxShadow: 'none',
                    }}
                  />
                </CInputGroup>
              </CCol>

              {/* STATUS */}

              <CCol xl={2} lg={2.5} md={4} className="mb-3 mb-md-0">
                <div
                  style={{
                    color: '#52525b',
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '7px',
                  }}
                >
                  Status
                </div>

                <CFormSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    minHeight: '44px',
                    borderRadius: '10px',
                    border: '1px solid #e4e4e7',
                    boxShadow: 'none',
                    fontSize: '13px',
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </CFormSelect>
              </CCol>

              {/* STOCK */}

              <CCol xl={2} lg={2.5} md={4} className="mb-3 mb-md-0">
                <div
                  style={{
                    color: '#52525b',
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '7px',
                  }}
                >
                  Stock
                </div>

                <CFormSelect
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  style={{
                    minHeight: '44px',
                    borderRadius: '10px',
                    border: '1px solid #e4e4e7',
                    boxShadow: 'none',
                    fontSize: '13px',
                  }}
                >
                  <option value="all">All Stock</option>
                  <option value="healthy">Healthy Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </CFormSelect>
              </CCol>

              {/* CLEAR */}

              <CCol xl={2} lg={2} md={4} className="text-md-end">
                <div
                  style={{
                    height: '18px',
                  }}
                />

                {hasActiveFilters && (
                  <CButton
                    onClick={clearFilters}
                    className="border-0 w-100"
                    style={{
                      minHeight: '44px',
                      borderRadius: '10px',
                      background: '#fff',
                      border: '1px solid #e4e4e7',
                      color: '#52525b',
                      fontWeight: '700',
                    }}
                  >
                    <CIcon icon={cilX} className="me-2" />
                    Clear Filters
                  </CButton>
                )}
              </CCol>
            </CRow>
          </div>
        </CCardBody>

        {/* =====================================================
            TABLE
        ====================================================== */}

        <CCardBody
          style={{
            padding: '0 24px 24px',
          }}
        >
          {loading ? (
            <div
              className="text-center"
              style={{
                minHeight: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '17px',
                  background: '#fff8dc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CSpinner
                  style={{
                    color: '#c9a227',
                  }}
                />
              </div>

              <div
                className="mt-3"
                style={{
                  color: '#3f3f46',
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                Loading inventory
              </div>

              <div
                className="mt-1"
                style={{
                  color: '#a1a1aa',
                  fontSize: '12px',
                }}
              >
                Preparing your product catalogue...
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  border: '1px solid #eeeeef',
                  borderRadius: '14px',
                  overflow: 'hidden',
                }}
              >
                <CTable hover responsive align="middle" className="mb-0">
                  <CTableHead>
                    <CTableRow
                      style={{
                        background: '#fafafa',
                      }}
                    >
                      {[
                        'Product',
                        'SKU / Barcode',
                        'Cost',
                        'Selling Price',
                        'Stock',
                        'Margin',
                        'Status',
                        'Actions',
                      ].map((heading, index) => (
                        <CTableHeaderCell
                          key={heading}
                          className={heading === 'Actions' ? 'text-end' : ''}
                          style={{
                            padding: '14px 15px',
                            color: '#71717a',
                            fontSize: '10px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.7px',
                            borderBottom: '1px solid #e4e4e7',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {heading}
                        </CTableHeaderCell>
                      ))}
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {currentProducts.length > 0 ? (
                      currentProducts.map((product) => {
                        const stockStatus = getStockStatus(product)

                        const costPrice = Number(product.costPrice || 0)

                        const sellingPrice = Number(product.sellingPrice || 0)

                        const margin = sellingPrice - costPrice

                        const marginPercent = costPrice > 0 ? (margin / costPrice) * 100 : 0

                        return (
                          <CTableRow
                            key={product.id}
                            style={{
                              borderBottom: '1px solid #f4f4f5',
                            }}
                          >
                            {/* PRODUCT */}

                            <CTableDataCell
                              style={{
                                padding: '14px 15px',
                                minWidth: '250px',
                              }}
                            >
                              <div className="d-flex align-items-center">
                                {product.image ? (
                                  <img
                                    src={getImageUrl(product.image)}
                                    alt={product.name}
                                    width="52"
                                    height="52"
                                    onError={(event) => {
                                      event.currentTarget.style.display = 'none'
                                      event.currentTarget.nextSibling.style.display = 'flex'
                                    }}
                                    style={{
                                      objectFit: 'cover',
                                      borderRadius: '12px',
                                      border: '1px solid #e4e4e7',
                                      background: '#fafafa',
                                    }}
                                  />
                                ) : null}

                                <div
                                  className="align-items-center justify-content-center"
                                  style={{
                                    display: product.image ? 'none' : 'flex',
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg,#fafafa,#f4f4f5)',
                                    border: '1px solid #e4e4e7',
                                    color: '#a1a1aa',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                  }}
                                >
                                  NO IMAGE
                                </div>

                                <div
                                  className="ms-3"
                                  style={{
                                    minWidth: '150px',
                                  }}
                                >
                                  <div
                                    style={{
                                      color: '#18181b',
                                      fontSize: '13px',
                                      fontWeight: '800',
                                      lineHeight: '1.4',
                                    }}
                                  >
                                    {product.name}
                                  </div>

                                  <div
                                    className="mt-1"
                                    style={{
                                      color: '#a1a1aa',
                                      fontSize: '11px',
                                    }}
                                  >
                                    Product ID: {product.id}
                                  </div>
                                </div>
                              </div>
                            </CTableDataCell>

                            {/* SKU / BARCODE */}

                            <CTableDataCell
                              style={{
                                padding: '14px 15px',
                                minWidth: '150px',
                              }}
                            >
                              <div
                                style={{
                                  color: '#3f3f46',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                }}
                              >
                                {product.sku || 'No SKU'}
                              </div>

                              {product.barcode && (
                                <div
                                  className="mt-1"
                                  style={{
                                    color: '#a1a1aa',
                                    fontSize: '10px',
                                  }}
                                >
                                  {product.barcode}
                                </div>
                              )}
                            </CTableDataCell>

                            {/* COST */}

                            <CTableDataCell
                              style={{
                                padding: '14px 15px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span
                                style={{
                                  color: '#52525b',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                }}
                              >
                                {formatCurrency(costPrice)}
                              </span>
                            </CTableDataCell>

                            {/* SELLING PRICE */}

                            <CTableDataCell
                              style={{
                                padding: '14px 15px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <strong
                                style={{
                                  color: '#18181b',
                                  fontSize: '13px',
                                  fontWeight: '800',
                                }}
                              >
                                {formatCurrency(sellingPrice)}
                              </strong>
                            </CTableDataCell>

                            {/* STOCK */}

                            <CTableDataCell
                              style={{
                                padding: '14px 15px',
                                minWidth: '110px',
                              }}
                            >
                              <div>
                                <CBadge
                                  color={
                                    stockStatus === 'out'
                                      ? 'danger'
                                      : stockStatus === 'low'
                                        ? 'warning'
                                        : 'success'
                                  }
                                  style={{
                                    padding: '6px 9px',
                                    borderRadius: '7px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                  }}
                                >
                                  {product.quantity} units
                                </CBadge>

                                {stockStatus === 'out' && (
                                  <div
                                    className="mt-1"
                                    style={{
                                      color: '#dc2626',
                                      fontSize: '10px',
                                      fontWeight: '700',
                                    }}
                                  >
                                    Out of stock
                                  </div>
                                )}

                                {stockStatus === 'low' && (
                                  <div
                                    className="mt-1"
                                    style={{
                                      color: '#b45309',
                                      fontSize: '10px',
                                      fontWeight: '700',
                                    }}
                                  >
                                    Reorder at {product.reorderLevel}
                                  </div>
                                )}
                              </div>
                            </CTableDataCell>

                            {/* MARGIN */}

                            <CTableDataCell
                              style={{
                                padding: '14px 15px',
                                minWidth: '120px',
                              }}
                            >
                              <div
                                style={{
                                  color: margin >= 0 ? '#15803d' : '#dc2626',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                }}
                              >
                                {formatCurrency(margin)}
                              </div>

                              <div
                                className="mt-1"
                                style={{
                                  color: '#a1a1aa',
                                  fontSize: '10px',
                                }}
                              >
                                {marginPercent.toFixed(1)}%
                              </div>
                            </CTableDataCell>

                            {/* STATUS */}

                            <CTableDataCell
                              style={{
                                padding: '14px 15px',
                              }}
                            >
                              <CBadge
                                color={product.status === 'active' ? 'success' : 'danger'}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '7px',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {product.status || 'unknown'}
                              </CBadge>
                            </CTableDataCell>

                            {/* ACTIONS */}

                            <CTableDataCell
                              className="text-end"
                              style={{
                                padding: '14px 15px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Link
                                to={`/editProduct/${product.id}`}
                                style={{
                                  textDecoration: 'none',
                                }}
                              >
                                <CButton
                                  size="sm"
                                  className="border-0 me-2"
                                  title="Edit Product"
                                  style={{
                                    width: '35px',
                                    height: '35px',
                                    padding: '0',
                                    borderRadius: '9px',
                                    background: '#fff8dc',
                                    color: '#a17d08',
                                  }}
                                >
                                  <CIcon icon={cilPencil} />
                                </CButton>
                              </Link>

                              <CButton
                                size="sm"
                                className="border-0"
                                title="Delete Product"
                                onClick={() => deleteProduct(product.id, product.name)}
                                style={{
                                  width: '35px',
                                  height: '35px',
                                  padding: '0',
                                  borderRadius: '9px',
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                }}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })
                    ) : (
                      <CTableRow>
                        <CTableDataCell
                          colSpan={8}
                          className="text-center"
                          style={{
                            padding: '80px 20px',
                          }}
                        >
                          <div
                            style={{
                              width: '64px',
                              height: '64px',
                              margin: '0 auto',
                              borderRadius: '18px',
                              background: '#fafafa',
                              border: '1px solid #eeeeef',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#a1a1aa',
                            }}
                          >
                            <CIcon icon={cilSearch} size="xl" />
                          </div>

                          <div
                            className="mt-3"
                            style={{
                              color: '#27272a',
                              fontSize: '15px',
                              fontWeight: '800',
                            }}
                          >
                            No products found
                          </div>

                          <div
                            className="mt-1"
                            style={{
                              color: '#a1a1aa',
                              fontSize: '12px',
                            }}
                          >
                            {hasActiveFilters
                              ? 'Try changing or clearing your filters.'
                              : 'Your product inventory is currently empty.'}
                          </div>

                          {hasActiveFilters ? (
                            <CButton
                              onClick={clearFilters}
                              className="border-0 mt-3"
                              style={{
                                background: '#fff8dc',
                                color: '#a17d08',
                                borderRadius: '9px',
                                fontWeight: '700',
                              }}
                            >
                              Clear Filters
                            </CButton>
                          ) : (
                            <Link
                              to="/addProduct"
                              style={{
                                textDecoration: 'none',
                              }}
                            >
                              <CButton
                                className="border-0 mt-3"
                                style={{
                                  background: '#18181b',
                                  color: '#fff',
                                  borderRadius: '9px',
                                  fontWeight: '700',
                                }}
                              >
                                <CIcon icon={cilPlus} className="me-2" />
                                Add First Product
                              </CButton>
                            </Link>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>

              {/* =====================================================
                  PAGINATION
              ====================================================== */}

              {totalPages > 0 && (
                <div
                  className="d-flex flex-wrap justify-content-between align-items-center mt-4"
                  style={{
                    gap: '15px',
                  }}
                >
                  <div
                    style={{
                      color: '#71717a',
                      fontSize: '12px',
                    }}
                  >
                    Showing{' '}
                    <strong
                      style={{
                        color: '#27272a',
                      }}
                    >
                      {(safeCurrentPage - 1) * itemsPerPage + 1}
                    </strong>{' '}
                    to{' '}
                    <strong
                      style={{
                        color: '#27272a',
                      }}
                    >
                      {Math.min(safeCurrentPage * itemsPerPage, filteredProducts.length)}
                    </strong>{' '}
                    of{' '}
                    <strong
                      style={{
                        color: '#27272a',
                      }}
                    >
                      {filteredProducts.length}
                    </strong>{' '}
                    products
                  </div>

                  <CPagination className="mb-0">
                    <CPaginationItem
                      disabled={safeCurrentPage === 1}
                      onClick={() => goToPage(safeCurrentPage - 1)}
                      style={{
                        cursor: safeCurrentPage === 1 ? 'default' : 'pointer',
                        borderRadius: '8px',
                        marginRight: '4px',
                      }}
                    >
                      <CIcon icon={cilChevronLeft} />
                    </CPaginationItem>

                    {getPaginationPages().map((page, index) =>
                      page === '...' ? (
                        <CPaginationItem
                          key={`ellipsis-${index}`}
                          disabled
                          style={{
                            border: '0',
                            background: 'transparent',
                          }}
                        >
                          ...
                        </CPaginationItem>
                      ) : (
                        <CPaginationItem
                          key={page}
                          active={safeCurrentPage === page}
                          onClick={() => goToPage(page)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '8px',
                            marginRight: '4px',
                          }}
                        >
                          {page}
                        </CPaginationItem>
                      ),
                    )}

                    <CPaginationItem
                      disabled={safeCurrentPage === totalPages}
                      onClick={() => goToPage(safeCurrentPage + 1)}
                      style={{
                        cursor: safeCurrentPage === totalPages ? 'default' : 'pointer',
                        borderRadius: '8px',
                      }}
                    >
                      <CIcon icon={cilChevronRight} />
                    </CPaginationItem>
                  </CPagination>
                </div>
              )}
            </>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default ProductList
