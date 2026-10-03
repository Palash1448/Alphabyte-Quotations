import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, TrendingUp, Plus, Search, Eye, Edit2, Trash2, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getQuotations, deleteQuotation, formatCurrency, formatDate } from '../utils/quotation';
import toast from 'react-hot-toast';

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' } }),
};

export default function Dashboard() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!user) return;
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
    fetch();
  }, [user]);

  const stats = {
    total: quotations.length,
    pending: quotations.filter((q) => q.status === 'pending' || !q.status).length,
    approved: quotations.filter((q) => q.status === 'approved').length,
    draft: quotations.filter((q) => q.status === 'draft').length,
  };

  const filtered = quotations.filter((q) => {
    const matchSearch =
      !search ||
      q.quotationId?.toLowerCase().includes(search.toLowerCase()) ||
      q.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      q.projectName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || q.status === filterStatus || (!q.status && filterStatus === 'pending');
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this quotation?')) return;
    try {
      await deleteQuotation(id);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      toast.success('Quotation deleted');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const statCards = [
    { label: 'Total Quotations', value: stats.total, icon: FileText, color: 'blue', bg: 'from-blue-500 to-blue-600' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber', bg: 'from-amber-500 to-orange-500' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'emerald', bg: 'from-emerald-500 to-green-600' },
    { label: 'Drafts', value: stats.draft, icon: TrendingUp, color: 'purple', bg: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            custom={i}
            variants={statVariants}
            initial="hidden"
            animate="visible"
            className="glass-card p-5 overflow-hidden relative"
          >
            <div className={`absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br ${s.bg} opacity-10 rounded-full blur-xl`} />
            <div className={`w-10 h-10 bg-gradient-to-br ${s.bg} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Quotations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="glass-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Quotations</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quotations..."
                className="pl-8 pr-4 py-2 text-sm input-field w-full sm:w-52"
              />
            </div>
            {/* Filter */}
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
            {/* New button */}
            <Link to="/quotations/new" className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap">
              <Plus size={15} /> New Quotation
            </Link>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No quotations found</p>
            <p className="text-gray-400 text-sm mt-1">Create your first quotation to get started</p>
            <Link to="/quotations/new" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
              <Plus size={15} /> Create Quotation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  {['Quotation ID', 'Client', 'Project', 'Date', 'Amount', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((q) => (
                  <motion.tr
                    key={q.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{q.quotationId}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-gray-100">{q.clientName || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 max-w-[160px] truncate">{q.projectName || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(q.createdAt)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
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
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
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
