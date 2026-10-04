import { useState } from 'react'
import axios from 'axios'

import { successAlert, errorAlert } from 'src/utils/alerts'

import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CButton,
  CSpinner,
  CFormSelect,
} from '@coreui/react'

const AddExpense = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  // ==========================================
  // TODAY
  // ==========================================

  const getToday = () => {
    const today = new Date()

    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  // ==========================================
  // STATE
  // ==========================================

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    expenseDate: getToday(),
    notes: '',
  })

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      category: '',
      expenseDate: getToday(),
      notes: '',
    })
  }

  // ==========================================
  // SUBMIT EXPENSE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    // ------------------------------------------
    // TITLE
    // ------------------------------------------

    if (!formData.title.trim()) {
      errorAlert('Please enter the expense title')
      return
    }

    // ------------------------------------------
    // AMOUNT
    // ------------------------------------------

    const amount = Number(formData.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      errorAlert('Please enter a valid expense amount')
      return
    }

    // ------------------------------------------
    // CATEGORY
    // ------------------------------------------

    if (!formData.category) {
      errorAlert('Please select an expense category')
      return
    }

    // ------------------------------------------
    // DATE
    // ------------------------------------------

    if (!formData.expenseDate) {
      errorAlert('Please select the expense date')
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_URL}api/v1/expenses`,
        {
          title: formData.title.trim(),
          amount,
          category: formData.category,
          expenseDate: formData.expenseDate,
          notes: formData.notes.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      successAlert(response.data?.message || 'Expense recorded successfully')

      resetForm()
    } catch (error) {
      console.error('CREATE EXPENSE ERROR:', error)

      errorAlert(error.response?.data?.message || 'Failed to create expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <CRow>
        <CCol xs={12}>
          <CCard className="shadow-sm border-0 mb-4">
            <CCardBody className="py-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h3 className="fw-bold mb-1">Add Expense</h3>

                  <p className="text-medium-emphasis mb-0">
                    Record business expenses and operating costs.
                  </p>
                </div>

                <div className="text-end">
                  <small className="text-medium-emphasis d-block">Expense Date</small>

                  <strong>{formData.expenseDate || getToday()}</strong>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ==========================================
          EXPENSE FORM
      ========================================== */}

      <CRow>
        <CCol xs={12} lg={9} xl={8}>
          <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-transparent py-3">
              <div className="fw-bold">Expense Details</div>

              <small className="text-medium-emphasis">
                Enter the details of the business expense.
              </small>
            </CCardHeader>

            <CCardBody>
              <CForm onSubmit={handleSubmit}>
                <CRow className="g-4">
                  {/* ==========================================
                      EXPENSE TITLE
                  ========================================== */}

                  <CCol xs={12}>
                    <CFormLabel className="fw-semibold">Expense Title</CFormLabel>

                    <CFormInput
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Electricity Bill"
                      autoComplete="off"
                      maxLength={150}
                      required
                    />

                    <small className="text-medium-emphasis">
                      Enter a clear description of the expense.
                    </small>
                  </CCol>

                  {/* ==========================================
                      AMOUNT
                  ========================================== */}

                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold">Amount</CFormLabel>

                    <CFormInput
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      required
                    />

                    <small className="text-medium-emphasis">Enter the total amount paid.</small>
                  </CCol>

                  {/* ==========================================
                      CATEGORY
                  ========================================== */}

                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold">Category</CFormLabel>

                    <CFormSelect
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>

                      <option value="Rent">Rent</option>

                      <option value="Utilities">Utilities</option>

                      <option value="Salary">Salary</option>

                      <option value="Fuel">Fuel</option>

                      <option value="Maintenance">Maintenance</option>

                      <option value="Marketing">Marketing</option>

                      <option value="Supplies">Supplies</option>

                      <option value="Transportation">Transportation</option>

                      <option value="Internet">Internet</option>

                      <option value="Bank Charges">Bank Charges</option>

                      <option value="Security">Security</option>

                      <option value="Others">Others</option>
                    </CFormSelect>
                  </CCol>

                  {/* ==========================================
                      EXPENSE DATE
                  ========================================== */}

                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold">Expense Date</CFormLabel>

                    <CFormInput
                      type="date"
                      name="expenseDate"
                      value={formData.expenseDate}
                      onChange={handleChange}
                      required
                    />

                    <small className="text-medium-emphasis">
                      The date the expense actually occurred.
                    </small>
                  </CCol>

                  {/* ==========================================
                      NOTES
                  ========================================== */}

                  <CCol xs={12}>
                    <CFormLabel className="fw-semibold">
                      Notes
                      <span className="text-medium-emphasis fw-normal"> (Optional)</span>
                    </CFormLabel>

                    <CFormTextarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Add any additional information about this expense..."
                      rows={4}
                      maxLength={1000}
                    />

                    <small className="text-medium-emphasis">
                      You can add payment details, invoice references, explanations, or other useful
                      information.
                    </small>
                  </CCol>
                </CRow>

                {/* ==========================================
                    SUMMARY
                ========================================== */}

                {formData.amount && Number(formData.amount) > 0 && (
                  <div className="border rounded p-3 mt-4 bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold">Expense Amount</span>

                      <span className="fs-5 fw-bold">
                        ₦
                        {Number(formData.amount).toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* ==========================================
                    ACTIONS
                ========================================== */}

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <CButton type="button" color="light" disabled={loading} onClick={resetForm}>
                    Clear
                  </CButton>

                  <CButton color="primary" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Expense'
                    )}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default AddExpense
