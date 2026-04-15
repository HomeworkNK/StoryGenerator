import { Link, useParams, useNavigate } from "react-router";
import { BookOpen, ArrowLeft, Video, Mic, Edit, Save } from "lucide-react";
import { useState, useEffect } from "react";
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

export function StoryDetailFixed() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (id) {
      fetchStoryDetail(id);
    }
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
    if (localStory) {
      applyStory(localStory);
    }

    const token = localStorage.getItem("token");
    if (!token) {
      if (!localStory) {
        setError("故事不存在");
      }
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
      if (!localStory) {
        setError("网络错误，请稍后重试");
      }
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
        const updatedStories = stories.map((s: Story) =>
          s.id === id ? { ...s, title: editTitle, content: editContent } : s,
        );
        localStorage.setItem("stories", JSON.stringify(updatedStories));
        setStory({ ...story, title: editTitle, content: editContent });
        setEditing(false);
      }
      return;
    }

    try {
      const response = await api.story.update(
        id,
        {
          title: editTitle,
          content: editContent,
          segments: story.segments ? story.segments : [],
        },
        token,
      );
      if (response.success) {
        const nextStory = response.data || { ...story, title: editTitle, content: editContent };
        applyStory(nextStory);
        const localStory = findStoryInLocal(id);
        if (localStory) {
          const storedStories = localStorage.getItem("stories") || "[]";
          const stories = JSON.parse(storedStories);
          const updatedStories = stories.map((s: Story) => (s.id === id ? { ...s, ...nextStory } : s));
          localStorage.setItem("stories", JSON.stringify(updatedStories));
        }
        setEditing(false);
      } else {
        setError(response.message || "更新故事失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("更新故事失败:", err);
    }
  };

  if (loading && !story) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <p className="text-indigo-200">正在加载故事...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <p className="text-indigo-200">{error || "故事不存在"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 text-white">
      <header className="bg-indigo-950/80 backdrop-blur-sm border-b border-indigo-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">梦境编织者</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-300 hover:text-purple-300 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        {error && <div className="mb-6 p-3 bg-red-500/20 text-red-300 rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">工作流</h3>
              <div className="bg-indigo-800/30 border border-indigo-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-sm font-medium">1</span>
                    </div>
                    <h4 className="font-medium">AI 生成故事</h4>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="w-full py-2 bg-indigo-700/50 rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  编辑生成结果
                </button>
              </div>

              <div className="bg-indigo-800/30 border border-indigo-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <h4 className="font-medium">AI 配音</h4>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                </div>
                <Link to={`/voice/${story.id}`} className="w-full py-2 bg-indigo-700/50 rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1">
                  <Mic className="w-4 h-4" />
                  选择音色
                </Link>
              </div>

              <div className="bg-indigo-800/30 border border-indigo-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-sm font-medium">3</span>
                    </div>
                    <h4 className="font-medium">AI 生图</h4>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                </div>
                <button className="w-full py-2 bg-indigo-700/50 rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1" disabled>
                  <Video className="w-4 h-4" />
                  生成图片
                </button>
              </div>

              <div className="bg-indigo-800/30 border border-indigo-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-sm font-medium">4</span>
                    </div>
                    <h4 className="font-medium">AI 视频</h4>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                </div>
                <button className="w-full py-2 bg-indigo-700/50 rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1" disabled>
                  <Video className="w-4 h-4" />
                  生成视频
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            {editing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-indigo-200 mb-2">故事标题</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white"
                    placeholder="输入故事标题"
                  />
                </div>

                <div>
                  <label className="block text-sm text-indigo-200 mb-2">故事内容</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-4 py-4 bg-indigo-800 border border-indigo-700 rounded-lg text-white min-h-[300px]"
                    placeholder="输入故事内容"
                  />
                </div>

                <button
                  onClick={handleUpdate}
                  className="w-full py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  保存修改
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold">{story.title}</h1>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="p-2 bg-indigo-800/50 rounded-lg hover:bg-indigo-700 transition-colors"
                    title="修改故事名称"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <span className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-xs font-medium">AI 生成</span>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <span className="text-indigo-300 text-sm">阅读时长：2分钟</span>
                </div>

                <div className="bg-indigo-800/50 border border-indigo-700 rounded-xl overflow-hidden mb-6">
                  {story.cover ? (
                    <img src={story.cover} alt={story.title} className="w-full h-64 object-cover" />
                  ) : (
                    <div className="w-full h-64 bg-indigo-700/50 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-indigo-300" />
                    </div>
                  )}
                </div>

                <div className="bg-indigo-800/30 border border-indigo-700 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">故事内容</h2>
                  <p className="text-indigo-200 leading-relaxed whitespace-pre-wrap">{story.content}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
