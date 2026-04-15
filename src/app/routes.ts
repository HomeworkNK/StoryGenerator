import { createBrowserRouter } from "react-router";
import { HomeFixed } from "./components/HomeFixed";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { CreateStory } from "./components/CreateStory";
import { StoryDetail } from "./components/StoryDetail";
import { VoiceSelection } from "./components/VoiceSelection";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomeFixed,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
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
