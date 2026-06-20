import { useState, useEffect } from 'react';

type CalcType = 'add' | 'extract';
type GSTType = 'intra' | 'inter';

interface InvoiceItem {
  id: string;
  desc: string;
  hsn: string;
  qty: number;
  rate: number;
  gstRate: number;
}

interface CalculationResult {
  items: Array<InvoiceItem & { taxable: number; gstAmt: number; total: number }>;
  totalTaxable: number;
  totalGst: number;
  totalInvoice: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstType: GSTType;
  calcType: CalcType;
  isExportLUT: boolean;
}

const HSN_DIRECTORY = [
  { code: '998313', desc: 'Software Consulting', rate: 18 },
  { code: '8471', desc: 'IT Hardware & PC', rate: 18 },
  { code: '998311', desc: 'Management Consulting', rate: 18 },
  { code: '998211', desc: 'Legal Advising', rate: 18 },
  { code: '998713', desc: 'Hardware Repairing', rate: 18 },
  { code: '998314', desc: 'Data Processing/Hosting', rate: 18 },
  { code: '998341', desc: 'Design & Graphics', rate: 18 },
  { code: '999799', desc: 'General Services', rate: 18 },
];

export default function App() {
  // Navigation / Global configuration
  const [calcType, setCalcType] = useState<CalcType>('add');
  const [gstType, setGSTType] = useState<GSTType>('intra');
  const [isExportLUT, setIsExportLUT] = useState<boolean>(false);

  // Seller / Buyer details
  const [sellerName, setSellerName] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [sellerGSTIN, setSellerGSTIN] = useState<string>('');
  const [buyerGSTIN, setBuyerGSTIN] = useState<string>('');

  // Itemized Rows State
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', desc: 'Software Consulting', hsn: '998313', qty: 1, rate: 50000, gstRate: 18 }
  ]);

  // UI state
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [animate, setAnimate] = useState<boolean>(false);
  const [copyText, setCopyText] = useState<string>('⎘ Copy');

  // FAQ Active Accordion
  const [faqActive, setFaqActive] = useState<number | null>(null);
  const toggleFaq = (index: number) => {
    setFaqActive(faqActive === index ? null : index);
  };

  // Dynamic FAQ JSON-LD Injection for deep SEO
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the difference between CGST, SGST, and IGST?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For intra-state supplies (within the same state), Central GST (CGST) and State GST (SGST) are levied equally. For inter-state supplies (between different states or exports), Integrated GST (IGST) is levied as a single combined tax."
          }
        },
        {
          "@type": "Question",
          "name": "What is an HSN or SAC code?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "HSN (Harmonized System of Nomenclature) is a 6-to-8 digit code system used to classify goods for tax categorization. SAC (Services Accounting Code) is a similar system used to classify services under Indian GST."
          }
        },
        {
          "@type": "Question",
          "name": "How does export under LUT work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "LUT (Letter of Undertaking) allows registered exporters to export goods or services without paying IGST upfront. When you toggle the LUT option, the tax rate is zero-rated (0% GST) on exports."
          }
        },
        {
          "@type": "Question",
          "name": "What is the difference between inclusive and exclusive GST calculation?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Exclusive GST calculates tax on top of the base price (Total = Base + Base*Tax). Inclusive GST extracts the tax amount from a combined total price (Base = Total / (1 + Tax Rate) and Tax = Total - Base)."
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-jsonld';
    script.innerHTML = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById('faq-jsonld');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Trigger calculations on state changes
  useEffect(() => {
    runCalculations();
  }, [calcType, gstType, isExportLUT, items]);

  // Main Itemized GST Calculation Logic
  const runCalculations = () => {
    let totalTaxable = 0;
    let totalGst = 0;
    let totalInvoice = 0;

    const calculatedItems = items.map((item) => {
      const q = item.qty || 0;
      const r = item.rate || 0;
      const baseGstRate = isExportLUT ? 0 : (item.gstRate || 0);

      let taxable = 0;
      let gstAmt = 0;
      let total = 0;

      if (calcType === 'add') {
        taxable = q * r;
        gstAmt = (taxable * baseGstRate) / 100;
        total = taxable + gstAmt;
      } else {
        total = q * r;
        taxable = total / (1 + baseGstRate / 100);
        gstAmt = total - taxable;
      }

      totalTaxable += taxable;
      totalGst += gstAmt;
      totalInvoice += total;

      return {
        ...item,
        taxable,
        gstAmt,
        total,
      };
    });

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (gstType === 'intra') {
      cgst = sgst = totalGst / 2;
    } else {
      igst = totalGst;
    }

    setResult({
      items: calculatedItems,
      totalTaxable,
      totalGst,
      totalInvoice,
      cgst,
      sgst,
      igst,
      gstType,
      calcType,
      isExportLUT,
    });

    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  };

  // Add Item row
  const addItemRow = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      desc: 'General Services',
      hsn: '999799',
      qty: 1,
      rate: 10000,
      gstRate: 18,
    };
    setItems([...items, newItem]);
    showToast('Row added!');
  };

  // Remove Item row
  const removeItemRow = (id: string) => {
    if (items.length <= 1) {
      showToast('Need at least 1 row in the invoice!');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
    showToast('Row removed.');
  };

  // Update specific item cell
  const updateItemCell = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'hsn') {
            const found = HSN_DIRECTORY.find((h) => h.code === value);
            if (found) {
              updated.desc = found.desc;
              updated.gstRate = found.rate;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Number to Words Converter
  const numberToWords = (n: number): string => {
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const twoDigit = (num: number): string => {
      if (num < 20) return ones[num];
      return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    };

    const threeDigit = (num: number): string => {
      if (num >= 100) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + twoDigit(num % 100) : '');
      return twoDigit(num);
    };

    let num = Math.floor(n);
    const paise = Math.round((n - num) * 100);
    if (num === 0) return 'Zero';
    
    let resultStr = '';
    if (num >= 10000000) {
      resultStr += threeDigit(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    if (num >= 100000) {
      resultStr += threeDigit(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      resultStr += threeDigit(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    if (num > 0) {
      resultStr += threeDigit(num);
    }
    if (paise > 0) {
      resultStr += ' and ' + twoDigit(paise) + ' Paise';
    }
    return resultStr.trim();
  };

  const handleReset = () => {
    setItems([{ id: '1', desc: 'Software Consulting', hsn: '998313', qty: 1, rate: 50000, gstRate: 18 }]);
    setSellerName('');
    setBuyerName('');
    setSellerGSTIN('');
    setBuyerGSTIN('');
    setIsExportLUT(false);
    setGSTType('intra');
    setCalcType('add');
    setShowInvoice(false);
    showToast('Forms cleared.');
  };

  const handleCopy = () => {
    if (!result) return;
    let txt = `GST Calculation Invoice Summary\n----------------------------\n`;
    txt += `Total Taxable: ₹${result.totalTaxable.toFixed(0)}\n`;
    if (result.isExportLUT) {
      txt += `Zero-Rated (LUT Export)\n`;
    } else {
      txt += `Total GST Amt: ₹${result.totalGst.toFixed(0)}\n`;
      if (result.gstType === 'intra') {
        txt += `CGST:          ₹${result.cgst.toFixed(0)}\n`;
        txt += `SGST:          ₹${result.sgst.toFixed(0)}\n`;
      } else {
        txt += `IGST:          ₹${result.igst.toFixed(0)}\n`;
      }
    }
    txt += `----------------------------\n`;
    txt += `Net Total:     ₹${result.totalInvoice.toFixed(0)}\n\n`;
    txt += `Phulkeshwar Mahto | phulkeshwar.e@gmail.com\n`;
    txt += `Built for Digital Heroes: https://digitalheroesco.com`;

    navigator.clipboard.writeText(txt).then(() => {
      setCopyText('✓ Copied!');
      setTimeout(() => setCopyText('⎘ Copy'), 2000);
    });
  };

  const handleDownload = () => {
    if (!result) return;
    let txt = `GST Calculation Invoice Summary\n----------------------------\n`;
    txt += `Total Taxable: ₹${result.totalTaxable.toFixed(0)}\n`;
    if (result.isExportLUT) {
      txt += `Zero-Rated (LUT Export)\n`;
    } else {
      txt += `Total GST Amt: ₹${result.totalGst.toFixed(0)}\n`;
      if (result.gstType === 'intra') {
        txt += `CGST:          ₹${result.cgst.toFixed(0)}\n`;
        txt += `SGST:          ₹${result.sgst.toFixed(0)}\n`;
      } else {
        txt += `IGST:          ₹${result.igst.toFixed(0)}\n`;
      }
    }
    txt += `----------------------------\n`;
    txt += `Net Total:     ₹${result.totalInvoice.toFixed(0)}\n\n`;
    txt += `Phulkeshwar Mahto | phulkeshwar.e@gmail.com\n`;
    txt += `Built for Digital Heroes: https://digitalheroesco.com`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gst_invoice_report.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const showToast = (msg: string) => {
    const el = document.getElementById('toast-banner');
    if (el) {
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 2000);
    }
  };

  const now = new Date();
  const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const dueDateStr = new Date(now.getTime() + 30 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      {/* HEADER */}
      <header>
        <div className="logo">
          <span>₹ GST Calc</span>
          <span className="logo-badge">PRO</span>
        </div>

        {/* GitHub Link */}
        <a href="https://github.com/phulkeshwar/GSTcalculator" target="_blank" rel="noopener noreferrer" className="github-btn" style={{ margin: '0 auto 0 24px' }}>
          <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: 'currentColor' }}><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          <span>GitHub</span>
        </a>

        <div className="author-chip">
          By <strong>Phulkeshwar Mahto</strong> &nbsp;·&nbsp; 
          <a href="mailto:phulkeshwar.e@gmail.com">phulkeshwar.e@gmail.com</a>
        </div>
      </header>

      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">Enterprise Invoice Suite · FY 2025–26</div>
        <h1>Itemized <span>GST Invoice</span> &amp;<br />Tax Split Engine</h1>
        <p>
          Add billing items, map HSN codes, toggle export LUT exemptions, and generate professional compliant PDF receipts.
        </p>
      </div>

      {/* MAIN CONTAINER */}
      <main className="main">
        <div className="calculator-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
          
          {/* LEFT: ITEM DIALOG */}
          <div className="card">
            <div className="card-title">Billing Items Matrix</div>

            {/* Config controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="field">
                <label>Billing Calculation</label>
                <div className="toggle-row">
                  <button
                    type="button"
                    className={`toggle-btn ${calcType === 'add' ? 'active' : ''}`}
                    onClick={() => setCalcType('add')}
                  >
                    Excl. GST (Rates + Tax)
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${calcType === 'extract' ? 'active' : ''}`}
                    onClick={() => setCalcType('extract')}
                  >
                    Incl. GST (Extract Tax)
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Tax Scope</label>
                <div className="toggle-row">
                  <button
                    type="button"
                    className={`toggle-btn ${gstType === 'intra' ? 'active' : ''}`}
                    disabled={isExportLUT}
                    onClick={() => setGSTType('intra')}
                  >
                    Intra (CGST+SGST)
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${gstType === 'inter' ? 'active' : ''}`}
                    disabled={isExportLUT}
                    onClick={() => setGSTType('inter')}
                  >
                    Inter (IGST)
                  </button>
                </div>
              </div>
            </div>

            {/* LUT Toggle */}
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={isExportLUT}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsExportLUT(checked);
                  if (checked) {
                    setGSTType('inter'); // LUT is Export, which is IGST category but zero rated
                  }
                }}
              />
              <span className="checkbox-label">Mark as Export under LUT (Letter of Undertaking) - 0% Tax</span>
            </label>

            {/* Itemized Grid Table */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="item-table" style={{ minWidth: '650px' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '220px' }}>Desc</th>
                    <th style={{ width: '150px' }}>HSN</th>
                    <th style={{ width: '70px' }}>Qty</th>
                    <th style={{ width: '110px' }}>Rate (₹)</th>
                    <th style={{ width: '90px' }}>Tax %</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          className="item-row-input"
                          placeholder="e.g. Software Consulting"
                          value={item.desc}
                          onChange={(e) => updateItemCell(item.id, 'desc', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="item-row-input"
                          value={item.hsn}
                          onChange={(e) => updateItemCell(item.id, 'hsn', e.target.value)}
                        >
                          <option value="">Custom...</option>
                          {HSN_DIRECTORY.map((h) => (
                            <option key={h.code} value={h.code}>
                              {h.code} ({h.desc})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="item-row-input"
                          min="1"
                          placeholder="1"
                          value={item.qty || ''}
                          onChange={(e) => updateItemCell(item.id, 'qty', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="item-row-input"
                          min="0"
                          placeholder="Rate"
                          value={item.rate || ''}
                          onChange={(e) => updateItemCell(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <select
                          className="item-row-input"
                          disabled={isExportLUT}
                          value={item.gstRate}
                          onChange={(e) => updateItemCell(item.id, 'gstRate', parseInt(e.target.value) || 0)}
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-remove-row"
                          onClick={() => removeItemRow(item.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn-add-item" onClick={addItemRow}>
              + Add Item Row
            </button>

            {/* Metadata Information fields */}
            <div className="card-title" style={{ marginTop: '24px', marginBottom: '16px' }}>Invoice Metadata</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="field">
                <label>Billed By (Seller)</label>
                <input
                  type="text"
                  placeholder="Seller Company"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Seller GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 29AAAAA1111A1Z1"
                  value={sellerGSTIN}
                  onChange={(e) => setSellerGSTIN(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Billed To (Buyer)</label>
                <input
                  type="text"
                  placeholder="Buyer Company"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Buyer GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 29BBBBB2222B2Z2"
                  value={buyerGSTIN}
                  onChange={(e) => setBuyerGSTIN(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="calc-btn"
              onClick={() => {
                setShowInvoice(true);
                setTimeout(() => {
                  document.getElementById('invoice-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              Generate Tax Invoice Preview
            </button>
          </div>

          {/* RIGHT: RESULTS SUMMARY PANEL */}
          <div className="card result-panel">
            <div className="card-title">Invoice Aggregates</div>

            {result && (
              <div className="animate-in">
                <div className={`result-main ${animate ? 'pulse' : ''}`}>
                  <div className="result-label">
                    Net Invoice Total (INR)
                  </div>
                  <div className="result-amount">
                    ₹{result.totalInvoice.toFixed(0)}
                  </div>
                </div>

                <ul className="breakdown-list">
                  <li className="breakdown-item">
                    <span className="b-label">Total Taxable Value</span>
                    <span className="b-value">₹{result.totalTaxable.toFixed(0)}</span>
                  </li>

                  {result.isExportLUT ? (
                    <li className="breakdown-item">
                      <span className="b-label" style={{ color: 'var(--accent)' }}>Export LUT Exemption</span>
                      <span className="b-value" style={{ color: 'var(--accent)' }}>₹0 (0% Tax)</span>
                    </li>
                  ) : (
                    <>
                      <li className="breakdown-item">
                        <span className="b-label">Combined GST Taxes</span>
                        <span className="b-value">₹{result.totalGst.toFixed(0)}</span>
                      </li>
                      {result.gstType === 'intra' ? (
                        <>
                          <li className="breakdown-item">
                            <span className="b-label">Central GST (CGST)</span>
                            <span className="b-value">₹{result.cgst.toFixed(0)}</span>
                          </li>
                          <li className="breakdown-item">
                            <span className="b-label">State GST (SGST)</span>
                            <span className="b-value">₹{result.sgst.toFixed(0)}</span>
                          </li>
                        </>
                      ) : (
                        <li className="breakdown-item">
                          <span className="b-label">Integrated GST (IGST)</span>
                          <span className="b-value">₹{result.igst.toFixed(0)}</span>
                        </li>
                      )}
                    </>
                  )}

                  <li className="breakdown-item highlight">
                    <span className="b-label">Final Receivable Value</span>
                    <span className="b-value">₹{result.totalInvoice.toFixed(0)}</span>
                  </li>
                </ul>

                <div className="tag-row">
                  <span className="tag active-tag">
                    {result.isExportLUT ? 'LUT EXPORT' : result.gstType === 'intra' ? 'INTRADOMESTIC (CGST+SGST)' : 'INTERSTATE (IGST)'}
                  </span>
                  <span className="tag">FY 2025–26</span>
                  <span className="tag">{result.items.length} Items</span>
                </div>

                <div className="tools-row">
                  <button type="button" className="tool-btn" onClick={handleReset}>
                    ↺ Reset Form
                  </button>
                  <button type="button" className="tool-btn" onClick={handleCopy}>
                    {copyText}
                  </button>
                  <button type="button" className="tool-btn" onClick={handleDownload} style={{ background: 'var(--accent)', color: '#fff' }}>
                    💾 Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM INVOICE PREVIEW */}
        {showInvoice && result && (
          <div className="invoice-section" id="invoice-section">
            <div className="card" style={{ padding: 0 }}>
              <div
                style={{
                  padding: '20px 24px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div className="card-title" style={{ margin: 0 }}>
                  Invoice Sheet
                </div>
                <div className="tools-row" style={{ margin: 0 }}>
                  <button type="button" className="tool-btn" onClick={handleDownload}>
                    💾 Download Invoice
                  </button>
                  <button type="button" className="tool-btn print-btn" onClick={() => window.print()}>
                    🖨 Print Invoice PDF
                  </button>
                  <button type="button" className="tool-btn" onClick={() => setShowInvoice(false)}>
                    ✕ Close Preview
                  </button>
                </div>
              </div>

              <div className="invoice-card" style={{ margin: '16px' }}>
                <div className="invoice-header">
                  <div>
                    <h2>{result.isExportLUT ? 'ZERO-RATED EXPORT INVOICE' : 'TAX INVOICE'}</h2>
                    <div className="inv-no">{invoiceNumber}</div>
                  </div>
                  <div className="invoice-date">
                    <div>
                      <strong>Date:</strong> {dateStr}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <strong>Terms:</strong> Net 30 ({dueDateStr})
                    </div>
                  </div>
                </div>
                <div className="invoice-body">
                  <div className="invoice-parties">
                    <div className="party-block">
                      <h4>Billed By (Seller)</h4>
                      <p>{sellerName || 'Your Company'}</p>
                      <div className="gstin">GSTIN: {sellerGSTIN || '—'}</div>
                    </div>
                    <div className="party-block" style={{ textAlign: 'right' }}>
                      <h4>Billed To (Buyer)</h4>
                      <p>{buyerName || 'Client Name'}</p>
                      <div className="gstin">GSTIN: {buyerGSTIN || '—'}</div>
                    </div>
                  </div>

                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Description</th>
                        <th>HSN/SAC</th>
                        <th>Qty</th>
                        <th className="num">Unit Price (₹)</th>
                        <th className="num">Tax Rate</th>
                        <th className="num">Taxable Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.desc}</td>
                          <td>{item.hsn || '—'}</td>
                          <td>{item.qty}</td>
                          <td className="num">₹{item.rate.toFixed(0)}</td>
                          <td className="num">{result.isExportLUT ? 'LUT (0%)' : `${item.gstRate}%`}</td>
                          <td className="num">₹{item.taxable.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'right', color: 'var(--text-sec)', fontSize: '0.82rem' }}>
                          Gross Taxable Subtotal
                        </td>
                        <td className="num">₹{result.totalTaxable.toFixed(0)}</td>
                      </tr>
                      {result.isExportLUT ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'right', color: 'var(--accent)', fontSize: '0.82rem' }}>
                            Zero-rated supply under LUT
                          </td>
                          <td className="num">₹0</td>
                        </tr>
                      ) : (
                        <>
                          {result.gstType === 'intra' ? (
                            <>
                              <tr>
                                <td colSpan={6} style={{ textAlign: 'right', color: 'var(--text-sec)', fontSize: '0.82rem' }}>
                                  CGST Breakdown
                                </td>
                                <td className="num">₹{result.cgst.toFixed(0)}</td>
                              </tr>
                              <tr>
                                <td colSpan={6} style={{ textAlign: 'right', color: 'var(--text-sec)', fontSize: '0.82rem' }}>
                                  SGST Breakdown
                                </td>
                                <td className="num">₹{result.sgst.toFixed(0)}</td>
                              </tr>
                            </>
                          ) : (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'right', color: 'var(--text-sec)', fontSize: '0.82rem' }}>
                                IGST Breakdown
                              </td>
                              <td className="num">₹{result.igst.toFixed(0)}</td>
                            </tr>
                          )}
                        </>
                      )}
                      <tr className="total-row">
                        <td colSpan={6} style={{ textAlign: 'right' }}>
                          RECEIVABLE INVOICE VALUE (INR)
                        </td>
                        <td className="num">₹{result.totalInvoice.toFixed(0)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="inv-note">
                    <strong>Total In Words:</strong> Rupees {numberToWords(result.totalInvoice)} Only.
                    <br />
                    <span style={{ marginTop: '6px', display: 'block', fontSize: '0.72rem' }}>
                      {result.isExportLUT && 'Supply meant for export under Letter of Undertaking without payment of integrated tax. '}
                      This is an electronic business invoice calculated under India GST rules. No signature required.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ SECTION */}
        <div className="card faq-card" style={{ gridColumn: 'span 2', marginTop: '24px' }}>
          <div className="card-title">❓ Frequently Asked Questions (FAQ)</div>
          <div className="faq-list">
            {[
              {
                q: "What is the difference between CGST, SGST, and IGST?",
                a: "For intra-state supplies (within the same state), Central GST (CGST) and State GST (SGST) are levied equally. For inter-state supplies (between different states or exports), Integrated GST (IGST) is levied as a single combined tax."
              },
              {
                q: "What is an HSN or SAC code?",
                a: "HSN (Harmonized System of Nomenclature) is a 6-to-8 digit code system used to classify goods for tax categorization. SAC (Services Accounting Code) is a similar system used to classify services under Indian GST."
              },
              {
                q: "How does export under LUT work?",
                a: "LUT (Letter of Undertaking) allows registered exporters to export goods or services without paying IGST upfront. When you toggle the LUT option, the tax rate is zero-rated (0% GST) on exports."
              },
              {
                q: "What is the difference between inclusive and exclusive GST calculation?",
                a: "Exclusive GST calculates tax on top of the base price (Total = Base + Base*Tax). Inclusive GST extracts the tax amount from a combined total price (Base = Total / (1 + Tax Rate) and Tax = Total - Base)."
              }
            ].map((item, index) => (
              <div key={index} className={`faq-item ${faqActive === index ? 'active' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={faqActive === index}
                >
                  <span>{item.q}</span>
                  <span className="faq-icon">{faqActive === index ? '−' : '+'}</span>
                </button>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer>
        <p className="footer-author">
          Built by <strong>Phulkeshwar Mahto</strong> &nbsp;·&nbsp; 
          <a href="mailto:phulkeshwar.e@gmail.com">phulkeshwar.e@gmail.com</a>
          &nbsp;·&nbsp; B.Tech CSE · NIAMT Ranchi · Founder, Garam Softwares
        </p>
        <a className="dh-btn" href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Built for Digital Heroes
        </a>
      </footer>

      {/* TOAST SYSTEM */}
      <div className="toast" id="toast-banner"></div>
    </>
  );
}
