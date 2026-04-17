const API_BASE_URL = "http://127.0.0.1:4523/m1/8127899-7885352-default/api";

const USE_MOCK_DATA = false;

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

type ApiResult<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;
};

type MockUser = {
  userId: string;
  username: string;
  password: string;
  email: string;
  avatar?: string;
  bio?: string;
  createTime: string;
};

type MockVoice = {
  voiceId: string;
  voiceName: string;
  default: boolean;
  username: string;
};

type MockStory = {
  id: string;
  title: string;
  summary: string;
  content?: string;
  segments?: Array<{ index: number; text: string; emotion: string }>;
  createdAt: string;
  hasVoice: boolean;
};

const STORAGE_KEYS = {
  users: "mockUsers",
  voices: "mockAudioSamples",
  stories: "stories",
  tokenUserMap: "mockTokenUserMap",
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getMockUsers(): MockUser[] {
  return safeParse<MockUser[]>(localStorage.getItem(STORAGE_KEYS.users), []);
}

function saveMockUsers(users: MockUser[]) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getMockVoices(): MockVoice[] {
  return safeParse<MockVoice[]>(localStorage.getItem(STORAGE_KEYS.voices), []);
}

function saveMockVoices(voices: MockVoice[]) {
  localStorage.setItem(STORAGE_KEYS.voices, JSON.stringify(voices));
}

function getMockStories(): MockStory[] {
  return safeParse<MockStory[]>(localStorage.getItem(STORAGE_KEYS.stories), []);
}

function saveMockStories(stories: MockStory[]) {
  localStorage.setItem(STORAGE_KEYS.stories, JSON.stringify(stories));
}

function getTokenUserMap(): Record<string, string> {
  return safeParse<Record<string, string>>(localStorage.getItem(STORAGE_KEYS.tokenUserMap), {});
}

function saveTokenUserMap(map: Record<string, string>) {
  localStorage.setItem(STORAGE_KEYS.tokenUserMap, JSON.stringify(map));
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateToken(username: string): string {
  return `mock_token_${username}_${Date.now()}`;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extractUsernameFromToken(token: string): string | null {
  const map = getTokenUserMap();
  if (map[token]) return map[token];

  const match = token.match(/mock_token_(.+?)_/);
  return match ? match[1] : null;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<ApiResponse<T> | null> {
  if (USE_MOCK_DATA) return null;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, init);
    if (!response.ok) return null;
    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
}

function ok<T>(data?: T, message = "操作成功"): ApiResult<T> {
  return { success: true, data, message };
}

function fail(message = "操作失败"): ApiResult {
  return { success: false, message };
}

function getCurrentUser(token: string): MockUser | null {
  const username = extractUsernameFromToken(token);
  if (!username) return null;
  const users = getMockUsers();
  return users.find((u) => u.username === username) || null;
}

function persistCurrentUserProfile(user: Partial<MockUser>) {
  const existing = safeParse<any>(localStorage.getItem("user"), {});
  localStorage.setItem("user", JSON.stringify({ ...existing, ...user }));
}

export const api = {
  user: {
    register: (data: { username: string; password: string; email: string }) =>
      (async (): Promise<ApiResult> => {
        const payload = {
          username: data.username.trim(),
          email: data.email.trim(),
          password: await hashPassword(data.password),
        };

        const backendRes = await requestJson<null>("/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (backendRes?.code === 200) {
          return ok(undefined, backendRes.message || "注册成功");
        }

        const users = getMockUsers();
        const userExists = users.some((u) => u.username === payload.username);
        if (userExists) return fail("用户名已存在");

        const emailExists = users.some((u) => u.email === payload.email);
        if (emailExists) return fail("邮箱已被注册");

        users.push({
          userId: generateId("user"),
          username: payload.username,
          password: payload.password,
          email: payload.email,
          createTime: new Date().toISOString(),
        });
        saveMockUsers(users);

        return ok(undefined, "注册成功");
      })(),

    login: (data: { username: string; password: string }) =>
      (async (): Promise<ApiResult> => {
        const payload = {
          username: data.username.trim(),
          password: await hashPassword(data.password),
        };

        const backendRes = await requestJson<string>("/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (backendRes?.code === 200 && backendRes.data) {
          return { success: true, token: backendRes.data, message: backendRes.message || "登录成功" };
        }

        const users = getMockUsers();
        const user = users.find((u) => u.username === payload.username && u.password === payload.password);
        if (!user) return fail("用户名或密码错误");

        const token = generateToken(user.username);
        const map = getTokenUserMap();
        map[token] = user.username;
        saveTokenUserMap(map);

        persistCurrentUserProfile({
          userId: user.userId,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createTime: user.createTime,
        });

        return { success: true, token, message: "登录成功" };
      })(),

    logout: (token: string) =>
      (async (): Promise<ApiResult> => {
        const backendRes = await requestJson<null>("/user/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const map = getTokenUserMap();
        if (map[token]) {
          delete map[token];
          saveTokenUserMap(map);
        }

        if (backendRes?.code === 200) return ok(undefined, backendRes.message || "登出成功");
        return ok(undefined, "登出成功");
      })(),

    getProfile: (token: string) =>
      (async (): Promise<ApiResult> => {
        const backendRes = await requestJson<any>("/user/profile", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (backendRes?.code === 200 && backendRes.data) {
          persistCurrentUserProfile(backendRes.data);
          return { success: true, user: backendRes.data, message: backendRes.message || "获取成功" };
        }

        const current = getCurrentUser(token);
        if (current) {
          const user = {
            userId: current.userId,
            username: current.username,
            email: current.email,
            avatar: current.avatar,
            createTime: current.createTime,
          };
          persistCurrentUserProfile(user);
          return { success: true, user, message: "获取成功" };
        }

        const local = safeParse<any>(localStorage.getItem("user"), null);
        if (local) return { success: true, user: local, message: "获取成功" };

        return fail("用户未登录");
      })(),

    updateProfile: (data: { username?: string; email?: string; avatar?: string; bio?: string }, token: string) =>
      (async (): Promise<ApiResult> => {
        const backendRes = await requestJson<null>("/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (backendRes?.code === 200) {
          const local = safeParse<any>(localStorage.getItem("user"), {});
          persistCurrentUserProfile({ ...local, ...data });
          return ok(undefined, backendRes.message || "修改成功");
        }

        const username = extractUsernameFromToken(token);
        if (!username) return fail("用户未登录");

        const users = getMockUsers();
        const idx = users.findIndex((u) => u.username === username);
        if (idx < 0) return fail("用户未登录");

        if (data.username && data.username !== username) {
          const duplicate = users.some((u, i) => i !== idx && u.username === data.username);
          if (duplicate) return fail("用户名已存在");
        }

        users[idx] = { ...users[idx], ...data, username: data.username || users[idx].username };
        saveMockUsers(users);

        if (data.username && data.username !== username) {
          const map = getTokenUserMap();
          map[token] = data.username;
          saveTokenUserMap(map);
        }

        persistCurrentUserProfile(users[idx]);
        return ok(undefined, "修改成功");
      })(),

    updatePassword: (data: { oldPassword: string; newPassword: string }, token: string) =>
      (async (): Promise<ApiResult> => {
        const payload = {
          oldPassword: await hashPassword(data.oldPassword),
          newPassword: await hashPassword(data.newPassword),
        };

        const backendRes = await requestJson<null>("/user/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (backendRes?.code === 200) return ok(undefined, backendRes.message || "密码修改成功");

        const username = extractUsernameFromToken(token);
        if (!username) return fail("用户未登录");

        const users = getMockUsers();
        const idx = users.findIndex((u) => u.username === username);
        if (idx < 0) return fail("用户未登录");
        if (users[idx].password !== payload.oldPassword) return fail("旧密码错误");

        users[idx].password = payload.newPassword;
        saveMockUsers(users);
        return ok(undefined, "密码修改成功");
      })(),

    resetPassword: (data: { email: string }) =>
      (async (): Promise<ApiResult> => {
        const payload = { email: data.email.trim() };

        const backendRes = await requestJson<null>("/user/password/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (backendRes?.code === 200) return ok(undefined, backendRes.message || "重置邮件已发送，请查收邮箱");

        const users = getMockUsers();
        const exists = users.some((u) => u.email === payload.email);
        if (!exists) return fail("邮箱不存在");
        return ok(undefined, "重置邮件已发送，请查收邮箱");
      })(),

    uploadAudio: (data: FormData, token: string) =>
      (async (): Promise<ApiResult<string>> => {
        const username = extractUsernameFromToken(token) || "guest";
        const voiceName = ((data.get("voiceName") as string) || "自定义音色").trim();
        const upsertLocalVoice = (voiceId: string) => {
          const voices = getMockVoices();
          const idx = voices.findIndex((v) => v.voiceId === voiceId);
          const nextVoice: MockVoice = {
            voiceId,
            voiceName,
            default: false,
            username,
          };
          if (idx >= 0) {
            voices[idx] = { ...voices[idx], ...nextVoice };
          } else {
            voices.push(nextVoice);
          }
          saveMockVoices(voices);
        };

        const backendRes = await requestJson<string>("/user/audio", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        });

        if (backendRes?.code === 200 && backendRes.data) {
          upsertLocalVoice(backendRes.data);
          return ok(backendRes.data, backendRes.message || "创建成功");
        }

        const voiceId = generateId("voice");
        upsertLocalVoice(voiceId);

        return ok(voiceId, "创建成功");
      })(),

    updateAudioName: (data: { voiceId: string; voiceName: string }, token: string) =>
      (async (): Promise<ApiResult> => {
        const backendRes = await requestJson<null>("/user/audio", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        const voices = getMockVoices();
        const idx = voices.findIndex((v) => v.voiceId === data.voiceId);
        if (idx >= 0) {
          voices[idx].voiceName = data.voiceName;
          saveMockVoices(voices);
        }

        if (backendRes?.code === 200) return ok(undefined, backendRes.message || "修改成功");
        return ok(undefined, "修改成功");
      })(),

    getAudioList: (token: string) =>
      (async (): Promise<ApiResult<MockVoice[]>> => {
        const backendRes = await requestJson<MockVoice[]>("/user/audio", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const username = extractUsernameFromToken(token) || "guest";
        const localVoices = getMockVoices().filter((v) => v.username === username || v.default);

        if (backendRes?.code === 200 && Array.isArray(backendRes.data)) {
          const merged = [...backendRes.data];
          for (const lv of localVoices) {
            const idx = merged.findIndex((v) => v.voiceId === lv.voiceId);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...lv };
            } else {
              merged.push(lv);
            }
          }
          return ok(merged, backendRes.message || "获取成功");
        }

        const voices = localVoices;

        if (voices.length > 0) return ok(voices, "获取成功");

        return ok(
          [
            { voiceId: "voice_1", voiceName: "默认音色", default: true, username: "system" },
            { voiceId: "voice_2", voiceName: "温暖男声", default: true, username: "system" },
            { voiceId: "voice_3", voiceName: "甜美女声", default: true, username: "system" },
          ],
          "获取成功",
        );
      })(),

    deleteAudio: (voiceId: string, token: string) =>
      (async (): Promise<ApiResult> => {
        const backendRes = await requestJson<null>(`/user/audio/${voiceId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (backendRes?.code === 200) return ok(undefined, backendRes.message || "删除成功");

        const voices = getMockVoices().filter((v) => v.voiceId !== voiceId);
        saveMockVoices(voices);
        return ok(undefined, "删除成功");
      })(),
  },

  story: {
    list: (params: { page: number; pageSize: number; title?: string }, token: string) =>
      (async (): Promise<ApiResult<MockStory[]>> => {
        const query = new URLSearchParams({
          page: String(params.page),
          pageSize: String(params.pageSize),
          ...(params.title ? { title: params.title } : {}),
        });

        const backendRes = await requestJson<any>(`/project/list?${query.toString()}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (backendRes?.code === 200 || backendRes?.code === 0) {
          const lists = backendRes.data?.lists || backendRes.data?.date?.lists;
          if (Array.isArray(lists)) {
            const mapped: MockStory[] = lists.map((item: any) => ({
              id: item.projectId,
              title: item.title || "未命名故事",
              summary: item.description || "",
              createdAt: new Date().toISOString(),
              hasVoice: false,
            }));
            saveMockStories(mapped);
            return ok(mapped, backendRes.message || "获取成功");
          }
        }

        const stories = getMockStories();
        return ok(stories, "获取成功");
      })(),

    get: (storyId: string, token: string) =>
      (async (): Promise<ApiResult> => {
        const backendRes = await requestJson<any>(`/story/list/${storyId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if ((backendRes?.code === 200 || backendRes?.code === 0) && backendRes.data) {
          const payload = {
            id: storyId,
            title: backendRes.data.title || "未命名故事",
            content: backendRes.data.content || "",
            segments: [{ index: 0, text: backendRes.data.content || "", emotion: "calm" }],
            createdAt: backendRes.data.createTime || new Date().toISOString(),
          };
          return ok(payload, backendRes.message || "获取成功");
        }

        const story = getMockStories().find((s) => s.id === storyId);
        if (story) {
          return ok(
            {
              id: story.id,
              title: story.title,
              content: story.content || story.summary || "",
              segments: story.segments || [{ index: 0, text: story.content || story.summary || "", emotion: "calm" }],
              createdAt: story.createdAt,
            },
            "获取成功",
          );
        }

        return fail("故事不存在");
      })(),

    create: (data: { theme: string; style: string; targetAge: string; length: string }, token: string) =>
      (async (): Promise<ApiResult<{ id: string }>> => {
        const payload = {
          theme: data.theme,
          style: data.style,
          keyword: data.targetAge,
          prompt: "",
          number: "3",
          length: data.length,
        };

        const backendRes = await requestJson<null>("/story/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const stories = getMockStories();
        const id = generateId("story");

        stories.unshift({
          id,
          title: data.theme || "新故事",
          summary: `主题: ${data.theme} 风格: ${data.style} 年龄: ${data.targetAge} 长度: ${data.length}`,
          content: "",
          segments: [],
          createdAt: new Date().toISOString(),
          hasVoice: false,
        });
        saveMockStories(stories);

        if (backendRes?.code === 200 || backendRes?.code === 0) {
          return ok({ id }, backendRes.message || "创建成功");
        }
        return ok({ id }, "创建成功");
      })(),

    update: (storyId: string, data: { title: string; content: string; segments: Array<{ index: number; text: string; emotion: string }> }, token: string) =>
      (async (): Promise<ApiResult> => {
        const payload = {
          projectId: storyId,
          title: data.title,
          content: data.content,
        };

        const backendRes = await requestJson<null>("/story", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const stories = getMockStories();
        const idx = stories.findIndex((s) => s.id === storyId);
        if (idx >= 0) {
          stories[idx] = {
            ...stories[idx],
            title: data.title,
            content: data.content,
            summary: data.content.slice(0, 120),
            segments: data.segments,
          };
          saveMockStories(stories);
        }

        if (backendRes?.code === 200 || backendRes?.code === 0) return ok(undefined, backendRes.message || "更新成功");
        return ok(undefined, "更新成功");
      })(),

    delete: (storyId: string, token: string) =>
      (async (): Promise<ApiResult> => {
        const backendRes = await requestJson<null>(`/story/${storyId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        const stories = getMockStories().filter((s) => s.id !== storyId);
        saveMockStories(stories);

        if (backendRes?.code === 200 || backendRes?.code === 0) return ok(undefined, backendRes.message || "删除成功");
        return ok(undefined, "删除成功");
      })(),

    import: (_data: FormData, _token: string) =>
      (async (): Promise<ApiResult<{ id: string }>> => {
        const id = generateId("story");
        return ok({ id }, "导入成功");
      })(),

    export: (storyId: string, token: string) =>
      (async (): Promise<Blob> => {
        try {
          if (!USE_MOCK_DATA) {
            const response = await fetch(`${API_BASE_URL}/story/export/${storyId}`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) return await response.blob();
          }
        } catch (error) {
          console.error("Export story error:", error);
        }

        const story = getMockStories().find((s) => s.id === storyId);
        return new Blob([story?.content || story?.summary || "故事内容"], { type: "text/plain;charset=utf-8" });
      })(),
  },

  voice: {
    synthesize: (data: { storyId: string; segmentIndex: number; text: string; voiceId: string; emotion: string; speed: number; pitch: number }, token: string) =>
      (async (): Promise<ApiResult<{ audioId: string }>> => {
        const payload = {
          projectId: data.storyId,
          voiceIds: [data.voiceId],
          style: data.emotion,
          prompt: data.text,
          speechRate: data.speed,
        };

        const backendRes = await requestJson<any>("/audio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (backendRes?.code === 200 && backendRes.data?.audioId) {
          return ok({ audioId: backendRes.data.audioId }, backendRes.message || "合成成功");
        }

        return ok({ audioId: generateId("audio") }, "合成成功");
      })(),

    styles: (_token: string) =>
      (async (): Promise<ApiResult<Array<{ id: string; name: string }>>> => {
        return ok(
          [
            { id: "style_1", name: "默认风格" },
            { id: "style_2", name: "欢快风格" },
            { id: "style_3", name: "温柔风格" },
          ],
          "获取成功",
        );
      })(),

    adjustSpeed: (data: { audioId: string; speed: number }, token: string) =>
      (async (): Promise<ApiResult> => {
        const backendRes = await requestJson<null>("/audio", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ audioId: data.audioId, title: `语速${data.speed}` }),
        });

        if (backendRes?.code === 200 || backendRes?.code === 0) return ok(undefined, backendRes.message || "调整成功");
        return ok(undefined, "调整成功");
      })(),

    background: (data: { audioId: string; bgmId: string; volume: number }, token: string) =>
      (async (): Promise<ApiResult> => {
        const backendRes = await requestJson<any>("/audio/bgm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (backendRes?.code === 200) return ok(backendRes.data, backendRes.message || "添加成功");
        return ok({ audioId: `${data.audioId}_bgm` }, "添加成功");
      })(),

    mix: (_data: { audioIds: string[]; volumes: number[]; mixType: string }, _token: string) =>
      (async (): Promise<ApiResult<{ audioId: string }>> => {
        return ok({ audioId: generateId("mixed") }, "混音成功");
      })(),

    custom: (data: FormData, token: string) =>
      (async (): Promise<ApiResult<{ voiceId: string }>> => {
        const res = await api.user.uploadAudio(data, token);
        if (!res.success || !res.data) return fail(res.message || "创建失败");
        return ok({ voiceId: res.data }, "创建成功");
      })(),

    edit: (_data: { audioId: string; startTime: number; endTime: number }, _token: string) =>
      (async (): Promise<ApiResult> => {
        return ok(undefined, "编辑成功");
      })(),
  },

  project: {
    create: (data: { title: string; description?: string }, token: string) =>
      requestJson<string>("/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }),

    update: (data: { projectId: string; title?: string; description?: string }, token: string) =>
      requestJson<null>("/project", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }),

    remove: (projectId: string, token: string) =>
      requestJson<null>(`/project/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
};
