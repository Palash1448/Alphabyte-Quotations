import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setCompany(null); setLoading(false); return; }
    const fetch = async () => {
      try {
        if (user.isMock) {
          const localData = localStorage.getItem(`company_${user.uid}`);
          if (localData) {
            setCompany(JSON.parse(localData));
          } else {
            // Default premium demo company profile
            const demoCompany = {
              companyName: 'Acme Software Solutions',
              email: 'info@acmesoftware.com',
              mobile: '+91 98765 43210',
              website: 'www.acmesoftware.com',
              address: '102, Cyber Tower B, Sector 62, Noida, Uttar Pradesh - 201301',
              gstNumber: '09AAACA1234A1Z5',
              termsAndConditions: '1. Payment: 50% advance, 50% post-delivery within 15 days.\n2. Validity: Quotation is valid for 30 days from date of issue.\n3. Support: Includes 1 year of free bug support and security updates.'
            };
            setCompany(demoCompany);
            localStorage.setItem(`company_${user.uid}`, JSON.stringify(demoCompany));
          }
          setLoading(false);
          return;
        }
        const snap = await getDoc(doc(db, 'companies', user.uid));
        if (snap.exists()) {
          setCompany(snap.data());
        } else {
          setCompany(null);
        }
      } catch (e) {
        console.error(e);
        const localData = localStorage.getItem(`company_${user.uid}`);
        if (localData) setCompany(JSON.parse(localData));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const saveCompany = async (data) => {
    if (!user) return;
    if (user.isMock) {
      localStorage.setItem(`company_${user.uid}`, JSON.stringify(data));
      setCompany(data);
      return;
    }
    try {
      await setDoc(doc(db, 'companies', user.uid), data, { merge: true });
      setCompany(data);
    } catch (e) {
      console.error('Firebase saveCompany failed, using localStorage:', e);
      localStorage.setItem(`company_${user.uid}`, JSON.stringify(data));
      setCompany(data);
    }
  };

  return (
    <CompanyContext.Provider value={{ company, loading, saveCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
