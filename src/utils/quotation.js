import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const generateQuotationId = () => {
  const prefix = 'QT';
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${random}`;
};

export const getQuotations = async (uid) => {
  if (uid === 'admin-mock-uid') {
    const local = localStorage.getItem(`quotations_${uid}`);
    if (local) {
      return JSON.parse(local);
    }
    // Return sample quotations so the dashboard looks loaded and polished
    const sampleQuotes = [
      {
        id: 'QT-2026-1024',
        uid,
        clientName: 'Google India Private Limited',
        clientEmail: 'procurement@google.com',
        clientPhone: '+91 98765 43210',
        clientAddress: 'Signature Towers, Tower B, Gurugram, Haryana',
        clientGst: '06AAACG1234A1ZB',
        items: [
          { description: 'Cloud Infrastructure Architecture & Consulting', quantity: 1, price: 150000, tax: 18 },
          { description: 'Vulnerability Assessment & Penetration Testing', quantity: 1, price: 75000, tax: 18 },
          { description: 'Monthly Support SLA (24/7 Monitoring)', quantity: 2, price: 25000, tax: 18 }
        ],
        subtotal: 275000,
        taxTotal: 49500,
        grandTotal: 324500,
        status: 'Sent',
        dueDate: '2026-06-15',
        notes: 'Terms: 30 days net billing. Thank you for your business!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'QT-2026-9842',
        uid,
        clientName: 'Microsoft India',
        clientEmail: 'billing@microsoft.com',
        clientPhone: '+91 88888 77777',
        clientAddress: 'Microsoft Campus, Gachibowli, Hyderabad, Telangana',
        clientGst: '36AAACM5678A1ZD',
        items: [
          { description: 'Enterprise Software Subscription (Annual License)', quantity: 50, price: 12000, tax: 18 },
          { description: 'Custom Power BI Dashboard Development', quantity: 1, price: 80000, tax: 18 }
        ],
        subtotal: 680000,
        taxTotal: 122400,
        grandTotal: 802400,
        status: 'Paid',
        dueDate: '2026-05-30',
        notes: 'Full payment received with thanks. Digital license keys dispatched.',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ];
    localStorage.setItem(`quotations_${uid}`, JSON.stringify(sampleQuotes));
    return sampleQuotes;
  }

  try {
    const q = query(
      collection(db, 'quotations'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Firebase failed, falling back to local storage:', e);
    const local = localStorage.getItem(`quotations_${uid}`);
    return local ? JSON.parse(local) : [];
  }
};

export const getQuotation = async (id) => {
  if (id.startsWith('QT-')) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('quotations_')) {
        const list = JSON.parse(localStorage.getItem(key));
        const found = list.find((q) => q.id === id);
        if (found) return found;
      }
    }
  }

  try {
    const snap = await getDoc(doc(db, 'quotations', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    console.error('Firebase getQuotation failed:', e);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('quotations_')) {
        const list = JSON.parse(localStorage.getItem(key));
        const found = list.find((q) => q.id === id);
        if (found) return found;
      }
    }
    return null;
  }
};

export const saveQuotation = async (uid, data, id = null) => {
  if (uid === 'admin-mock-uid') {
    const local = localStorage.getItem(`quotations_${uid}`);
    let list = local ? JSON.parse(local) : [];
    
    if (id) {
      list = list.map((q) => q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q);
    } else {
      const newId = generateQuotationId();
      id = newId;
      list.unshift({
        ...data,
        id,
        uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    localStorage.setItem(`quotations_${uid}`, JSON.stringify(list));
    return id;
  }

  try {
    if (id) {
      await updateDoc(doc(db, 'quotations', id), { ...data, updatedAt: serverTimestamp() });
      return id;
    } else {
      const ref = await addDoc(collection(db, 'quotations'), {
        ...data,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return ref.id;
    }
  } catch (e) {
    console.error('Firebase saveQuotation failed, using local storage:', e);
    const local = localStorage.getItem(`quotations_${uid}`);
    let list = local ? JSON.parse(local) : [];
    
    if (id) {
      list = list.map((q) => q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q);
    } else {
      id = generateQuotationId();
      list.unshift({
        ...data,
        id,
        uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    localStorage.setItem(`quotations_${uid}`, JSON.stringify(list));
    return id;
  }
};

export const deleteQuotation = async (id) => {
  let deletedFromLocal = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('quotations_')) {
      const list = JSON.parse(localStorage.getItem(key));
      const filtered = list.filter((q) => q.id !== id);
      if (filtered.length !== list.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
        deletedFromLocal = true;
      }
    }
  }

  if (deletedFromLocal) return;

  try {
    await deleteDoc(doc(db, 'quotations', id));
  } catch (e) {
    console.error('Firebase delete failed:', e);
  }
};

export const calcItemTotal = (qty, price, tax) => {
  const subtotal = qty * price;
  const taxAmt = subtotal * (tax / 100);
  return { subtotal, taxAmt, total: subtotal + taxAmt };
};

export const calcGrandTotal = (items) => {
  return items.reduce(
    (acc, item) => {
      const { subtotal, taxAmt, total } = calcItemTotal(
        parseFloat(item.quantity) || 0,
        parseFloat(item.price) || 0,
        parseFloat(item.tax) || 0
      );
      return {
        subtotal: acc.subtotal + subtotal,
        taxTotal: acc.taxTotal + taxAmt,
        grandTotal: acc.grandTotal + total,
      };
    },
    { subtotal: 0, taxTotal: 0, grandTotal: 0 }
  );
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};

export const formatDate = (ts) => {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
