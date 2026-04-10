import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import RegistryForm from "@/components/RegistryForm";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock env
process.env.NEXT_PUBLIC_NEXTAUTH_URL = "http://localhost:3000";

// Mock next-auth/react
const mockSignIn = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RegistryForm", () => {
  it("renders all form fields", () => {
    render(<RegistryForm />);

    expect(screen.getByLabelText("Imię:")).toBeInTheDocument();
    expect(screen.getByLabelText("Email:")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasło:")).toBeInTheDocument();
    expect(screen.getByLabelText("Powtórz hasło:")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<RegistryForm />);

    expect(
      screen.getByRole("button", { name: "Zarejestruj" }),
    ).toBeInTheDocument();
  });

  it("renders link to login page", () => {
    render(<RegistryForm />);

    const link = screen.getByText("zaloguj się");
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows validation error for empty name", async () => {
    render(<RegistryForm />);

    fireEvent.click(screen.getByRole("button", { name: "Zarejestruj" }));

    await waitFor(() => {
      expect(screen.getByText("to pole jest wymagane")).toBeInTheDocument();
    });
  });

  it("shows validation error for short password", async () => {
    render(<RegistryForm />);

    fireEvent.change(screen.getByLabelText("Imię:"), {
      target: { value: "Jan" },
    });
    fireEvent.change(screen.getByLabelText("Email:"), {
      target: { value: "jan@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Hasło:"), {
      target: { value: "abc" },
    });
    fireEvent.change(screen.getByLabelText("Powtórz hasło:"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zarejestruj" }));

    await waitFor(() => {
      expect(
        screen.getByText("hasło za krótkie (min 7 znaków)"),
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for mismatched passwords", async () => {
    render(<RegistryForm />);

    fireEvent.change(screen.getByLabelText("Imię:"), {
      target: { value: "Jan" },
    });
    fireEvent.change(screen.getByLabelText("Email:"), {
      target: { value: "jan@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Hasło:"), {
      target: { value: "haslo123" },
    });
    fireEvent.change(screen.getByLabelText("Powtórz hasło:"), {
      target: { value: "inneinne" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zarejestruj" }));

    await waitFor(() => {
      expect(
        screen.getByText("podane hasła nie są takie same"),
      ).toBeInTheDocument();
    });
  });

  it("calls API and signs in on successful registration", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "new-user", name: "Jan" }),
    });

    render(<RegistryForm />);

    fireEvent.change(screen.getByLabelText("Imię:"), {
      target: { value: "Jan" },
    });
    fireEvent.change(screen.getByLabelText("Email:"), {
      target: { value: "jan@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Hasło:"), {
      target: { value: "haslo123" },
    });
    fireEvent.change(screen.getByLabelText("Powtórz hasło:"), {
      target: { value: "haslo123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zarejestruj" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/rejestracja",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "jan@example.com",
        password: "haslo123",
        redirectTo: "/",
      });
    });
  });

  it("shows server error for duplicate email", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: { email: "podany email już istnieje" } }),
      statusText: "Unprocessable Entity",
    });

    render(<RegistryForm />);

    fireEvent.change(screen.getByLabelText("Imię:"), {
      target: { value: "Jan" },
    });
    fireEvent.change(screen.getByLabelText("Email:"), {
      target: { value: "jan@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Hasło:"), {
      target: { value: "haslo123" },
    });
    fireEvent.change(screen.getByLabelText("Powtórz hasło:"), {
      target: { value: "haslo123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zarejestruj" }));

    await waitFor(() => {
      expect(screen.getByText("podany email już istnieje")).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows server error for duplicate username", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: { name: "podana nazwa użytkownika już istnieje" },
      }),
      statusText: "Unprocessable Entity",
    });

    render(<RegistryForm />);

    fireEvent.change(screen.getByLabelText("Imię:"), {
      target: { value: "Jan" },
    });
    fireEvent.change(screen.getByLabelText("Email:"), {
      target: { value: "jan@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Hasło:"), {
      target: { value: "haslo123" },
    });
    fireEvent.change(screen.getByLabelText("Powtórz hasło:"), {
      target: { value: "haslo123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zarejestruj" }));

    await waitFor(() => {
      expect(
        screen.getByText("podana nazwa użytkownika już istnieje"),
      ).toBeInTheDocument();
    });
  });

  it("shows unknown error when API throws", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    render(<RegistryForm />);

    fireEvent.change(screen.getByLabelText("Imię:"), {
      target: { value: "Jan" },
    });
    fireEvent.change(screen.getByLabelText("Email:"), {
      target: { value: "jan@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Hasło:"), {
      target: { value: "haslo123" },
    });
    fireEvent.change(screen.getByLabelText("Powtórz hasło:"), {
      target: { value: "haslo123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zarejestruj" }));

    await waitFor(() => {
      expect(
        screen.getByText("coś poszło nie tak, spróbuj ponownie później"),
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
