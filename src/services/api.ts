const API_BASE_URL = 'https://app.apifox.com/project/8094739';

export const api = {
  user: {
    register: (data: { username: string; password: string; email: string }) =>
      fetch(`${API_BASE_URL}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    login: (data: { username: string; password: string }) =>
      fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    logout: (token: string) =>
      fetch(`${API_BASE_URL}/user/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).then((res) => res.json()),

    getInfo: (token: string) =>
      fetch(`${API_BASE_URL}/user/info`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then((res) => res.json()),

    updateInfo: (data: { email?: string; avatar?: string }, token: string) =>
      fetch(`${API_BASE_URL}/user/info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    updatePassword: (data: { oldPassword: string; newPassword: string }, token: string) =>
      fetch(`${API_BASE_URL}/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    resetPassword: (data: { email: string }) =>
      fetch(`${API_BASE_URL}/user/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
  },

  story: {
    list: (params: { page: number; pageSize: number }, token: string) =>
      fetch(`${API_BASE_URL}/story?page=${params.page}&pageSize=${params.pageSize}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then((res) => res.json()),

    get: (storyId: string, token: string) =>
      fetch(`${API_BASE_URL}/story/${storyId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then((res) => res.json()),

    create: (data: { theme: string; style: string; targetAge: string; length: string }, token: string) =>
      fetch(`${API_BASE_URL}/story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    update: (storyId: string, data: { title: string; content: string; segments: Array<{ index: number; text: string; emotion: string }> }, token: string) =>
      fetch(`${API_BASE_URL}/story/${storyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    delete: (storyId: string, token: string) =>
      fetch(`${API_BASE_URL}/story/${storyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      }).then((res) => res.json()),

    import: (data: FormData, token: string) =>
      fetch(`${API_BASE_URL}/story/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      }).then((res) => res.json()),

    export: (storyId: string, token: string) =>
      fetch(`${API_BASE_URL}/story/export?storyId=${storyId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then((res) => res.blob()),
  },

  voice: {
    synthesize: (data: { storyId: string; segmentIndex: number; text: string; voiceId: string; emotion: string; speed: number; pitch: number }, token: string) =>
      fetch(`${API_BASE_URL}/voice/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    styles: (token: string) =>
      fetch(`${API_BASE_URL}/voice/styles`, {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then((res) => res.json()),

    adjustSpeed: (data: { audioId: string; speed: number }, token: string) =>
      fetch(`${API_BASE_URL}/voice/speed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    background: (data: { audioId: string; bgmId: string; volume: number }, token: string) =>
      fetch(`${API_BASE_URL}/voice/background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    mix: (data: { audioIds: string[]; volumes: number[]; mixType: string }, token: string) =>
      fetch(`${API_BASE_URL}/voice/mix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),

    custom: (data: FormData, token: string) =>
      fetch(`${API_BASE_URL}/voice/custom`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      }).then((res) => res.json()),

    edit: (data: { audioId: string; startTime: number; endTime: number }, token: string) =>
      fetch(`${API_BASE_URL}/voice/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
  },
};
