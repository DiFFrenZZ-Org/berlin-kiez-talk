import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatInterface } from "../ChatInterface";
import type { UserProfile } from "@/hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Mock deps                                                         */
/* ------------------------------------------------------------------ */
vi.mock("@/hooks/useChatRooms", () => ({
  useChatRooms: () => ({ data: [], refetch: vi.fn() }),
}));
vi.mock("@/hooks/useRoomMessages", () => ({
  useRoomMessages: () => ({ data: [], refetch: vi.fn() }),
}));
vi.mock("@/services/sendChatMessage", () => ({
  sendChatMessage: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

/* ------------------------------------------------------------------ */
/*  Test fixture                                                      */
/* ------------------------------------------------------------------ */
const userProfile: UserProfile = {
  id: "1",
  email: "test@example.com",
  nickname: null,
  user_role: "buyer",
  borough: null,
  subscription_tier: null,
  subscription_active: null,
  verified_local: null,
  reputation_score: null,
};

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe("ChatInterface", () => {
  it("renders placeholder when no chat is active", () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <ChatInterface userProfile={userProfile} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Welcome to KiezTalk")).toBeInTheDocument();
  });
});
