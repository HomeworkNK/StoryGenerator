import { Link } from "react-router";
import { BookOpen, User } from "lucide-react";
import { useEffect, useState } from "react";
import { UserProfileModal } from "./UserProfileModal";

type HeaderTab = "home" | "create" | "voice";

interface AppHeaderProps {
  activeTab: HeaderTab;
}

function getUserInfo() {
  const raw = localStorage.getItem("user");
  if (!raw) return { name: "访客宝贝", avatar: "" };
  try {
    const user = JSON.parse(raw);
    return {
      name: user?.username || user?.nickname || "访客宝贝",
      avatar: user?.avatar || "",
    };
  } catch {
    return { name: "访客宝贝", avatar: "" };
  }
}

function navClass(isActive: boolean) {
  return `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-[#63549f]/55 text-[#efeaff]"
      : "text-[#d9d0ff] hover:bg-[#63549f]/45 hover:text-white"
  }`;
}

export function AppHeader({ activeTab }: AppHeaderProps) {
  const [user, setUser] = useState(getUserInfo());
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const refresh = () => setUser(getUserInfo());
    window.addEventListener("storage", refresh);
    window.addEventListener("user-profile-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("user-profile-updated", refresh);
    };
  }, []);

  return (
    <header className="border-b border-[#6b75c9]/20 bg-[#111209]/88 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6b75c9]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#e4ddff]">梦境编织者</span>
          </div>
          <nav className="flex items-center gap-2 rounded-full border border-[#6b75c9]/25 bg-[#231c40]/70 px-2 py-2 shadow-lg shadow-black/10">
            <Link to="/" className={navClass(activeTab === "home")}>书藏馆</Link>
            <Link to="/create" className={navClass(activeTab === "create")}>创作工坊</Link>
            <Link to="/voice-lab" className={navClass(activeTab === "voice")}>声音实验室</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setShowProfileModal(true)} className="text-sm text-[#a7a8b7] transition-colors hover:text-[#e4ddff]">{user.name}</button>
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#63549f]/40 transition-colors hover:bg-[#63549f]/65"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </div>
      <UserProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </header>
  );
}
