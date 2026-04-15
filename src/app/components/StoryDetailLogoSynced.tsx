import { Link } from "react-router";
import { BookOpen, ArrowLeft, Video, Mic, Edit, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { api } from "../../services/api";

interface Story {
  id: string;
  title: string;
  summary: string;
  content: string;
  createdAt: string;
  hasVoice: boolean;
  voiceType?: string;
  cover?: string;
  segments?: Array<{ index: number; text: string; emotion: string }>;
}

function findStoryInLocal(storyId: string) {
  const storedStories = localStorage.getItem("stories");
  if (!storedStories) return null;
  const stories = JSON.parse(storedStories);
  return stories.find((s: Story) => s.id === storyId) || null;
}

export function StoryDetailLogoSynced() {
  const { id } = useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (id) fetchStoryDetail(id);
  }, [id]);

  const applyStory = (currentStory: Story) => {
    setStory(currentStory);
    setEditTitle(currentStory.title);
    setEditContent(currentStory.content);
  };

  const fetchStoryDetail = async (storyId: string) => {
    setLoading(true);
    setError("");
    const localStory = findStoryInLocal(storyId);
    if (localStory) applyStory(localStory);
    const token = localStorage.getItem("token");
    if (!token) {
      if (!localStory) setError("故事不存在");
      setLoading(false);
      return;
    }
    try {
      const response = await api.story.get(storyId, token);
      if (response.success && response.data) {
        applyStory(response.data);
      } else if (!localStory) {
        setError(response.message || "故事不存在");
      }
    } catch (err) {
      console.error("获取故事详情失败:", err);
      if (!localStory) setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id || !story) return;
    const token = localStorage.getItem("token");
    if (!token) {
      const storedStories = localStorage.getItem("stories");
      if (storedStories) {
        const stories = JSON.parse(storedStories);
        const updatedStories = stories.map((s: Story) => (s.id === id ? { ...s, title: editTitle, content: editContent } : s));
        localStorage.setItem("stories", JSON.stringify(updatedStories));
        setStory({ ...story, title: editTitle, content: editContent });
        setEditing(false);
      }
      return;
    }
    try {
      const response = await api.story.update(id, { title: editTitle, content: editContent, segments: story.segments ? story.segments : [] }, token);
      if (response.success) {
        applyStory(response.data || { ...story, title: editTitle, content: editContent });
        setEditing(false);
      } else {
        setError(response.message || "更新故事失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("更新故事失败:", err);
    }
  };

  if (loading && !story) return <div className="flex min-h-screen items-center justify-center bg-[#111209] text-[#ddd6ff]">正在加载故事...</div>;
  if (!story) return <div className="flex min-h-screen items-center justify-center bg-[#111209] text-[#ddd6ff]">{error || "故事不存在"}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111209] via-[#231c40] to-[#111209] text-white">
      <header className="border-b border-[#6b75c9]/20 bg-[#111209]/88 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6b75c9]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#e4ddff]">梦境编织者</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-[#d8ddff] transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
        {error && <div className="mb-6 rounded-lg bg-red-500/20 p-3 text-red-200">{error}</div>}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="space-y-6">
              <h3 className="mb-4 text-lg font-semibold text-[#f4f0ff]">工作流</h3>
              <div className="rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#63549f]"><span className="text-sm font-medium">1</span></div>
                    <h4 className="font-medium text-[#f4f0ff]">AI 生成故事</h4>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <button onClick={() => setEditing(!editing)} className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#312752] py-2 text-sm text-[#eee9ff] transition-colors hover:bg-[#3a2d63]"><Edit className="h-4 w-4" />编辑生成结果</button>
              </div>
              <div className="rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#63549f]"><span className="text-sm font-medium">2</span></div>
                    <h4 className="font-medium text-[#f4f0ff]">AI 配音</h4>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                </div>
                <Link to={`/voice/${story.id}`} className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#312752] py-2 text-sm text-[#eee9ff] transition-colors hover:bg-[#3a2d63]"><Mic className="h-4 w-4" />选择音色</Link>
              </div>
              <div className="rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6b75c9]"><span className="text-sm font-medium">3</span></div>
                    <h4 className="font-medium text-[#f4f0ff]">AI 生图</h4>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                </div>
                <button className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#312752] py-2 text-sm text-[#bdb5e7]" disabled><Video className="h-4 w-4" />生成图片</button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {editing ? (
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm text-[#e6e0ff]">故事标题</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-lg border border-[#63549f]/35 bg-[#312752] px-4 py-2 text-[#faf8ff]" placeholder="输入故事标题" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-[#e6e0ff]">故事内容</label>
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[300px] w-full rounded-lg border border-[#63549f]/35 bg-[#312752] px-4 py-4 text-[#faf8ff]" placeholder="输入故事内容" />
                </div>
                <button onClick={handleUpdate} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#63549f] py-3 text-[#faf8ff] transition-colors hover:bg-[#6b75c9]"><Save className="h-5 w-5" />保存修改</button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-[#faf8ff]">{story.title}</h1>
                  <button onClick={() => setEditing(!editing)} className="rounded-lg bg-[#312752] p-2 transition-colors hover:bg-[#3a2d63]" title="修改故事名称"><Edit className="h-5 w-5" /></button>
                  <span className="rounded-full bg-[#63549f]/25 px-3 py-1 text-xs font-medium text-[#ddd6ff]">AI 生成</span>
                </div>
                <div className="mb-6 flex items-center gap-2"><span className="text-sm text-[#c6bdf3]">阅读时长：2分钟</span></div>
                <div className="mb-6 overflow-hidden rounded-xl border border-[#63549f]/30 bg-[#231c40]/45">
                  {story.cover ? <img src={story.cover} alt={story.title} className="h-64 w-full object-cover" /> : <div className="flex h-64 w-full items-center justify-center bg-[#231c40]/75"><BookOpen className="h-16 w-16 text-[#a7a8b7]" /></div>}
                </div>
                <div className="rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-6">
                  <h2 className="mb-4 text-lg font-semibold text-[#f4f0ff]">故事内容</h2>
                  <p className="whitespace-pre-wrap leading-relaxed text-[#ddd6ff]">{story.content}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
