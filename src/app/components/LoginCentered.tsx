import { Link, useNavigate, useSearchParams } from "react-router";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";

export function LoginCentered() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.user.login({ username: username.trim(), password });
      if (response.success && response.token) {
        localStorage.setItem("token", response.token);
        // 尝试获取用户信息并保存
        const profileResponse = await api.user.getProfile(response.token);
        if (profileResponse.success && profileResponse.user) {
          localStorage.setItem("user", JSON.stringify(profileResponse.user));
        }
        const redirect = searchParams.get("redirect") || "/";
        navigate(redirect);
      } else {
        setError(response.message || "登录失败");
      }
    } catch (err) {
      setError("网络异常，请稍后重试");
      console.error("登录失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#111209_0%,#231c40_52%,#111209_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-sm rounded-[24px] border border-[#8a78b7]/25 bg-[#111209]/82 p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
          <div className="mb-6 text-center">
            <Link to="/" className="mb-6 inline-flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-[#d8ddff]" />
              <span className="text-xl font-semibold text-[#ede8ff]">故事创作平台</span>
            </Link>
            <h2 className="text-2xl font-semibold text-white">登录</h2>
            <p className="mt-2 text-sm text-[#b8afdf]">输入账号与密码，继续你的故事旅程</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</div>}

            <div>
              <label htmlFor="username" className="mb-2 block text-sm text-[#d8ddff]">用户名</label>
              <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-[#63549f]/45 bg-[#231c40]/72 px-4 py-3 text-white placeholder:text-[#8a78b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]" placeholder="请输入用户名" required />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-[#d8ddff]">密码</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[#63549f]/45 bg-[#231c40]/72 px-4 py-3 text-white placeholder:text-[#8a78b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]" placeholder="请输入密码" required />
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#63549f] py-3 text-white transition-colors hover:bg-[#6b75c9] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "登录中..." : "登录"}
            </button>

            <p className="text-center text-sm text-[#b8afdf]">
              还没有账号？
              <Link to="/register" className="ml-1 text-[#d8ddff] hover:text-white">去注册</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
