import { createBrowserRouter } from "react-router";
import { HomeModalDismiss } from "./components/HomeModalDismiss";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { CreateStoryWideClean } from "./components/CreateStoryWideClean";
import { StoryDetailLogoSynced } from "./components/StoryDetailLogoSynced";
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
    Component: CreateStoryWideClean,
  },
  {
    path: "/story/:id",
    Component: StoryDetailLogoSynced,
  },
  {
    path: "/voice/:id",
    Component: VoiceSelectionFixed,
  },
]);
