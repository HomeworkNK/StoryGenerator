export interface UserProfile {
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export interface StoryRecord {
  id: string;
  title: string;
  summary: string;
  content: string;
  createdAt: string;
  hasVoice: boolean;
  voiceType?: string;
  cover?: string;
  audioId?: string;
  source?: "local" | "remote";
}

const STORIES_KEY = "stories";
const TOKEN_KEY = "token";
const USER_KEY = "user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredStories() {
  const raw = localStorage.getItem(STORIES_KEY);

  if (!raw) {
    return [] as StoryRecord[];
  }

  try {
    return JSON.parse(raw) as StoryRecord[];
  } catch {
    return [];
  }
}

export function setStoredStories(stories: StoryRecord[]) {
  localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export function upsertStory(story: StoryRecord) {
  const stories = getStoredStories();
  const index = stories.findIndex((item) => item.id === story.id);

  if (index === -1) {
    stories.unshift(story);
  } else {
    stories[index] = { ...stories[index], ...story };
  }

  setStoredStories(stories);
  return stories;
}

export function removeStory(storyId: string) {
  const stories = getStoredStories().filter((story) => story.id !== storyId);
  setStoredStories(stories);
  return stories;
}

export function mergeStories(remoteStories: StoryRecord[], localStories = getStoredStories()) {
  const map = new Map<string, StoryRecord>();

  remoteStories.forEach((story) => {
    map.set(story.id, { ...story, source: "remote" });
  });

  localStories.forEach((story) => {
    map.set(story.id, { ...map.get(story.id), ...story, source: story.source ?? map.get(story.id)?.source ?? "local" });
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function buildSummary(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  return normalized.length > 90 ? `${normalized.slice(0, 90)}...` : normalized;
}
