import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { readJsonSafe } from '../utils/http';

interface AdminLoginViewProps {
  onLoginSuccess: (token: string, username: string) => void;
  onBack: () => void;
}

export function AdminLoginView({ onLoginSuccess, onBack }: AdminLoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('请输入管理员账号');
      return;
    }
    if (!password) {
      setErrorMsg('请输入登录密码');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const parsed = await readJsonSafe<{
        ok?: boolean;
        token?: string;
        username?: string;
        message?: string;
      }>(res);
      if (!parsed.ok || !parsed.data?.ok || !parsed.data.token) {
        setErrorMsg(parsed.data?.message || parsed.errorMessage || '管理员账号或密码错误');
        return;
      }

      onLoginSuccess(parsed.data.token, parsed.data.username || username.trim());
    } catch {
      setErrorMsg('网络请求失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-4 pb-10">
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-surface-container space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-[20px] font-bold text-on-surface tracking-tight">
            管理员后台登录
          </h1>
          <p className="text-[13px] text-on-surface-variant leading-relaxed">
            登录后可管理利安花园业主调查问卷列表，执行新增、核验、修改与删除操作
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="admin-username" className="text-[13px] font-medium text-on-surface block">
              管理员账号
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="请输入管理员账号"
                className="w-full h-12 pl-10 pr-3.5 rounded-xl bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-[13px] font-medium text-on-surface block">
              登录密码
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="请输入登录密码"
                className="w-full h-12 pl-10 pr-11 rounded-xl bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                className="absolute right-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl p-3 bg-error-container text-on-error-container flex items-center gap-2 text-[13px] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-primary text-on-primary text-[15px] font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在验证登录...</span>
              </>
            ) : (
              <span>登录管理后台</span>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="w-full h-10 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回业主问卷列表</span>
        </button>
      </div>
    </div>
  );
}
