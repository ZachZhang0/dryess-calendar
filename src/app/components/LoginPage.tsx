import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Calendar, Lock, User, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string, remember: boolean) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 简单验证
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    // 共享账号密码验证（演示版本）
    if (username === 'dryess' && password === 'critical666') {
      onLogin(username, password, remember);
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/10 backdrop-blur-2xl relative z-10 border border-white/20">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-xl opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-cyan-400 to-blue-600 p-4 rounded-2xl shadow-2xl">
                <Calendar className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-3xl text-white tracking-tight flex items-center justify-center gap-2">
              Dry ESS Critical Event
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </CardTitle>
            <CardDescription className="text-cyan-200/80 text-base">
              部门大事件日历系统
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-white/90">用户名</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-cyan-400 focus:ring-cyan-400/50 backdrop-blur-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-white/90">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-cyan-400 focus:ring-cyan-400/50 backdrop-blur-xl"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked as boolean)}
                className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer text-white/80"
              >
                记住登录状态
              </Label>
            </div>
            {error && (
              <div className="text-sm text-red-200 bg-red-500/20 border border-red-500/30 p-3 rounded-xl flex items-center gap-2 backdrop-blur-xl">
                <span className="text-red-300">⚠️</span>
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-xl shadow-cyan-500/50 text-base border-0 text-white"
            >
              登录系统
            </Button>

          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-white/40 text-sm">
          Powered by Figma Make
        </p>
      </div>
    </div>
  );
}
