import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download, Printer, ArrowLeft, Edit2, Share2, Loader2, Mail, MessageCircle,
} from 'lucide-react';
import { getQuotation, formatCurrency, formatDate, calcItemTotal } from '../utils/quotation';
import { useCompany } from '../context/CompanyContext';
import toast from 'react-hot-toast';

export default function QuotationPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useCompany();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    getQuotation(id).then((q) => {
      setQuotation(q);
      setLoading(false);
    });
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf()
        .set({
          margin: 0,
          filename: `${quotation.quotationId || 'quotation'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(printRef.current)
        .save();
      toast.success('PDF downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsApp = () => {
    const msg = `Hi, please find the quotation ${quotation?.quotationId} from ${company?.companyName || 'us'}. Total: ${formatCurrency(quotation?.grandTotal, quotation?.currency)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmail = () => {
    const subject = `Quotation ${quotation?.quotationId} from ${company?.companyName || ''}`;
    const body = `Dear ${quotation?.clientName},\n\nPlease find attached quotation ${quotation?.quotationId}.\n\nTotal Amount: ${formatCurrency(quotation?.grandTotal, quotation?.currency)}\n\nRegards,\n${company?.companyName || ''}`;
    window.open(`mailto:${quotation?.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!quotation) {
    return <div className="text-center py-32 text-gray-500">Quotation not found.</div>;
  }

  const currency = quotation.currency || 'INR';
  const subtotal = parseFloat(quotation.subtotal) || 0;
  const taxTotal = parseFloat(quotation.taxTotal) || 0;
  const grandTotal = parseFloat(quotation.grandTotal) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-4 md:py-8">
      {/* Page styling style tag for print and screen preview A4 bounds */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          .print-container {
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* Action bar */}
      <div className="no-print flex flex-wrap items-center gap-3 justify-between bg-slate-900/5 dark:bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50">
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex flex-wrap gap-2">
          <Link to={`/quotations/edit/${id}`} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
            <Edit2 size={16} /> Edit
          </Link>
          <button onClick={handleEmail} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
            <Mail size={16} /> Email
          </button>
          <button onClick={handleWhatsApp} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4 text-emerald-600 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleDownload} disabled={downloading} className="btn-primary flex items-center gap-2 text-sm py-2 px-5 min-w-[140px] justify-center">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <><Download size={16} /> Download PDF</>}
          </button>
        </div>
      </div>

      {/* Quotation Document Wrapper for A4 rendering */}
      <div className="w-full overflow-x-auto rounded-2xl shadow-xl dark:shadow-2xl/40 border border-slate-150 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-950/50 p-4 md:p-8 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          ref={printRef}
          className="print-container w-[210mm] min-h-[297mm] bg-white text-slate-800 p-[20mm] flex flex-col justify-between box-border shadow-md print:shadow-none print:p-0 print:w-full print:min-h-0 print:border-none relative border border-slate-200"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {/* Top colored accent line */}
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-blue-600 to-indigo-600 print:hidden" />

          {/* Core Content of Document */}
          <div className="flex-grow flex flex-col gap-6">
            {/* Header */}
            <div className="grid grid-cols-2 gap-4 items-start pb-6 border-b border-slate-100">
              {/* Left Column: Company Profile */}
              <div className="flex items-start gap-4">
                {company?.logoUrl && (
                  <img src={company.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-slate-50 p-1.5 border border-slate-100" />
                )}
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{company?.companyName || 'Your Company'}</h1>
                  {company?.gstNumber && <p className="text-slate-600 text-xs font-semibold mt-1">GSTIN: {company.gstNumber}</p>}
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-[280px]">{company?.address}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {[company?.mobile, company?.email].filter(Boolean).join('  ·  ')}
                  </p>
                </div>
              </div>

              {/* Right Column: Quotation Meta */}
              <div className="text-right">
                <h2 className="text-2xl font-black text-slate-900 tracking-wider uppercase mb-2 animate-pulse">Quotation</h2>
                <div className="text-sm font-bold text-blue-600 tracking-tight">{quotation.quotationId}</div>
                <div className="text-slate-500 text-xs mt-2.5">
                  <span className="text-slate-400">Date:</span> {formatDate(quotation.createdAt) || new Date().toLocaleDateString()}
                </div>
                {quotation.dueDate && (
                  <div className="text-slate-500 text-xs mt-1">
                    <span className="text-slate-400">Valid Until:</span> {formatDate(quotation.dueDate)}
                  </div>
                )}
                <div className="mt-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    quotation.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    quotation.status === 'draft' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {quotation.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill To & Project Info */}
            <div className="grid grid-cols-2 gap-8 py-2">
              {/* Bill To */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Bill To</h3>
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900 text-sm tracking-tight">{quotation.clientName}</p>
                  {quotation.clientCompany && <p className="text-slate-600 font-semibold text-xs">{quotation.clientCompany}</p>}
                  {quotation.clientGst && <p className="text-slate-500 font-semibold text-[11px]">GSTIN: {quotation.clientGst}</p>}
                  {quotation.clientAddress && <p className="text-slate-500 text-xs leading-relaxed max-w-[260px] pt-0.5">{quotation.clientAddress}</p>}
                  <p className="text-slate-400 text-xs pt-1">
                    {[quotation.clientMobile, quotation.clientEmail].filter(Boolean).join('  |  ')}
                  </p>
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Project Overview</h3>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-sm tracking-tight">{quotation.projectName || '—'}</p>
                  {quotation.serviceCategory && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {quotation.serviceCategory}
                    </span>
                  )}
                  {quotation.projectDescription && (
                    <p className="text-slate-500 text-xs leading-relaxed max-w-[300px] pt-1.5">{quotation.projectDescription}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-grow">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-y border-slate-200">
                    <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-[6%] text-center">#</th>
                    <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-[54%]">Description of Services</th>
                    <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-[10%] text-center">Qty</th>
                    <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-[15%] text-right">Rate</th>
                    <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-[10%] text-center">Tax</th>
                    <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-[15%] text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(quotation.items || []).map((item, i) => {
                    const { total } = calcItemTotal(
                      parseFloat(item.quantity) || 0,
                      parseFloat(item.price) || 0,
                      parseFloat(item.tax) || 0
                    );
                    return (
                      <tr key={i} className="align-top hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{i + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 text-sm">{item.name || '—'}</div>
                          {item.description && (
                            <div className="text-slate-400 text-xs mt-1 leading-relaxed whitespace-pre-line max-w-[420px]">{item.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-700 font-medium">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-slate-700 font-medium">{formatCurrency(parseFloat(item.price) || 0, currency)}</td>
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">{item.tax}%</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(total, currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals & Notes Section */}
            <div className="avoid-break grid grid-cols-5 gap-6 pt-4 border-t border-slate-100 items-start">
              {/* Notes & Terms (Left) */}
              <div className="col-span-3 flex gap-6">
                <div className="space-y-4 flex-grow">
                  {quotation.notes && (
                    <div>
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Special Notes</h4>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-[380px]">{quotation.notes}</p>
                    </div>
                  )}
                  {(quotation.termsAndConditions || company?.termsAndConditions) && (
                    <div>
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Terms & Conditions</h4>
                      <p className="text-slate-400 text-[10px] leading-relaxed whitespace-pre-line max-w-[380px] bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                        {quotation.termsAndConditions || company?.termsAndConditions}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Payment QR Code */}
                {company?.qrCodeUrl && (
                  <div className="flex-shrink-0 flex flex-col items-center justify-start pt-1">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Scan to Pay</h4>
                    <div className="bg-white p-1.5 border border-slate-200 shadow-sm rounded-xl">
                      <img src={company.qrCodeUrl} alt="Payment QR Code" className="w-[84px] h-[84px] object-contain" />
                    </div>
                  </div>
                )}
              </div>

              {/* Price calculation summary (Right) */}
              <div className="col-span-2 space-y-2">
                <div className="flex justify-between text-xs text-slate-500 py-1.5 border-b border-slate-100">
                  <span>Subtotal (before tax)</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 py-1.5 border-b border-slate-100">
                  <span>Estimated GST / Tax</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(taxTotal, currency)}</span>
                </div>
                <div className="flex justify-between py-3 bg-slate-900 text-white px-4 rounded-xl font-bold text-sm tracking-wide mt-2">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Signature Section */}
          <div className="avoid-break mt-8 space-y-6 pt-4 border-t border-slate-100">
            {/* Signature Area */}
            {(company?.signatureUrl || company?.stampUrl) && (
              <div className="flex items-end justify-between px-2">
                {/* Stamp */}
                <div>
                  {company?.stampUrl ? (
                    <div className="text-left">
                      <img src={company.stampUrl} alt="Stamp" className="w-16 h-16 object-contain opacity-75 mix-blend-multiply" />
                      <p className="text-[9px] text-slate-400 tracking-wider mt-1 uppercase">Official Stamp</p>
                    </div>
                  ) : <div />}
                </div>

                {/* Signature */}
                <div>
                  {company?.signatureUrl ? (
                    <div className="text-center w-40">
                      <img src={company.signatureUrl} alt="Signature" className="h-12 object-contain mx-auto mix-blend-multiply" />
                      <div className="border-t border-slate-200 mt-1.5 pt-1">
                        <p className="text-[10px] font-bold text-slate-800 leading-tight">{company?.companyName}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Authorized Signatory</p>
                      </div>
                    </div>
                  ) : <div />}
                </div>
              </div>
            )}

            {/* Document Footer Strip */}
            <div className="pt-4 border-t border-slate-100 text-center space-y-1">
              <p className="text-[9px] text-slate-400 font-medium tracking-wide">
                {[
                  company?.companyName,
                  company?.website,
                  company?.email,
                  company?.mobile
                ].filter(Boolean).join('   |   ')}
              </p>
              <p className="text-[9px] text-slate-350 italic text-center">Thank you for your business. Generated by Alphabyte Quotations.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
