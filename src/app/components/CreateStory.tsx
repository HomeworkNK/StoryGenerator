import { Link, useNavigate } from "react-router";
import { BookOpen, X, Sparkles, Clipboard, FileText } from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";

export function CreateStory() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [theme, setTheme] = useState("");
  const [summary, setSummary] = useState("");
  const [style, setStyle] = useState("温馨");
  const [targetAge, setTargetAge] = useState("3-6");
  const [length, setLength] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("paste"); // paste, ai

  const handlePasteContent = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
    } catch (err) {
      setError("粘贴失败，请手动粘贴");
      console.error("粘贴失败:", err);
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      // 未登录时使用本地存储
      const storedStories = localStorage.getItem("stories") || "[]";
      const stories = JSON.parse(storedStories);
      const newStory = {
        id: Date.now().toString(),
        title: title.trim() || "未命名故事",
        content: content.trim(),
        summary: content.trim().substring(0, 100) + "...",
        createdAt: new Date().toISOString(),
        hasVoice: false
      };
      stories.push(newStory);
      localStorage.setItem("stories", JSON.stringify(stories));
      navigate(`/story/${newStory.id}`);
      setLoading(false);
      return;
    }

    try {
      // 这里应该调用创建故事的API，暂时使用模拟数据
      const newStory = {
        id: Date.now().toString(),
        title: title.trim() || "未命名故事",
        content: content.trim(),
        summary: content.trim().substring(0, 100) + "...",
        createdAt: new Date().toISOString(),
        hasVoice: false
      };
      navigate(`/story/${newStory.id}`);
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("创建故事失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("请先登录");
      setLoading(false);
      return;
    }

    try {
      const response = await api.story.create(
        {
          theme: theme.trim(),
          style,
          targetAge,
          length
        },
        token
      );

      if (response.success) {
        // Navigate to story detail
        navigate(`/story/${response.data.id}`);
      } else {
        setError(response.message || "创建故事失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("创建故事失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-950/90 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-4xl w-full mx-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-white">梦境编织者</span>
          </Link>
        </div>

        {/* Modal */}
        <div className="bg-indigo-900 border border-indigo-800 rounded-xl p-8 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">编织一个新梦境</h2>
            <Link to="/" className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center hover:bg-indigo-700 transition-colors">
              <X className="w-4 h-4" />
            </Link>
          </div>
          
          <p className="text-indigo-200 mb-6">创建一个新的故事，您可以选择粘贴已有内容或使用 AI 生成。</p>
          
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 text-red-300 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Story Title */}
          <div className="mb-6">
            <label className="block text-sm text-indigo-200 mb-2">故事名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-400"
              placeholder="输入故事名称"
              required
            />
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-indigo-700 mb-6">
            <button
              onClick={() => setActiveTab("paste")}
              className={`px-4 py-2 mr-2 border-b-2 ${activeTab === "paste" ? "border-purple-500 text-purple-300" : "border-transparent hover:border-indigo-600"}`}
            >
              <div className="flex items-center gap-1">
                <Clipboard className="w-4 h-4" />
                <span>粘贴故事</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-4 py-2 border-b-2 ${activeTab === "ai" ? "border-purple-500 text-purple-300" : "border-transparent hover:border-indigo-600"}`}
            >
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>AI 生成</span>
              </div>
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === "paste" && (
            <form onSubmit={handlePasteSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-indigo-200 mb-2">故事内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-4 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-400 min-h-[200px]"
                  placeholder="粘贴或输入故事内容..."
                  required
                />
                <button
                  type="button"
                  onClick={handlePasteContent}
                  className="mt-2 px-4 py-2 bg-indigo-700/50 rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <Clipboard className="w-4 h-4" />
                  一键粘贴
                </button>
              </div>
              
              <button
                type="submit"
                disabled={!title.trim() || !content.trim() || loading}
                className="w-full py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                {loading ? "创建中..." : "创建故事"}
              </button>
            </form>
          )}
          
          {activeTab === "ai" && (
            <form onSubmit={handleAISubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-indigo-200 mb-2">故事主题</label>
                <textarea 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-4 py-4 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-400 min-h-[100px]"
                  placeholder="例如：一只会飞的小象在巧克力岛上的冒险..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-indigo-200 mb-2">故事简介</label>
                <textarea 
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-4 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-400 min-h-[80px]"
                  placeholder="简要描述故事内容..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-indigo-200 mb-2">故事风格</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white"
                  >
                    <option value="温馨">温馨</option>
                    <option value="冒险">冒险</option>
                    <option value="奇幻">奇幻</option>
                    <option value="科普">科普</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-indigo-200 mb-2">目标年龄</label>
                  <select
                    value={targetAge}
                    onChange={(e) => setTargetAge(e.target.value)}
                    className="w-full px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white"
                  >
                    <option value="0-3">0-3岁</option>
                    <option value="3-6">3-6岁</option>
                    <option value="6-9">6-9岁</option>
                    <option value="9+">9岁以上</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-indigo-200 mb-2">故事长度</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white"
                >
                  <option value="short">短篇</option>
                  <option value="medium">中篇</option>
                  <option value="long">长篇</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={!theme.trim() || loading}
                className="w-full py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {loading ? "生成中..." : "开始生成"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}