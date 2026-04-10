import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import LoginForm from "@/components/LoginForm";

// Mock next-auth/react
const mockSignIn = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Haslo")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: "Zaloguj" })).toBeInTheDocument();
  });

  it("renders link to registration page", () => {
    render(<LoginForm />);

    const link = screen.getByText("Zarejestruj sie");
    expect(link).toHaveAttribute("href", "/rejestracja");
  });

  it("calls signIn with credentials and redirects on success", async () => {
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "Jan@Example.com" },
    });
    fireEvent.change(screen.getByLabelText("Haslo"), {
      target: { value: "haslo123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zaloguj" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        redirect: false,
        email: "jan@example.com",
        password: "haslo123",
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows error message on failed login", async () => {
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jan@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Haslo"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zaloguj" }));

    await waitFor(() => {
      expect(
        screen.getByText("Niepoprawny email lub hasło"),
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows error message on unexpected error", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jan@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Haslo"), {
      target: { value: "haslo123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zaloguj" }));

    await waitFor(() => {
      expect(
        screen.getByText("Wystąpił nieoczekiwany błąd. Spróbuj ponownie."),
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("lowercases and trims email before sending", async () => {
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  JAN@EXAMPLE.COM  " },
    });
    fireEvent.change(screen.getByLabelText("Haslo"), {
      target: { value: "haslo123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zaloguj" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({
          email: "jan@example.com",
        }),
      );
    });
  });
});
