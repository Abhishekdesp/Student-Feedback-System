import React, { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { Bot, Shield, Info, CheckCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [useExternalAi, setUseExternalAi] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAiSetting();
  }, []);

  const fetchAiSetting = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/ai');
      setUseExternalAi(res.data.useExternalAi);
    } catch (err) {
      console.error('Error fetching AI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setMsg(null);
      const res = await api.post('/settings/ai', { useExternalAi });
      setMsg(res.data.message);
    } catch (err: any) {
      alert('Error updating AI settings');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure AI sentiment engine and system parameters</p>
        </div>

        {msg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>{msg}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* AI Sentiment Engine Toggle */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-start space-x-4">
              <Bot className="h-8 w-8 text-blue-600 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">AI Sentiment Engine Toggle</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Enable Google Gemini 1.5 Flash Cloud AI for student comment sentiment processing, or disable it to use the zero-cost Offline Lexicon NLP Engine.
                </p>

                {loading ? (
                  <div className="py-4 text-sm text-slate-400">Loading settings...</div>
                ) : (
                  <div className="mt-4 flex items-center space-x-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useExternalAi}
                        onChange={(e) => setUseExternalAi(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className="text-sm font-semibold text-slate-900">
                      {useExternalAi ? 'Google Gemini 1.5 Flash Enabled' : 'Offline Lexicon NLP Engine Active'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 flex justify-end">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Info className="h-5 w-5 text-slate-500" />
              <h3>System Information</h3>
            </div>
            <ul className="text-sm text-slate-600 space-y-1">
              <li><strong className="text-slate-800">Stack:</strong> MERN (MongoDB, Express, React, Node.js)</li>
              <li><strong className="text-slate-800">Authentication:</strong> JWT httpOnly Cookies</li>
              <li><strong className="text-slate-800">Excel Export Engine:</strong> ExcelJS Master Template System</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
