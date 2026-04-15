import { Link, useNavigate } from "react-router";
import { BookOpen, X, Sparkles, Clipboard, FileText } from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";

interface LocalStory {
  id: string;
  title: string;
  summary: string;
  content: string;
  createdAt: string;
  hasVoice: boolean;
}

function saveStoryToLocal(story: LocalStory) {
  const storedStories = localStorage.getItem("stories") || "[]";
  const stories = JSON.parse(storedStories);
  const filteredStories = stories.filter((item: LocalStory) => item.id !== story.id);
  filteredStories.unshift(story);
  localStorage.setItem("stories", JSON.stringify(filteredStories));
}

export function CreateStoryFixed() {
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
  const [activeTab, setActiveTab] = useState("paste");

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

    const newStory: LocalStory = {
      id: Date.now().toString(),
      title: title.trim() || "未命名故事",
      content: content.trim(),
      summary: content.trim().substring(0, 100) + "...",
      createdAt: new Date().toISOString(),
      hasVoice: false,
    };

    saveStoryToLocal(newStory);
    navigate(`/story/${newStory.id}`);
    setLoading(false);
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
          length,
        },
        token,
      );

      if (response.success && response.data?.id) {
        const optimisticStory: LocalStory = {
          id: response.data.id,
          title: response.data.title || title.trim() || theme.trim().slice(0, 20) || "AI 生成故事",
          content: response.data.content || summary.trim() || theme.trim(),
          summary: response.data.summary || summary.trim() || theme.trim().slice(0, 100),
          createdAt: response.data.createdAt || new Date().toISOString(),
          hasVoice: Boolean(response.data.hasVoice),
        };
        saveStoryToLocal(optimisticStory);
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
    <div className="flex min-h-screen items-center justify-center bg-[#111209]/95 text-[#f2efff] backdrop-blur-sm">
      <div className="mx-6 w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#63549f]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#f2efff]">梦境编织者</span>
          </Link>
        </div>

        <div className="mx-auto max-w-md rounded-xl border border-[#6b75c9]/30 bg-[#231c40] p-8 shadow-2xl shadow-black/20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#f6f2ff]">编织一个新梦境</h2>
            <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#312752] text-[#f2efff] transition-colors hover:bg-[#3a2d63]">
              <X className="h-4 w-4" />
            </Link>
          </div>

          <p className="mb-6 text-[#ddd6ff]">创建一个新的故事，你可以选择粘贴已有内容或使用 AI 生成。</p>

          {error && <div className="mb-6 rounded-lg bg-red-500/20 p-3 text-red-200">{error}</div>}

          <div className="mb-6">
            <label className="mb-2 block text-sm text-[#e6e0ff]">故事名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[#6b75c9]/35 bg-[#312752] px-4 py-2 text-[#faf8ff] placeholder:text-[#bfb6ea]"
              placeholder="输入故事名称"
            />
          </div>

          <div className="mb-6 flex border-b border-[#6b75c9]/25">
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`mr-2 border-b-2 px-4 py-2 ${activeTab === "paste" ? "border-[#8a78b7] text-[#f2efff]" : "border-transparent text-[#d7cffb] hover:border-[#6b75c9]/40"}`}
            >
              <div className="flex items-center gap-1">
                <Clipboard className="h-4 w-4" />
                <span>粘贴故事</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`border-b-2 px-4 py-2 ${activeTab === "ai" ? "border-[#8a78b7] text-[#f2efff]" : "border-transparent text-[#d7cffb] hover:border-[#6b75c9]/40"}`}
            >
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span>AI 生成</span>
              </div>
            </button>
          </div>

          {activeTab === "paste" && (
            <form onSubmit={handlePasteSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm text-[#e6e0ff]">故事内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] w-full rounded-lg border border-[#6b75c9]/35 bg-[#312752] px-4 py-4 text-[#faf8ff] placeholder:text-[#bfb6ea]"
                  placeholder="粘贴或输入故事内容..."
                  required
                />
                <button
                  type="button"
                  onClick={handlePasteContent}
                  className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-[#312752] px-4 py-2 text-sm text-[#efeaff] transition-colors hover:bg-[#3a2d63]"
                >
                  <Clipboard className="h-4 w-4" />
                  一键粘贴
                </button>
              </div>

              <button
                type="submit"
                disabled={!content.trim() || loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#63549f] py-3 text-[#faf8ff] transition-colors hover:bg-[#6b75c9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText className="h-5 w-5" />
                {loading ? "创建中..." : "创建故事"}
              </button>
            </form>
          )}

          {activeTab === "ai" && (
            <form onSubmit={handleAISubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm text-[#e6e0ff]">故事主题</label>
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="min-h-[100px] w-full rounded-lg border border-[#6b75c9]/35 bg-[#312752] px-4 py-4 text-[#faf8ff] placeholder:text-[#bfb6ea]"
                  placeholder="例如：一只会飞的小象在巧克力岛上的冒险..."
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#e6e0ff]">故事简介</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[80px] w-full rounded-lg border border-[#6b75c9]/35 bg-[#312752] px-4 py-4 text-[#faf8ff] placeholder:text-[#bfb6ea]"
                  placeholder="简要描述故事内容..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-[#e6e0ff]">故事风格</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full rounded-lg border border-[#6b75c9]/35 bg-[#312752] px-4 py-2 text-[#faf8ff]"
                  >
                    <option value="温馨">温馨</option>
                    <option value="冒险">冒险</option>
                    <option value="奇幻">奇幻</option>
                    <option value="科普">科普</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#e6e0ff]">目标年龄</label>
                  <select
                    value={targetAge}
                    onChange={(e) => setTargetAge(e.target.value)}
                    className="w-full rounded-lg border border-[#6b75c9]/35 bg-[#312752] px-4 py-2 text-[#faf8ff]"
                  >
                    <option value="0-3">0-3岁</option>
                    <option value="3-6">3-6岁</option>
                    <option value="6-9">6-9岁</option>
                    <option value="9+">9岁以上</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#e6e0ff]">故事长度</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full rounded-lg border border-[#6b75c9]/35 bg-[#312752] px-4 py-2 text-[#faf8ff]"
                >
                  <option value="short">短篇</option>
                  <option value="medium">中篇</option>
                  <option value="long">长篇</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!theme.trim() || loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#63549f] py-3 text-[#faf8ff] transition-colors hover:bg-[#6b75c9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-5 w-5" />
                {loading ? "生成中..." : "开始生成"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
