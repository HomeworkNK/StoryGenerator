import { createBrowserRouter } from "react-router";
import { HomeModalDismiss } from "./components/HomeModalDismiss";
import { LoginCentered } from "./components/LoginCentered";
import { RegisterCentered } from "./components/RegisterCentered";
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
    Component: LoginCentered,
  },
  {
    path: "/register",
    Component: RegisterCentered,
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
