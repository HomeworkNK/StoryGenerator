import { Link } from "react-router";
import { Mic, Upload, Trash2, Edit2, X, Check, Radio, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import { AppHeader } from "./AppHeader";

interface VoiceSample {
  voiceId: string;
  voiceName: string;
  default: boolean;
}

const style = document.createElement("style");
style.textContent = `
  @keyframes wave {
    0%, 100% { height: 20px; }
    50% { height: 50px; }
  }
`;
if (!document.head.querySelector('style[data-wave="voice-lab"]')) {
  style.setAttribute("data-wave", "voice-lab");
  document.head.appendChild(style);
}

export function VoiceLab() {
  const [voiceList, setVoiceList] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [editingVoiceId, setEditingVoiceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchVoiceList();
  }, []);

  const fetchVoiceList = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("请先登录");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.user.getAudioList(token);
      if (response.success && response.data) {
        setVoiceList(response.data as VoiceSample[]);
      } else {
        setError(response.message || "获取音频列表失败");
      }
    } catch (err) {
      console.error("获取音频列表失败:", err);
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
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
        handleUploadAudio(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("无法访问麦克风，请检查权限");
      console.error("录音失败:", err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setHasRecorded(true);
    }
  };

  const handleUploadAudio = async (audioFile?: File) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("请先登录");
      return;
    }

    if (!audioFile) {
      fileInputRef.current?.click();
      return;
    }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("voiceName", recordingName || `克隆音色${Date.now()}`);

      const response = await api.user.uploadAudio(formData, token);
      if (response.success) {
        setRecordingName("");
        setHasRecorded(false);
        fetchVoiceList();
      } else {
        setError(response.message || "上传失败");
      }
    } catch (err) {
      console.error("上传音频失败:", err);
      setError("网络错误，请稍后重试");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUploadAudio(file);
    }
  };

  const handleDeleteVoice = async (voiceId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("请先登录");
      return;
    }
    if (!confirm("确定要删除这个音色吗？")) return;

    setLoading(true);
    setError("");
    try {
      const response = await api.user.deleteAudio(voiceId, token);
      if (response.success) {
        fetchVoiceList();
      } else {
        setError(response.message || "删除失败");
      }
    } catch (err) {
      console.error("删除音频失败:", err);
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (voice: VoiceSample) => {
    setEditingVoiceId(voice.voiceId);
    setEditingName(voice.voiceName);
  };

  const handleCancelEdit = () => {
    setEditingVoiceId(null);
    setEditingName("");
  };

  const handleSaveEdit = async () => {
    if (!editingVoiceId) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("请先登录");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.user.updateAudioName(
        { voiceId: editingVoiceId, voiceName: editingName },
        token
      );
      if (response.success) {
        setEditingVoiceId(null);
        setEditingName("");
        fetchVoiceList();
      } else {
        setError(response.message || "修改失败");
      }
    } catch (err) {
      console.error("修改音频名称失败:", err);
      setError("网络错误，请稍后重试");
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
    <div className="min-h-screen bg-gradient-to-b from-[#111209] via-[#231c40] to-[#111209] text-white">
      <AppHeader activeTab="voice" />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#faf8ff]">声音实验室</h1>
          <p className="mt-2 text-[#c6bdf3]">管理你的克隆音频样本，录制新音色或上传已有音频</p>
        </div>

        {error && <div className="mb-6 rounded-lg bg-red-500/20 p-3 text-red-200">{error}</div>}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="space-y-6">
              <h3 className="mb-4 text-lg font-semibold text-[#f4f0ff]">操作</h3>

              <div className="rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#63549f]">
                    <Mic className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-medium text-[#f4f0ff]">录制新音色</h4>
                </div>
                <p className="mb-3 text-sm text-[#c6bdf3]">对着麦克风说话，让 AI 克隆你的声音</p>

                <input
                  type="text"
                  value={recordingName}
                  onChange={(e) => setRecordingName(e.target.value)}
                  placeholder="为音色起个名字"
                  className="mb-3 w-full rounded-lg border border-[#63549f]/35 bg-[#312752] px-3 py-2 text-sm text-[#faf8ff] placeholder-[#8a78b7]"
                />

                {isRecording ? (
                  <div className="space-y-3">
                    <div style={waveAnimation}>
                      {[...Array(5)].map((_, index) => (
                        <div key={index} style={waveBarStyle(index)}></div>
                      ))}
                    </div>
                    <button
                      onClick={handleStopRecording}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 py-2 text-sm text-white transition-colors hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                      停止录音
                    </button>
                  </div>
                ) : uploading ? (
                  <div className="flex items-center justify-center rounded-lg bg-[#312752] py-3 text-sm text-[#c6bdf3]">
                    上传中...
                  </div>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#63549f] py-2 text-sm text-[#faf8ff] transition-colors hover:bg-[#6b75c9]"
                  >
                    <Mic className="h-4 w-4" />
                    开始录音
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#63549f]">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-medium text-[#f4f0ff]">上传音频文件</h4>
                </div>
                <p className="mb-3 text-sm text-[#c6bdf3]">上传已有的音频文件作为音色</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#312752] py-2 text-sm text-[#eee9ff] transition-colors hover:bg-[#3a2d63] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  选择文件
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f4f0ff]">我的音色 ({voiceList.length})</h3>
              <button
                onClick={fetchVoiceList}
                className="text-sm text-[#d7cffb] hover:text-white"
              >
                刷新列表
              </button>
            </div>

            {loading && voiceList.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-12">
                <span className="text-[#c6bdf3]">加载中...</span>
              </div>
            ) : voiceList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-12">
                <Radio className="mb-4 h-16 w-16 text-[#6b75c9]/50" />
                <h4 className="mb-2 text-lg font-medium text-[#f4f0ff]">暂无音色样本</h4>
                <p className="text-center text-sm text-[#c6bdf3]">录制或上传音频来创建你的第一个克隆音色</p>
              </div>
            ) : (
              <div className="space-y-4">
                {voiceList.map((voice) => (
                  <div
                    key={voice.voiceId}
                    className="rounded-xl border border-[#63549f]/30 bg-[#231c40]/45 p-4"
                  >
                    {editingVoiceId === voice.voiceId ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 rounded-lg border border-[#63549f]/35 bg-[#312752] px-3 py-2 text-[#faf8ff]"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={loading}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-400 transition-colors hover:bg-green-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={loading}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#63549f]/30">
                            <Volume2 className="h-6 w-6 text-[#cfc8ff]" />
                          </div>
                          <div>
                            <h4 className="font-medium text-[#f7f3ff]">{voice.voiceName}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#c6bdf3]">ID: {voice.voiceId}</span>
                              {voice.default && (
                                <span className="rounded-full bg-[#63549f]/25 px-2 py-0.5 text-xs text-[#ddd6ff]">
                                  系统音色
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(voice)}
                            disabled={voice.default}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#312752] text-[#d7cffb] transition-colors hover:bg-[#3a2d63] disabled:cursor-not-allowed disabled:opacity-30"
                            title="修改名称"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVoice(voice.voiceId)}
                            disabled={voice.default || loading}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#312752] text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                            title="删除音色"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
