'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, Download, ChevronRight, ChevronLeft, X } from 'lucide-react'
import { createInvoice, updateInvoice } from '@/lib/actions/invoices'
import { createParty } from '@/lib/actions/parties'
import { format } from 'date-fns'
import { toWords } from 'number-to-words'

interface Party {
  id: number
  name: string
  address: string
  city: string
  state: string
  stateCode: string
  gstin: string
  pan: string
  type: string
}

interface Declaration {
  id: number
  title: string
  body: string
}

interface LineItem {
  id: string // local id for tracking
  description: string
  hsn: string
  quantity: number
  rate: number
  discount: number
  taxableValue: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  igstRate: number
  igstAmount: number
  total: number
}

export function InvoiceForm({ parties, declarations, initialProfile, initialData }: { parties: Party[], declarations: Declaration[], initialProfile?: any, initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)
  const [partyList, setPartyList] = useState(parties)

  // Inline Party Creation Modal
  const [showPartyModal, setShowPartyModal] = useState(false)
  const [partyModalType, setPartyModalType] = useState<'BilledTo' | 'ShippedTo'>('BilledTo')
  const [partyModalLoading, setPartyModalLoading] = useState(false)
  const [newParty, setNewParty] = useState({
    name: '', address: '', city: '', state: 'Gujarat', stateCode: '24', gstin: '', pan: ''
  })

  // Form State
  const [formData, setFormData] = useState({
    date: initialData ? format(new Date(initialData.date), 'yyyy-MM-dd') : '',
    type: initialData?.type || ('Intra' as 'Intra' | 'Inter'),
    diamondType: initialData?.diamondType || ('LabGrown' as 'LabGrown' | 'Natural'),
    billedToId: initialData?.billedToId || 0,
    shippedToId: initialData?.shippedToId || 0,
    gstin: initialData?.gstin || initialProfile?.gstin || '24AAAAA0000A1Z5',
    pan: initialData?.pan || initialProfile?.pan || 'ABCDE1234F',
    terms: initialData?.terms || initialProfile?.terms || 'CREDIT',
    banker: initialData?.banker || initialProfile?.banker || 'STATE BANK of INDIA',
    accountNo: initialData?.accountNo || initialProfile?.accountNo || '12345678901',
    ifsc: initialData?.ifsc || initialProfile?.ifsc || 'SBIN0000001',
    districtOriginCode: initialData?.districtOriginCode || initialProfile?.districtOriginCode || '24',
    declarationText: initialData?.declarationText || '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([])

  // Summary State
  const [summary, setSummary] = useState({
    taxableAmount: initialData?.taxableAmount || 0,
    cgstTotal: initialData?.cgstTotal || 0,
    sgstTotal: initialData?.sgstTotal || 0,
    igstTotal: initialData?.igstTotal || 0,
    totalTax: initialData?.totalTax || 0,
    amountAfterTax: initialData?.amountAfterTax || 0,
    roundOff: initialData?.roundOff || 0,
    totalValue: initialData?.totalValue || 0,
    totalWords: initialData?.totalWords || ''
  })

  // Set initial state only on client to avoid hydration mismatch
  useEffect(() => {
    if (!initialData) {
      const savedDraft = localStorage.getItem('sell-invoice-draft')
      if (savedDraft) {
        try {
          const { formData: savedFormData, lineItems: savedLineItems, step: savedStep } = JSON.parse(savedDraft)
          if (savedFormData) setFormData(savedFormData)
          if (savedLineItems) setLineItems(savedLineItems)
          if (savedStep) setStep(savedStep)
          setHasRestoredDraft(true)
          return
        } catch (e) {
          console.error('Failed to parse draft', e)
        }
      }

      setFormData(prev => ({
        ...prev,
        date: format(new Date(), 'yyyy-MM-dd')
      }))

      setLineItems([
        {
          id: Math.random().toString(),
          description: 'Cut & Polished Diamond (CVD)',
          hsn: '71049120',
          quantity: 0,
          rate: 0,
          discount: 0,
          taxableValue: 0,
          cgstRate: 0.75,
          cgstAmount: 0,
          sgstRate: 0.75,
          sgstAmount: 0,
          igstRate: 1.5,
          igstAmount: 0,
          total: 0
        }
      ])
    } else {
      setLineItems(initialData.lineItems.map((item: any) => ({
        id: Math.random().toString(),
        description: item.description,
        hsn: item.hsn,
        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount,
        taxableValue: item.taxableValue,
        cgstRate: item.cgstRate,
        cgstAmount: item.cgstAmount,
        sgstRate: item.sgstRate,
        sgstAmount: item.sgstAmount,
        igstRate: item.igstRate,
        igstAmount: item.igstAmount,
        total: item.total
      })))
    }
  }, [initialData])

  // Save draft to localStorage on changes
  useEffect(() => {
    if (!initialData && lineItems.length > 0) {
      localStorage.setItem('sell-invoice-draft', JSON.stringify({
        formData,
        lineItems,
        step
      }))
    }
  }, [formData, lineItems, step, initialData])

  const handleResetForm = () => {
    if (confirm('Are you sure you want to reset the form? All current progress will be lost.')) {
      localStorage.removeItem('sell-invoice-draft')
      setHasRestoredDraft(false)
      setStep(1)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'Intra',
        diamondType: 'LabGrown',
        billedToId: 0,
        shippedToId: 0,
        gstin: initialProfile?.gstin || '24AAAAA0000A1Z5',
        pan: initialProfile?.pan || 'ABCDE1234F',
        terms: initialProfile?.terms || 'CREDIT',
        banker: initialProfile?.banker || 'STATE BANK OF INDIA',
        accountNo: initialProfile?.accountNo || '12345678901',
        ifsc: initialProfile?.ifsc || 'SBIN0000001',
        districtOriginCode: initialProfile?.districtOriginCode || '24',
        declarationText: '',
      })
      setLineItems([
        {
          id: Math.random().toString(),
          description: 'Cut & Polished Diamond (CVD)',
          hsn: '71049120',
          quantity: 0,
          rate: 0,
          discount: 0,
          taxableValue: 0,
          cgstRate: 0.75,
          cgstAmount: 0,
          sgstRate: 0.75,
          sgstAmount: 0,
          igstRate: 1.5,
          igstAmount: 0,
          total: 0
        }
      ])
    }
  }

  // Watch for type/diamond type changes (using ref to run only on user updates)
  const lastDiamondTypeRef = useRef(formData.diamondType)
  useEffect(() => {
    if (lastDiamondTypeRef.current !== formData.diamondType) {
      lastDiamondTypeRef.current = formData.diamondType
      const desc = formData.diamondType === 'LabGrown' 
        ? 'Cut & Polished Diamond (CVD)' 
        : 'Cut & Polished Diamond'
      const hsn = formData.diamondType === 'LabGrown'
        ? '71049120'
        : '71023910'
      
      setLineItems(prev => prev.map(item => ({ ...item, description: desc, hsn })))
    }
  }, [formData.diamondType])

  // Watch for calculations
  useEffect(() => {
    let taxableAmount = 0
    let cgstTotal = 0
    let sgstTotal = 0
    let igstTotal = 0

    const r2 = (v: number) => Math.round(v * 100) / 100
    const updatedItems = lineItems.map(item => {
      const taxable = r2((item.quantity * item.rate) - (formData.type === 'Inter' ? (item.discount || 0) : 0))
      let cgst = 0, sgst = 0, igst = 0
      
      if (formData.type === 'Intra') {
        cgst = r2((taxable * (item.cgstRate || 0)) / 100)
        sgst = r2((taxable * (item.sgstRate || 0)) / 100)
      } else {
        igst = r2((taxable * (item.igstRate || 0)) / 100)
      }

      const total = r2(taxable + cgst + sgst + igst)
      
      taxableAmount += taxable
      cgstTotal += cgst
      sgstTotal += sgst
      igstTotal += igst
      
      return {
        ...item,
        taxableValue: taxable,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        total: total
      }
    })

    // Check if we actually need to update lineItems to avoid infinite loop
    const hasChanged = updatedItems.some((item, i) => (
      item.taxableValue !== lineItems[i].taxableValue ||
      item.cgstAmount !== lineItems[i].cgstAmount ||
      item.sgstAmount !== lineItems[i].sgstAmount ||
      item.igstAmount !== lineItems[i].igstAmount ||
      item.total !== lineItems[i].total
    ))

    if (hasChanged) {
      setLineItems(updatedItems)
    }

    const totalTax = r2(cgstTotal + sgstTotal + igstTotal)
    const amountAfterTax = r2(taxableAmount + totalTax)
    const totalValue = Math.round(amountAfterTax)
    const roundOff = r2(totalValue - amountAfterTax)

    setSummary({
      taxableAmount: r2(taxableAmount),
      cgstTotal: r2(cgstTotal),
      sgstTotal: r2(sgstTotal),
      igstTotal: r2(igstTotal),
      totalTax,
      amountAfterTax,
      roundOff,
      totalValue,
      totalWords: capitalizeFirstLetter(toWords(totalValue)) + ' Only'
    })
  }, [lineItems, formData.type])

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  const addRow = () => {
    setLineItems([...lineItems, {
      id: Math.random().toString(),
      description: formData.diamondType === 'LabGrown' ? 'Cut & Polished Diamond (CVD)' : 'Cut & Polished Diamond',
      hsn: '7104',
      quantity: 0,
      rate: 0,
      discount: 0,
      taxableValue: 0,
      cgstRate: 0.75,
      sgstRate: 0.75,
      igstRate: 1.5,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      total: 0
    }])
  }

  const removeRow = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async () => {
    setLoading(true)
    if (!formData.billedToId || formData.billedToId === 0) {
      alert('Please select a party (Billed To)')
      setLoading(false)
      return
    }
    try {
      const payload = {
        ...formData,
        ...summary,
        lineItems
      }
      let res;
      if (initialData) {
        res = await updateInvoice(initialData.id, payload)
      } else {
        res = await createInvoice(payload)
        localStorage.removeItem('sell-invoice-draft')
      }
      router.push(`/invoices/view/${res.id}`)
    } catch (error) {
      alert('Failed to save invoice')
      setLoading(false)
    }
  }

  const selectedBilledTo = partyList.find(p => p.id === formData.billedToId)
  const selectedShippedTo = partyList.find(p => p.id === formData.shippedToId)

  // Step labels for history header
  const stepLabels: Record<number, string> = { 1: 'Type', 2: 'Diamond', 3: 'Header', 4: 'Parties', 5: 'Items', 6: 'Summary', 7: 'Declaration' }
  const stepSelections: Record<number, string> = {
    1: formData.type === 'Intra' ? 'Intra (CGST+SGST)' : 'Inter (IGST)',
    2: formData.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond',
    3: formData.date ? `Date: ${formData.date}` : '',
    4: selectedBilledTo ? selectedBilledTo.name : '',
    5: `${lineItems.length} item(s)`,
    6: summary.totalValue > 0 ? `₹${summary.totalValue.toLocaleString()}` : '',
    7: formData.declarationText ? '✓ Set' : ''
  }

  return (
    <div className="invoice-form">
      {hasRestoredDraft && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          color: '#3b82f6',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span>
            <span>Restored your unsaved draft. You can continue or start fresh.</span>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
              padding: 0
            }}
          >
            Reset Form
          </button>
        </div>
      )}

      {/* History Status Header */}
      {step > 1 && (
        <div className="step-history-bar">
          {Array.from({ length: step - 1 }, (_, i) => i + 1).map(s => (
            <button key={s} type="button" className="history-chip" onClick={() => setStep(s)}>
              <span className="chip-label">{stepLabels[s]}</span>
              {stepSelections[s] && <span className="chip-value">{stepSelections[s]}</span>}
            </button>
          ))}
        </div>
      )}
      {/* Steps Progress */}
      <div className="steps-progress">
        {[1, 2, 3, 4, 5, 6, 7].map(s => (
          <button
            key={s}
            type="button"
            className={`step-dot ${step >= s ? 'active' : ''}`}
            onClick={() => { if (s <= step) setStep(s) }}
            style={{ cursor: s <= step ? 'pointer' : 'default' }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="step-content glass-card animate-fade-in">
        {step === 1 && (
          <section className="step-section">
            <h2>Invoice Type</h2>
            <div className="radio-group">
              <label className="radio-card">
                <input 
                  type="radio" 
                  name="type" 
                  value="Intra" 
                  checked={formData.type === 'Intra'} 
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                />
                <div className="radio-content">
                  <span className="radio-title">Intra-state</span>
                  <span className="radio-desc">CGST + SGST (Within Gujarat)</span>
                </div>
              </label>
              <label className="radio-card">
                <input 
                  type="radio" 
                  name="type" 
                  value="Inter" 
                  checked={formData.type === 'Inter'} 
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                />
                <div className="radio-content">
                  <span className="radio-title">Inter-state</span>
                  <span className="radio-desc">IGST (Outside Gujarat)</span>
                </div>
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="step-section">
            <h2>Diamond Type</h2>
            <div className="radio-group">
              <label className="radio-card">
                <input 
                  type="radio" 
                  name="diamondType" 
                  value="LabGrown" 
                  checked={formData.diamondType === 'LabGrown'} 
                  onChange={(e) => setFormData({...formData, diamondType: e.target.value as any})}
                />
                <div className="radio-content">
                  <span className="radio-title">Lab Grown (CVD)</span>
                  <span className="radio-desc">Product: Cut & Polished Diamond (CVD)</span>
                </div>
              </label>
              <label className="radio-card">
                <input 
                  type="radio" 
                  name="diamondType" 
                  value="Natural" 
                  checked={formData.diamondType === 'Natural'} 
                  onChange={(e) => setFormData({...formData, diamondType: e.target.value as any})}
                />
                <div className="radio-content">
                  <span className="radio-title">Natural Diamond</span>
                  <span className="radio-desc">Product: Cut & Polished Diamond</span>
                </div>
              </label>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="step-section">
            <h2>Invoice Header</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Our GSTIN</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.gstin} 
                  onChange={(e) => setFormData({...formData, gstin: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Our PAN</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.pan} 
                  onChange={(e) => setFormData({...formData, pan: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Terms</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.terms} 
                  onChange={(e) => setFormData({...formData, terms: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Banker</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.banker} 
                  onChange={(e) => setFormData({...formData, banker: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Account No</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.accountNo} 
                  onChange={(e) => setFormData({...formData, accountNo: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.ifsc} 
                  onChange={(e) => setFormData({...formData, ifsc: e.target.value})}
                />
              </div>
              {formData.type === 'Inter' && (
                <div className="form-group">
                  <label className="form-label">District Origin Code</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.districtOriginCode} 
                    onChange={(e) => setFormData({...formData, districtOriginCode: e.target.value})}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="step-section">
            <h2>Billed To & Shipped To</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Billed To (Party)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    className="form-input" 
                    value={formData.billedToId} 
                    onChange={(e) => setFormData({...formData, billedToId: parseInt(e.target.value)})}
                    style={{ flex: 1 }}
                  >
                    <option value={0}>Select Party</option>
                    {partyList.filter(p => p.type === 'BilledTo' || p.type === 'Both').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => { setPartyModalType('BilledTo'); setNewParty({ name: '', address: '', city: '', state: 'Gujarat', stateCode: '24', gstin: '', pan: '' }); setShowPartyModal(true) }} style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={14} /> Create
                  </button>
                </div>
                {selectedBilledTo && (
                  <div className="selection-preview">
                    <p><strong>{selectedBilledTo.address}</strong></p>
                    <p>{selectedBilledTo.city}, {selectedBilledTo.state} ({selectedBilledTo.stateCode})</p>
                    <p>GSTIN: {selectedBilledTo.gstin}</p>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Shipped To (Consignee)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    className="form-input" 
                    value={formData.shippedToId} 
                    onChange={(e) => setFormData({...formData, shippedToId: parseInt(e.target.value)})}
                    style={{ flex: 1 }}
                  >
                    <option value={0}>Select Consignee</option>
                    <option value={-1}>Same as Billed To</option>
                    {partyList.filter(p => p.type === 'ShippedTo' || p.type === 'Both').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => { setPartyModalType('ShippedTo'); setNewParty({ name: '', address: '', city: '', state: 'Gujarat', stateCode: '24', gstin: '', pan: '' }); setShowPartyModal(true) }} style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={14} /> Create
                  </button>
                </div>
                {formData.shippedToId === -1 && selectedBilledTo && (
                  <div className="selection-preview">
                    <p>Same as billed to party</p>
                  </div>
                )}
                {formData.shippedToId > 0 && selectedShippedTo && (
                  <div className="selection-preview">
                    <p><strong>{selectedShippedTo.address}</strong></p>
                    <p>{selectedShippedTo.city}, {selectedShippedTo.state} ({selectedShippedTo.stateCode})</p>
                    <p>GSTIN: {selectedShippedTo.gstin}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="step-section">
            <h2>Product Line Items</h2>
            <div className="line-items-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>HSN</th>
                    <th>Carats</th>
                    <th>Rate</th>
                    {formData.type === 'Inter' && <th>Discount</th>}
                    <th>Taxable</th>
                    {formData.type === 'Intra' ? (
                      <>
                        <th>CGST</th>
                        <th>SGST</th>
                      </>
                    ) : (
                      <th>IGST</th>
                    )}
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td><input type="text" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="form-input min" /></td>
                      <td><input type="text" value={item.hsn} onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)} className="form-input min" /></td>
                      <td><input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="form-input min" /></td>
                      <td><input type="number" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)} className="form-input min" /></td>
                      {formData.type === 'Inter' && (
                        <td><input type="number" value={item.discount} onChange={(e) => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)} className="form-input min" /></td>
                      )}
                      <td className="mono">₹{item.taxableValue.toFixed(2)}</td>
                      {formData.type === 'Intra' ? (
                        <>
                          <td>
                            <div className="tax-cell">
                              <input type="number" value={item.cgstRate} onChange={(e) => handleItemChange(item.id, 'cgstRate', parseFloat(e.target.value) || 0)} className="form-input tiny" />
                              %
                            </div>
                          </td>
                          <td>
                            <div className="tax-cell">
                              <input type="number" value={item.sgstRate} onChange={(e) => handleItemChange(item.id, 'sgstRate', parseFloat(e.target.value) || 0)} className="form-input tiny" />
                              %
                            </div>
                          </td>
                        </>
                      ) : (
                        <td>
                          <div className="tax-cell">
                            <input type="number" value={item.igstRate} onChange={(e) => handleItemChange(item.id, 'igstRate', parseFloat(e.target.value) || 0)} className="form-input tiny" />
                            %
                          </div>
                        </td>
                      )}
                      <td className="mono">₹{item.total.toFixed(2)}</td>
                      <td>
                        <button onClick={() => removeRow(item.id)} className="icon-btn danger">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addRow} className="btn btn-outline btn-sm mt-4">
                <Plus size={16} /> Add Row
              </button>
            </div>
            
            <div className="totals-row">
               <div className="total-item">
                  <span>Total Taxable:</span>
                  <strong>₹{summary.taxableAmount.toFixed(2)}</strong>
               </div>
               <div className="total-item">
                  <span>Total Tax:</span>
                  <strong>₹{summary.totalTax.toFixed(2)}</strong>
               </div>
               <div className="total-item grand">
                  <span>Grand Total:</span>
                  <strong>₹{summary.totalValue.toLocaleString()}</strong>
               </div>
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="step-section">
            <h2>Summary & Totals</h2>
            <div className="summary-card">
              <div className="summary-row">
                <span>Total Taxable Amount:</span>
                <span>₹{summary.taxableAmount.toFixed(2)}</span>
              </div>
              {formData.type === 'Intra' ? (
                <>
                  <div className="summary-row">
                    <span>Add: CGST:</span>
                    <span>₹{summary.cgstTotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Add: SGST:</span>
                    <span>₹{summary.sgstTotal.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="summary-row">
                  <span>Add: IGST:</span>
                  <span>₹{summary.igstTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row highlight">
                <span>Total Tax Amount:</span>
                <span>₹{summary.totalTax.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Amount After Tax:</span>
                <span>₹{summary.amountAfterTax.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Round Off:</span>
                <span>₹{summary.roundOff.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total Invoice Value:</span>
                <span>₹{summary.totalValue.toLocaleString()}</span>
              </div>
              <div className="words-block">
                <p className="form-label">Total Amount in Words</p>
                <p className="words-text">{summary.totalWords}</p>
              </div>
            </div>
          </section>
        )}

        {step === 7 && (
          <section className="step-section">
            <h2>Declaration & Terms</h2>
            <div className="form-group">
              <label className="form-label">Select Template</label>
              <select 
                className="form-input" 
                onChange={(e) => {
                  const dec = declarations.find(d => d.id === parseInt(e.target.value))
                  if (dec) setFormData({...formData, declarationText: dec.body})
                }}
              >
                <option value="">Select Template</option>
                {declarations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Declaration Text (Editable)</label>
              <textarea 
                className="form-input" 
                rows={10} 
                value={formData.declarationText} 
                onChange={(e) => setFormData({...formData, declarationText: e.target.value})}
              />
            </div>
          </section>
        )}
      </div>

      <div className="form-navigation">
        <div className="form-navigation-inner">
          <button 
            type="button"
            onClick={() => setStep(s => s - 1)} 
            disabled={step === 1 || loading}
            className="btn btn-outline"
          >
            <ChevronLeft size={20} /> Previous
          </button>
          
          {step < 7 ? (
            <button 
              type="button"
              onClick={() => setStep(s => s + 1)} 
              className="btn btn-primary"
            >
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSubmit} 
              className="btn btn-success"
              disabled={loading || !formData.billedToId}
            >
              <Save size={20} /> {loading ? 'Saving...' : 'Generate Invoice'}
            </button>
          )}
        </div>
      </div>

      {/* Inline Party Creation Modal */}
      {showPartyModal && (
        <div className="modal-overlay" onClick={() => setShowPartyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Create {partyModalType === 'BilledTo' ? 'Party (Billed To)' : 'Consignee (Shipped To)'}</h3>
              <button type="button" className="icon-btn" onClick={() => setShowPartyModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setPartyModalLoading(true)
              try {
                const created = await createParty({ ...newParty, type: partyModalType })
                setPartyList(prev => [...prev, created])
                if (partyModalType === 'BilledTo') {
                  setFormData(prev => ({ ...prev, billedToId: created.id }))
                } else {
                  setFormData(prev => ({ ...prev, shippedToId: created.id }))
                }
                setShowPartyModal(false)
              } catch {
                alert('Failed to create party')
              } finally {
                setPartyModalLoading(false)
              }
            }}>
              <div className="form-grid" style={{ padding: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Party Name *</label>
                  <input type="text" className="form-input" required value={newParty.name} onChange={e => setNewParty({...newParty, name: e.target.value})} placeholder="e.g. Acme Diamond Corp" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address *</label>
                  <textarea className="form-input" rows={2} required value={newParty.address} onChange={e => setNewParty({...newParty, address: e.target.value})} placeholder="Full address..." />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input type="text" className="form-input" required value={newParty.city} onChange={e => setNewParty({...newParty, city: e.target.value})} placeholder="Surat" />
                </div>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input type="text" className="form-input" required value={newParty.state} onChange={e => setNewParty({...newParty, state: e.target.value})} placeholder="Gujarat" />
                </div>
                <div className="form-group">
                  <label className="form-label">State Code *</label>
                  <input type="text" className="form-input" required value={newParty.stateCode} onChange={e => setNewParty({...newParty, stateCode: e.target.value})} placeholder="24" />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN *</label>
                  <input type="text" className="form-input" required value={newParty.gstin} onChange={e => {
                    const val = e.target.value.toUpperCase()
                    if (val.length >= 15) {
                      setNewParty({...newParty, gstin: val, pan: val.substring(2, 12)})
                    } else {
                      setNewParty({...newParty, gstin: val})
                    }
                  }} placeholder="24AAAAA0000A1Z5" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">PAN *</label>
                  <input type="text" className="form-input" required value={newParty.pan} onChange={e => setNewParty({...newParty, pan: e.target.value.toUpperCase()})} placeholder="Auto-filled from GSTIN" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '0 1.5rem 1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPartyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={partyModalLoading}>
                  {partyModalLoading ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
