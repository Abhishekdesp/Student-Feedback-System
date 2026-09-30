import React, { useState } from 'react';
import { useQuestionsList, useCreateQuestion, useDeleteQuestion } from '../hooks/useQuestions';
import { Trash2, Plus, HelpCircle } from 'lucide-react';

export const Questions: React.FC = () => {
  const { data: questions, isLoading, error } = useQuestionsList();
  const createMutation = useCreateQuestion();
  const deleteMutation = useDeleteQuestion();

  const [newQuestionText, setNewQuestionText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    try {
      await createMutation.mutateAsync(newQuestionText.trim());
      setNewQuestionText('');
      setMsg('Question added successfully!');
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding question');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        alert('Error deleting question');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center space-x-3 border-b border-slate-200 pb-4 mb-6">
          <HelpCircle className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Survey Question Management</h1>
            <p className="text-sm text-slate-500 mt-1">Configure evaluation survey criteria for students</p>
          </div>
        </div>

        {msg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
            {msg}
          </div>
        )}

        {/* Question List */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Active Questions ({questions?.length || 0})</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">Error loading questions.</div>
          ) : !questions || questions.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-center text-sm">
              No survey questions found. Add a question below to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
              {questions.map((q, idx) => (
                <div key={q._id} className="p-4 bg-white flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <span className="h-6 w-6 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-900">{q.text}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(q._id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete Question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Question Form */}
        <form onSubmit={handleAddQuestion} className="bg-slate-50 p-6 border border-slate-200 rounded-xl space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Add New Survey Question</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
            <input
              type="text"
              required
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="e.g. Clarity of explanation and domain expertise?"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{createMutation.isPending ? 'Adding...' : 'Add Question'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
