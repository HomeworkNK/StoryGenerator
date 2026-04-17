import { Link, useNavigate } from "react-router";
import { BookOpen, Upload, User } from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";

export function RegisterCentered() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.user.register({ username: username.trim(), password, email: email.trim() });
      if (response.success) {
        navigate("/login");
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
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-md rounded-[28px] border border-[#8a78b7]/25 bg-[#111209]/82 p-8 shadow-2xl shadow-black/30 backdrop-blur-md">
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
              <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-[#63549f]/45 bg-[#231c40]/72 px-4 py-3 text-white placeholder:text-[#8a78b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]" placeholder="请输入用户名" required />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-[#d8ddff]">邮箱</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-[#63549f]/45 bg-[#231c40]/72 px-4 py-3 text-white placeholder:text-[#8a78b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]" placeholder="请输入邮箱" required />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-[#d8ddff]">密码</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[#63549f]/45 bg-[#231c40]/72 px-4 py-3 text-white placeholder:text-[#8a78b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]" placeholder="请输入密码" required />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#d8ddff]">头像</label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-[#8a78b7]/45 bg-[#231c40]/55 px-4 py-3 transition-colors hover:border-[#6b75c9]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#63549f]/35">
                    {avatar ? <img src={avatar} alt="头像预览" className="h-11 w-11 rounded-full object-cover" /> : <User className="h-5 w-5 text-[#d8ddff]" />}
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

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#63549f] py-3 text-white transition-colors hover:bg-[#6b75c9] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "注册中..." : "注册"}
            </button>

            <p className="text-center text-sm text-[#b8afdf]">
              已有账号？
              <Link to="/login" className="ml-1 text-[#d8ddff] hover:text-white">去登录</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
