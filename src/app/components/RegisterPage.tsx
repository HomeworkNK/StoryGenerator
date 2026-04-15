import { Link, useNavigate } from "react-router";
import { BookOpen, Upload, User } from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.user.register({
        username: username.trim(),
        password,
        email: email.trim(),
      });

      if (response.success) {
        localStorage.setItem("token", response.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...response.user,
            avatar: response.user?.avatar || avatar,
            username: response.user?.username || username.trim(),
            nickname: response.user?.nickname || username.trim(),
          }),
        );
        navigate("/");
      } else {
        setError(response.message || "注册失败");
      }
    } catch (err) {
      setError("网络异常，请稍后重试");
      console.error("注册失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#111209_0%,#231c40_52%,#111209_100%)] px-6 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#8a78b7]/25 bg-[#111209]/82 p-8 shadow-2xl shadow-black/30 backdrop-blur-md">
          <div className="mb-8 text-center">
            <Link to="/" className="mb-6 inline-flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-[#d8ddff]" />
              <span className="text-xl font-semibold text-[#ede8ff]">故事创作平台</span>
            </Link>
            <h2 className="text-3xl font-semibold text-white">注册</h2>
            <p className="mt-2 text-sm text-[#b8afdf]">创建账号后即可进入首页与个人资料编辑页</p>
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
              <label htmlFor="email" className="mb-2 block text-sm text-[#d8ddff]">邮箱</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#63549f]/45 bg-[#231c40]/72 px-4 py-3 text-white placeholder:text-[#8a78b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]"
                placeholder="请输入邮箱"
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

            <div>
              <label className="mb-2 block text-sm text-[#d8ddff]">头像</label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-[#8a78b7]/45 bg-[#231c40]/55 px-4 py-3 transition-colors hover:border-[#6b75c9]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#63549f]/35">
                    {avatar ? (
                      <img src={avatar} alt="头像预览" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-[#d8ddff]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#ede8ff]">上传头像</p>
                    <p className="text-xs text-[#8a78b7]">仅做前端显示预览</p>
                  </div>
                </div>
                <Upload className="h-4 w-4 text-[#d8ddff]" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#63549f] py-3 text-white transition-colors hover:bg-[#6b75c9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "注册中..." : "注册"}
            </button>

            <p className="text-center text-sm text-[#b8afdf]">
              已有账号？
              <Link to="/login" className="ml-1 text-[#d8ddff] hover:text-white">去登录</Link>
            </p>
          </form>
        </div>

        <div className="hidden rounded-[32px] border border-[#8a78b7]/20 bg-[#111209]/50 p-10 shadow-2xl shadow-black/20 backdrop-blur-sm lg:block">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-[#111209] p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[#8a78b7]">Smoky Black</p>
              <p className="mt-3 text-3xl font-semibold text-[#ede8ff]">#111209</p>
            </div>
            <div className="rounded-3xl bg-[#8a78b7] p-6 text-[#231c40]">
              <p className="text-sm uppercase tracking-[0.18em]">Middle Blue Purple</p>
              <p className="mt-3 text-3xl font-semibold">#8A78B7</p>
            </div>
            <div className="rounded-3xl bg-[#63549f] p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[#d8ddff]">Liberty</p>
              <p className="mt-3 text-3xl font-semibold text-white">#63549F</p>
            </div>
            <div className="rounded-3xl bg-[#6b75c9] p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[#ede8ff]">Violet Blue</p>
              <p className="mt-3 text-3xl font-semibold text-white">#6B75C9</p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] bg-[#231c40] p-8">
            <p className="text-sm tracking-[0.18em] text-[#a7a8b7]">注册完成后</p>
            <h3 className="mt-3 text-3xl font-semibold text-[#ede8ff]">可以直接进入首页并打开个人信息编辑弹窗。</h3>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#b8afdf]">
              这里保持现有接口不改，只补充前端注册页展示、头像预览和统一的黑紫蓝视觉风格。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
