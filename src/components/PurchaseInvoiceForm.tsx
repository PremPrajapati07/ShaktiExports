'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, ChevronRight, ChevronLeft } from 'lucide-react'
import { createPurchaseInvoice } from '@/lib/actions/purchase-invoices'
import { format } from 'date-fns'
import { toWords } from 'number-to-words'

interface PurchaseSupplier {
  id: number; name: string; address: string; city: string
  state: string; stateCode: string; gstin: string; pan: string
  bankerName?: string | null; accountNo?: string | null; ifsc?: string | null; swiftCode?: string | null
}
interface PurchaseBuyer {
  id: number; name: string; address: string; city: string
  state: string; stateCode: string; gstin: string; pan: string
  type: string
}
interface Declaration { id: number; title: string; body: string }
interface LineItem {
  id: string; description: string; hsn: string; quantity: number; rate: number
  discount: number; taxableValue: number; cgstRate: number; cgstAmount: number
  sgstRate: number; sgstAmount: number; igstRate: number; igstAmount: number; total: number
}

// 6 steps: 1=Type, 2=Diamond, 3=Parties, 4=Items, 5=Summary, 6=Declaration
const TOTAL_STEPS = 6

const stepLabels: Record<number, string> = {
  1: 'Type', 2: 'Diamond', 3: 'Parties', 4: 'Items', 5: 'Summary', 6: 'Declaration'
}

export function PurchaseInvoiceForm({
  suppliers, buyers, declarations
}: {
  suppliers: PurchaseSupplier[]
  buyers: PurchaseBuyer[]
  declarations: Declaration[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    date: '',
    type: 'Intra' as 'Intra' | 'Inter',
    diamondType: 'LabGrown' as 'LabGrown' | 'Natural',
    supplierId: 0,
    shipToId: 0,
    billToId: 0,
    sellerGstin: '',
    sellerPan: '',
    terms: 'CREDIT',
    bankerName: '',
    accountNo: '',
    ifsc: '',
    swiftCode: '',
    declarationText: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [summary, setSummary] = useState({
    taxableAmount: 0, cgstTotal: 0, sgstTotal: 0, igstTotal: 0,
    totalTax: 0, amountAfterTax: 0, roundOff: 0, totalValue: 0, totalWords: ''
  })

  // Init date + first line item on client
  useEffect(() => {
    setFormData(prev => ({ ...prev, date: format(new Date(), 'yyyy-MM-dd') }))
    setLineItems([{
      id: Math.random().toString(),
      description: 'LABORATORY GROWN CUT & POLISH DIAMOND',
      hsn: '71049120', quantity: 0, rate: 0, discount: 0,
      taxableValue: 0, cgstRate: 0.75, cgstAmount: 0,
      sgstRate: 0.75, sgstAmount: 0, igstRate: 1.5, igstAmount: 0, total: 0
    }])
  }, [])

  // Auto-fill seller GSTIN/PAN/Bank from selected supplier
  useEffect(() => {
    if (formData.supplierId > 0) {
      const sup = suppliers.find(s => s.id === formData.supplierId)
      if (sup) {
        setFormData(prev => ({
          ...prev,
          sellerGstin: sup.gstin,
          sellerPan: sup.pan,
          bankerName: sup.bankerName || '',
          accountNo: sup.accountNo || '',
          ifsc: sup.ifsc || '',
          swiftCode: sup.swiftCode || '',
        }))
      }
    }
  }, [formData.supplierId, suppliers])

  // Update description on diamond type change
  useEffect(() => {
    const desc = formData.diamondType === 'LabGrown'
      ? 'LABORATORY GROWN CUT & POLISH DIAMOND'
      : 'CUT & POLISHED NATURAL DIAMOND'
    setLineItems(prev => prev.map(item => ({ ...item, description: desc })))
  }, [formData.diamondType])

  // Calculation
  // Intra = IGST (Outside Gujarat), Inter = CGST+SGST (Within Gujarat)
  useEffect(() => {
    let taxableAmount = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0

    const updatedItems = lineItems.map(item => {
      const taxable = (item.quantity * item.rate) - (formData.type === 'Inter' ? (item.discount || 0) : 0)
      let cgst = 0, sgst = 0, igst = 0
      if (formData.type === 'Intra') {
        igst = (taxable * (item.igstRate || 0)) / 100
      } else {
        cgst = (taxable * (item.cgstRate || 0)) / 100
        sgst = (taxable * (item.sgstRate || 0)) / 100
      }
      const total = taxable + cgst + sgst + igst
      taxableAmount += taxable; cgstTotal += cgst; sgstTotal += sgst; igstTotal += igst
      return { ...item, taxableValue: taxable, cgstAmount: cgst, sgstAmount: sgst, igstAmount: igst, total }
    })

    const hasChanged = updatedItems.some((item, i) => (
      item.taxableValue !== lineItems[i]?.taxableValue ||
      item.cgstAmount !== lineItems[i]?.cgstAmount ||
      item.sgstAmount !== lineItems[i]?.sgstAmount ||
      item.igstAmount !== lineItems[i]?.igstAmount ||
      item.total !== lineItems[i]?.total
    ))
    if (hasChanged) setLineItems(updatedItems)

    const totalTax = cgstTotal + sgstTotal + igstTotal
    const amountAfterTax = taxableAmount + totalTax
    const totalValue = Math.round(amountAfterTax)
    const roundOff = totalValue - amountAfterTax
    const words = toWords(Math.max(totalValue, 0))

    setSummary({
      taxableAmount, cgstTotal, sgstTotal, igstTotal, totalTax, amountAfterTax, roundOff, totalValue,
      totalWords: (words.charAt(0).toUpperCase() + words.slice(1)) + ' Only'
    })
  }, [lineItems, formData.type])

  const addRow = () => setLineItems([...lineItems, {
    id: Math.random().toString(),
    description: formData.diamondType === 'LabGrown' ? 'LABORATORY GROWN CUT & POLISH DIAMOND' : 'CUT & POLISHED NATURAL DIAMOND',
    hsn: '71049120', quantity: 0, rate: 0, discount: 0,
    taxableValue: 0, cgstRate: 0.75, cgstAmount: 0,
    sgstRate: 0.75, sgstAmount: 0, igstRate: 1.5, igstAmount: 0, total: 0
  }])

  const removeRow = (id: string) => {
    if (lineItems.length > 1) setLineItems(lineItems.filter(i => i.id !== id))
  }

  const handleItemChange = (id: string, field: keyof LineItem, value: any) =>
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item))

  const handleSubmit = async () => {
    setLoading(true)
    if (!formData.supplierId) { alert('Please select a supplier (From Whom)'); setLoading(false); return }
    if (!formData.shipToId) { alert('Please select a consignee (Ship To)'); setLoading(false); return }
    if (!formData.billToId) { alert('Please select a buyer (Bill To)'); setLoading(false); return }
    try {
      const res = await createPurchaseInvoice({ ...formData, ...summary, lineItems })
      router.push(`/purchase-invoices/view/${res.id}`)
    } catch {
      alert('Failed to save purchase invoice')
      setLoading(false)
    }
  }

  const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)
  const selectedShipTo = buyers.find(b => b.id === formData.shipToId)
  const selectedBillTo = buyers.find(b => b.id === formData.billToId)

  const shipToOptions = buyers.filter(b => b.type === 'ShipTo' || b.type === 'Both')
  const billToOptions = buyers.filter(b => b.type === 'BillTo' || b.type === 'Both')

  // History chips for completed steps
  const stepSelections: Record<number, string> = {
    1: formData.type === 'Intra' ? 'Intra (IGST)' : 'Inter (CGST+SGST)',
    2: formData.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond',
    3: selectedSupplier ? `From: ${selectedSupplier.name}` : '',
    4: `${lineItems.length} item(s)`,
    5: summary.totalValue > 0 ? `₹${summary.totalValue.toLocaleString()}` : '',
    6: formData.declarationText ? '✓ Set' : '',
  }

  // Intra = IGST (Outside Gujarat)
  const isIGST = formData.type === 'Intra'

  return (
    <div className="invoice-form">
      {/* Step History Breadcrumb */}
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
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
          <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`}>{s}</div>
        ))}
      </div>

      <div className="step-content glass-card animate-fade-in">

        {/* ── Step 1: Invoice Type ─────────────────────────────────────────── */}
        {step === 1 && (
          <section className="step-section">
            <h2>Invoice Type</h2>
            <div className="radio-group">
              <label className="radio-card">
                <input type="radio" name="type" value="Intra" checked={formData.type === 'Intra'}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })} />
                <div className="radio-content">
                  <span className="radio-title">Intra-state</span>
                  <span className="radio-desc">IGST (Outside Gujarat)</span>
                </div>
              </label>
              <label className="radio-card">
                <input type="radio" name="type" value="Inter" checked={formData.type === 'Inter'}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })} />
                <div className="radio-content">
                  <span className="radio-title">Inter-state</span>
                  <span className="radio-desc">CGST + SGST (Within Gujarat)</span>
                </div>
              </label>
            </div>
          </section>
        )}

        {/* ── Step 2: Diamond Type ─────────────────────────────────────────── */}
        {step === 2 && (
          <section className="step-section">
            <h2>Diamond Type</h2>
            <div className="radio-group">
              <label className="radio-card">
                <input type="radio" name="diamondType" value="LabGrown" checked={formData.diamondType === 'LabGrown'}
                  onChange={e => setFormData({ ...formData, diamondType: e.target.value as any })} />
                <div className="radio-content">
                  <span className="radio-title">Lab Grown (CVD)</span>
                  <span className="radio-desc">LABORATORY GROWN CUT & POLISH DIAMOND — Invoice: P-LGD</span>
                </div>
              </label>
              <label className="radio-card">
                <input type="radio" name="diamondType" value="Natural" checked={formData.diamondType === 'Natural'}
                  onChange={e => setFormData({ ...formData, diamondType: e.target.value as any })} />
                <div className="radio-content">
                  <span className="radio-title">Natural Diamond</span>
                  <span className="radio-desc">CUT & POLISHED NATURAL DIAMOND — Invoice: P-NS</span>
                </div>
              </label>
            </div>
          </section>
        )}

        {/* ── Step 3: From Whom + Ship To + Bill To ───────────────────────── */}
        {step === 3 && (
          <section className="step-section">
            <h2>Parties (Supplier, Consignee &amp; Buyer)</h2>
            <div className="form-grid">
              {/* Supplier */}
              <div className="form-group">
                <label className="form-label">Supplier (From Whom Purchase)</label>
                <select className="form-input" value={formData.supplierId}
                  onChange={e => setFormData({ ...formData, supplierId: parseInt(e.target.value) })}>
                  <option value={0}>Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {selectedSupplier && (
                  <div className="selection-preview">
                    <p><strong>{selectedSupplier.address}</strong></p>
                    <p>{selectedSupplier.city}, {selectedSupplier.state} ({selectedSupplier.stateCode})</p>
                    <p>GSTIN: {selectedSupplier.gstin} &nbsp;|&nbsp; PAN: {selectedSupplier.pan}</p>
                    {selectedSupplier.bankerName && (
                      <p className="mt-1 text-xs text-gray-600">Bank: {selectedSupplier.bankerName} ({selectedSupplier.accountNo})</p>
                    )}
                  </div>
                )}
                {suppliers.length === 0 && (
                  <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    No suppliers found. <a href="/purchase-suppliers/create" style={{ color: 'var(--accent)' }}>Add one first →</a>
                  </p>
                )}
              </div>

              {/* Consignee (Ship To) */}
              <div className="form-group">
                <label className="form-label">Consignee (Ship To)</label>
                <select className="form-input" value={formData.shipToId}
                  onChange={e => setFormData({ ...formData, shipToId: parseInt(e.target.value) })}>
                  <option value={0}>Select Consignee</option>
                  {shipToOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {selectedShipTo && (
                  <div className="selection-preview">
                    <p><strong>{selectedShipTo.address}</strong></p>
                    <p>{selectedShipTo.city}, {selectedShipTo.state} ({selectedShipTo.stateCode})</p>
                    <p>GSTIN: {selectedShipTo.gstin} &nbsp;|&nbsp; PAN: {selectedShipTo.pan}</p>
                  </div>
                )}
                {shipToOptions.length === 0 && (
                  <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    No consignees found. <a href="/purchase-buyers/create" style={{ color: 'var(--accent)' }}>Add one first →</a>
                  </p>
                )}
              </div>

              {/* Buyer (Bill To) */}
              <div className="form-group">
                <label className="form-label">Buyer (Bill To)</label>
                <select className="form-input" value={formData.billToId}
                  onChange={e => setFormData({ ...formData, billToId: parseInt(e.target.value) })}>
                  <option value={0}>Select Buyer</option>
                  {billToOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {selectedBillTo && (
                  <div className="selection-preview">
                    <p><strong>{selectedBillTo.address}</strong></p>
                    <p>{selectedBillTo.city}, {selectedBillTo.state} ({selectedBillTo.stateCode})</p>
                    <p>GSTIN: {selectedBillTo.gstin} &nbsp;|&nbsp; PAN: {selectedBillTo.pan}</p>
                  </div>
                )}
                {billToOptions.length === 0 && (
                  <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    No buyers found. <a href="/purchase-buyers/create" style={{ color: 'var(--accent)' }}>Add one first →</a>
                  </p>
                )}
              </div>

              {/* Invoice Date inline here */}
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input type="date" className="form-input" value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>

              {/* Terms */}
              <div className="form-group">
                <label className="form-label">Mode / Terms of Payment</label>
                <input type="text" className="form-input" value={formData.terms}
                  onChange={e => setFormData({ ...formData, terms: e.target.value })} />
              </div>
            </div>
          </section>
        )}

        {/* ── Step 4: Line Items ───────────────────────────────────────────── */}
        {step === 4 && (
          <section className="step-section">
            <h2>Product Line Items</h2>
            <div className="line-items-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>HSN</th>
                    <th>Carats</th>
                    <th>Rate (₹/Ct)</th>
                    {!isIGST && <th>Discount</th>}
                    <th>Taxable</th>
                    {isIGST
                      ? <th>IGST %</th>
                      : <><th>CGST %</th><th>SGST %</th></>
                    }
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map(item => (
                    <tr key={item.id}>
                      <td><input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="form-input min" /></td>
                      <td><input type="text" value={item.hsn} onChange={e => handleItemChange(item.id, 'hsn', e.target.value)} className="form-input min" /></td>
                      <td><input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="form-input min" /></td>
                      <td><input type="number" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)} className="form-input min" /></td>
                      {!isIGST && <td><input type="number" value={item.discount} onChange={e => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)} className="form-input min" /></td>}
                      <td className="mono">₹{item.taxableValue.toFixed(2)}</td>
                      {isIGST ? (
                        <td><div className="tax-cell"><input type="number" value={item.igstRate} onChange={e => handleItemChange(item.id, 'igstRate', parseFloat(e.target.value) || 0)} className="form-input tiny" />%</div></td>
                      ) : (
                        <>
                          <td><div className="tax-cell"><input type="number" value={item.cgstRate} onChange={e => handleItemChange(item.id, 'cgstRate', parseFloat(e.target.value) || 0)} className="form-input tiny" />%</div></td>
                          <td><div className="tax-cell"><input type="number" value={item.sgstRate} onChange={e => handleItemChange(item.id, 'sgstRate', parseFloat(e.target.value) || 0)} className="form-input tiny" />%</div></td>
                        </>
                      )}
                      <td className="mono">₹{item.total.toFixed(2)}</td>
                      <td>
                        <button onClick={() => removeRow(item.id)} className="icon-btn danger"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addRow} className="btn btn-outline btn-sm mt-4"><Plus size={16} /> Add Row</button>
            </div>
            <div className="totals-row">
              <div className="total-item"><span>Total Taxable:</span><strong>₹{summary.taxableAmount.toFixed(2)}</strong></div>
              <div className="total-item"><span>Total Tax:</span><strong>₹{summary.totalTax.toFixed(2)}</strong></div>
              <div className="total-item grand"><span>Grand Total:</span><strong>₹{summary.totalValue.toLocaleString()}</strong></div>
            </div>
          </section>
        )}

        {/* ── Step 5: Summary ──────────────────────────────────────────────── */}
        {step === 5 && (
          <section className="step-section">
            <h2>Summary &amp; Totals</h2>
            <div className="summary-card">
              <div className="summary-row"><span>Total Taxable Amount:</span><span>₹{summary.taxableAmount.toFixed(2)}</span></div>
              {isIGST ? (
                <div className="summary-row"><span>Add: IGST:</span><span>₹{summary.igstTotal.toFixed(2)}</span></div>
              ) : (
                <>
                  <div className="summary-row"><span>Add: CGST:</span><span>₹{summary.cgstTotal.toFixed(2)}</span></div>
                  <div className="summary-row"><span>Add: SGST:</span><span>₹{summary.sgstTotal.toFixed(2)}</span></div>
                </>
              )}
              <div className="summary-row highlight"><span>Total Tax Amount:</span><span>₹{summary.totalTax.toFixed(2)}</span></div>
              <div className="summary-row"><span>Amount After Tax:</span><span>₹{summary.amountAfterTax.toFixed(2)}</span></div>
              <div className="summary-row"><span>Round Off:</span><span>₹{summary.roundOff.toFixed(2)}</span></div>
              <div className="summary-row total"><span>Total Invoice Value:</span><span>₹{summary.totalValue.toLocaleString()}</span></div>
              <div className="words-block">
                <p className="form-label">Total Amount in Words</p>
                <p className="words-text">{summary.totalWords}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Step 6: Declaration ──────────────────────────────────────────── */}
        {step === 6 && (
          <section className="step-section">
            <h2>Declaration &amp; Terms</h2>
            <div className="form-group">
              <label className="form-label">Select Template</label>
              <select className="form-input" onChange={e => {
                const dec = declarations.find(d => d.id === parseInt(e.target.value))
                if (dec) setFormData({ ...formData, declarationText: dec.body })
              }}>
                <option value="">Select Template</option>
                {declarations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Declaration Text (Editable)</label>
              <textarea className="form-input" rows={8} value={formData.declarationText}
                onChange={e => setFormData({ ...formData, declarationText: e.target.value })} />
            </div>
          </section>
        )}

      </div>

      {/* Navigation */}
      <div className="form-navigation">
        <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1 || loading} className="btn btn-outline">
          <ChevronLeft size={20} /> Previous
        </button>
        {step < TOTAL_STEPS ? (
          <button type="button" onClick={() => setStep(s => s + 1)} className="btn btn-primary">
            Next <ChevronRight size={20} />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} className="btn btn-success"
            disabled={loading || !formData.supplierId || !formData.shipToId || !formData.billToId}>
            <Save size={20} /> {loading ? 'Saving...' : 'Generate Purchase Invoice'}
          </button>
        )}
      </div>
    </div>
  )
}

