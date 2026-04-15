import { createBrowserRouter } from "react-router";
import { HomeNavFixed } from "./components/HomeNavFixed";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { CreateStoryFixed } from "./components/CreateStoryFixed";
import { StoryDetailFixed } from "./components/StoryDetailFixed";
import { VoiceSelection } from "./components/VoiceSelection";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomeNavFixed,
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
    Component: CreateStoryFixed,
  },
  {
    path: "/story/:id",
    Component: StoryDetailFixed,
  },
  {
    path: "/voice/:id",
    Component: VoiceSelection,
  },
]);
