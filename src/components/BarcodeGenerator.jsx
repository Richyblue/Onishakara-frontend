import React, { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'

const BarcodeGenerator = ({ product = null, onSaved = null }) => {
  const barcodeRef = useRef(null)

  const [productName, setProductName] = useState(product?.name || '')
  const [sku, setSku] = useState(product?.sku || '')
  const [barcode, setBarcode] = useState(product?.barcode || '')
  const [price, setPrice] = useState(product?.selling_price || product?.price || '')
  const [copies, setCopies] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!barcode || !barcodeRef.current) return

    try {
      JsBarcode(barcodeRef.current, barcode, {
        format: 'CODE128',
        lineColor: '#000000',
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 16,
        margin: 10,
      })
    } catch (error) {
      console.error('Barcode generation error:', error)
    }
  }, [barcode])

  const generateBarcode = () => {
    const randomPart = Math.floor(100000 + Math.random() * 900000)

    const generated = `2000${randomPart}`

    setBarcode(generated)
  }

  const saveBarcode = async () => {
    if (!product) {
      alert('Please select a product first.')
      return
    }

    if (!barcode.trim()) {
      alert('Generate a barcode first.')
      return
    }

    try {
      setSaving(true)

      const token = localStorage.getItem('token')

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5001/api/v1'}/products/${product.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            barcode: barcode.trim(),
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to save barcode')
      }

      alert('Barcode saved successfully.')

      if (typeof onSaved === 'function') {
        onSaved({
          ...product,
          barcode: barcode.trim(),
        })
      }
    } catch (error) {
      console.error('Save barcode error:', error)
      alert(error.message || 'Failed to save barcode.')
    } finally {
      setSaving(false)
    }
  }

  const printBarcode = async () => {
    if (!barcode.trim()) {
      alert('Generate a barcode first.')
      return
    }

    const qty = Math.max(1, Number(copies) || 1)

    const labels = Array.from({ length: qty })
      .map(
        () => `
          <div class="label">
            <div class="product-name">
              ${escapeHtml(productName)}
            </div>

            <svg
              class="barcode"
              data-barcode="${escapeHtml(barcode)}"
            ></svg>

            ${
              price
                ? `<div class="price">
                    ₦${Number(price).toLocaleString()}
                  </div>`
                : ''
            }
          </div>
        `,
      )
      .join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />

        <style>
          @page {
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }

          .label {
            width: 80mm;
            min-height: 35mm;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            padding: 3mm;

            page-break-after: always;
          }

          .product-name {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 2mm;
            text-align: center;
          }

          .barcode {
            width: 70mm;
            max-width: 100%;
            height: 18mm;
          }

          .price {
            font-size: 13px;
            font-weight: bold;
            margin-top: 1mm;
          }
        </style>
      </head>

      <body>

        ${labels}

        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>

        <script>
          window.onload = function () {
            document.querySelectorAll('.barcode').forEach(function (element) {
              JsBarcode(
                element,
                element.getAttribute('data-barcode'),
                {
                  format: 'CODE128',
                  width: 2,
                  height: 55,
                  displayValue: true,
                  fontSize: 13,
                  margin: 5
                }
              );
            });
          };
        </script>

      </body>
      </html>
    `

    if (window.electronAPI && typeof window.electronAPI.printReceipt === 'function') {
      try {
        const result = await window.electronAPI.printReceipt(html)

        if (!result?.success) {
          throw new Error(result?.message || 'Failed to print barcode')
        }

        console.log('Barcode printed:', result)
        return
      } catch (error) {
        console.error('Barcode print error:', error)
        alert(error.message || 'Failed to print barcode.')
        return
      }
    }

    // Browser fallback
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('Please allow popups to print barcode.')
      return
    }

    printWindow.document.write(html)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 800)
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: 24,
        maxWidth: 650,
        margin: '0 auto',
      }}
    >
      <h3 style={{ marginBottom: 20 }}>Barcode Generator</h3>

      <div style={{ marginBottom: 15 }}>
        <label>Product Name</label>

        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Product name"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>SKU</label>

        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Barcode</label>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Barcode"
            style={{
              ...inputStyle,
              flex: 1,
            }}
          />

          <button type="button" onClick={generateBarcode} style={buttonStyle}>
            Generate
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Price</label>

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Selling price"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Copies</label>

        <input
          type="number"
          min="1"
          value={copies}
          onChange={(e) => setCopies(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Barcode Preview */}
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          textAlign: 'center',
          background: '#fafafa',
        }}
      >
        {productName && (
          <div
            style={{
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {productName}
          </div>
        )}

        {barcode ? (
          <svg ref={barcodeRef} />
        ) : (
          <div style={{ color: '#777' }}>Generate a barcode to preview it</div>
        )}

        {price && (
          <div
            style={{
              marginTop: 8,
              fontWeight: 700,
            }}
          >
            ₦{Number(price).toLocaleString()}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={saveBarcode}
          disabled={saving || !barcode}
          style={{
            ...buttonStyle,
            background: '#00B978',
          }}
        >
          {saving ? 'Saving...' : 'Save Barcode'}
        </button>

        <button
          type="button"
          onClick={printBarcode}
          disabled={!barcode}
          style={{
            ...buttonStyle,
            background: '#061326',
          }}
        >
          Print Barcode
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '11px 13px',
  border: '1px solid #ddd',
  borderRadius: 8,
  marginTop: 6,
  fontSize: 14,
  outline: 'none',
}

const buttonStyle = {
  border: 'none',
  borderRadius: 8,
  padding: '11px 18px',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default BarcodeGenerator
