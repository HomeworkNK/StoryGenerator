import { Link, useNavigate } from "react-router";
import { BookOpen, Upload, User } from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";

export function Register() {
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
        password: password,
        email: email.trim(),
      });

      if (response.success) {
        // 存储token
        localStorage.setItem("token", response.token);
        // 存储用户信息
        localStorage.setItem("user", JSON.stringify(response.user));
        navigate("/");
      } else {
        setError(response.message || "注册失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("注册失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="w-8 h-8 text-neutral-900" />
            <span className="text-xl font-semibold text-neutral-900">故事创作平台</span>
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">注册</h1>
          <p className="text-neutral-600">创建你的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-lg p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="输入用户名"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
              邮箱
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="输入邮箱"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
              密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "注册中..." : "注册"}
          </button>

          <p className="text-center text-sm text-neutral-600 mt-6">
            已有账号？{" "}
            <Link to="/login" className="text-neutral-900 hover:underline">
              登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
