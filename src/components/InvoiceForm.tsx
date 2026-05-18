'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, Download, ChevronRight, ChevronLeft } from 'lucide-react'
import { createInvoice } from '@/lib/actions/invoices'
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

export function InvoiceForm({ parties, declarations }: { parties: Party[], declarations: Declaration[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  // Form State
  const [formData, setFormData] = useState({
    date: '', // Initialize empty to avoid hydration mismatch
    type: 'Intra' as 'Intra' | 'Inter',
    diamondType: 'LabGrown' as 'LabGrown' | 'Natural',
    billedToId: 0,
    shippedToId: 0,
    gstin: '24AAAAA0000A1Z5', // Shakti Exports default
    pan: 'ABCDE1234F',         // Shakti Exports default
    terms: 'CREDIT',
    banker: 'STATE BANK OF INDIA',
    accountNo: '12345678901',
    ifsc: 'SBIN0000001',
    districtOriginCode: '24',
    declarationText: '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([])

  // Summary State
  const [summary, setSummary] = useState({
    taxableAmount: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    totalTax: 0,
    amountAfterTax: 0,
    roundOff: 0,
    totalValue: 0,
    totalWords: ''
  })

  // Set initial state only on client to avoid hydration mismatch
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: format(new Date(), 'yyyy-MM-dd')
    }))

    setLineItems([
      {
        id: Math.random().toString(),
        description: 'Cut & Polished Diamond (CVD)',
        hsn: '7104',
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
  }, [])

  // Watch for type/diamond type changes
  useEffect(() => {
    const desc = formData.diamondType === 'LabGrown' 
      ? 'Cut & Polished Diamond (CVD)' 
      : 'Cut & Polished Diamond'
    
    setLineItems(prev => prev.map(item => ({ ...item, description: desc })))
  }, [formData.diamondType])

  // Watch for calculations
  useEffect(() => {
    let taxableAmount = 0
    let cgstTotal = 0
    let sgstTotal = 0
    let igstTotal = 0

    const updatedItems = lineItems.map(item => {
      const taxable = (item.quantity * item.rate) - (formData.type === 'Inter' ? (item.discount || 0) : 0)
      let cgst = 0, sgst = 0, igst = 0
      
      if (formData.type === 'Intra') {
        cgst = (taxable * (item.cgstRate || 0)) / 100
        sgst = (taxable * (item.sgstRate || 0)) / 100
      } else {
        igst = (taxable * (item.igstRate || 0)) / 100
      }

      const total = taxable + cgst + sgst + igst
      
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

    const totalTax = cgstTotal + sgstTotal + igstTotal
    const amountAfterTax = taxableAmount + totalTax
    const totalValue = Math.round(amountAfterTax)
    const roundOff = totalValue - amountAfterTax

    setSummary({
      taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
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
      const res = await createInvoice(payload)
      router.push(`/invoices/view/${res.id}`)
    } catch (error) {
      alert('Failed to save invoice')
      setLoading(false)
    }
  }

  const selectedBilledTo = parties.find(p => p.id === formData.billedToId)
  const selectedShippedTo = parties.find(p => p.id === formData.shippedToId)

  // Step labels for history header
  const stepLabels: Record<number, string> = { 1: 'Type', 2: 'Diamond', 3: 'Header', 4: 'Parties', 5: 'Items', 6: 'Summary', 7: 'Declaration' }
  const stepSelections: Record<number, string> = {
    1: formData.type === 'Intra' ? 'Intra (IGST)' : 'Inter (CGST+SGST)',
    2: formData.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond',
    3: formData.date ? `Date: ${formData.date}` : '',
    4: selectedBilledTo ? selectedBilledTo.name : '',
    5: `${lineItems.length} item(s)`,
    6: summary.totalValue > 0 ? `₹${summary.totalValue.toLocaleString()}` : '',
    7: formData.declarationText ? '✓ Set' : ''
  }

  return (
    <div className="invoice-form">
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
          <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`}>
            {s}
          </div>
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
                  <span className="radio-desc">IGST (Outside Gujarat)</span>
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
                  <span className="radio-desc">CGST + SGST (Within Gujarat)</span>
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
                  onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Our PAN</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.pan} 
                  onChange={(e) => setFormData({...formData, pan: e.target.value})}
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
                <select 
                  className="form-input" 
                  value={formData.billedToId} 
                  onChange={(e) => setFormData({...formData, billedToId: parseInt(e.target.value)})}
                >
                  <option value={0}>Select Party</option>
                  {parties.filter(p => p.type === 'BilledTo' || p.type === 'Both').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
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
                <select 
                  className="form-input" 
                  value={formData.shippedToId} 
                  onChange={(e) => setFormData({...formData, shippedToId: parseInt(e.target.value)})}
                >
                  <option value={0}>Select Consignee</option>
                  <option value={-1}>Same as Billed To</option>
                  {parties.filter(p => p.type === 'ShippedTo' || p.type === 'Both').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
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
  )
}
