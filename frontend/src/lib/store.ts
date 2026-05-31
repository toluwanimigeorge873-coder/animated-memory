import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

interface Chat {
  id: string;
  title: string;
  mode: string;
  is_bookmarked: boolean;
  folder?: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  detailLevel: string;
  setDetailLevel: (level: string) => void;
  mode: string;
  setMode: (mode: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  chats: [],
  setChats: (chats) => set({ chats }),
  currentChatId: null,
  setCurrentChatId: (id) => set({ currentChatId: id }),
  messages: [],
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  detailLevel: 'standard',
  setDetailLevel: (level) => set({ detailLevel: level }),
  mode: 'chat',
  setMode: (mode) => set({ mode }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  darkMode: true,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));
