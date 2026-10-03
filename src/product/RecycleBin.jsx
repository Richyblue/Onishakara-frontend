import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import CIcon from '@coreui/icons-react'

import {
  cilRecycle,
  cilTrash,
  cilSearch,
  cilReload,
  cilWarning,
  cilCloudDownload,
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
  CBadge,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CFormSelect,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CSpinner,
  CPagination,
  CPaginationItem,
} from '@coreui/react'

const RecycleBin = () => {
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const formatDeletedDate = (date) => {
    if (!date) return 'Unknown'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Unknown'
    }

    return parsedDate.toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getImageUrl = (image) => {
    if (!image) return ''

    const value = String(image).trim()

    if (!value) return ''

    if (/^https?:\/\//i.test(value)) {
      return value
    }

    if (/^(data:|blob:)/i.test(value)) {
      return value
    }

    if (value.startsWith('/')) {
      return `${API_URL}${value}`
    }

    return `${API_URL}/${value}`
  }

  // =========================================================
  // GET DELETED PRODUCTS
  // =========================================================

  const getDeletedProducts = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}/api/v1/products/recycle-bin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const deletedProducts = Array.isArray(response.data?.products)
        ? response.data.products
        : Array.isArray(response.data)
          ? response.data
          : []

      setProducts(deletedProducts)
    } catch (error) {
      console.error('Failed to load recycle bin:', error)

      Swal.fire({
        icon: 'error',
        title: 'Unable to Load Recycle Bin',
        text: error.response?.data?.message || error.message || 'Failed to load deleted products.',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    getDeletedProducts()
  }, [])

  // =========================================================
  // FILTER
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

      return matchesSearch && matchesStatus
    })
  }, [products, search, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const deletedProducts = products.length

    const recoverable = products.length

    const inventoryCostValue = products.reduce(
      (total, product) => total + Number(product.costPrice || 0) * Number(product.quantity || 0),
      0,
    )

    const inventoryRetailValue = products.reduce(
      (total, product) => total + Number(product.sellingPrice || 0) * Number(product.quantity || 0),
      0,
    )

    const potentialMargin = inventoryRetailValue - inventoryCostValue

    return {
      deletedProducts,
      recoverable,
      inventoryCostValue,
      inventoryRetailValue,
      potentialMargin,
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

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return

    setCurrentPage(page)
  }

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    const pages = [1]

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
  // RESTORE PRODUCT
  // =========================================================

  const restoreProduct = async (id, productName) => {
    const result = await Swal.fire({
      title: 'Restore Product?',
      html: `
        <div style="font-size:14px;color:#71717a;">
          Restore
          <strong style="color:#18181b;">
            ${productName || 'this product'}
          </strong>
          back to active inventory?
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Yes, Restore',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}/api/v1/products/${id}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      await Swal.fire({
        icon: 'success',
        title: 'Product Restored',
        text: `${productName || 'The product'} is back in active inventory.`,
        timer: 1800,
        showConfirmButton: false,
      })

      await getDeletedProducts(true)
    } catch (error) {
      console.error('Restore product error:', error)

      Swal.fire({
        icon: 'error',
        title: 'Restore Failed',
        text: error.response?.data?.message || error.message || 'Unable to restore the product.',
      })
    }
  }

  // =========================================================
  // PERMANENT DELETE
  // =========================================================

  const deleteForever = async (id, productName) => {
    const result = await Swal.fire({
      title: 'Permanently Delete Product?',
      html: `
        <div style="font-size:14px;color:#71717a;line-height:1.7;">
          You are about to permanently delete
          <strong style="color:#18181b;">
            ${productName || 'this product'}
          </strong>.
          <br/>
          <strong style="color:#dc2626;">
            This action cannot be undone.
          </strong>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Permanently Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')

      await axios.delete(`${API_URL}/api/v1/products/${id}/permanent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await Swal.fire({
        icon: 'success',
        title: 'Permanently Deleted',
        text: 'The product has been permanently removed.',
        timer: 1800,
        showConfirmButton: false,
      })

      await getDeletedProducts(true)
    } catch (error) {
      console.error('Permanent delete error:', error)

      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text:
          error.response?.data?.message ||
          error.message ||
          'Unable to permanently delete the product.',
      })
    }
  }

  // =========================================================
  // RESTORE ALL
  // =========================================================

  const restoreAll = async () => {
    if (products.length === 0) return

    const result = await Swal.fire({
      title: 'Restore All Products?',
      html: `
        <div style="font-size:14px;color:#71717a;">
          This will restore
          <strong style="color:#18181b;">
            ${products.length}
          </strong>
          deleted product${products.length === 1 ? '' : 's'}
          back to active inventory.
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Restore All',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    })

    if (!result.isConfirmed) return

    const token = localStorage.getItem('token')

    let restored = 0
    let failed = 0

    Swal.fire({
      title: 'Restoring Products...',
      text: 'Please wait while the recycle bin is being processed.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      for (const product of products) {
        try {
          await axios.put(
            `${API_URL}/api/v1/products/${product.id}/restore`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

          restored += 1
        } catch (error) {
          failed += 1
          console.error(`Failed to restore product ${product.id}:`, error)
        }
      }

      await getDeletedProducts(true)

      await Swal.fire({
        icon: failed === 0 ? 'success' : 'warning',
        title: failed === 0 ? 'Products Restored' : 'Restore Completed with Warnings',
        html: `
          <div style="font-size:14px;color:#71717a;">
            Restored:
            <strong style="color:#15803d;">
              ${restored}
            </strong>
            <br/>
            Failed:
            <strong style="color:#dc2626;">
              ${failed}
            </strong>
          </div>
        `,
        confirmButtonColor: '#18181b',
      })
    } catch (error) {
      console.error('Restore all error:', error)

      Swal.fire({
        icon: 'error',
        title: 'Restore Failed',
        text: error.message || 'Unable to restore deleted products.',
      })
    }
  }

  // =========================================================
  // EMPTY RECYCLE BIN
  // =========================================================

  const emptyRecycleBin = async () => {
    if (products.length === 0) return

    const result = await Swal.fire({
      title: 'Empty Recycle Bin?',
      html: `
        <div style="font-size:14px;color:#71717a;line-height:1.7;">
          You are about to permanently delete
          <strong style="color:#18181b;">
            ${products.length}
          </strong>
          product${products.length === 1 ? '' : 's'}.
          <br/>
          <strong style="color:#dc2626;">
            This action cannot be undone.
          </strong>
        </div>
      `,
      icon: 'warning',
      input: 'text',
      inputPlaceholder: 'Type DELETE to confirm',
      inputAttributes: {
        autocapitalize: 'off',
        autocomplete: 'off',
      },
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Empty Recycle Bin',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      preConfirm: (value) => {
        if (value !== 'DELETE') {
          Swal.showValidationMessage('Please type DELETE exactly to confirm.')

          return false
        }

        return true
      },
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')

      Swal.fire({
        title: 'Emptying Recycle Bin...',
        text: 'Permanently deleting products.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      await axios.delete(`${API_URL}/api/v1/products/recycle-bin/empty`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setProducts([])

      await Swal.fire({
        icon: 'success',
        title: 'Recycle Bin Empty',
        text: 'All deleted products have been permanently removed.',
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error('Empty recycle bin error:', error)

      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: error.response?.data?.message || error.message || 'Unable to empty the recycle bin.',
      })
    }
  }

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all'

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
          PREMIUM HEADER
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
        <div
          style={{
            position: 'absolute',
            width: '190px',
            height: '190px',
            borderRadius: '50%',
            right: '-70px',
            top: '-80px',
            border: '1px solid rgba(232,189,53,0.18)',
            boxShadow: '0 0 0 30px rgba(232,189,53,0.03)',
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
              Product Recycle Bin
            </h2>

            <p
              className="mb-0"
              style={{
                color: '#a1a1aa',
                fontSize: '14px',
                lineHeight: '1.7',
                maxWidth: '650px',
              }}
            >
              Recover deleted products or permanently remove products that are no longer needed.
            </p>
          </CCol>

          <CCol lg={4} className="text-lg-end mt-4 mt-lg-0">
            <div
              className="d-inline-flex align-items-center"
              style={{
                padding: '11px 16px',
                borderRadius: '11px',
                background: 'rgba(232,189,53,0.10)',
                border: '1px solid rgba(232,189,53,0.20)',
                color: '#e8bd35',
                fontSize: '12px',
                fontWeight: '800',
              }}
            >
              <CIcon icon={cilRecycle} className="me-2" />
              {products.length} Deleted
            </div>
          </CCol>
        </CRow>
      </div>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <CRow className="mb-4">
        <CCol md={6} xl={3} className="mb-3 mb-xl-0">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '16px',
              boxShadow: '0 5px 24px rgba(15,23,42,0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between">
                <div>
                  <div
                    style={{
                      color: '#71717a',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.7px',
                    }}
                  >
                    Deleted Products
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      color: '#18181b',
                      fontSize: '29px',
                      fontWeight: '800',
                    }}
                  >
                    {statistics.deletedProducts}
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
                  }}
                >
                  <CIcon icon={cilRecycle} />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6} xl={3} className="mb-3 mb-xl-0">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '16px',
              boxShadow: '0 5px 24px rgba(15,23,42,0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between">
                <div>
                  <div
                    style={{
                      color: '#71717a',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.7px',
                    }}
                  >
                    Recoverable
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      color: '#15803d',
                      fontSize: '29px',
                      fontWeight: '800',
                    }}
                  >
                    {statistics.recoverable}
                  </div>

                  <div
                    className="mt-1"
                    style={{
                      color: '#a1a1aa',
                      fontSize: '11px',
                    }}
                  >
                    Products can be restored
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
                  <CIcon icon={cilRecycle} />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6} xl={3} className="mb-3 mb-xl-0">
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '16px',
              boxShadow: '0 5px 24px rgba(15,23,42,0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between">
                <div>
                  <div
                    style={{
                      color: '#71717a',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.7px',
                    }}
                  >
                    Cost Value
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      color: '#18181b',
                      fontSize: '20px',
                      fontWeight: '800',
                    }}
                  >
                    {formatCurrency(statistics.inventoryCostValue)}
                  </div>

                  <div
                    className="mt-1"
                    style={{
                      color: '#a1a1aa',
                      fontSize: '11px',
                    }}
                  >
                    Deleted inventory cost
                  </div>
                </div>

                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '13px',
                    background: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#52525b',
                    fontWeight: '800',
                  }}
                >
                  ₦
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6} xl={3}>
          <CCard
            className="border-0 h-100"
            style={{
              borderRadius: '16px',
              boxShadow: '0 5px 24px rgba(15,23,42,0.06)',
            }}
          >
            <CCardBody style={{ padding: '20px' }}>
              <div className="d-flex justify-content-between">
                <div>
                  <div
                    style={{
                      color: '#71717a',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.7px',
                    }}
                  >
                    Retail Value
                  </div>

                  <div
                    className="mt-2"
                    style={{
                      color: '#c9a227',
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
                    {formatCurrency(statistics.potentialMargin)} potential margin
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
          MAIN RECYCLE BIN
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
                Deleted Products
              </div>

              <div
                className="mt-1"
                style={{
                  color: '#a1a1aa',
                  fontSize: '12px',
                }}
              >
                Restore products or permanently remove them.
              </div>
            </CCol>

            <CCol lg={6} className="text-lg-end mt-3 mt-lg-0">
              <CButton
                onClick={() => getDeletedProducts(true)}
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

              {products.length > 0 && (
                <>
                  <CButton
                    onClick={restoreAll}
                    className="border-0 ms-2"
                    style={{
                      background: '#f0fdf4',
                      color: '#15803d',
                      borderRadius: '9px',
                      fontWeight: '700',
                      padding: '9px 14px',
                    }}
                  >
                    <CIcon icon={cilRecycle} className="me-2" />
                    Restore All
                  </CButton>

                  <CButton
                    onClick={emptyRecycleBin}
                    className="border-0 ms-2"
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      borderRadius: '9px',
                      fontWeight: '700',
                      padding: '9px 14px',
                    }}
                  >
                    <CIcon icon={cilTrash} className="me-2" />
                    Empty Bin
                  </CButton>
                </>
              )}
            </CCol>
          </CRow>
        </CCardHeader>

        {/* =====================================================
            SEARCH / FILTER
        ====================================================== */}

        <CCardBody
          style={{
            padding: '0 24px 20px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg,#fafafa,#f8fafc)',
              border: '1px solid #eeeeef',
              borderRadius: '14px',
              padding: '15px',
            }}
          >
            <CRow className="align-items-end">
              <CCol lg={7} className="mb-3 mb-lg-0">
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
                  Search Deleted Products
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
                      boxShadow: 'none',
                    }}
                  />
                </CInputGroup>
              </CCol>

              <CCol lg={3} md={6} className="mb-3 mb-lg-0">
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
                  Product Status
                </div>

                <CFormSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    minHeight: '44px',
                    border: '1px solid #e4e4e7',
                    borderRadius: '10px',
                    boxShadow: 'none',
                    fontSize: '13px',
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </CFormSelect>
              </CCol>

              <CCol lg={2} md={6}>
                {hasActiveFilters && (
                  <CButton
                    onClick={clearFilters}
                    className="border-0 w-100"
                    style={{
                      minHeight: '44px',
                      borderRadius: '10px',
                      background: '#fff',
                      color: '#52525b',
                      fontWeight: '700',
                    }}
                  >
                    <CIcon icon={cilX} className="me-2" />
                    Clear
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
                Loading recycle bin
              </div>

              <div
                className="mt-1"
                style={{
                  color: '#a1a1aa',
                  fontSize: '12px',
                }}
              >
                Retrieving deleted products...
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
                      <CTableHeaderCell
                        style={{
                          padding: '14px 15px',
                          color: '#71717a',
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.7px',
                          borderBottom: '1px solid #e4e4e7',
                        }}
                      >
                        Product
                      </CTableHeaderCell>

                      <CTableHeaderCell
                        style={{
                          padding: '14px 15px',
                          color: '#71717a',
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.7px',
                          borderBottom: '1px solid #e4e4e7',
                        }}
                      >
                        SKU / Barcode
                      </CTableHeaderCell>

                      <CTableHeaderCell
                        style={{
                          padding: '14px 15px',
                          color: '#71717a',
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.7px',
                          borderBottom: '1px solid #e4e4e7',
                        }}
                      >
                        Stock
                      </CTableHeaderCell>

                      <CTableHeaderCell
                        style={{
                          padding: '14px 15px',
                          color: '#71717a',
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.7px',
                          borderBottom: '1px solid #e4e4e7',
                        }}
                      >
                        Value
                      </CTableHeaderCell>

                      <CTableHeaderCell
                        style={{
                          padding: '14px 15px',
                          color: '#71717a',
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.7px',
                          borderBottom: '1px solid #e4e4e7',
                        }}
                      >
                        Deleted
                      </CTableHeaderCell>

                      <CTableHeaderCell
                        style={{
                          padding: '14px 15px',
                          color: '#71717a',
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.7px',
                          borderBottom: '1px solid #e4e4e7',
                        }}
                      >
                        Status
                      </CTableHeaderCell>

                      <CTableHeaderCell
                        className="text-end"
                        style={{
                          padding: '14px 15px',
                          color: '#71717a',
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.7px',
                          borderBottom: '1px solid #e4e4e7',
                        }}
                      >
                        Actions
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {currentProducts.length > 0 ? (
                      currentProducts.map((product) => (
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
                              minWidth: '240px',
                            }}
                          >
                            <div className="d-flex align-items-center">
                              {product.image ? (
                                <img
                                  src={getImageUrl(product.image)}
                                  alt={product.name}
                                  width="50"
                                  height="50"
                                  onError={(event) => {
                                    event.currentTarget.style.display = 'none'
                                    event.currentTarget.nextSibling.style.display = 'flex'
                                  }}
                                  style={{
                                    objectFit: 'cover',
                                    borderRadius: '11px',
                                    border: '1px solid #e4e4e7',
                                  }}
                                />
                              ) : null}

                              <div
                                className="align-items-center justify-content-center"
                                style={{
                                  display: product.image ? 'none' : 'flex',
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '11px',
                                  background: '#fafafa',
                                  border: '1px solid #eeeeef',
                                  color: '#a1a1aa',
                                  fontSize: '9px',
                                  fontWeight: '800',
                                }}
                              >
                                NO IMAGE
                              </div>

                              <div className="ms-3">
                                <div
                                  style={{
                                    color: '#18181b',
                                    fontSize: '13px',
                                    fontWeight: '800',
                                  }}
                                >
                                  {product.name}
                                </div>

                                <div
                                  className="mt-1"
                                  style={{
                                    color: '#a1a1aa',
                                    fontSize: '10px',
                                  }}
                                >
                                  ID: {product.id}
                                </div>
                              </div>
                            </div>
                          </CTableDataCell>

                          {/* SKU */}

                          <CTableDataCell
                            style={{
                              padding: '14px 15px',
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

                          {/* STOCK */}

                          <CTableDataCell
                            style={{
                              padding: '14px 15px',
                            }}
                          >
                            <CBadge
                              color={Number(product.quantity || 0) <= 0 ? 'danger' : 'warning'}
                              style={{
                                padding: '6px 9px',
                                borderRadius: '7px',
                                fontSize: '10px',
                                fontWeight: '800',
                              }}
                            >
                              {product.quantity} units
                            </CBadge>
                          </CTableDataCell>

                          {/* VALUE */}

                          <CTableDataCell
                            style={{
                              padding: '14px 15px',
                            }}
                          >
                            <div
                              style={{
                                color: '#18181b',
                                fontSize: '12px',
                                fontWeight: '800',
                              }}
                            >
                              {formatCurrency(
                                Number(product.costPrice || 0) * Number(product.quantity || 0),
                              )}
                            </div>

                            <div
                              className="mt-1"
                              style={{
                                color: '#a1a1aa',
                                fontSize: '10px',
                              }}
                            >
                              Cost value
                            </div>
                          </CTableDataCell>

                          {/* DELETED DATE */}

                          <CTableDataCell
                            style={{
                              padding: '14px 15px',
                              minWidth: '155px',
                            }}
                          >
                            <div
                              style={{
                                color: '#3f3f46',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                            >
                              {formatDeletedDate(product.deletedAt)}
                            </div>
                          </CTableDataCell>

                          {/* STATUS */}

                          <CTableDataCell
                            style={{
                              padding: '14px 15px',
                            }}
                          >
                            <CBadge
                              color={product.status === 'active' ? 'success' : 'secondary'}
                              style={{
                                padding: '6px 9px',
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
                            <CButton
                              size="sm"
                              className="border-0 me-2"
                              title="Restore Product"
                              onClick={() => restoreProduct(product.id, product.name)}
                              style={{
                                width: '36px',
                                height: '36px',
                                padding: '0',
                                borderRadius: '9px',
                                background: '#f0fdf4',
                                color: '#15803d',
                              }}
                            >
                              <CIcon icon={cilRecycle} />
                            </CButton>

                            <CButton
                              size="sm"
                              className="border-0"
                              title="Permanently Delete"
                              onClick={() => deleteForever(product.id, product.name)}
                              style={{
                                width: '36px',
                                height: '36px',
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
                      ))
                    ) : (
                      <CTableRow>
                        <CTableDataCell
                          colSpan={7}
                          className="text-center"
                          style={{
                            padding: '80px 20px',
                          }}
                        >
                          <div
                            style={{
                              width: '68px',
                              height: '68px',
                              margin: '0 auto',
                              borderRadius: '19px',
                              background: '#fafafa',
                              border: '1px solid #eeeeef',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#a1a1aa',
                            }}
                          >
                            <CIcon icon={cilRecycle} size="xl" />
                          </div>

                          <div
                            className="mt-3"
                            style={{
                              color: '#27272a',
                              fontSize: '15px',
                              fontWeight: '800',
                            }}
                          >
                            {hasActiveFilters ? 'No matching products' : 'Recycle Bin is Empty'}
                          </div>

                          <div
                            className="mt-1"
                            style={{
                              color: '#a1a1aa',
                              fontSize: '12px',
                            }}
                          >
                            {hasActiveFilters
                              ? 'Try changing your search or filter.'
                              : 'Deleted products will appear here when they are moved to the Recycle Bin.'}
                          </div>

                          {hasActiveFilters && (
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
                              <CIcon icon={cilX} className="me-2" />
                              Clear Filters
                            </CButton>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>

              {/* =================================================
                  PAGINATION
              ================================================== */}

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
                    </strong>
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

export default RecycleBin
