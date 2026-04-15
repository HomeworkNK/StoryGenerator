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

const defaultUser: UserProfile = {
  username: "访客宝贝",
  email: "",
  avatar: "",
  bio: "",
};

const defaultPasswordForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function normalizeUser(user: Partial<UserProfile> | null | undefined): UserProfile {
  if (!user) return defaultUser;
  const username = user.username || user.nickname || defaultUser.username;

  return {
    ...defaultUser,
    ...user,
    username,
    nickname: user.nickname || username,
  };
}

export function HomeFixed() {
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
      const fetchUserInfo = async () => {
        try {
          const response = await api.user.getInfo(token);
          if (response.success) {
            const nextUser = normalizeUser(response.user);
            setUser(nextUser);
            setEditingUser(nextUser);
            localStorage.setItem("user", JSON.stringify(nextUser));
          }
        } catch (err) {
          console.error("获取用户信息失败:", err);
        }
      };
      fetchUserInfo();

      const fetchStories = async () => {
        try {
          const response = await api.story.list({ page: 1, pageSize: 20 }, token);
          if (response.success) {
            setStories(response.data);
          }
        } catch (err) {
          console.error("获取故事列表失败:", err);
          const storedStories = localStorage.getItem("stories");
          if (storedStories) {
            setStories(JSON.parse(storedStories));
          }
        }
      };
      fetchStories();
    } else {
      const storedStories = localStorage.getItem("stories");
      if (storedStories) {
        setStories(JSON.parse(storedStories));
      }
    }
  }, []);

  const displayUser = user ? normalizeUser(user) : defaultUser;

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await api.user.logout(token);
      } catch (err) {
        console.error("退出登录失败:", err);
      }
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

    try {
      const response = await api.user.updateInfo(
        {
          email: nextUser.email,
          avatar: nextUser.avatar,
        },
        token,
      );

      if (response.success) {
        const mergedUser = normalizeUser({
          ...nextUser,
          ...response.user,
          bio: nextUser.bio,
        });
        setUser(mergedUser);
        setEditingUser(mergedUser);
        localStorage.setItem("user", JSON.stringify(mergedUser));
        setShowUserModal(false);
      } else {
        const fallbackUser = normalizeUser(nextUser);
        setUser(fallbackUser);
        setEditingUser(fallbackUser);
        localStorage.setItem("user", JSON.stringify(fallbackUser));
        setShowUserModal(false);
        setError(response.message || "信息保存失败，已先保存到本地显示。");
      }
    } catch (err) {
      const fallbackUser = normalizeUser(nextUser);
      setUser(fallbackUser);
      setEditingUser(fallbackUser);
      localStorage.setItem("user", JSON.stringify(fallbackUser));
      setShowUserModal(false);
      console.error("修改个人信息失败:", err);
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

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("新密码至少需要 6 位");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }

    setPasswordSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setPasswordMessage("密码修改表单已准备完成，当前为前端演示状态");
      setPasswordForm(defaultPasswordForm);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditingUser({ ...editingUser, avatar: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111209] via-[#231c40] to-[#111209] text-white">
      <header className="border-b border-[#6b75c9]/20 bg-[#111209]/88 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6b75c9]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#e4ddff]">故事创作平台</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm text-[#d9d0ff] transition-colors hover:text-white">书库首页</Link>
            <Link to="/" className="text-sm text-[#d9d0ff] transition-colors hover:text-white">创作工坊</Link>
            <Link to="/" className="text-sm text-[#d9d0ff] transition-colors hover:text-white">声音实验室</Link>
            <span className="text-sm text-[#a7a8b7]">{displayUser.username}</span>

            <button
              onClick={() => {
                setEditingUser(displayUser);
                setPasswordForm(defaultPasswordForm);
                setError("");
                setPasswordError("");
                setPasswordMessage("");
                setShowUserModal(true);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#63549f]/40 transition-colors hover:bg-[#63549f]/65"
            >
              {displayUser.avatar ? (
                <img src={displayUser.avatar} alt={displayUser.username} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#8a78b7]/30 bg-[#111209] p-6 shadow-2xl shadow-black/30">
            <div className="mb-6 text-center">
              <div className="relative mx-auto mb-4 h-20 w-20">
                {editingUser.avatar ? (
                  <img src={editingUser.avatar} alt={editingUser.username} className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#231c40]">
                    <User className="h-10 w-10 text-white" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 cursor-pointer opacity-0" />
              </div>
              <h3 className="text-lg font-semibold text-[#ede8ff]">编辑个人信息</h3>
              <p className="mt-2 text-sm text-[#a7a8b7]">已连接的资料保存逻辑保持不变，新增密码区域仅做前端展示</p>
            </div>

            {error && <div className="mb-4 rounded-lg bg-[#6b75c9]/15 p-3 text-sm text-[#d8ddff]">{error}</div>}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-[#d9d0ff]">用户名</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value, nickname: e.target.value })}
                    className="w-full rounded-lg border border-[#63549f]/40 bg-[#231c40]/75 px-4 py-2 text-white placeholder:text-[#a7a8b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]"
                    placeholder="请输入用户名"
                    disabled
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#d9d0ff]">邮箱</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full rounded-lg border border-[#63549f]/40 bg-[#231c40]/75 px-4 py-2 text-white placeholder:text-[#a7a8b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]"
                    placeholder="请输入邮箱"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#d9d0ff]">个性签名</label>
                  <textarea
                    value={editingUser.bio}
                    onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                    className="w-full rounded-lg border border-[#63549f]/40 bg-[#231c40]/75 px-4 py-2 text-white placeholder:text-[#a7a8b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]"
                    placeholder="写下一句介绍自己吧"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveUser}
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#63549f] px-4 py-2 text-white transition-colors hover:bg-[#6b75c9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? "保存中..." : "保存修改"}
                  </button>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#63549f]/50 bg-[#231c40]/65 px-4 py-2 text-white transition-colors hover:bg-[#231c40]"
                  >
                    <X className="h-4 w-4" />
                    取消
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/25 bg-red-500/12 px-4 py-2 text-red-100 transition-colors hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>

              <div className="rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-4">
                <div className="mb-4 flex items-center gap-2 text-[#ede8ff]">
                  <KeyRound className="h-4 w-4" />
                  <h4 className="text-base font-semibold">修改密码</h4>
                </div>

                {passwordError && <div className="mb-4 rounded-lg bg-red-500/15 p-3 text-sm text-red-200">{passwordError}</div>}
                {passwordMessage && <div className="mb-4 rounded-lg bg-[#6b75c9]/15 p-3 text-sm text-[#d8ddff]">{passwordMessage}</div>}

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-[#d9d0ff]">当前密码</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full rounded-lg border border-[#63549f]/40 bg-[#111209]/70 px-4 py-2 text-white placeholder:text-[#a7a8b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]"
                      placeholder="请输入当前密码"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-[#d9d0ff]">新密码</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full rounded-lg border border-[#63549f]/40 bg-[#111209]/70 px-4 py-2 text-white placeholder:text-[#a7a8b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]"
                      placeholder="请输入新密码"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-[#d9d0ff]">确认新密码</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full rounded-lg border border-[#63549f]/40 bg-[#111209]/70 px-4 py-2 text-white placeholder:text-[#a7a8b7] focus:outline-none focus:ring-2 focus:ring-[#6b75c9]"
                      placeholder="请再次输入新密码"
                    />
                  </div>

                  <button
                    onClick={handlePasswordSave}
                    disabled={passwordSaving}
                    className="w-full rounded-lg bg-[#8a78b7] px-4 py-2 text-[#111209] transition-colors hover:bg-[#a7a8b7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {passwordSaving ? "处理中..." : "确认修改密码"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#111209]/88 via-[#231c40]/72 to-[#111209]/88"></div>
          <img src="/src/assets/images/bg.jpg" alt="小屋背景" className="h-full w-full object-cover" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-between md:flex-row">
          <div className="mb-8 md:mb-0 md:w-1/2">
            <span className="mb-4 inline-block rounded-full bg-[#8a78b7]/20 px-3 py-1 text-sm font-medium text-[#d8ddff]">NEW FEATURE</span>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              AI 合成
              <br />
              <span className="text-[#d8ddff]">由爸爸妈妈讲故事</span>
            </h1>

            <Link to="/create" className="inline-flex items-center gap-2 rounded-lg bg-[#63549f] px-6 py-3 transition-colors hover:bg-[#6b75c9]">
              <Plus className="h-5 w-5" />
              立即生成新故事
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#ede8ff]">全部故事</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.length === 0 ? (
            <>
              <Link to="/story/1" className="overflow-hidden rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 transition-colors hover:bg-[#231c40]/70">
                <div className="flex h-48 items-center justify-center bg-[#8a78b7]/20">
                  <div className="text-6xl">✨</div>
                </div>
                <div className="p-6">
                  <h3 className="mb-2 font-semibold text-[#ede8ff]">拇指姑娘</h3>
                  <p className="mb-4 text-sm text-[#a7a8b7]">经典童话 · 3-6岁</p>
                  <div className="flex items-center justify-center">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#63549f]/60 transition-colors hover:bg-[#63549f]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>

              <Link to="/story/2" className="overflow-hidden rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 transition-colors hover:bg-[#231c40]/70">
                <div className="flex h-48 items-center justify-center bg-[#6b75c9]/20">
                  <div className="text-6xl">🚀</div>
                </div>
                <div className="p-6">
                  <h3 className="mb-2 font-semibold text-[#ede8ff]">星际小火箭</h3>
                  <p className="mb-4 text-sm text-[#a7a8b7]">科普故事 · 5-8岁</p>
                  <div className="flex items-center justify-center">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#63549f]/60 transition-colors hover:bg-[#63549f]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            </>
          ) : (
            stories.map((story) => (
              <div key={story.id} className="relative">
                <Link to={`/story/${story.id}`} className="block overflow-hidden rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 transition-colors hover:bg-[#231c40]/70">
                  <div className="h-48">
                    {story.cover ? (
                      <img src={story.cover} alt={story.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#231c40]/75">
                        <BookOpen className="h-12 w-12 text-[#a7a8b7]" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 font-semibold text-[#ede8ff]">{story.title}</h3>
                    <p className="mb-4 line-clamp-2 text-sm text-[#a7a8b7]">{story.summary}</p>
                    <div className="flex items-center justify-center">
                      <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#63549f]/60 transition-colors hover:bg-[#63549f]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    if (window.confirm("确定要删除这个故事吗？")) {
                      const storedStories = localStorage.getItem("stories");
                      if (storedStories) {
                        const localStories = JSON.parse(storedStories);
                        const updatedStories = localStories.filter((s: Story) => s.id !== story.id);
                        localStorage.setItem("stories", JSON.stringify(updatedStories));
                        window.location.reload();
                      }
                    }
                  }}
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/25 transition-colors hover:bg-red-500/40"
                  title="删除故事"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
