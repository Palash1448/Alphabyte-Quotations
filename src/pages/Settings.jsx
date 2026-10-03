import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, Shield, Bell, Palette, Info, Key } from 'lucide-react';
import { useState } from 'react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';

export default function Settings() {
  const { dark, toggleDark } = useTheme();
  const { user, logout } = useAuth();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPwd || !newPwd) { toast.error('Fill in both fields'); return; }
    if (newPwd.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setChangingPwd(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPwd);
      toast.success('Password updated successfully!');
      setCurrentPwd('');
      setNewPwd('');
    } catch (e) {
      if (e.code === 'auth/wrong-password') toast.error('Current password is incorrect');
      else toast.error(e.message);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Appearance */}
        <SettingsSection icon={Palette} title="Appearance" color="blue">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Switch between light and dark themes</p>
            </div>
            <button
              onClick={toggleDark}
              className={`relative w-12 h-6 rounded-full transition-colors ${dark ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${dark ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 mt-2">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Current Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{dark ? 'Dark mode is active' : 'Light mode is active'}</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              {dark ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} className="text-amber-500" />}
              <span className="text-gray-700 dark:text-gray-300">{dark ? 'Dark' : 'Light'}</span>
            </div>
          </div>
        </SettingsSection>

        {/* Account */}
        <SettingsSection icon={Shield} title="Account & Security" color="purple">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">{user?.email}</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="label text-xs">Current Password</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="input-field text-sm"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="label text-xs">New Password</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="input-field text-sm"
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
            <button type="submit" disabled={changingPwd} className="btn-primary text-sm flex items-center gap-2">
              <Key size={14} /> {changingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </SettingsSection>

        {/* About */}
        <SettingsSection icon={Info} title="About" color="emerald">
          <div className="space-y-2">
            <InfoRow label="Application" value="Alphabyte Quotations" />
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="Tech Stack" value="React + Firebase + Tailwind CSS" />
            <InfoRow label="PDF Export" value="html2pdf.js" />
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection icon={LogOut} title="Session" color="red">
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800">
            <div>
              <p className="font-medium text-red-700 dark:text-red-400 text-sm">Sign Out</p>
              <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">Log out of your admin account</p>
            </div>
            <button
              onClick={() => { logout(); toast.success('Logged out'); }}
              className="btn-danger text-sm flex items-center gap-2"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </SettingsSection>
      </motion.div>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, color, children }) {
  const colors = {
    blue: 'from-blue-500 to-blue-700',
    purple: 'from-violet-500 to-purple-700',
    emerald: 'from-emerald-500 to-green-700',
    red: 'from-red-500 to-red-700',
  };
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-8 h-8 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center`}>
          <Icon size={15} className="text-white" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}
