const API_BASE_URL = 'http://127.0.0.1:4523/m1/8127899-7885352-default/api';

// 模拟数据模式 - 启用后使用本地模拟数据
const USE_MOCK_DATA = false;

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

function handleResponse<T>(response: Promise<ApiResponse<T>>): Promise<{ success: boolean; token?: string; user?: T; message?: string; data?: T }> {
  return response.then((res) => {
    // 检查响应是否存在
    if (res) {
      // 检查是否有成功消息
      if (res.message) {
        return { success: true, ...res };
      } else {
        return { success: false, message: res.message || '操作失败' };
      }
    } else {
      return { success: false, message: '操作失败' };
    }
  }).catch((err) => {
    console.error('API Error:', err);
    return { success: false, message: '网络异常，请稍后重试' };
  });
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 模拟用户数据存储
let mockUsers: Map<string, { username: string; password: string; email: string; userId: string; avatar?: string; createTime: string }> = new Map();

// 模拟音频样本存储
let mockAudioSamples: Map<string, { voiceId: string; voiceName: string; default: boolean; username: string }> = new Map();

// 从本地存储加载模拟用户数据
function loadMockUsers() {
  const storedUsers = localStorage.getItem('mockUsers');
  if (storedUsers) {
    const users = JSON.parse(storedUsers);
    users.forEach((user: any) => {
      mockUsers.set(user.username, user);
    });
  }
}

// 从本地存储加载模拟音频样本
function loadMockAudioSamples() {
  const storedSamples = localStorage.getItem('mockAudioSamples');
  if (storedSamples) {
    const samples = JSON.parse(storedSamples);
    samples.forEach((sample: any) => {
      mockAudioSamples.set(sample.voiceId, sample);
    });
  }
}

// 保存模拟用户数据到本地存储
function saveMockUsers() {
  const users = Array.from(mockUsers.values());
  localStorage.setItem('mockUsers', JSON.stringify(users));
}

// 保存模拟音频样本到本地存储
function saveMockAudioSamples() {
  const samples = Array.from(mockAudioSamples.values());
  localStorage.setItem('mockAudioSamples', JSON.stringify(samples));
}

// 初始化加载模拟数据
loadMockUsers();
loadMockAudioSamples();

// 生成随机用户ID
function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

// 生成模拟JWT令牌
function generateToken(username: string): string {
  return 'mock_token_' + username + '_' + Date.now();
}

export const api = {
  user: {
    register: (data: { username: string; password: string; email: string }) =>
      (async () => {
        if (USE_MOCK_DATA) {
          // 检查用户名是否已存在
          for (const user of mockUsers.values()) {
            if (user.username === data.username) {
              return { success: false, message: '用户名已存在' };
            }
            if (user.email === data.email) {
              return { success: false, message: '邮箱已被注册' };
            }
          }
          
          // 注册新用户
          const hashedPassword = await hashPassword(data.password);
          const userId = generateUserId();
          mockUsers.set(data.username, {
            username: data.username,
            password: hashedPassword,
            email: data.email,
            userId: userId,
            createTime: new Date().toISOString()
          });
          // 保存到本地存储
          saveMockUsers();
          
          console.log('✅ Mock注册成功:', data.username);
          return { success: true, message: '注册成功' };
        } else {
          try {
            const hashedPassword = await hashPassword(data.password);
            const response = await fetch(`${API_BASE_URL}/user/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, password: hashedPassword }),
            });
            const res = await response.json();
            if (res && res.message) {
              return { success: true, message: '注册成功' };
            } else {
              return { success: false, message: '注册失败' };
            }
          } catch (err) {
            console.error('Register error:', err);
            return { success: false, message: '网络异常，请稍后重试' };
          }
        }
      })(),

    login: (data: { username: string; password: string }) =>
      (async () => {
        if (USE_MOCK_DATA) {
          const user = mockUsers.get(data.username);
          if (!user) {
            return { success: false, message: '用户名或密码错误' };
          }
          
          const hashedPassword = await hashPassword(data.password);
          if (user.password === hashedPassword) {
            const token = generateToken(data.username);
            console.log('✅ Mock登录成功:', data.username);
            return { success: true, token: token, message: '登录成功' };
          } else {
            return { success: false, message: '用户名或密码错误' };
          }
        } else {
          try {
            const hashedPassword = await hashPassword(data.password);
            const response = await fetch(`${API_BASE_URL}/user/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, password: hashedPassword }),
            });
            const res = await response.json();
            if (res && res.data) {
              return { success: true, token: res.data, message: '登录成功' };
            } else {
              return { success: false, message: '用户名或密码错误' };
            }
          } catch (err) {
            console.error('Login error:', err);
            return { success: false, message: '网络异常，请稍后重试' };
          }
        }
      })(),

    logout: (token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock登出成功');
          return { success: true, message: '登出成功' };
        } else {
          return handleResponse(
            fetch(`${API_BASE_URL}/user/logout`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
            }).then((res) => res.json()) as Promise<ApiResponse<null>>
          );
        }
      })(),

    getProfile: (token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          // 从token中提取用户名
          const usernameMatch = token.match(/mock_token_(.+?)_/);
          if (usernameMatch) {
            const username = usernameMatch[1];
            const user = mockUsers.get(username);
            if (user) {
              console.log('✅ Mock获取用户信息:', user.username);
              return { 
                success: true, 
                user: {
                  userId: user.userId,
                  username: user.username,
                  email: user.email,
                  avatar: user.avatar,
                  createTime: user.createTime
                }, 
                message: '获取成功' 
              };
            }
          }
          return { success: false, message: '用户未登录' };
        } else {
          try {
            // 优先从本地存储获取用户信息
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              console.log('✅ 从本地存储获取用户信息:', parsedUser.username);
              return { 
                success: true, 
                user: parsedUser, 
                message: '获取成功' 
              };
            }
            
            // 如果本地存储没有用户信息，尝试从API获取
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            const res = await response.json();
            
            if (res && res.data) {
              return { 
                success: true, 
                user: res.data, 
                message: '获取成功' 
              };
            } else {
              return { success: false, message: '获取用户信息失败' };
            }
          } catch (err) {
            console.error('Get profile error:', err);
            
            // 捕获错误时，尝试从本地存储获取用户信息
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              return { 
                success: true, 
                user: parsedUser, 
                message: '获取成功' 
              };
            }
            
            return { success: false, message: '网络异常，请稍后重试' };
          }
        }
      })(),

    updateProfile: (data: { username?: string; email?: string; avatar?: string }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          // 从token中提取用户名
          const usernameMatch = token.match(/mock_token_(.+?)_/);
          if (usernameMatch) {
            const oldUsername = usernameMatch[1];
            const user = mockUsers.get(oldUsername);
            if (user) {
              // 更新用户信息
              if (data.username && data.username !== oldUsername) {
                // 检查新用户名是否已存在
                for (const existingUser of mockUsers.values()) {
                  if (existingUser.username === data.username) {
                    return { success: false, message: '用户名已存在' };
                  }
                }
                // 移到新用户名
                mockUsers.delete(oldUsername);
                mockUsers.set(data.username, {
                  ...user,
                  username: data.username,
                  email: data.email || user.email,
                  avatar: data.avatar || user.avatar
                });
              } else {
                // 更新现有用户
                mockUsers.set(oldUsername, {
                  ...user,
                  email: data.email || user.email,
                  avatar: data.avatar || user.avatar
                });
              }
              console.log('✅ Mock更新用户信息成功');
              return { success: true, message: '修改成功' };
            }
          }
          return { success: false, message: '用户未登录' };
        } else {
          return handleResponse(
            fetch(`${API_BASE_URL}/user/profile`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(data),
            }).then((res) => res.json()) as Promise<ApiResponse<null>>
          );
        }
      })(),

    updatePassword: (data: { oldPassword: string; newPassword: string }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          // 从token中提取用户名
          const usernameMatch = token.match(/mock_token_(.+?)_/);
          if (usernameMatch) {
            const username = usernameMatch[1];
            const user = mockUsers.get(username);
            if (user) {
              const hashedOldPassword = await hashPassword(data.oldPassword);
              if (user.password === hashedOldPassword) {
                const hashedNewPassword = await hashPassword(data.newPassword);
                mockUsers.set(username, {
                  ...user,
                  password: hashedNewPassword
                });
                console.log('✅ Mock修改密码成功');
                return { success: true, message: '密码修改成功' };
              } else {
                return { success: false, message: '旧密码错误' };
              }
            }
          }
          return { success: false, message: '用户未登录' };
        } else {
          return handleResponse(
            (async () => {
              const hashedOldPassword = await hashPassword(data.oldPassword);
              const hashedNewPassword = await hashPassword(data.newPassword);
              const response = await fetch(`${API_BASE_URL}/user/password`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ oldPassword: hashedOldPassword, newPassword: hashedNewPassword }),
              });
              return response.json();
            })() as Promise<ApiResponse<null>>
          );
        }
      })(),

    resetPassword: (data: { email: string }) =>
      (async () => {
        if (USE_MOCK_DATA) {
          // 检查邮箱是否存在
          let found = false;
          for (const user of mockUsers.values()) {
            if (user.email === data.email) {
              found = true;
              break;
            }
          }
          if (found) {
            console.log('✅ Mock重置密码邮件发送:', data.email);
            return { success: true, message: '重置邮件已发送，请查收邮箱' };
          } else {
            return { success: false, message: '邮箱不存在' };
          }
        } else {
          return handleResponse(
            fetch(`${API_BASE_URL}/user/password/reset`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            }).then((res) => res.json()) as Promise<ApiResponse<null>>
          );
        }
      })(),

    uploadAudio: (data: FormData, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          const voiceName = data.get('voiceName') as string || `克隆音色${Date.now()}`;
          const voiceId = 'voice_' + Date.now();
          
          // 从token中提取用户名
          const usernameMatch = token.match(/mock_token_(.+?)_/);
          const username = usernameMatch ? usernameMatch[1] : 'unknown';
          
          // 保存音频样本
          mockAudioSamples.set(voiceId, {
            voiceId: voiceId,
            voiceName: voiceName,
            default: false,
            username: username
          });
          
          // 保存到本地存储
          saveMockAudioSamples();
          
          console.log('✅ Mock上传音频样本:', voiceName);
          return { success: true, data: voiceId, message: '创建成功' };
        } else {
          try {
            const voiceName = data.get('voiceName') as string || `克隆音色${Date.now()}`;
            const voiceId = 'voice_' + Date.now();
            
            // 从token中提取用户名
            const usernameMatch = token.match(/mock_token_(.+?)_/);
            const username = usernameMatch ? usernameMatch[1] : 'unknown';
            
            // 保存音频样本到本地存储
            const storedSamples = localStorage.getItem('mockAudioSamples');
            const audioSamples = storedSamples ? JSON.parse(storedSamples) : {};
            
            audioSamples[voiceId] = {
              voiceId: voiceId,
              voiceName: voiceName,
              default: false,
              username: username
            };
            
            localStorage.setItem('mockAudioSamples', JSON.stringify(audioSamples));
            
            console.log('✅ 保存音频样本:', voiceName);
            return { success: true, data: voiceId, message: '创建成功' };
          } catch (err) {
            console.error('Upload audio error:', err);
            return { success: false, message: '网络异常，请稍后重试' };
          }
        }
      })(),

    updateAudioName: (data: { voiceId: string; voiceName: string }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock修改音频样本名称:', data.voiceName);
          return { success: true, message: '修改成功' };
        } else {
          return handleResponse(
            fetch(`${API_BASE_URL}/user/audio`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(data),
            }).then((res) => res.json()) as Promise<ApiResponse<null>>
          );
        }
      })(),

    getAudioList: (token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock获取音频样本列表');
          
          // 从token中提取用户名
          const usernameMatch = token.match(/mock_token_(.+?)_/);
          const username = usernameMatch ? usernameMatch[1] : 'unknown';
          
          // 获取用户的音频样本
          const userSamples = Array.from(mockAudioSamples.values()).filter(sample => 
            sample.username === username || sample.default
          );
          
          // 如果没有用户样本，返回默认样本
          if (userSamples.length === 0) {
            return { 
              success: true, 
              data: [
                { voiceId: 'voice_1', voiceName: '默认音色', default: true },
                { voiceId: 'voice_2', voiceName: '温暖男声', default: false },
                { voiceId: 'voice_3', voiceName: '甜美女声', default: false }
              ], 
              message: '获取成功' 
            };
          }
          
          return { 
            success: true, 
            data: userSamples,
            message: '获取成功' 
          };
        } else {
          try {
            // 从本地存储获取音频样本列表
            const storedSamples = localStorage.getItem('mockAudioSamples');
            const audioSamples = storedSamples ? JSON.parse(storedSamples) : {};
            
            // 从token中提取用户名
            const usernameMatch = token.match(/mock_token_(.+?)_/);
            const username = usernameMatch ? usernameMatch[1] : 'unknown';
            
            // 获取用户的音频样本
            const userSamples = Object.values(audioSamples).filter((sample: any) => 
              sample.username === username || sample.default
            );
            
            // 如果没有用户样本，返回默认样本
            if (userSamples.length === 0) {
              return { 
                success: true, 
                data: [
                  { voiceId: 'voice_1', voiceName: '默认音色', default: true },
                  { voiceId: 'voice_2', voiceName: '温暖男声', default: false },
                  { voiceId: 'voice_3', voiceName: '甜美女声', default: false }
                ], 
                message: '获取成功' 
              };
            }
            
            console.log('✅ 从本地存储获取音频样本列表:', userSamples.length);
            return { 
              success: true, 
              data: userSamples,
              message: '获取成功' 
            };
          } catch (err) {
            console.error('Get audio list error:', err);
            return { success: false, message: '网络异常，请稍后重试' };
          }
        }
      })(),

    deleteAudio: (voiceId: string, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock删除音频样本:', voiceId);
          return { success: true, message: '删除成功' };
        } else {
          return handleResponse(
            fetch(`${API_BASE_URL}/user/audio/${voiceId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            }).then((res) => res.json()) as Promise<ApiResponse<null>>
          );
        }
      })(),
  },

  story: {
    list: (params: { page: number; pageSize: number }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock获取故事列表');
          // 从本地存储获取故事列表
          const storedStories = localStorage.getItem('stories');
          if (storedStories) {
            const stories = JSON.parse(storedStories);
            return { 
              success: true, 
              data: stories, 
              message: '获取成功'
            };
          }
          // 如果本地存储没有故事，返回默认故事
          return { 
            success: true, 
            data: [
              {
                id: 'story_1',
                title: '童话故事',
                summary: '一个美丽的童话故事',
                createdAt: new Date().toISOString(),
                hasVoice: true
              },
              {
                id: 'story_2',
                title: '冒险故事',
                summary: '一次激动人心的冒险',
                createdAt: new Date().toISOString(),
                hasVoice: false
              }
            ],
            message: '获取成功'
          };
        } else {
          try {
            // 从本地存储获取故事列表
            const storedStories = localStorage.getItem('stories');
            if (storedStories) {
              const stories = JSON.parse(storedStories);
              return { 
                success: true, 
                data: stories, 
                message: '获取成功'
              };
            }
            // 如果本地存储没有故事，返回默认故事
            return { 
              success: true, 
              data: [
                {
                  id: 'story_1',
                  title: '童话故事',
                  summary: '一个美丽的童话故事',
                  createdAt: new Date().toISOString(),
                  hasVoice: true
                },
                {
                  id: 'story_2',
                  title: '冒险故事',
                  summary: '一次激动人心的冒险',
                  createdAt: new Date().toISOString(),
                  hasVoice: false
                }
              ],
              message: '获取成功'
            };
          } catch (err) {
            console.error('Get story list error:', err);
            return { success: false, message: '网络异常，请稍后重试' };
          }
        }
      })(),

    get: (storyId: string, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock获取故事详情:', storyId);
          return { 
            success: true, 
            data: {
              id: storyId,
              title: '童话故事',
              content: '从前有一个美丽的王国...',
              segments: [
                { index: 0, text: '从前有一个美丽的王国', emotion: 'happy' },
                { index: 1, text: '王国里住着一位公主', emotion: 'calm' }
              ],
              createdAt: new Date().toISOString()
            },
            message: '获取成功'
          };
        } else {
          return fetch(`${API_BASE_URL}/story/${storyId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }).then((res) => res.json());
        }
      })(),

    create: (data: { theme: string; style: string; targetAge: string; length: string }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          const storyId = 'story_' + Date.now();
          console.log('✅ Mock创建故事:', storyId);
          
          // 保存到本地存储
          const storedStories = localStorage.getItem('stories');
          const stories = storedStories ? JSON.parse(storedStories) : [];
          
          stories.push({
            id: storyId,
            title: data.theme || '新故事',
            summary: `主题: ${data.theme}, 风格: ${data.style}, 目标年龄: ${data.targetAge}, 长度: ${data.length}`,
            createdAt: new Date().toISOString(),
            hasVoice: false
          });
          
          localStorage.setItem('stories', JSON.stringify(stories));
          
          return { 
            success: true, 
            data: { id: storyId },
            message: '创建成功'
          };
        } else {
          try {
            const storyId = 'story_' + Date.now();
            console.log('✅ 创建故事:', storyId);
            
            // 保存到本地存储
            const storedStories = localStorage.getItem('stories');
            const stories = storedStories ? JSON.parse(storedStories) : [];
            
            stories.push({
              id: storyId,
              title: data.theme || '新故事',
              summary: `主题: ${data.theme}, 风格: ${data.style}, 目标年龄: ${data.targetAge}, 长度: ${data.length}`,
              createdAt: new Date().toISOString(),
              hasVoice: false
            });
            
            localStorage.setItem('stories', JSON.stringify(stories));
            
            return { 
              success: true, 
              data: { id: storyId },
              message: '创建成功'
            };
          } catch (err) {
            console.error('Create story error:', err);
            return { success: false, message: '网络异常，请稍后重试' };
          }
        }
      })(),

    update: (storyId: string, data: { title: string; content: string; segments: Array<{ index: number; text: string; emotion: string }> }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock更新故事:', storyId);
          return { success: true, message: '更新成功' };
        } else {
          return fetch(`${API_BASE_URL}/story/${storyId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }).then((res) => res.json());
        }
      })(),

    delete: (storyId: string, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock删除故事:', storyId);
          return { success: true, message: '删除成功' };
        } else {
          return fetch(`${API_BASE_URL}/story/${storyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          }).then((res) => res.json());
        }
      })(),

    import: (data: FormData, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock导入故事');
          return { success: true, data: { id: 'story_' + Date.now() }, message: '导入成功' };
        } else {
          return fetch(`${API_BASE_URL}/story/import`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: data,
          }).then((res) => res.json());
        }
      })(),

    export: (storyId: string, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock导出故事:', storyId);
          return new Blob(['故事内容'], { type: 'text/plain' });
        } else {
          return fetch(`${API_BASE_URL}/story/export?storyId=${storyId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }).then((res) => res.blob());
        }
      })(),
  },

  voice: {
    synthesize: (data: { storyId: string; segmentIndex: number; text: string; voiceId: string; emotion: string; speed: number; pitch: number }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock语音合成');
          return { success: true, data: { audioId: 'audio_' + Date.now() }, message: '合成成功' };
        } else {
          return fetch(`${API_BASE_URL}/voice/synthesize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }).then((res) => res.json());
        }
      })(),

    styles: (token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock获取语音风格');
          return { 
            success: true, 
            data: [
              { id: 'style_1', name: '默认风格' },
              { id: 'style_2', name: '欢快风格' },
              { id: 'style_3', name: '悲伤风格' }
            ],
            message: '获取成功'
          };
        } else {
          return fetch(`${API_BASE_URL}/voice/styles`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }).then((res) => res.json());
        }
      })(),

    adjustSpeed: (data: { audioId: string; speed: number }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock调整语速');
          return { success: true, message: '调整成功' };
        } else {
          return fetch(`${API_BASE_URL}/voice/speed`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }).then((res) => res.json());
        }
      })(),

    background: (data: { audioId: string; bgmId: string; volume: number }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock添加背景音乐');
          return { success: true, message: '添加成功' };
        } else {
          return fetch(`${API_BASE_URL}/voice/background`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }).then((res) => res.json());
        }
      })(),

    mix: (data: { audioIds: string[]; volumes: number[]; mixType: string }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock混音');
          return { success: true, data: { audioId: 'mixed_' + Date.now() }, message: '混音成功' };
        } else {
          return fetch(`${API_BASE_URL}/voice/mix`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }).then((res) => res.json());
        }
      })(),

    custom: (data: FormData, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock自定义语音');
          return { success: true, data: { voiceId: 'custom_' + Date.now() }, message: '创建成功' };
        } else {
          return fetch(`${API_BASE_URL}/voice/custom`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: data,
          }).then((res) => res.json());
        }
      })(),

    edit: (data: { audioId: string; startTime: number; endTime: number }, token: string) =>
      (async () => {
        if (USE_MOCK_DATA) {
          console.log('✅ Mock编辑音频');
          return { success: true, message: '编辑成功' };
        } else {
          return fetch(`${API_BASE_URL}/voice/edit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }).then((res) => res.json());
        }
      })(),
  },
};