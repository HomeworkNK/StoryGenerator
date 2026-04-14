import { createBrowserRouter } from "react-router";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { CreateStory } from "./components/CreateStory";
import { StoryDetail } from "./components/StoryDetail";
import { VoiceSelection } from "./components/VoiceSelection";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/create",
    Component: CreateStory,
  },
  {
    path: "/story/:id",
    Component: StoryDetail,
  },
  {
    path: "/voice/:id",
    Component: VoiceSelection,
  },
]);
