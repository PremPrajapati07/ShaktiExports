'use client'

import { useState } from 'react'
import { Download, CheckSquare, Square, FileText, Globe } from 'lucide-react'
import { generateInvoicePDF, generatePurchaseInvoicePDF } from '@/lib/pdf-generator'
import { createAuditLog } from '@/lib/actions/logs'

interface PDFActionsProps {
  invoice: any
  profile: any
  isPurchase?: boolean
}

export default function PDFActions({ invoice, profile, isPurchase = false }: PDFActionsProps) {
  const [templateType, setTemplateType] = useState('Standard')
  const [isDigitallySigned, setIsDigitallySigned] = useState(true)
  const [exportOptions, setExportOptions] = useState({
    countryOfOrigin: 'INDIA',
    finalDestination: 'BELGIUM',
    portOfLoading: 'MUMBAI, INDIA',
    portOfDischarge: 'ANTWERP, BELGIUM'
  })
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const options = {
        templateType,
        isDigitallySigned,
        exportOptions: templateType === 'Export' ? exportOptions : undefined
      }

      const doc = isPurchase 
        ? generatePurchaseInvoicePDF(invoice, profile, options)
        : generateInvoicePDF(invoice, profile, options)

      doc.save(`${invoice.invoiceNo.replace(/\//g, '_')}_${templateType}.pdf`)

      // Create an audit log for the print/download action
      await createAuditLog(
        'PRINT',
        isPurchase ? 'PURCHASE_INVOICE' : 'INVOICE',
        invoice.id.toString(),
        `Downloaded PDF invoice using template: ${templateType} (Digital Signature: ${isDigitallySigned ? 'ON' : 'OFF'})`
      )
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleExportChange = (field: string, value: string) => {
    setExportOptions(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FileText size={18} className="text-accent" />
          <span>Print & Export PDF</span>
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Customize document template and download</p>
      </div>

      {/* Template Select */}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Layout Template</label>
        <select
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value)}
          className="form-input"
          style={{ width: '100%' }}
        >
          <option value="Standard">Standard Layout</option>
          <option value="Letterhead">Letterhead Style (40mm space)</option>
          <option value="Compact">Compact (Tighter padding)</option>
          {!isPurchase && <option value="Export">Export / Customs Invoice</option>}
        </select>
      </div>

      {/* Digital Signature Toggle */}
      <div 
        onClick={() => setIsDigitallySigned(!isDigitallySigned)} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          cursor: 'pointer',
          padding: '0.75rem',
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--sidebar-hover)',
          border: '1px solid var(--border)',
          transition: 'all 0.2s'
        }}
      >
        {isDigitallySigned ? (
          <CheckSquare size={18} className="text-accent" style={{ color: 'var(--accent)' }} />
        ) : (
          <Square size={18} style={{ color: 'var(--text-muted)' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Digital Signature & Seal</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Embed verified signature stamp</span>
        </div>
      </div>

      {/* Export Options (Conditionally Rendered) */}
      {templateType === 'Export' && !isPurchase && (
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            backgroundColor: 'rgba(59, 130, 246, 0.03)',
            border: '1px dashed rgba(59, 130, 246, 0.2)'
          }}
          className="animate-fade-in"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
            <Globe size={14} />
            <span>EXPORT DETAILS</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Origin Country</label>
              <input 
                type="text" 
                value={exportOptions.countryOfOrigin} 
                onChange={(e) => handleExportChange('countryOfOrigin', e.target.value)} 
                className="form-input" 
                style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Final Destination</label>
              <input 
                type="text" 
                value={exportOptions.finalDestination} 
                onChange={(e) => handleExportChange('finalDestination', e.target.value)} 
                className="form-input" 
                style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Port of Loading</label>
              <input 
                type="text" 
                value={exportOptions.portOfLoading} 
                onChange={(e) => handleExportChange('portOfLoading', e.target.value)} 
                className="form-input" 
                style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Port of Discharge</label>
              <input 
                type="text" 
                value={exportOptions.portOfDischarge} 
                onChange={(e) => handleExportChange('portOfDischarge', e.target.value)} 
                className="form-input" 
                style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button 
        onClick={handleDownload} 
        disabled={isDownloading} 
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
      >
        <Download size={18} />
        <span>{isDownloading ? 'Generating PDF...' : 'Download Invoice PDF'}</span>
      </button>
    </div>
  )
}
