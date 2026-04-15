import { createBrowserRouter } from "react-router";
import { HomeModalDismiss } from "./components/HomeModalDismiss";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { CreateStoryFixed } from "./components/CreateStoryFixed";
import { StoryDetailSynced } from "./components/StoryDetailSynced";
import { VoiceSelectionFixed } from "./components/VoiceSelectionFixed";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomeModalDismiss,
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
    Component: StoryDetailSynced,
  },
  {
    path: "/voice/:id",
    Component: VoiceSelectionFixed,
  },
]);
