import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Map, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

function SignInForm({ role }: { role: 'user' | 'admin' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({ name: '', email: '', password: '' });
  const destination = (location.state as { from?: string } | null)?.from || (role === 'admin' ? '/admin' : '/dashboard');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegistering && role === 'user') {
        await register({
          name: fields.name,
          email: fields.email,
          password: fields.password,
        });
      } else {
        await login(fields.email, fields.password, role);
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to sign in. Please check your details.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-lg">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#0F766E] text-white">
            {role === 'admin' ? <ShieldCheck /> : <Map />}
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">GeoLedger {role === 'admin' ? 'Admin' : ''}</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {isRegistering ? 'Create your user account' : `Sign in to your ${role} account`}
          </p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          {isRegistering && (
            <label className="block text-sm font-medium text-[#334155]">
              Full name
              <input required minLength={2} autoComplete="name" value={fields.name}
                onChange={(e) => setFields({ ...fields, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2" />
            </label>
          )}
          <label className="block text-sm font-medium text-[#334155]">
            Email
            <input required type="email" autoComplete="email" value={fields.email}
              onChange={(e) => setFields({ ...fields, email: e.target.value })}
              className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2" />
          </label>
          <label className="block text-sm font-medium text-[#334155]">
            Password
            <input required type="password" minLength={isRegistering ? 10 : undefined}
              autoComplete={isRegistering ? 'new-password' : 'current-password'} value={fields.password}
              onChange={(e) => setFields({ ...fields, password: e.target.value })}
              className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2" />
            {isRegistering && <span className="mt-1 block text-xs text-[#64748B]">Use at least 10 characters.</span>}
          </label>
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0F766E] px-4 py-3 font-medium text-white hover:bg-[#115E59] disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>
        {role === 'user' && (
          <button type="button" onClick={() => { setError(''); setIsRegistering(!isRegistering); }}
            className="mt-5 w-full text-sm text-[#0F766E] hover:underline">
            {isRegistering ? 'Already registered? Sign in' : 'New to GeoLedger? Create an account'}
          </button>
        )}
        <div className="mt-6 flex justify-between text-sm">
          <Link to="/" className="text-[#64748B] hover:text-[#0F766E]">Back to home</Link>
          {role === 'user'
            ? <Link to="/admin/login" className="text-[#64748B] hover:text-[#0F766E]">Admin sign in</Link>
            : <Link to="/login" className="text-[#64748B] hover:text-[#0F766E]">User sign in</Link>}
        </div>
      </section>
    </main>
  );
}

export function Login() {
  return <SignInForm role="user" />;
}

export function AdminLogin() {
  return <SignInForm role="admin" />;
}
