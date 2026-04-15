import { createBrowserRouter } from "react-router";
import { HomeRestored } from "./components/HomeRestored";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { CreateStoryLight } from "./components/CreateStoryLight";
import { StoryDetail } from "./components/StoryDetail";
import { VoiceSelection } from "./components/VoiceSelection";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomeRestored,
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
    Component: CreateStoryLight,
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
