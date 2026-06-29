'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, ChevronRight, ChevronLeft, X } from 'lucide-react'
import { createPurchaseInvoice, updatePurchaseInvoice } from '@/lib/actions/purchase-invoices'
import { createSupplier } from '@/lib/actions/purchase-parties'
import { format } from 'date-fns'
import { toWords } from 'number-to-words'

interface PurchaseSupplier {
  id: number; name: string; address: string; city: string
  state: string; stateCode: string; gstin: string; pan: string
  bankerName?: string | null; accountNo?: string | null; ifsc?: string | null; swiftCode?: string | null
}
interface CompanyBuyer {
  id: number; name: string; address: string; city: string
  state: string; stateCode: string; gstin: string; pan: string
}
interface LineItem {
  id: string; description: string; hsn: string; quantity: number; rate: number
  discount: number; taxableValue: number; cgstRate: number; cgstAmount: number
  sgstRate: number; sgstAmount: number; igstRate: number; igstAmount: number; total: number
}

// 4 steps: 1=Type, 2=Diamond, 3=Supplier, 4=Items, 5=Summary
const TOTAL_STEPS = 5

const stepLabels: Record<number, string> = {
  1: 'Type', 2: 'Diamond', 3: 'Supplier', 4: 'Items', 5: 'Summary'
}

export function PurchaseInvoiceForm({
  suppliers, companyBuyer, initialData, invoiceId
}: {
  suppliers: PurchaseSupplier[]
  companyBuyer: CompanyBuyer
  initialData?: any
  invoiceId?: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)
  const [supplierList, setSupplierList] = useState(suppliers)

  // Inline Supplier Creation Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [supplierModalLoading, setSupplierModalLoading] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: '', address: '', city: '', state: 'Gujarat', stateCode: '24', gstin: '', pan: '',
    bankerName: '', accountNo: '', ifsc: '', swiftCode: ''
  })

  const [formData, setFormData] = useState({
    date: initialData?.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : '',
    type: (initialData?.type || 'Intra') as 'Intra' | 'Inter',
    diamondType: (initialData?.diamondType || 'LabGrown') as 'LabGrown' | 'Natural',
    supplierId: initialData?.supplierId || 0,
    supplierInvoiceNo: initialData?.supplierInvoiceNo || '',
    shipToId: companyBuyer.id,
    billToId: companyBuyer.id,
    sellerGstin: initialData?.sellerGstin || '',
    sellerPan: initialData?.sellerPan || '',
    terms: initialData?.terms || 'CREDIT',
    bankerName: initialData?.bankerName || '',
    accountNo: initialData?.accountNo || '',
    ifsc: initialData?.ifsc || '',
    swiftCode: initialData?.swiftCode || '',
    declarationText: initialData?.declarationText || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [summary, setSummary] = useState({
    taxableAmount: initialData?.taxableAmount || 0, cgstTotal: initialData?.cgstTotal || 0, sgstTotal: initialData?.sgstTotal || 0, igstTotal: initialData?.igstTotal || 0,
    totalTax: initialData?.totalTax || 0, amountAfterTax: initialData?.amountAfterTax || 0, roundOff: initialData?.roundOff || 0, totalValue: initialData?.totalValue || 0, totalWords: initialData?.totalWords || ''
  })

  const lastDiamondTypeRef = useRef(formData.diamondType)

  // Init date + first line item on client if not editing, check draft
  useEffect(() => {
    if (!initialData) {
      const savedDraft = localStorage.getItem('purchase-invoice-draft')
      if (savedDraft) {
        try {
          const { formData: savedFormData, lineItems: savedLineItems, step: savedStep } = JSON.parse(savedDraft)
          if (savedFormData) {
            // Always keep company buyer IDs fresh
            setFormData({ ...savedFormData, shipToId: companyBuyer.id, billToId: companyBuyer.id })
            lastDiamondTypeRef.current = savedFormData.diamondType
          }
          if (savedLineItems) setLineItems(savedLineItems)
          if (savedStep) setStep(savedStep)
          setHasRestoredDraft(true)
          return
        } catch (e) {
          console.error('Failed to parse draft', e)
        }
      }

      setFormData(prev => ({ ...prev, date: format(new Date(), 'yyyy-MM-dd') }))
      setLineItems([{
        id: Math.random().toString(),
        description: 'LABORATORY GROWN CUT & POLISH DIAMOND',
        hsn: '71049120', quantity: 0, rate: 0, discount: 0,
        taxableValue: 0, cgstRate: 0.75, cgstAmount: 0,
        sgstRate: 0.75, sgstAmount: 0, igstRate: 1.5, igstAmount: 0, total: 0
      }])
    } else {
      setLineItems(initialData?.lineItems || [])
    }
  }, [initialData, companyBuyer.id])

  // Save draft to localStorage on changes
  useEffect(() => {
    if (!initialData && lineItems.length > 0) {
      localStorage.setItem('purchase-invoice-draft', JSON.stringify({
        formData,
        lineItems,
        step
      }))
    }
  }, [formData, lineItems, step, initialData])

  const handleResetForm = () => {
    if (confirm('Are you sure you want to reset the form? All current progress will be lost.')) {
      localStorage.removeItem('purchase-invoice-draft')
      setHasRestoredDraft(false)
      setStep(1)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'Intra',
        diamondType: 'LabGrown',
        supplierId: 0,
        supplierInvoiceNo: '',
        shipToId: companyBuyer.id,
        billToId: companyBuyer.id,
        sellerGstin: '',
        sellerPan: '',
        terms: 'CREDIT',
        bankerName: '',
        accountNo: '',
        ifsc: '',
        swiftCode: '',
        declarationText: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      })
      setLineItems([{
        id: Math.random().toString(),
        description: 'LABORATORY GROWN CUT & POLISH DIAMOND',
        hsn: '71049120', quantity: 0, rate: 0, discount: 0,
        taxableValue: 0, cgstRate: 0.75, cgstAmount: 0,
        sgstRate: 0.75, sgstAmount: 0, igstRate: 1.5, igstAmount: 0, total: 0
      }])
    }
  }

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
    if (lastDiamondTypeRef.current !== formData.diamondType) {
      lastDiamondTypeRef.current = formData.diamondType
      const desc = formData.diamondType === 'LabGrown'
        ? 'LABORATORY GROWN CUT & POLISH DIAMOND'
        : 'CUT & POLISHED NATURAL DIAMOND'
      setLineItems(prev => prev.map(item => ({ ...item, description: desc })))
    }
  }, [formData.diamondType])

  // Calculation
  useEffect(() => {
    let taxableAmount = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0
    const r2 = (v: number) => Math.round(v * 100) / 100

    const updatedItems = lineItems.map(item => {
      const taxable = r2((item.quantity * item.rate) - (formData.type === 'Inter' ? (item.discount || 0) : 0))
      let cgst = 0, sgst = 0, igst = 0
      if (formData.type === 'Intra') {
        igst = r2((taxable * (item.igstRate || 0)) / 100)
      } else {
        cgst = r2((taxable * (item.cgstRate || 0)) / 100)
        sgst = r2((taxable * (item.sgstRate || 0)) / 100)
      }
      const total = r2(taxable + cgst + sgst + igst)
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

    const totalTax = r2(cgstTotal + sgstTotal + igstTotal)
    const amountAfterTax = r2(taxableAmount + totalTax)
    const totalValue = Math.round(amountAfterTax)
    const roundOff = r2(totalValue - amountAfterTax)
    const words = toWords(Math.max(totalValue, 0))

    setSummary({
      taxableAmount: r2(taxableAmount), cgstTotal: r2(cgstTotal), sgstTotal: r2(sgstTotal), igstTotal: r2(igstTotal), totalTax, amountAfterTax, roundOff, totalValue,
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
    if (!formData.supplierId) { alert('Please select a supplier'); setLoading(false); return }
    try {
      if (invoiceId) {
        await updatePurchaseInvoice(invoiceId, { ...formData, ...summary, lineItems })
        router.push(`/purchase-invoices/view/${invoiceId}`)
      } else {
        const res = await createPurchaseInvoice({ ...formData, ...summary, lineItems })
        localStorage.removeItem('purchase-invoice-draft')
        router.push(`/purchase-invoices/view/${res.id}`)
      }
    } catch {
      alert('Failed to save purchase invoice')
      setLoading(false)
    }
  }

  const selectedSupplier = supplierList.find(s => s.id === formData.supplierId)

  // History chips for completed steps
  const stepSelections: Record<number, string> = {
    1: formData.type === 'Intra' ? 'Intra (IGST)' : 'Inter (CGST+SGST)',
    2: formData.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond',
    3: selectedSupplier ? `From: ${selectedSupplier.name}` : '',
    4: `${lineItems.length} item(s)`,
    5: summary.totalValue > 0 ? `₹${summary.totalValue.toLocaleString()}` : '',
  }

  const isIGST = formData.type === 'Intra'

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

      {/* Company Buyer Info Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'rgba(34, 197, 94, 0.05)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <span style={{ fontSize: '1.1rem' }}>🏢</span>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{companyBuyer.name}</span>
          <span style={{ marginLeft: '0.5rem' }}>— GSTIN: {companyBuyer.gstin} | {companyBuyer.city}, {companyBuyer.state}</span>
          <span style={{ marginLeft: '0.5rem', color: 'rgba(34,197,94,0.9)', fontWeight: 500 }}>• Bill To &amp; Ship To (Company)</span>
        </div>
      </div>

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
                  <span className="radio-desc">LABORATORY GROWN CUT &amp; POLISH DIAMOND — Invoice: P-LGD</span>
                </div>
              </label>
              <label className="radio-card">
                <input type="radio" name="diamondType" value="Natural" checked={formData.diamondType === 'Natural'}
                  onChange={e => setFormData({ ...formData, diamondType: e.target.value as any })} />
                <div className="radio-content">
                  <span className="radio-title">Natural Diamond</span>
                  <span className="radio-desc">CUT &amp; POLISHED NATURAL DIAMOND — Invoice: P-NS</span>
                </div>
              </label>
            </div>
          </section>
        )}

        {/* ── Step 3: Supplier + Date + Terms ─────────────────────────────── */}
        {step === 3 && (
          <section className="step-section">
            <h2>Supplier Details</h2>
            <div className="form-grid">
              {/* Supplier */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Supplier (From Whom Purchase)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select className="form-input" value={formData.supplierId}
                    onChange={e => setFormData({ ...formData, supplierId: parseInt(e.target.value) })} style={{ flex: 1 }}>
                    <option value={0}>Select Supplier</option>
                    {supplierList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => {
                    setNewSupplier({ name: '', address: '', city: '', state: 'Gujarat', stateCode: '24', gstin: '', pan: '', bankerName: '', accountNo: '', ifsc: '', swiftCode: '' })
                    setShowSupplierModal(true)
                  }} style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={14} /> Create
                  </button>
                </div>
                {selectedSupplier && (
                  <div className="selection-preview">
                    <p><strong>{selectedSupplier.address}</strong></p>
                    <p>{selectedSupplier.city}, {selectedSupplier.state} ({selectedSupplier.stateCode})</p>
                    <p>GSTIN: {selectedSupplier.gstin} &nbsp;|&nbsp; PAN: {selectedSupplier.pan}</p>
                    {selectedSupplier.bankerName && (
                      <p className="mt-1 text-xs text-gray-600">Bank: {selectedSupplier.bankerName} — A/c: {selectedSupplier.accountNo} | IFSC: {selectedSupplier.ifsc}</p>
                    )}
                  </div>
                )}
                {supplierList.length === 0 && (
                  <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    No suppliers found. <a href="/purchase-suppliers/create" style={{ color: 'var(--accent)' }}>Add one first →</a>
                  </p>
                )}
              </div>

              {/* Invoice Date */}
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

              {/* Supplier Invoice Number */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Supplier Invoice Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.supplierInvoiceNo}
                  onChange={e => setFormData({ ...formData, supplierInvoiceNo: e.target.value })}
                  placeholder="Enter Supplier Invoice Number (e.g. INV-2026-001)"
                />
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
              {formData.supplierInvoiceNo && (
                <div className="summary-row" style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <span>Supplier Invoice No:</span>
                  <span style={{ fontWeight: 600 }}>{formData.supplierInvoiceNo}</span>
                </div>
              )}
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

      </div>

      {/* Navigation */}
      <div className="form-navigation">
        <div className="form-navigation-inner">
          <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1 || loading} className="btn btn-outline">
            <ChevronLeft size={20} /> Previous
          </button>
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={() => setStep(s => s + 1)} className="btn btn-primary">
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} className="btn btn-success"
              disabled={loading || !formData.supplierId}>
              <Save size={20} /> {loading ? 'Saving...' : 'Generate Purchase Invoice'}
            </button>
          )}
        </div>
      </div>

      {/* Inline Supplier Creation Modal */}
      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Create Supplier</h3>
              <button type="button" className="icon-btn" onClick={() => setShowSupplierModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setSupplierModalLoading(true)
              try {
                const created = await createSupplier(newSupplier)
                if (created) {
                  setSupplierList(prev => [...prev, created])
                  setFormData(prev => ({ ...prev, supplierId: created.id, sellerGstin: created.gstin, sellerPan: created.pan, bankerName: created.bankerName || '', accountNo: created.accountNo || '', ifsc: created.ifsc || '', swiftCode: created.swiftCode || '' }))
                }
                setShowSupplierModal(false)
              } catch {
                alert('Failed to create supplier')
              } finally {
                setSupplierModalLoading(false)
              }
            }}>
              <div className="form-grid" style={{ padding: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Supplier Name *</label>
                  <input type="text" className="form-input" required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="Supplier company name" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address *</label>
                  <textarea className="form-input" rows={2} required value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} placeholder="Full address..." />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input type="text" className="form-input" required value={newSupplier.city} onChange={e => setNewSupplier({...newSupplier, city: e.target.value})} placeholder="Surat" />
                </div>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input type="text" className="form-input" required value={newSupplier.state} onChange={e => setNewSupplier({...newSupplier, state: e.target.value})} placeholder="Gujarat" />
                </div>
                <div className="form-group">
                  <label className="form-label">State Code *</label>
                  <input type="text" className="form-input" required value={newSupplier.stateCode} onChange={e => setNewSupplier({...newSupplier, stateCode: e.target.value})} placeholder="24" />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN *</label>
                  <input type="text" className="form-input" required value={newSupplier.gstin} onChange={e => {
                    const val = e.target.value.toUpperCase()
                    if (val.length >= 15) {
                      setNewSupplier({...newSupplier, gstin: val, pan: val.substring(2, 12)})
                    } else {
                      setNewSupplier({...newSupplier, gstin: val})
                    }
                  }} placeholder="24AAAAA0000A1Z5" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">PAN *</label>
                  <input type="text" className="form-input" required value={newSupplier.pan} onChange={e => setNewSupplier({...newSupplier, pan: e.target.value.toUpperCase()})} placeholder="Auto-filled from GSTIN" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input type="text" className="form-input" value={newSupplier.bankerName} onChange={e => setNewSupplier({...newSupplier, bankerName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account No</label>
                  <input type="text" className="form-input" value={newSupplier.accountNo} onChange={e => setNewSupplier({...newSupplier, accountNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input type="text" className="form-input" value={newSupplier.ifsc} onChange={e => setNewSupplier({...newSupplier, ifsc: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">SWIFT Code</label>
                  <input type="text" className="form-input" value={newSupplier.swiftCode} onChange={e => setNewSupplier({...newSupplier, swiftCode: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '0 1.5rem 1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={supplierModalLoading}>
                  {supplierModalLoading ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
