import { Link, useNavigate } from "react-router";
import { BookOpen, Plus, User, Save, X, LogOut, Trash2, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../services/api";

interface Story {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  hasVoice: boolean;
  cover?: string;
}

interface UserProfile {
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  nickname?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const defaultUser: UserProfile = { username: "访客宝贝", email: "", avatar: "", bio: "" };
const defaultPasswordForm: PasswordForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

function normalizeUser(user: Partial<UserProfile> | null | undefined): UserProfile {
  if (!user) return defaultUser;
  const username = user.username || user.nickname || defaultUser.username;
  return { ...defaultUser, ...user, username, nickname: user.nickname || username };
}

export function HomeModalDismiss() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile>(defaultUser);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(defaultPasswordForm);
  const [loading, setLoading] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser) {
      const parsedUser = normalizeUser(JSON.parse(storedUser));
      setUser(parsedUser);
      setEditingUser(parsedUser);
    }
    if (token) {
      api.user.getProfile(token).then((response) => {
        if (response.success) {
          const nextUser = normalizeUser(response.user);
          setUser(nextUser);
          setEditingUser(nextUser);
          localStorage.setItem("user", JSON.stringify(nextUser));
        }
      }).catch(() => {});
      api.story.list({ page: 1, pageSize: 20 }, token).then((response) => {
        if (response.success) setStories(response.data);
      }).catch(() => {
        const storedStories = localStorage.getItem("stories");
        if (storedStories) setStories(JSON.parse(storedStories));
      });
    } else {
      const storedStories = localStorage.getItem("stories");
      if (storedStories) setStories(JSON.parse(storedStories));
    }
  }, []);

  const displayUser = user ? normalizeUser(user) : defaultUser;

  const closeModal = () => {
    setEditingUser(displayUser);
    setPasswordForm(defaultPasswordForm);
    setError("");
    setPasswordError("");
    setPasswordMessage("");
    setShowUserModal(false);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try { await api.user.logout(token); } catch {}
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const handleSaveUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    setError("");
    const nextUser = normalizeUser(editingUser);
    const saveToLocal = () => {
      const localUser = normalizeUser({ ...(user || {}), ...nextUser });
      setUser(localUser);
      setEditingUser(localUser);
      localStorage.setItem("user", JSON.stringify(localUser));
      setShowUserModal(false);
    };
    try {
      const response = await api.user.updateProfile({ username: nextUser.username, email: nextUser.email, avatar: nextUser.avatar, bio: nextUser.bio }, token);
      if (response.success) {
        const mergedUser = normalizeUser({ ...response.user, ...nextUser, bio: nextUser.bio });
        setUser(mergedUser);
        setEditingUser(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
        setShowUserModal(false);
      } else {
        saveToLocal();
      }
    } catch {
      saveToLocal();
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError("");
    setPasswordMessage("");
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("请完整填写密码信息");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setPasswordError("请先登录");
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await api.user.updatePassword(
        {
          oldPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        token,
      );
      if (response.success) {
        setPasswordMessage("修改成功");
        setPasswordForm(defaultPasswordForm);
      } else {
        setPasswordError(response.message || "修改失败");
      }
    } catch {
      setPasswordError("网络错误，请稍后重试");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setEditingUser({ ...editingUser, avatar: event.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111209] via-[#231c40] to-[#111209] text-white">
      <header className="border-b border-[#6b75c9]/20 bg-[#111209]/88 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6b75c9]"><BookOpen className="h-5 w-5 text-white" /></div>
              <span className="text-lg font-semibold text-[#e4ddff]">梦境编织者</span>
            </div>
            <nav className="flex items-center gap-2 rounded-full border border-[#6b75c9]/25 bg-[#231c40]/70 px-2 py-2 shadow-lg shadow-black/10">
              <Link to="/" className="rounded-full px-4 py-2 text-sm font-medium text-[#efeaff] transition-colors hover:bg-[#63549f]/45 hover:text-white">书藏馆</Link>
              <Link to="/create" className="rounded-full px-4 py-2 text-sm font-medium text-[#d9d0ff] transition-colors hover:bg-[#63549f]/45 hover:text-white">创作工坊</Link>
              <Link to="/voice-lab" className="rounded-full px-4 py-2 text-sm font-medium text-[#d9d0ff] transition-colors hover:bg-[#63549f]/45 hover:text-white">声音实验室</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#a7a8b7]">{displayUser.username}</span>
            <button onClick={() => setShowUserModal(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#63549f]/40 transition-colors hover:bg-[#63549f]/65">
              {displayUser.avatar ? <img src={displayUser.avatar} alt={displayUser.username} className="h-10 w-10 rounded-full object-cover" /> : <User className="h-5 w-5 text-white" />}
            </button>
          </div>
        </div>
      </header>

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8" onClick={closeModal}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#8a78b7]/30 bg-[#111209] p-6 shadow-2xl shadow-black/30" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 text-center">
              <div className="relative mx-auto mb-4 h-20 w-20">
                {editingUser.avatar ? <img src={editingUser.avatar} alt={editingUser.username} className="h-20 w-20 rounded-full object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#231c40]"><User className="h-10 w-10 text-white" /></div>}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 cursor-pointer opacity-0" />
              </div>
              <h3 className="text-lg font-semibold text-[#ede8ff]">编辑个人信息</h3>
            </div>
            {error && <div className="mb-4 rounded-lg bg-[#6b75c9]/15 p-3 text-sm text-[#d8ddff]">{error}</div>}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value, nickname: e.target.value })}
                  className="w-full rounded-lg border border-[#63549f]/40 bg-[#231c40]/75 px-4 py-2 text-white"
                  placeholder="请输入昵称"
                />
                <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full rounded-lg border border-[#63549f]/40 bg-[#231c40]/75 px-4 py-2 text-white" placeholder="请输入邮箱" />
                <textarea value={editingUser.bio} onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })} className="w-full rounded-lg border border-[#63549f]/40 bg-[#231c40]/75 px-4 py-2 text-white" placeholder="写下一句介绍自己吧" rows={4} />
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSaveUser} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#63549f] px-4 py-2 text-white transition-colors hover:bg-[#6b75c9] disabled:opacity-50"><Save className="h-4 w-4" />{loading ? "保存中..." : "保存修改"}</button>
                  <button onClick={closeModal} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#63549f]/50 bg-[#231c40]/65 px-4 py-2 text-white transition-colors hover:bg-[#231c40]"><X className="h-4 w-4" />取消</button>
                </div>
                <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/25 bg-red-500/12 px-4 py-2 text-red-100 transition-colors hover:bg-red-500/20"><LogOut className="h-4 w-4" />退出登录</button>
              </div>
              <div className="rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-4">
                <div className="mb-4 flex items-center gap-2 text-[#ede8ff]"><KeyRound className="h-4 w-4" /><h4 className="text-base font-semibold">修改密码</h4></div>
                {passwordError && <div className="mb-4 rounded-lg bg-red-500/15 p-3 text-sm text-red-200">{passwordError}</div>}
                {passwordMessage && <div className="mb-4 rounded-lg bg-[#6b75c9]/15 p-3 text-sm text-[#d8ddff]">{passwordMessage}</div>}
                <div className="space-y-4">
                  <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full rounded-lg border border-[#63549f]/40 bg-[#111209]/70 px-4 py-2 text-white" placeholder="请输入当前密码" />
                  <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full rounded-lg border border-[#63549f]/40 bg-[#111209]/70 px-4 py-2 text-white" placeholder="请输入新密码" />
                  <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full rounded-lg border border-[#63549f]/40 bg-[#111209]/70 px-4 py-2 text-white" placeholder="请再次输入新密码" />
                  <button onClick={handlePasswordSave} disabled={passwordSaving} className="w-full rounded-lg bg-[#8a78b7] px-4 py-2 text-[#111209] transition-colors hover:bg-[#a7a8b7] disabled:opacity-50">{passwordSaving ? "处理中..." : "确认修改密码"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-16">
        <div className="absolute inset-0 z-0"><div className="absolute inset-0 z-10 bg-gradient-to-r from-[#111209]/88 via-[#231c40]/72 to-[#111209]/88"></div><img src="/src/assets/images/bg.jpg" alt="小屋背景" className="h-full w-full object-cover" /></div>
        <div className="relative z-10 flex flex-col items-center justify-between md:flex-row">
          <div className="mb-8 md:mb-0 md:w-1/2">
            <span className="mb-4 inline-block rounded-full bg-[#8a78b7]/20 px-3 py-1 text-sm font-medium text-[#d8ddff]">NEW FEATURE</span>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">AI 合成<br /><span className="text-[#d8ddff]">由爸爸妈妈讲故事</span></h1>
            <Link to="/create" className="inline-flex items-center gap-2 rounded-lg bg-[#63549f] px-6 py-3 transition-colors hover:bg-[#6b75c9]"><Plus className="h-5 w-5" />立即生成新故事</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between"><h2 className="text-2xl font-semibold text-[#ede8ff]">全部故事</h2></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <div key={story.id} className="relative">
              <Link to={`/story/${story.id}`} className="block overflow-hidden rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 transition-colors hover:bg-[#231c40]/70">
                <div className="h-48">{story.cover ? <img src={story.cover} alt={story.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-[#231c40]/75"><BookOpen className="h-12 w-12 text-[#a7a8b7]" /></div>}</div>
                <div className="p-6"><h3 className="mb-2 font-semibold text-[#ede8ff]">{story.title}</h3><p className="mb-4 line-clamp-2 text-sm text-[#a7a8b7]">{story.summary}</p></div>
              </Link>
              <button onClick={() => {
                if (window.confirm("确定要删除这个故事吗？")) {
                  const storedStories = localStorage.getItem("stories");
                  if (storedStories) {
                    const localStories = JSON.parse(storedStories);
                    const updatedStories = localStories.filter((s: Story) => s.id !== story.id);
                    localStorage.setItem("stories", JSON.stringify(updatedStories));
                    window.location.reload();
                  }
                }
              }} className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/25 transition-colors hover:bg-red-500/40" title="删除故事"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
