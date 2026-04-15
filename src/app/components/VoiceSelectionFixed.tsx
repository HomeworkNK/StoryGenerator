import { Link, useNavigate, useParams } from "react-router";
import { BookOpen, X, Radio, Volume2, Save, Clipboard, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../services/api";

const style = document.createElement("style");
style.textContent = `
  @keyframes wave {
    0%, 100% { height: 20px; }
    50% { height: 50px; }
  }
`;
if (!document.head.querySelector('style[data-wave="voice-selection"]')) {
  style.setAttribute("data-wave", "voice-selection");
  document.head.appendChild(style);
}

interface VoiceStyle {
  id: string;
  name: string;
  description: string;
}

export function VoiceSelectionFixed() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVoice, setSelectedVoice] = useState("");
  const [voiceStyles, setVoiceStyles] = useState<VoiceStyle[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [useCustomVoice, setUseCustomVoice] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("voice");
  const audioFileRef = useRef<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (id) {
      fetchVoiceStyles();
    }
  }, [id]);

  const fetchVoiceStyles = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await api.voice.styles(token);
      if (response.success) {
        setVoiceStyles(response.data);
      }
    } catch (err) {
      console.error("获取语音风格失败:", err);
      setVoiceStyles([
        { id: "voice-1", name: "阳光男声", description: "阳光、温暖、自然" },
        { id: "voice-2", name: "甜美女声", description: "可爱、活泼、亲切" },
        { id: "voice-3", name: "温柔女声", description: "温柔、细腻、轻盈" },
        { id: "voice-4", name: "磁性男声", description: "沉稳、磁性、成熟" },
      ]);
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setUseCustomVoice(false);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioFile = new File([audioBlob], "voice-recording.wav", { type: "audio/wav" });
        audioFileRef.current = audioFile;
        setIsRecording(false);
        setHasRecorded(true);
        setUseCustomVoice(true);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setUseCustomVoice(true);
      setSelectedVoice("");
    } catch (err) {
      setError("无法访问麦克风，请检查权限");
      console.error("录音失败:", err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoiceSynthesis = async () => {
    if (!id || (!selectedVoice && !useCustomVoice)) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("请先登录");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.voice.synthesize(
        {
          storyId: id,
          segmentIndex: 1,
          text: "从前，在一片美丽的森林里，住着一只勇敢的小兔子。",
          voiceId: useCustomVoice ? "custom" : selectedVoice,
          emotion: "happy",
          speed,
          pitch: 1.0,
        },
        token,
      );

      if (response.success) {
        const storedStories = localStorage.getItem("stories");
        if (storedStories) {
          const stories = JSON.parse(storedStories);
          const storyIndex = stories.findIndex((s: { id: string }) => s.id === id);
          if (storyIndex !== -1) {
            stories[storyIndex].hasVoice = true;
            stories[storyIndex].voiceType = useCustomVoice ? "custom" : selectedVoice;
            stories[storyIndex].audioId = response.data.audioId;
            localStorage.setItem("stories", JSON.stringify(stories));
          }
        }
        navigate(`/story/${id}`);
      } else {
        setError(response.message || "语音合成失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("语音合成失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeedAdjust = async () => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("请先登录");
      return;
    }
    const storedStories = localStorage.getItem("stories");
    if (!storedStories) return;
    const stories = JSON.parse(storedStories);
    const story = stories.find((s: { id: string; audioId?: string }) => s.id === id);
    if (!story || !story.audioId) {
      setError("请先合成语音");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.voice.adjustSpeed(
        {
          audioId: story.audioId,
          speed,
        },
        token,
      );
      if (response.success) {
        setError("语速调节成功");
      } else {
        setError(response.message || "语速调节失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("语速调节失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const waveAnimation = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    height: "60px",
  } as const;

  const waveBarStyle = (index: number) =>
    ({
      width: "8px",
      backgroundColor: "#8a78b7",
      borderRadius: "4px",
      animation: `wave ${1 + index * 0.2}s ease-in-out infinite`,
      animationDelay: `${index * 0.1}s`,
    }) as const;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111209]/95 text-[#f3efff] backdrop-blur-sm">
      <div className="mx-6 w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#63549f]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#f3efff]">梦境编织者</span>
          </Link>
        </div>

        <div className="mx-auto max-w-3xl rounded-xl border border-[#6b75c9]/30 bg-[#231c40] p-8 shadow-2xl shadow-black/20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#faf7ff]">音频处理</h2>
            <Link to={`/story/${id}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#312752] text-[#f3efff] transition-colors hover:bg-[#3a2d63]">
              <X className="h-4 w-4" />
            </Link>
          </div>

          <p className="mb-6 text-[#ddd6ff]">在这里选择音色、录制克隆声音，并调整生成后的语速。</p>

          {error && <div className="mb-6 rounded-lg bg-red-500/20 p-3 text-red-200">{error}</div>}

          <div className="mb-6 flex border-b border-[#6b75c9]/25">
            <button
              onClick={() => setActiveTab("voice")}
              className={`mr-2 border-b-2 px-4 py-2 ${activeTab === "voice" ? "border-[#8a78b7] text-[#f3efff]" : "border-transparent text-[#d7cffb] hover:border-[#6b75c9]/40"}`}
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                语音选择
              </span>
            </button>
            <button
              onClick={() => setActiveTab("speed")}
              className={`border-b-2 px-4 py-2 ${activeTab === "speed" ? "border-[#8a78b7] text-[#f3efff]" : "border-transparent text-[#d7cffb] hover:border-[#6b75c9]/40"}`}
            >
              <span className="inline-flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                语速调节
              </span>
            </button>
          </div>

          {activeTab === "voice" && (
            <div>
              <h3 className="mb-4 text-lg font-medium text-[#f7f3ff]">选择配音音色</h3>
              <div className="mb-6 grid grid-cols-2 gap-4">
                {voiceStyles.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceSelect(voice.id)}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${selectedVoice === voice.id ? "border-[#8a78b7] bg-[#63549f]/20" : "border-[#6b75c9]/25 bg-[#312752]/50 hover:border-[#6b75c9]"}`}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <Radio className="h-5 w-5 text-[#cfc8ff]" />
                      <h4 className="font-medium text-[#f7f3ff]">{voice.name}</h4>
                    </div>
                    <p className="ml-8 text-xs text-[#c6bdf3]">{voice.description}</p>
                  </button>
                ))}

                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${useCustomVoice ? "border-[#8a78b7] bg-[#63549f]/20" : "border-[#6b75c9]/25 bg-[#312752]/50 hover:border-[#6b75c9]"}`}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <Radio className="h-5 w-5 text-[#cfc8ff]" />
                    <h4 className="font-medium text-[#f7f3ff]">克隆音色</h4>
                  </div>
                  <p className="ml-8 text-xs text-[#c6bdf3]">使用你自己的声音进行配音</p>

                  {isRecording ? (
                    <div className="mt-4" style={waveAnimation}>
                      {[...Array(5)].map((_, index) => (
                        <div key={index} style={waveBarStyle(index)}></div>
                      ))}
                    </div>
                  ) : hasRecorded ? (
                    <div className="mt-4 rounded bg-green-500/20 p-2 text-xs text-green-200">录音完成，点击合成语音即可使用克隆音色</div>
                  ) : (
                    <div className="mt-4 rounded bg-[#6b75c9]/12 p-2 text-xs text-[#ddd6ff]">点击开始录音，说一段话让 AI 克隆你的声音</div>
                  )}
                </button>
              </div>

              <button
                onClick={handleVoiceSynthesis}
                disabled={loading || (!selectedVoice && !useCustomVoice)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#63549f] py-3 text-[#faf8ff] transition-colors hover:bg-[#6b75c9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {loading ? "合成中..." : "合成语音"}
              </button>
            </div>
          )}

          {activeTab === "speed" && (
            <div>
              <h3 className="mb-4 text-lg font-medium text-[#f7f3ff]">调节语速</h3>
              <div className="mb-6">
                <label className="mb-2 block text-sm text-[#e6e0ff]">语速 {speed.toFixed(1)}x</label>
                <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full accent-[#8a78b7]" />
              </div>
              <button
                onClick={handleSpeedAdjust}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#63549f] py-3 text-[#faf8ff] transition-colors hover:bg-[#6b75c9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Volume2 className="h-5 w-5" />
                {loading ? "调节中..." : "调节语速"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
