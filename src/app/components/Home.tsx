import { Link, useNavigate } from "react-router";
import { BookOpen, Plus, User, Edit, Save, X, LogOut, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../../services/api";

interface Story {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  hasVoice: boolean;
  cover?: string;
}

export function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string; email: string; avatar?: string; bio?: string } | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{ username: string; email: string; avatar?: string; bio?: string }>({
    username: "访客宝贝",
    email: "",
    avatar: "",
    bio: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEditingUser(parsedUser);
    }

    // 获取用户信息
    if (token) {
      const fetchUserInfo = async () => {
        try {
          const response = await api.user.getProfile(token);
          if (response.success) {
            setUser(response.user);
            setEditingUser(response.user);
            localStorage.setItem("user", JSON.stringify(response.user));
          }
        } catch (err) {
          console.error("获取用户信息失败:", err);
        }
      };
      fetchUserInfo();

      // 获取故事列表
      const fetchStories = async () => {
        try {
          const response = await api.story.list({ page: 1, pageSize: 20 }, token);
          if (response.success) {
            setStories(response.data);
          }
        } catch (err) {
          console.error("获取故事列表失败:", err);
          // 失败时使用本地存储的故事
          const storedStories = localStorage.getItem("stories");
          if (storedStories) {
            setStories(JSON.parse(storedStories));
          }
        }
      };
      fetchStories();
    } else {
      // 未登录时使用本地存储的故事
      const storedStories = localStorage.getItem("stories");
      if (storedStories) {
        setStories(JSON.parse(storedStories));
      }
    }
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await api.user.logout(token);
      } catch (err) {
        console.error("登出失败:", err);
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

    try {
      const response = await api.user.updateProfile(
        {
          username: editingUser.username,
          email: editingUser.email,
          avatar: editingUser.avatar
        },
        token
      );

      if (response.success) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        setShowUserModal(false);
      } else {
        setError(response.message || "修改失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("修改个人信息失败:", err);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-indigo-950/80 backdrop-blur-sm border-b border-indigo-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">梦境编织者</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm hover:text-purple-300 transition-colors">书藏馆</Link>
            <Link to="/" className="text-sm hover:text-purple-300 transition-colors">创作工坊</Link>
            <Link to="/voice-lab" className="text-sm hover:text-purple-300 transition-colors">声音实验室</Link>
            <Link to="/" className="text-sm hover:text-purple-300 transition-colors">访客宝贝</Link>
            
            <div className="relative">
              <button 
                onClick={() => setShowUserModal(true)}
                className="w-10 h-10 rounded-full bg-indigo-800 flex items-center justify-center hover:bg-indigo-700 transition-colors"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.nickname} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-indigo-900 border border-indigo-800 rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="relative w-20 h-20 mx-auto mb-4">
                {editingUser.avatar ? (
                  <img src={editingUser.avatar} alt={editingUser.username} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-800 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <h3 className="text-lg font-semibold">编辑个人信息</h3>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-indigo-200 mb-2">用户名</label>
                <input 
                  type="text" 
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-400"
                  placeholder="请输入用户名"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm text-indigo-200 mb-2">邮箱</label>
                <input 
                  type="email" 
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-400"
                  placeholder="请输入邮箱"
                />
              </div>
              
              <div>
                <label className="block text-sm text-indigo-200 mb-2">个性签名</label>
                <textarea 
                  value={editingUser.bio}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  className="w-full px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-400"
                  placeholder="写下一句话吧..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleSaveUser}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "保存中..." : "保存修改"}
                </button>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
              </div>
              
              <div className="mt-4">
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 bg-red-600/30 border border-red-600/50 rounded-lg hover:bg-red-600/40 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-indigo-950/80 z-10"></div>
          <img 
            src="/src/assets/images/bg.jpg" 
            alt="小屋背景" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <span className="inline-block px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm font-medium mb-4">NEW FEATURE</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AI 合成
              <br />
              <span className="text-purple-300">由爸爸妈妈讲故事</span>
            </h1>

            <Link 
              to="/create" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
              立即生成新故事
            </Link>
          </div>
          

        </div>
      </section>

      {/* Stories Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">全部故事</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.length === 0 ? (
            // 示例故事卡片
            <>
              <Link 
                to="/story/1" 
                className="bg-indigo-800/30 border border-indigo-700 rounded-xl overflow-hidden hover:bg-indigo-800/50 transition-colors"
              >
                <div className="h-48 bg-pink-500/30 flex items-center justify-center">
                  <div className="text-6xl">❤️</div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold mb-2">拇指姑娘</h3>
                  <p className="text-sm text-indigo-300 mb-4">经典童话 · 3-6岁</p>
                  <div className="flex items-center justify-center">
                    <button className="w-10 h-10 rounded-full bg-purple-600/50 flex items-center justify-center hover:bg-purple-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
              
              <Link 
                to="/story/2" 
                className="bg-indigo-800/30 border border-indigo-700 rounded-xl overflow-hidden hover:bg-indigo-800/50 transition-colors"
              >
                <div className="h-48 bg-blue-500/30 flex items-center justify-center">
                  <div className="text-6xl">🚀</div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold mb-2">星际小火箭</h3>
                  <p className="text-sm text-indigo-300 mb-4">科普故事 · 5-8岁</p>
                  <div className="flex items-center justify-center">
                    <button className="w-10 h-10 rounded-full bg-purple-600/50 flex items-center justify-center hover:bg-purple-600 transition-colors">
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
                <Link
                  to={`/story/${story.id}`}
                  className="bg-indigo-800/30 border border-indigo-700 rounded-xl overflow-hidden hover:bg-indigo-800/50 transition-colors block"
                >
                  <div className="h-48">
                    {story.cover ? (
                      <img src={story.cover} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-700/50 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-indigo-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold mb-2">{story.title}</h3>
                    <p className="text-sm text-indigo-300 mb-4 line-clamp-2">{story.summary}</p>
                    <div className="flex items-center justify-center">
                      <button className="w-10 h-10 rounded-full bg-purple-600/50 flex items-center justify-center hover:bg-purple-600 transition-colors">
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
                    if (window.confirm('确定要删除这个故事吗？')) {
                      const storedStories = localStorage.getItem('stories');
                      if (storedStories) {
                        const stories = JSON.parse(storedStories);
                        const updatedStories = stories.filter((s: any) => s.id !== story.id);
                        localStorage.setItem('stories', JSON.stringify(updatedStories));
                        window.location.reload();
                      }
                    }
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center hover:bg-red-600/50 transition-colors z-10"
                  title="删除故事"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
