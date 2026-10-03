import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Eye, Edit2, Trash2, Copy, FileText, Calendar, ChevronDown, SortAsc, SortDesc,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getQuotations, deleteQuotation, saveQuotation, formatCurrency, formatDate, generateQuotationId } from '../utils/quotation';
import toast from 'react-hot-toast';

export default function ManageQuotations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const fetch = async () => {
    try {
      const data = await getQuotations(user.uid);
      setQuotations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetch();
  }, [user]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this quotation? This cannot be undone.')) return;
    try {
      await deleteQuotation(id);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      toast.success('Quotation deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDuplicate = async (q) => {
    try {
      const newQ = {
        ...q,
        quotationId: generateQuotationId(),
        status: 'draft',
        date: new Date().toISOString(),
      };
      delete newQ.id;
      delete newQ.createdAt;
      delete newQ.updatedAt;
      const newId = await saveQuotation(user.uid, newQ);
      toast.success('Quotation duplicated!');
      navigate(`/quotations/edit/${newId}`);
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  const filtered = quotations
    .filter((q) => {
      const s = search.toLowerCase();
      const matchSearch =
        !s ||
        q.quotationId?.toLowerCase().includes(s) ||
        q.clientName?.toLowerCase().includes(s) ||
        q.projectName?.toLowerCase().includes(s) ||
        q.clientCompany?.toLowerCase().includes(s);
      const matchStatus = filterStatus === 'all' || q.status === filterStatus || (!q.status && filterStatus === 'pending');
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let aV = a[sortField];
      let bV = b[sortField];
      if (sortField === 'createdAt') {
        aV = a.createdAt?.toMillis?.() || 0;
        bV = b.createdAt?.toMillis?.() || 0;
      }
      if (sortField === 'grandTotal') {
        aV = parseFloat(a.grandTotal) || 0;
        bV = parseFloat(b.grandTotal) || 0;
      }
      if (typeof aV === 'string') return sortDir === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
      return sortDir === 'asc' ? aV - bV : bV - aV;
    });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, client, project..."
              className="pl-8 pr-4 py-2 text-sm input-field w-64"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-8 pr-8 py-2 text-sm input-field appearance-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
        <Link to="/quotations/new" className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap">
          <Plus size={15} /> New Quotation
        </Link>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={44} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No quotations found</p>
            <Link to="/quotations/new" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
              <Plus size={15} /> Create First Quotation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  {[
                    { label: 'Quotation ID', field: 'quotationId' },
                    { label: 'Client', field: 'clientName' },
                    { label: 'Project', field: 'projectName' },
                    { label: 'Date', field: 'createdAt' },
                    { label: 'Amount', field: 'grandTotal' },
                    { label: 'Status', field: 'status' },
                    { label: 'Actions', field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ${field ? 'cursor-pointer select-none hover:text-blue-600' : ''}`}
                      onClick={() => field && toggleSort(field)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {field && sortField === field && (
                          sortDir === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                <AnimatePresence>
                  {filtered.map((q) => (
                    <motion.tr
                      key={q.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{q.quotationId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{q.clientName || '—'}</div>
                        {q.clientCompany && <div className="text-xs text-gray-400">{q.clientCompany}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 max-w-[180px]">
                        <div className="truncate">{q.projectName || '—'}</div>
                        {q.serviceCategory && <div className="text-xs text-gray-400 truncate">{q.serviceCategory}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(q.createdAt)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(q.grandTotal || 0, q.currency || 'INR')}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/quotations/preview/${q.id}`}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Preview"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            to={`/quotations/edit/${q.id}`}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(q)}
                            className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-400 hover:text-purple-600 transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-400">
              Showing {filtered.length} of {quotations.length} quotations
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    draft: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  };
  const s = status || 'pending';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[s] || map.pending}`}>
      {s}
    </span>
  );
}
