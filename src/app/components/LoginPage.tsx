import { Link, useNavigate, useSearchParams } from "react-router";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";

export function LoginPage() {
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
      const response = await api.user.login({
        username: username.trim(),
        password,
      });

      if (response.success) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
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
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden rounded-[32px] border border-[#8a78b7]/20 bg-[#111209]/50 p-10 shadow-2xl shadow-black/20 backdrop-blur-sm lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-[#231c40]/80 px-4 py-2">
            <BookOpen className="h-5 w-5 text-[#d8ddff]" />
            <span className="text-sm tracking-[0.2em] text-[#d8ddff]">STORY GENERATOR</span>
          </div>
          <h1 className="max-w-lg text-5xl font-semibold leading-tight text-[#ede8ff]">
            用柔和的夜色与紫蓝色，把故事继续讲下去。
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#b8afdf]">
            登录后即可继续管理个人资料、查看故事内容和进入创作流程。页面配色已向你提供的黑紫蓝参考色靠拢。
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#8a78b7]/22 p-4">
              <div className="mb-2 h-2 w-16 rounded-full bg-[#8a78b7]"></div>
              <p className="text-sm text-[#ede8ff]">Smoky Black</p>
            </div>
            <div className="rounded-2xl bg-[#63549f]/30 p-4">
              <div className="mb-2 h-2 w-16 rounded-full bg-[#63549f]"></div>
              <p className="text-sm text-[#ede8ff]">Liberty</p>
            </div>
            <div className="rounded-2xl bg-[#6b75c9]/30 p-4">
              <div className="mb-2 h-2 w-16 rounded-full bg-[#6b75c9]"></div>
              <p className="text-sm text-[#ede8ff]">Violet Blue</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#8a78b7]/25 bg-[#111209]/82 p-8 shadow-2xl shadow-black/30 backdrop-blur-md">
          <div className="mb-8 text-center">
            <Link to="/" className="mb-6 inline-flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-[#d8ddff]" />
              <span className="text-xl font-semibold text-[#ede8ff]">故事创作平台</span>
            </Link>
            <h2 className="text-3xl font-semibold text-white">登录</h2>
            <p className="mt-2 text-sm text-[#b8afdf]">输入账号与密码，继续你的故事旅程</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</div>}

            <div>
              <label htmlFor="username" className="mb-2 block text-sm text-[#d8ddff]">用户名</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-[#63549f]/45 bg-[#231c40]/72 px-4 py-3 text-white placeholder:text-[#8a78b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-[#d8ddff]">密码</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#63549f]/45 bg-[#231c40]/72 px-4 py-3 text-white placeholder:text-[#8a78b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]"
                placeholder="请输入密码"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#63549f] py-3 text-white transition-colors hover:bg-[#6b75c9] disabled:cursor-not-allowed disabled:opacity-50"
            >
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
