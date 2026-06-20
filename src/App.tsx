import { useState, useEffect } from 'react';

type CalcType = 'add' | 'extract';
type GSTType = 'intra' | 'inter';

interface CalculationResult {
  base: number;
  gstAmt: number;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
  rate: number;
  gstType: GSTType;
  calcType: CalcType;
}

export default function App() {
  // Form State
  const [calcType, setCalcType] = useState<CalcType>('add');
  const [gstType, setGSTType] = useState<GSTType>('intra');
  const [amount, setAmount] = useState<number | ''>('');
  const [gstRate, setGstRate] = useState<number>(12);
  const [customRate, setCustomRate] = useState<number | ''>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [itemDesc, setItemDesc] = useState<string>('');
  const [sellerName, setSellerName] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');

  // UI state
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [animate, setAnimate] = useState<boolean>(false);
  const [copyText, setCopyText] = useState<string>('⎘ Copy');

  // Trigger calculations on state changes
  useEffect(() => {
    runCalculation();
  }, [calcType, gstType, amount, gstRate, customRate, showCustomInput]);

  // Main GST Calculation Logic
  const runCalculation = () => {
    const rawAmt = typeof amount === 'number' ? amount : 0;
    if (rawAmt <= 0) {
      setResult(null);
      return;
    }

    const rate = showCustomInput ? (typeof customRate === 'number' ? customRate : 0) : gstRate;

    let base = 0;
    let gstAmt = 0;
    let total = 0;

    if (calcType === 'add') {
      base = rawAmt;
      gstAmt = (base * rate) / 100;
      total = base + gstAmt;
    } else {
      total = rawAmt;
      base = total / (1 + rate / 100);
      gstAmt = total - base;
    }

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (gstType === 'intra') {
      cgst = sgst = gstAmt / 2;
    } else {
      igst = gstAmt;
    }

    setResult({
      base,
      gstAmt,
      total,
      cgst,
      sgst,
      igst,
      rate,
      gstType,
      calcType,
    });

    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  };

  // Indian Number-to-Words Conversion Function
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
    
    let result = '';
    if (num >= 10000000) {
      result += threeDigit(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    if (num >= 100000) {
      result += threeDigit(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      result += threeDigit(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    if (num > 0) {
      result += threeDigit(num);
    }
    if (paise > 0) {
      result += ' and ' + twoDigit(paise) + ' Paise';
    }
    return result.trim();
  };

  // Reset Form Inputs
  const handleReset = () => {
    setAmount('');
    setItemDesc('');
    setSellerName('');
    setBuyerName('');
    setCustomRate('');
    setShowCustomInput(false);
    setGstRate(12);
    setResult(null);
    setShowInvoice(false);
  };

  // Copy Results to Clipboard
  const handleCopy = () => {
    if (!result) return;
    let txt = `GST Calculation\n----------------------------\n`;
    txt += `Base Amount:   ₹${result.base.toFixed(2)}\n`;
    txt += `GST @ ${result.rate}%:   ₹${result.gstAmt.toFixed(2)}\n`;
    if (result.gstType === 'intra') {
      txt += `CGST @ ${(result.rate / 2).toFixed(2)}%: ₹${result.cgst.toFixed(2)}\n`;
      txt += `SGST @ ${(result.rate / 2).toFixed(2)}%: ₹${result.sgst.toFixed(2)}\n`;
    } else {
      txt += `IGST @ ${result.rate}%:  ₹${result.igst.toFixed(2)}\n`;
    }
    txt += `----------------------------\nTotal:         ₹${result.total.toFixed(2)}\n`;
    txt += `\nCalculated at gstcalc.vercel.app`;
    
    navigator.clipboard.writeText(txt).then(() => {
      setCopyText('✓ Copied!');
      setTimeout(() => setCopyText('⎘ Copy'), 2000);
    });
  };

  // Generate and Display Invoice
  const handleInvoicePreview = () => {
    if (!result) {
      // Focus amount input to show error
      const el = document.getElementById('amount');
      if (el) {
        el.style.borderColor = '#ef4444';
        el.focus();
        setTimeout(() => (el.style.borderColor = ''), 1200);
      }
      return;
    }
    setShowInvoice(true);
    setTimeout(() => {
      const sec = document.getElementById('invoice-section');
      if (sec) {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Print Invoice
  const handlePrint = () => {
    window.print();
  };

  const now = new Date();
  const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const dueDateStr = new Date(now.getTime() + 30 * 86400000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      {/* HEADER */}
      <header>
        <div className="logo">
          <span>₹ GST Calc</span>
          <span className="logo-badge">FREE</span>
        </div>
        <div className="author-chip">
          By <strong>Phulkeshwar Mahto</strong> &nbsp;·&nbsp; 
          <a href="mailto:phulkeshwarmahto@gmail.com">phulkeshwarmahto@gmail.com</a>
        </div>
      </header>

      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">India GST Tool · FY 2025–26</div>
        <h1>Calculate GST &amp; <span>Invoice Total</span><br />in Seconds</h1>
        <p>
          Enter any amount, pick a GST rate — get CGST, SGST, IGST, and a print-ready invoice. No signup, no ads, completely free.
        </p>
      </div>

      {/* MAIN CONTAINER */}
      <main className="main">
        <div className="calculator-grid">
          
          {/* LEFT: INPUT CARD */}
          <div className="card">
            <div className="card-title">Invoice Details</div>

            {/* Calculation Type Toggle */}
            <div className="field">
              <label>Calculate</label>
              <div className="toggle-row">
                <button
                  type="button"
                  className={`toggle-btn ${calcType === 'add' ? 'active' : ''}`}
                  onClick={() => setCalcType('add')}
                >
                  Add GST to amount
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${calcType === 'extract' ? 'active' : ''}`}
                  onClick={() => setCalcType('extract')}
                >
                  Extract GST from total
                </button>
              </div>
            </div>

            {/* GST Type Toggle */}
            <div className="field">
              <label>GST Type</label>
              <div className="toggle-row">
                <button
                  type="button"
                  className={`toggle-btn ${gstType === 'intra' ? 'active' : ''}`}
                  onClick={() => setGSTType('intra')}
                >
                  Intra-state (CGST + SGST)
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${gstType === 'inter' ? 'active' : ''}`}
                  onClick={() => setGSTType('inter')}
                >
                  Inter-state (IGST)
                </button>
              </div>
            </div>

            {/* Amount Field */}
            <div className="field">
              <label htmlFor="amount">
                {calcType === 'add' ? 'Base Amount (₹, excl. GST)' : 'Total Amount (₹, incl. GST)'}
              </label>
              <div className="prefix-wrap">
                <span className="prefix">₹</span>
                <input
                  id="amount"
                  type="number"
                  placeholder="e.g. 10000"
                  min="0"
                  step="0.01"
                  value={amount === '' ? '' : amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAmount(val === '' ? '' : parseFloat(val));
                  }}
                />
              </div>
            </div>

            {/* GST Rate Preset Grid */}
            <div className="field">
              <label>GST Rate</label>
              <div className="gst-rate-grid">
                {[0, 0.1, 0.25, 3, 5, 12, 18, 28].map((rateOption) => (
                  <button
                    key={rateOption}
                    type="button"
                    className={`rate-btn ${!showCustomInput && gstRate === rateOption ? 'active' : ''}`}
                    onClick={() => {
                      setShowCustomInput(false);
                      setGstRate(rateOption);
                    }}
                  >
                    {rateOption}%
                  </button>
                ))}
                <button
                  type="button"
                  className={`rate-btn custom-rate-btn ${showCustomInput ? 'active' : ''}`}
                  onClick={() => setShowCustomInput(true)}
                >
                  Custom
                </button>
              </div>

              {showCustomInput && (
                <input
                  type="number"
                  id="custom-rate"
                  placeholder="Enter custom %"
                  min="0"
                  max="100"
                  step="0.01"
                  style={{ display: 'block', marginTop: '8px' }}
                  value={customRate === '' ? '' : customRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomRate(val === '' ? '' : parseFloat(val));
                  }}
                />
              )}
            </div>

            {/* Optional Fields (Invoice Metadata) */}
            <div className="field">
              <label htmlFor="item-desc">
                Item / Service Description <span style={{ color: 'var(--text-mute)' }}>(optional, for invoice)</span>
              </label>
              <input
                id="item-desc"
                type="text"
                placeholder="e.g. Web Development Services"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="seller-name">
                Seller Name <span style={{ color: 'var(--text-mute)' }}>(optional)</span>
              </label>
              <input
                id="seller-name"
                type="text"
                placeholder="Your company / name"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="buyer-name">
                Buyer / Client Name <span style={{ color: 'var(--text-mute)' }}>(optional)</span>
              </label>
              <input
                id="buyer-name"
                type="text"
                placeholder="Client company / name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>

            <button type="button" className="calc-btn" onClick={handleInvoicePreview}>
              Calculate GST →
            </button>
          </div>

          {/* RIGHT: RESULTS PANEL */}
          <div className="card result-panel" id="result-panel">
            <div className="card-title">Breakdown</div>

            {/* Placeholder state */}
            {!result && (
              <div className="placeholder-state" id="placeholder">
                <div className="big-icon">🧾</div>
                <p>
                  Enter an amount and hit <strong style={{ color: 'var(--text-sec)' }}>Calculate GST</strong> to see the full breakdown here.
                </p>
              </div>
            )}

            {/* Results Content */}
            {result && (
              <div id="result-content" className="animate-in">
                <div className={`result-main ${animate ? 'pulse' : ''}`} id="result-main-box">
                  <div className="result-label" id="result-label">
                    {result.calcType === 'add' ? 'Total Invoice Amount (incl. GST)' : 'Base Amount (excl. GST)'}
                  </div>
                  <div className="result-amount" id="total-display">
                    ₹{result.calcType === 'add' ? result.total.toFixed(2) : result.base.toFixed(2)}
                  </div>
                </div>

                <ul className="breakdown-list" id="breakdown-list">
                  <li className="breakdown-item">
                    <span className="b-label">
                      {result.calcType === 'add' ? 'Base Amount' : 'You Entered (incl. GST)'}
                    </span>
                    <span className="b-value">
                      ₹{result.calcType === 'add' ? result.base.toFixed(2) : result.total.toFixed(2)}
                    </span>
                  </li>
                  <li className="breakdown-item">
                    <span className="b-label">GST @ {result.rate}%</span>
                    <span className="b-value">₹{result.gstAmt.toFixed(2)}</span>
                  </li>
                  
                  {result.gstType === 'intra' ? (
                    <>
                      <li className="breakdown-item">
                        <span className="b-label">CGST @ {(result.rate / 2).toFixed(2)}%</span>
                        <span className="b-value">₹{result.cgst.toFixed(2)}</span>
                      </li>
                      <li className="breakdown-item">
                        <span className="b-label">SGST @ {(result.rate / 2).toFixed(2)}%</span>
                        <span className="b-value">₹{result.sgst.toFixed(2)}</span>
                      </li>
                    </>
                  ) : (
                    <li className="breakdown-item">
                      <span className="b-label">IGST @ {result.rate}%</span>
                      <span className="b-value">₹{result.igst.toFixed(2)}</span>
                    </li>
                  )}

                  <li className="breakdown-item highlight">
                    <span className="b-label">
                      {result.calcType === 'add' ? 'Total Invoice (incl. GST)' : 'Base Amount (excl. GST)'}
                    </span>
                    <span className="b-value">
                      ₹{result.calcType === 'add' ? result.total.toFixed(2) : result.base.toFixed(2)}
                    </span>
                  </li>
                </ul>

                <div className="tag-row">
                  <span className="tag active-tag">
                    {result.gstType === 'intra' ? 'CGST + SGST' : 'IGST'}
                  </span>
                  <span className="tag active-tag">GST {result.rate}%</span>
                  <span className="tag">
                    {result.calcType === 'add' ? 'Exclusive' : 'Inclusive'}
                  </span>
                  <span className="tag">FY 2025–26</span>
                </div>

                <div className="tools-row">
                  <button type="button" className="tool-btn" onClick={handleReset}>
                    ↺ Reset
                  </button>
                  <button type="button" className="tool-btn" onClick={handleCopy}>
                    {copyText}
                  </button>
                  <button type="button" className="tool-btn print-btn" onClick={handleInvoicePreview}>
                    🖨 Invoice Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM: INVOICE PREVIEW SECTION */}
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
                  Invoice Preview
                </div>
                <div className="tools-row" style={{ margin: 0 }}>
                  <button type="button" className="tool-btn" onClick={handlePrint}>
                    🖨 Print
                  </button>
                  <button type="button" className="tool-btn" onClick={() => setShowInvoice(false)}>
                    ✕ Close
                  </button>
                </div>
              </div>

              <div className="invoice-card" style={{ margin: '16px' }}>
                <div className="invoice-header">
                  <div>
                    <h2>TAX INVOICE</h2>
                    <div className="inv-no">{invoiceNumber}</div>
                  </div>
                  <div className="invoice-date">
                    <div>
                      <strong>Date:</strong> {dateStr}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <strong>Due Date:</strong> {dueDateStr}
                    </div>
                  </div>
                </div>
                <div className="invoice-body">
                  <div className="invoice-parties">
                    <div className="party-block">
                      <h4>Billed By</h4>
                      <p>{sellerName || 'Your Company'}</p>
                      <div className="gstin">GSTIN: Not provided</div>
                    </div>
                    <div className="party-block" style={{ textAlign: 'right' }}>
                      <h4>Billed To</h4>
                      <p>{buyerName || 'Client Name'}</p>
                      <div className="gstin">GSTIN: Not provided</div>
                    </div>
                  </div>

                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Description</th>
                        <th>HSN/SAC</th>
                        <th>Qty</th>
                        <th className="num">Rate (₹)</th>
                        <th className="num">Taxable Amt (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>{itemDesc || 'Professional Services'}</td>
                        <td>—</td>
                        <td>1</td>
                        <td className="num">₹{result.base.toFixed(2)}</td>
                        <td className="num">₹{result.base.toFixed(2)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'right', color: 'var(--text-sec)', fontSize: '0.82rem' }}>
                          Sub-Total
                        </td>
                        <td className="num">₹{result.base.toFixed(2)}</td>
                      </tr>
                      {result.gstType === 'intra' ? (
                        <>
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'right', color: 'var(--text-sec)', fontSize: '0.82rem' }}>
                              CGST @ {(result.rate / 2).toFixed(2)}%
                            </td>
                            <td className="num">₹{result.cgst.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'right', color: 'var(--text-sec)', fontSize: '0.82rem' }}>
                              SGST @ {(result.rate / 2).toFixed(2)}%
                            </td>
                            <td className="num">₹{result.sgst.toFixed(2)}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'right', color: 'var(--text-sec)', fontSize: '0.82rem' }}>
                            IGST @ {result.rate}%
                          </td>
                          <td className="num">₹{result.igst.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="total-row">
                        <td colSpan={5} style={{ textAlign: 'right' }}>
                          TOTAL (INR)
                        </td>
                        <td className="num">₹{result.total.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="inv-note">
                    <strong>Amount in words:</strong> Rupees {numberToWords(result.total)} Only.
                    <br />
                    <span style={{ marginTop: '4px', display: 'block' }}>
                      This is a computer-generated invoice. No physical signature required.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer>
        <p className="footer-author">
          Built by <strong>Phulkeshwar Mahto</strong> &nbsp;·&nbsp; 
          <a href="mailto:phulkeshwarmahto@gmail.com">phulkeshwarmahto@gmail.com</a>
          &nbsp;·&nbsp; B.Tech CSE · NIAMT Ranchi · Founder, Garam Softwares
        </p>
        <a className="dh-btn" href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Built for Digital Heroes
        </a>
      </footer>
    </>
  );
}
