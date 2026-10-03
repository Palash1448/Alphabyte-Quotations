import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Upload, Building2, Save, Loader2, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import toast from 'react-hot-toast';

export default function CompanyProfile() {
  const { user } = useAuth();
  const { company, saveCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState({ logo: null, stamp: null, signature: null, qrCode: null });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (company) {
      reset(company);
      setPreviews({ logo: company.logoUrl, stamp: company.stampUrl, signature: company.signatureUrl, qrCode: company.qrCodeUrl });
    }
  }, [company, reset]);

  const uploadFile = async (file, path) => {
    const storageRef = ref(storage, `${user.uid}/${path}/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleFilePreview = (field, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviews((p) => ({ ...p, [field]: url }));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data };

      // Upload logo
      if (data.logo?.[0]) {
        payload.logoUrl = await uploadFile(data.logo[0], 'logos');
      } else {
        payload.logoUrl = company?.logoUrl || '';
      }
      delete payload.logo;

      // Upload stamp
      if (data.stamp?.[0]) {
        payload.stampUrl = await uploadFile(data.stamp[0], 'stamps');
      } else {
        payload.stampUrl = company?.stampUrl || '';
      }
      delete payload.stamp;

      // Upload signature
      if (data.signature?.[0]) {
        payload.signatureUrl = await uploadFile(data.signature[0], 'signatures');
      } else {
        payload.signatureUrl = company?.signatureUrl || '';
      }
      delete payload.signature;

      // Upload QR Code
      if (data.qrCode?.[0]) {
        payload.qrCodeUrl = await uploadFile(data.qrCode[0], 'qrcodes');
      } else {
        payload.qrCodeUrl = company?.qrCodeUrl || '';
      }
      delete payload.qrCode;

      await saveCompany(payload);
      toast.success('Company profile saved!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Company Profile</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Information used in quotation headers</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Upload section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <ImageUpload
                label="Company Logo"
                field="logo"
                preview={previews.logo}
                register={register}
                onFile={(f) => handleFilePreview('logo', f)}
              />
              <ImageUpload
                label="Company Stamp"
                field="stamp"
                preview={previews.stamp}
                register={register}
                onFile={(f) => handleFilePreview('stamp', f)}
              />
              <ImageUpload
                label="Digital Signature"
                field="signature"
                preview={previews.signature}
                register={register}
                onFile={(f) => handleFilePreview('signature', f)}
              />
              <ImageUpload
                label="Payment QR Code"
                field="qrCode"
                preview={previews.qrCode}
                register={register}
                onFile={(f) => handleFilePreview('qrCode', f)}
              />
            </div>

            {/* Company info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Company Name *" error={errors.companyName}>
                <input
                  {...register('companyName', { required: 'Required' })}
                  className="input-field"
                  placeholder="Acme Corp Pvt. Ltd."
                />
              </FormField>
              <FormField label="GST Number">
                <input {...register('gstNumber')} className="input-field" placeholder="22AAAAA0000A1Z5" />
              </FormField>
              <FormField label="Mobile Number *" error={errors.mobile}>
                <input
                  {...register('mobile', { required: 'Required' })}
                  className="input-field"
                  placeholder="+91 98765 43210"
                />
              </FormField>
              <FormField label="Company Email *" error={errors.email}>
                <input
                  type="email"
                  {...register('email', { required: 'Required' })}
                  className="input-field"
                  placeholder="info@company.com"
                />
              </FormField>
              <FormField label="Website URL">
                <input {...register('website')} className="input-field" placeholder="https://www.company.com" />
              </FormField>
              <FormField label="Company Address *" error={errors.address}>
                <textarea
                  {...register('address', { required: 'Required' })}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="123 Business Park, City, State - 000000"
                />
              </FormField>
            </div>

            {/* Terms & Conditions */}
            <FormField label="Default Terms & Conditions">
              <textarea
                {...register('termsAndConditions')}
                className="input-field resize-none"
                rows={4}
                placeholder="1. Payment due within 30 days of invoice.&#10;2. All prices are in INR excluding GST.&#10;3. Work begins upon receipt of advance payment."
              />
            </FormField>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 min-w-[140px] justify-center">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Profile</>}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
}

function ImageUpload({ label, field, preview, register, onFile }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center bg-gray-50 dark:bg-gray-800 hover:border-blue-400 transition-colors group cursor-pointer">
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-contain p-3" />
        ) : (
          <div className="text-center">
            <Upload size={20} className="mx-auto text-gray-300 mb-1" />
            <span className="text-xs text-gray-400">Click to upload</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          {...register(field)}
          onChange={(e) => onFile(e.target.files?.[0])}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
