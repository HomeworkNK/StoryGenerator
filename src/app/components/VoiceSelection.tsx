import { Link, useNavigate, useParams } from "react-router";
import { BookOpen, Mic, X, Radio, Volume2, Save } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { api } from "../../services/api";

// 添加波浪线动画的CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes wave {
    0%, 100% {
      height: 20px;
    }
    50% {
      height: 50px;
    }
  }
`;
document.head.appendChild(style);

interface VoiceStyle {
  id: string;
  name: string;
  description: string;
}

export function VoiceSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [voiceStyles, setVoiceStyles] = useState<VoiceStyle[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [useCustomVoice, setUseCustomVoice] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("voice"); // voice, speed
  const recordingTimeoutRef = useRef<number>();
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
      // 使用默认语音风格
      setVoiceStyles([
        { id: "voice-1", name: "阳光男声", description: "阳光、温暖、自然" },
        { id: "voice-2", name: "甜美童声", description: "可爱、活泼、纯真" },
        { id: "voice-3", name: "温柔女声", description: "温柔、细腻、优雅" },
        { id: "voice-4", name: "磁性男声", description: "深沉、磁性、稳重" },
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'voice-recording.wav', { type: 'audio/wav' });
        audioFileRef.current = audioFile;
        setIsRecording(false);
        setHasRecorded(true);
        setUseCustomVoice(true);
        
        // 停止所有音频轨道
        stream.getTracks().forEach(track => track.stop());
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleCustomVoiceSubmit = async () => {
    if (!id || !audioFileRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("请先登录");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", audioFileRef.current);
      formData.append("voiceName", "自定义声音");

      const response = await api.voice.custom(formData, token);
      if (response.success) {
        setSelectedVoice(response.data.voiceId);
        setUseCustomVoice(true);
        setHasRecorded(true);
      } else {
        setError(response.message || "个性化配音失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("个性化配音失败:", err);
    } finally {
      setLoading(false);
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
          speed: speed,
          pitch: 1.0
        },
        token
      );

      if (response.success) {
        // 更新故事的语音信息
        const storedStories = localStorage.getItem("stories");
        if (storedStories) {
          const stories = JSON.parse(storedStories);
          const storyIndex = stories.findIndex((s: any) => s.id === id);
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

    // 获取故事的音频ID
    const storedStories = localStorage.getItem("stories");
    if (!storedStories) return;

    const stories = JSON.parse(storedStories);
    const story = stories.find((s: any) => s.id === id);
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
          speed: speed
        },
        token
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

  // 生成波浪线动画的CSS
  const waveAnimation = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '60px'
  };

  const waveBarStyle = (index: number) => ({
    width: '8px',
    backgroundColor: '#8b5cf6',
    borderRadius: '4px',
    animation: `wave ${1 + index * 0.2}s ease-in-out infinite`,
    animationDelay: `${index * 0.1}s`
  });

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
        <div className="bg-indigo-900 border border-indigo-800 rounded-xl p-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">音频处理</h2>
            <Link to={`/story/${id}`} className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center hover:bg-indigo-700 transition-colors">
              <X className="w-4 h-4" />
            </Link>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 text-red-300 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="flex border-b border-indigo-700 mb-6">
            <button
              onClick={() => setActiveTab("voice")}
              className={`px-4 py-2 mr-2 border-b-2 ${activeTab === "voice" ? "border-purple-500 text-purple-300" : "border-transparent hover:border-indigo-600"}`}
            >
              语音选择
            </button>
            <button
              onClick={() => setActiveTab("speed")}
              className={`px-4 py-2 border-b-2 ${activeTab === "speed" ? "border-purple-500 text-purple-300" : "border-transparent hover:border-indigo-600"}`}
            >
              语速调节
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === "voice" && (
            <div>
              <h3 className="text-lg font-medium mb-4">选择配音音色</h3>
              {/* AI Voices */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {voiceStyles.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceSelect(voice.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${selectedVoice === voice.id ? "border-purple-500 bg-purple-600/20" : "border-indigo-700 hover:border-indigo-600"}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Radio className="w-5 h-5 text-purple-400" />
                      <h4 className="font-medium">{voice.name}</h4>
                    </div>
                    <p className="text-xs text-indigo-300 ml-8">{voice.description}</p>
                  </button>
                ))}
                
                {/* 克隆音色 */}
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${useCustomVoice ? "border-purple-500 bg-purple-600/20" : "border-indigo-700 hover:border-indigo-600"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Radio className="w-5 h-5 text-purple-400" />
                    <h4 className="font-medium">克隆音色</h4>
                  </div>
                  <p className="text-xs text-indigo-300 ml-8">使用您自己的声音</p>
                  
                  {isRecording ? (
                    <div className="mt-4" style={waveAnimation}>
                      {[...Array(5)].map((_, index) => (
                        <div key={index} style={waveBarStyle(index)}></div>
                      ))}
                    </div>
                  ) : hasRecorded ? (
                    <div className="mt-4 p-2 bg-green-500/20 text-green-300 rounded text-xs">
                      录音完成，点击合成语音使用克隆音色
                    </div>
                  ) : (
                    <div className="mt-4 p-2 bg-indigo-700/30 text-indigo-300 rounded text-xs">
                      点击开始录音，说一段话让AI克隆您的声音
                    </div>
                  )}
                </button>
              </div>
              
              <button
                onClick={handleVoiceSynthesis}
                disabled={loading || (!selectedVoice && !useCustomVoice)}
                className="w-full py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? "合成中..." : "合成语音"}
              </button>
            </div>
          )}
          
          {activeTab === "speed" && (
            <div>
              <h3 className="text-lg font-medium mb-4">调节语速</h3>
              <div className="mb-6">
                <label className="block text-sm text-indigo-200 mb-2">语速: {speed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleSpeedAdjust}
                disabled={loading}
                className="w-full py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Volume2 className="w-5 h-5" />
                {loading ? "调节中..." : "调节语速"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}