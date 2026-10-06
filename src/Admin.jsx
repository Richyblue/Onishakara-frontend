import React from 'react'
import axios from 'axios'
import { CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload } from '@coreui/icons'

const API_URL = import.meta.env.VITE_API_URL

const Admin = () => {
  // ADD THE BACKUP FUNCTION HERE
  const handleDatabaseBackup = async () => {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        alert('Your session has expired. Please log in again.')
        return
      }

      const response = await axios.get(`${API_URL}/database/backup`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], {
        type: 'application/sql',
      })

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = url

      link.download = `IMVON_Database_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`

      document.body.appendChild(link)

      link.click()

      link.remove()

      window.URL.revokeObjectURL(url)

      alert('Database backup downloaded successfully.')
    } catch (error) {
      console.error('Database backup error:', error)

      let message = 'Unable to download database backup.'

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text()

          const data = JSON.parse(text)

          message = data.message || message
        } catch {}
      } else {
        message = error.response?.data?.message || message
      }

      alert(message)
    }
  }

  return (
    <div>
      <h2>Admin Settings</h2>

      <CButton color="primary" onClick={handleDatabaseBackup}>
        <CIcon icon={cilCloudDownload} className="me-2" />
        Download Database Backup
      </CButton>
    </div>
  )
}

export default Admin
