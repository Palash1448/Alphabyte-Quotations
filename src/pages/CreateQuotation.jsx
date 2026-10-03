import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Save, Eye, Loader2, User, Briefcase, DollarSign, FileText, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { saveQuotation, getQuotation, generateQuotationId, calcItemTotal, formatCurrency } from '../utils/quotation';
import toast from 'react-hot-toast';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const SERVICE_CATEGORIES = [
  'Web Development', 'Mobile App Development', 'UI/UX Design', 'Digital Marketing',
  'SEO Services', 'Content Writing', 'Graphic Design', 'IT Consulting', 'Cloud Services', 'Other',
];

const defaultItem = { name: '', description: '', quantity: 1, price: 0, tax: 18 };

export default function CreateQuotation() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company } = useCompany();
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [currency, setCurrency] = useState('INR');

  const {
    register, handleSubmit, control, watch, reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientName: '', clientCompany: '', clientMobile: '', clientEmail: '', clientAddress: '',
      projectName: '', projectDescription: '', serviceCategory: '',
      items: [defaultItem],
      notes: '', termsAndConditions: company?.termsAndConditions || '',
      status: 'pending', currency: 'INR',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  useEffect(() => {
    if (isEdit) {
      getQuotation(id).then((q) => {
        if (q) { reset(q); setCurrency(q.currency || 'INR'); }
        setLoadingData(false);
      });
    }
  }, [id, isEdit, reset]);

  useEffect(() => {
    if (company?.termsAndConditions && !isEdit) {
      reset((v) => ({ ...v, termsAndConditions: company.termsAndConditions }));
    }
  }, [company]);

  const totals = watchItems.reduce(
    (acc, item) => {
      const { subtotal, taxAmt, total } = calcItemTotal(
        parseFloat(item.quantity) || 0,
        parseFloat(item.price) || 0,
        parseFloat(item.tax) || 0
      );
      return { subtotal: acc.subtotal + subtotal, taxTotal: acc.taxTotal + taxAmt, grandTotal: acc.grandTotal + total };
    },
    { subtotal: 0, taxTotal: 0, grandTotal: 0 }
  );

  const save = async (data, isDraft = false) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        currency,
        status: isDraft ? 'draft' : (data.status || 'pending'),
        quotationId: isEdit ? data.quotationId : generateQuotationId(),
        grandTotal: totals.grandTotal,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        date: new Date().toISOString(),
      };
      const savedId = await saveQuotation(user.uid, payload, isEdit ? id : null);
      toast.success(isEdit ? 'Quotation updated!' : 'Quotation created!');
      navigate(`/quotations/preview/${isEdit ? id : savedId}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <form onSubmit={handleSubmit((d) => save(d))} className="space-y-6">
        {/* Client Details */}
        <Section icon={User} title="Client Details" color="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Client Name *" error={errors.clientName}>
              <input {...register('clientName', { required: 'Required' })} className="input-field" placeholder="John Smith" />
            </Field>
            <Field label="Client Company">
              <input {...register('clientCompany')} className="input-field" placeholder="ABC Corp" />
            </Field>
            <Field label="Mobile Number">
              <input {...register('clientMobile')} className="input-field" placeholder="+91 98765 43210" />
            </Field>
            <Field label="Email Address">
              <input type="email" {...register('clientEmail')} className="input-field" placeholder="client@company.com" />
            </Field>
            <Field label="Client Address" className="md:col-span-2">
              <textarea {...register('clientAddress')} className="input-field resize-none" rows={2} placeholder="Office address..." />
            </Field>
          </div>
        </Section>

        {/* Project Details */}
        <Section icon={Briefcase} title="Project Details" color="purple">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Project Name *" error={errors.projectName}>
              <input {...register('projectName', { required: 'Required' })} className="input-field" placeholder="E-commerce Website" />
            </Field>
            <Field label="Service Category">
              <select {...register('serviceCategory')} className="input-field">
                <option value="">Select category...</option>
                {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Project Description" className="md:col-span-2">
              <textarea {...register('projectDescription')} className="input-field resize-none" rows={3} placeholder="Brief description of the project scope..." />
            </Field>
          </div>
        </Section>

        {/* Pricing */}
        <Section icon={DollarSign} title="Pricing Details" color="emerald">
          {/* Currency + Status header */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Currency:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field w-auto py-1.5 text-sm"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</label>
              <select {...register('status')} className="input-field w-auto py-1.5 text-sm">
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Item Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-20">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-28">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-20">Tax %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 w-28">Total</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                <AnimatePresence>
                  {fields.map((field, idx) => {
                    const item = watchItems[idx] || {};
                    const { total } = calcItemTotal(parseFloat(item.quantity) || 0, parseFloat(item.price) || 0, parseFloat(item.tax) || 0);
                    return (
                      <motion.tr
                        key={field.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        className="bg-white dark:bg-gray-900"
                      >
                        <td className="px-4 py-2 text-sm text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2">
                          <input {...register(`items.${idx}.name`)} className="input-field text-sm py-2" placeholder="Service name" />
                        </td>
                        <td className="px-4 py-2">
                          <input {...register(`items.${idx}.description`)} className="input-field text-sm py-2" placeholder="Brief description" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="1" {...register(`items.${idx}.quantity`)} className="input-field text-sm py-2 text-center" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="0" step="0.01" {...register(`items.${idx}.price`)} className="input-field text-sm py-2" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="0" max="100" {...register(`items.${idx}.tax`)} className="input-field text-sm py-2 text-center" />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(total, currency)}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Add Item */}
          <button
            type="button"
            onClick={() => append(defaultItem)}
            className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <Plus size={15} /> Add Item
          </button>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 w-full max-w-xs space-y-2.5">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>GST / Tax</span>
                <span className="font-medium">{formatCurrency(totals.taxTotal, currency)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5 flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Grand Total</span>
                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(totals.grandTotal, currency)}</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Notes & Terms */}
        <Section icon={FileText} title="Notes & Terms" color="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Additional Notes">
              <textarea {...register('notes')} className="input-field resize-none" rows={4} placeholder="Any additional information for the client..." />
            </Field>
            <Field label="Terms & Conditions">
              <textarea {...register('termsAndConditions')} className="input-field resize-none" rows={4} placeholder="1. Payment terms...&#10;2. Revision policy..." />
            </Field>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <button
            type="button"
            onClick={handleSubmit((d) => save(d, true))}
            disabled={saving}
            className="btn-secondary flex items-center gap-2"
          >
            <Save size={15} /> Save as Draft
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 min-w-[160px] justify-center">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Eye size={15} /> {isEdit ? 'Update & Preview' : 'Save & Preview'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ icon: Icon, title, color, children }) {
  const colors = {
    blue: 'from-blue-500 to-blue-700',
    purple: 'from-violet-500 to-purple-700',
    emerald: 'from-emerald-500 to-green-700',
    amber: 'from-amber-500 to-orange-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-8 h-8 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center`}>
          <Icon size={15} className="text-white" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function Field({ label, error, className = '', children }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
}
