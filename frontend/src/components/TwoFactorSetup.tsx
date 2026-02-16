import React, { useState } from 'react';
import { Shield, Key, Download, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';

interface TwoFactorSetupProps {
  onComplete: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/2fa/setup');
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setBackupCodes(response.data.backup_codes);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/2fa/verify', { token });
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid token');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="glass-panel rounded-2xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-8 h-8 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">Two-Factor Authentication</h2>
        </div>

        {step === 'setup' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-gray-300">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <button
              onClick={handleSetup}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Key className="w-5 h-5" />
              <span>{loading ? 'Setting up...' : 'Setup 2FA'}</span>
            </button>
          </motion.div>
        )}

        {step === 'verify' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Step 1: Scan QR Code</h3>
              <p className="text-gray-300 text-sm">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="text-gray-400 text-xs text-center">
                Manual entry key: <code className="bg-gray-800 px-2 py-1 rounded">{secret}</code>
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Step 2: Save Backup Codes</h3>
              <p className="text-gray-300 text-sm">
                Save these backup codes in a safe place. You can use them to access your account if you lose your device.
              </p>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm font-mono text-gray-300">
                  {backupCodes.map((code, idx) => (
                    <div key={idx}>{code}</div>
                  ))}
                </div>
              </div>
              <button
                onClick={downloadBackupCodes}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Backup Codes</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Step 3: Verify</h3>
              <p className="text-gray-300 text-sm">
                Enter the 6-digit code from your authenticator app
              </p>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="input-field w-full text-center text-2xl tracking-widest"
              />
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                onClick={handleVerify}
                disabled={loading || token.length !== 6}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{loading ? 'Verifying...' : 'Enable 2FA'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;
