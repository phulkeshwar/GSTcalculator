# Indian GST Invoice Calculator

A professional, client-side React TypeScript application for instant Goods and Services Tax (GST) calculations in India. It includes exclusive/inclusive tax breakdowns, CGST/SGST/IGST division, an interactive print-ready Tax Invoice generator, and automatic Indian number-to-words translation.

## Features

1.  **Dual Calculation Modes**:
    *   **Add GST**: Calculate inclusive totals from a base taxable amount.
    *   **Extract GST**: Back-calculate the base taxable amount and tax from a final inclusive invoice amount.
2.  **Tax Type Division**:
    *   **Intra-state**: Divides tax equally into CGST (Central) and SGST (State).
    *   **Inter-state**: Computes the entire tax amount as IGST (Integrated).
3.  **Standard Presets**: Fast selectors for Indian tax rates: `0%`, `0.1%`, `0.25%`, `3%`, `5%`, `12%`, `18%`, and `28%`, with support for custom numeric percentage inputs.
4.  **Tax Invoice Preview**: Generates a standard tax invoice showing Billed By/To details, Date, Due Date, HSN/SAC description, and dynamic totals.
5.  **Indian Number-to-Words**: Custom port of the Indian numbering system translating totals into words (e.g., *Rupees One Lakh Five Thousand Seven Hundred and Fifty Paise Only*).
6.  **Print-Ready Styles**: Uses custom CSS printing queries (`@media print`) that hide header, footer, and form controls to format the Tax Invoice preview on a standard A4 sheet upon pressing Print or Ctrl+P.
7.  **Clipboard Sharing**: Quick copy action formatted into a clean receipt summary.
8.  **Responsive Interface**: Beautiful dark layout matching India GST financial conventions.

---

## Math Formulas

*   **Add GST (Exclusive)**:
    $$\text{Base} = \text{Amount}$$
    $$\text{GST Amount} = \text{Base} \times \frac{\text{Rate}}{100}$$
    $$\text{Total} = \text{Base} + \text{GST Amount}$$
*   **Extract GST (Inclusive)**:
    $$\text{Total} = \text{Amount}$$
    $$\text{Base} = \frac{\text{Total}}{1 + \frac{\text{Rate}}{100}}$$
    $$\text{GST Amount} = \text{Total} - \text{Base}$$

---

## Technical Details

*   **Framework**: [Vite](https://vite.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: Pure CSS variables, CSS grid layouts, and custom print media configurations.
*   **Fonts**: `Space Grotesk` (for headings and totals) and `Inter` (body paragraphs) loaded via Google Fonts.

---

## Local Setup

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Installation
1. Navigate to the repository folder:
   ```bash
   cd GST
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run local dev server:
   ```bash
   npm run dev
   ```
4. Compile for production:
   ```bash
   npm run build
   ```

---

## Deployment

Since this is a client-side static web application, it can be hosted directly on Vercel:
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** → **Project**.
3. Import your GitHub repository `GSTcalculator`.
4. Click **Deploy**.

---

## Advanced Features Implemented

*   **Multi-Item Invoice Support (Itemized Billing)**: Build dynamic table grids allowing multiple row inputs with customized quantities, unit rates, and individual GST tax rates.
*   **HSN/SAC Code Directory**: Integrates auto-complete dropdown selectors mapping common business descriptions to official HSN/SAC codes (e.g., software consulting at 998313).
*   **Export under LUT Toggle**: Instantly toggles zero-rated tax handling for export invoicing under Letter of Undertaking (LUT) compliance guidelines.

## Submission Details
*   **Developer**: Phulkeshwar Mahto
*   **Email**: [phulkeshwarmahto@gmail.com](mailto:phulkeshwarmahto@gmail.com)
*   **Organization**: Built for Digital Heroes ([https://digitalheroesco.com](https://digitalheroesco.com))
