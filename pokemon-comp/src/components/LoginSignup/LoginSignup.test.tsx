import LoginSignup from "./LoginSignup"
import { render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { vi, describe, test, expect, beforeEach } from "vitest"

// --- Mocks ---

const { mockNavigate, mockSignInWithPassword } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockSignInWithPassword: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock("@/supabase", () => ({
    default: {
        auth: {
            signInWithPassword: mockSignInWithPassword,
        },
    },
}));

vi.stubGlobal('fetch', vi.fn());


// --- Helpers ---

async function switchToSignup() {
    await userEvent.click(
        screen.getByRole("tab", { name: /sign up/i })
    );
}

function getSignupFields() {
    return {
        username:        screen.getByLabelText("Username"),
        email:           screen.getByLabelText("Email"),
        password:        screen.getByLabelText("Password"),
        confirmPassword: screen.getByLabelText("Confirm Password"),
        submitBtn:       screen.getByRole("button", { name: /sign up/i }),
    };
}

function getLoginFields() {
    return {
        email:     screen.getByLabelText("Email"),
        password:  screen.getByLabelText("Password"),
        submitBtn: screen.getByRole("button", { name: /^login$/i }),
    };
}

const VALID_SIGNUP = {
    username:        "Ash",
    email:           "ash@pokemon.com",
    password:        "Pikachu1!",
    confirmPassword: "Pikachu1!",
};


// --- Tests ---

describe("LoginSignup", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });


    // ── Tab / Layout ──────────────────────────────────────────────

    describe("Rendering", () => {
        test("renders the PokeComp logo", () => {
            render(<LoginSignup />);
            expect(screen.getByText("PokeComp")).toBeInTheDocument();
        });

        test("login tab is active by default", () => {
            render(<LoginSignup />);
            expect(getLoginFields().email).toBeInTheDocument();
            expect(getLoginFields().password).toBeInTheDocument();
        });

        test("switching to Sign Up tab shows all four fields", async () => {
            render(<LoginSignup />);
            await switchToSignup();
            const { username, email, password, confirmPassword } = getSignupFields();
            expect(username).toBeInTheDocument();
            expect(email).toBeInTheDocument();
            expect(password).toBeInTheDocument();
            expect(confirmPassword).toBeInTheDocument();
        });
    });


    // ── Login Form ────────────────────────────────────────────────

    describe("Login", () => {
        test("updates email and password state on change", async () => {
            render(<LoginSignup />);
            const { email, password } = getLoginFields();
            await userEvent.type(email, "ash@pokemon.com");
            await userEvent.type(password, "Pikachu1!");
            expect(email).toHaveValue("ash@pokemon.com");
            expect(password).toHaveValue("Pikachu1!");
        });

        test("calls supabase.signInWithPassword with entered credentials", async () => {
            mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });
            render(<LoginSignup />);
            const { email, password, submitBtn } = getLoginFields();
            await userEvent.type(email, "ash@pokemon.com");
            await userEvent.type(password, "Pikachu1!");
            await userEvent.click(submitBtn);
            expect(mockSignInWithPassword).toHaveBeenCalledWith({
                email:    "ash@pokemon.com",
                password: "Pikachu1!",
            });
        });

        test("navigates to /dashboard on successful login", async () => {
            mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });
            render(<LoginSignup />);
            const { email, password, submitBtn } = getLoginFields();
            await userEvent.type(email, "ash@pokemon.com");
            await userEvent.type(password, "Pikachu1!");
            await userEvent.click(submitBtn);
            await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
        });

        test("does NOT navigate on login error", async () => {
            mockSignInWithPassword.mockResolvedValue({ data: null, error: { message: "Invalid credentials" } });
            render(<LoginSignup />);
            const { email, password, submitBtn } = getLoginFields();
            await userEvent.type(email, "wrong@pokemon.com");
            await userEvent.type(password, "wrongpass");
            await userEvent.click(submitBtn);
            await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
        });
    });


    // ── Signup Validation ─────────────────────────────────────────

    describe("Signup – validation", () => {
        beforeEach(async () => {
            render(<LoginSignup />);
            await switchToSignup();
        });

        test("shows email error for invalid email format", async () => {
            const { username, email, password, confirmPassword, submitBtn } = getSignupFields();
            await userEvent.type(username, "Ash");
            await userEvent.type(email, "not-an-email");
            await userEvent.type(password, "Pikachu1!");
            await userEvent.type(confirmPassword, "Pikachu1!");
            await userEvent.click(submitBtn);
            expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
        });

        test("shows password error when password is too weak", async () => {
            const { username, email, password, confirmPassword, submitBtn } = getSignupFields();
            await userEvent.type(username, "Ash");
            await userEvent.type(email, "ash@pokemon.com");
            await userEvent.type(password, "weakpass");
            await userEvent.type(confirmPassword, "weakpass");
            await userEvent.click(submitBtn);
            expect(await screen.findByText(/uppercase letter/i)).toBeInTheDocument();
        });

        test("shows confirmPassword error when passwords do not match", async () => {
            const { username, email, password, confirmPassword, submitBtn } = getSignupFields();
            await userEvent.type(username, "Ash");
            await userEvent.type(email, "ash@pokemon.com");
            await userEvent.type(password, "Pikachu1!");
            await userEvent.type(confirmPassword, "Pikachu2!");
            await userEvent.click(submitBtn);
            expect(await screen.findByText(/does not match/i)).toBeInTheDocument();
        });

        test("shows all three errors simultaneously when all fields are invalid", async () => {
            const { email, password, confirmPassword, submitBtn } = getSignupFields();
            // Trigger all three errors at once:
            // - bad email format  → email error
            // - weak password     → password error
            // - mismatch          → confirmPassword error
            // (two empty strings are equal so won't trigger the mismatch error)
            await userEvent.type(email, "not-an-email");
            await userEvent.type(password, "weakpass");
            await userEvent.type(confirmPassword, "different");
            await userEvent.click(submitBtn);
            await waitFor(() => {
                expect(screen.getByText(/valid email/i)).toBeInTheDocument();
                expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
                expect(screen.getByText(/does not match/i)).toBeInTheDocument();
            });
        });

        test("clears errors after fixing invalid fields and resubmitting successfully", async () => {
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                json: async () => ({ message: "User created" }),
            });
            const { username, email, password, confirmPassword, submitBtn } = getSignupFields();

            // First: trigger errors
            await userEvent.type(email, "bad");
            await userEvent.click(submitBtn);
            expect(await screen.findByText(/valid email/i)).toBeInTheDocument();

            // Fix everything
            await userEvent.clear(email);
            await userEvent.type(username, VALID_SIGNUP.username);
            await userEvent.type(email, VALID_SIGNUP.email);
            await userEvent.type(password, VALID_SIGNUP.password);
            await userEvent.type(confirmPassword, VALID_SIGNUP.confirmPassword);
            await userEvent.click(submitBtn);

            await waitFor(() => {
                expect(screen.queryByText(/valid email/i)).not.toBeInTheDocument();
                expect(screen.queryByText(/uppercase letter/i)).not.toBeInTheDocument();
                expect(screen.queryByText(/does not match/i)).not.toBeInTheDocument();
            });
        });
    });


    // ── Signup Submission ─────────────────────────────────────────

    describe("Signup – successful submission", () => {
        test("calls /signup endpoint with correct payload on valid form", async () => {
            (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
                json: async () => ({ message: "User created" }),
            });
            render(<LoginSignup />);
            await switchToSignup();
            const { username, email, password, confirmPassword, submitBtn } = getSignupFields();
            await userEvent.type(username, VALID_SIGNUP.username);
            await userEvent.type(email, VALID_SIGNUP.email);
            await userEvent.type(password, VALID_SIGNUP.password);
            await userEvent.type(confirmPassword, VALID_SIGNUP.confirmPassword);
            await userEvent.click(submitBtn);

            await waitFor(() => {
                expect(globalThis.fetch).toHaveBeenCalledWith(
                    "http://localhost:8000/signup",
                    expect.objectContaining({
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(VALID_SIGNUP),
                    })
                );
            });
        });

        test("does NOT call fetch when validation fails", async () => {
            render(<LoginSignup />);
            await switchToSignup();
            const { submitBtn } = getSignupFields();
            await userEvent.click(submitBtn);
            expect(globalThis.fetch).not.toHaveBeenCalled();
        });

        test("updates all signup state fields as the user types", async () => {
            render(<LoginSignup />);
            await switchToSignup();
            const { username, email, password, confirmPassword } = getSignupFields();
            await userEvent.type(username, VALID_SIGNUP.username);
            await userEvent.type(email, VALID_SIGNUP.email);
            await userEvent.type(password, VALID_SIGNUP.password);
            await userEvent.type(confirmPassword, VALID_SIGNUP.confirmPassword);
            expect(username).toHaveValue(VALID_SIGNUP.username);
            expect(email).toHaveValue(VALID_SIGNUP.email);
            expect(password).toHaveValue(VALID_SIGNUP.password);
            expect(confirmPassword).toHaveValue(VALID_SIGNUP.confirmPassword);
        });
    });
});