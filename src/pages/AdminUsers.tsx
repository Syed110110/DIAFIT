import { FormEvent, useState } from 'react';
import { adminService } from '../services/api';

const roles = ['PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR', 'ADMIN'] as const;

export default function AdminUsers() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'PATIENT' });
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setIsSaving(true);
    try {
      await adminService.createUser(form);
      setMessage(`Created ${form.role} account for ${form.email}.`);
      setForm({ name: '', email: '', password: '', role: 'PATIENT' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create account.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="dia-workspace mx-auto min-h-screen max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Provision an account</h1>
      <p className="mt-2 text-sm text-gray-600">Admin accounts can manage identities but cannot access patient clinical records.</p>
      <form onSubmit={submit} className="mt-8 space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700">
          Full name
          <input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Email
          <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Temporary password
          <input required type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Role
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2">
            {roles.map((role) => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}
          </select>
        </label>
        <button disabled={isSaving} className="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60">
          {isSaving ? 'Creating...' : 'Create account'}
        </button>
        {message && <p role="status" className="text-sm text-gray-700">{message}</p>}
      </form>
    </main>
  );
}