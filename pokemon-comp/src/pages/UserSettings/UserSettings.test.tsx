import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import UserSettings from './UserSettings';

const { mockPatch, mockSignOut } = vi.hoisted(() => ({
    mockPatch: vi.fn(),
    mockSignOut: vi.fn(),
}));

// backend calls; isAxiosError lets the page read the server's error message
vi.mock('axios', () => ({
    default: {
        patch: mockPatch,
        isAxiosError: (e: any) => !!e?.isAxiosError,
    },
}));

// supabase: the users table returns the saved username, and signOut is spied on
vi.mock('@/lib/supabase', () => ({
    default: {
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: { username: 'ash' }, error: null }),
                }),
            }),
        }),
        auth: { signOut: mockSignOut },
    },
}));

// an axios-style error carrying the backend's { error } message
function serverError(message: string) {
    return Object.assign(new Error(message), { isAxiosError: true, response: { data: { error: message } } });
}

beforeEach(() => {
    mockSignOut.mockResolvedValue({ error: null });
});

// purely visual background, swapped for a plain div
vi.mock('@/components/animate-ui/components/backgrounds/hexagon', () => ({
    HexagonBackground: () => <div data-testid="hexagon-background" />,
}));

// the page reads the logged in user from context, so give it a fixed one
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1', email: 'ash@example.com' },
        session: { access_token: 'test-token' },
    }),
}));

// Renders the page at "/settings" plus a stand-in /dashboard page, so we can
// check the return arrow really lands on the right route
function renderSettings() {
    return render(
        <MemoryRouter initialEntries={['/settings']}>
            <Routes>
                <Route path="/settings" element={<UserSettings />} />
                <Route path="/dashboard" element={<p>Dashboard Page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('UserSettings - page', () => {
    it('renders the background, the return button and the logout button', () => {
        renderSettings();

        expect(screen.getByTestId('hexagon-background')).toBeTruthy();
        expect(screen.getByRole('button', { name: '← Dashboard' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Logout' })).toBeTruthy();
    });

    it('links the return arrow to /dashboard', () => {
        renderSettings();

        fireEvent.click(screen.getByRole('button', { name: '← Dashboard' }));

        expect(screen.getByText('Dashboard Page')).toBeTruthy();
    });
});

describe('UserSettings - profile', () => {
    it('shows the account fields as read-only', () => {
        renderSettings();

        expect(screen.getByText('Account Information')).toBeTruthy();
        expect((screen.getByLabelText('Username') as HTMLInputElement).readOnly).toBe(true);
        expect((screen.getByLabelText('Email') as HTMLInputElement).readOnly).toBe(true);
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    });

    it('shows the email of the logged in user', async () => {
        renderSettings();

        expect(await screen.findByDisplayValue('ash@example.com')).toBeTruthy();
    });

    it('shows Save and an editable username after clicking Edit, and hides them on Cancel', () => {
        renderSettings();

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
        expect((screen.getByLabelText('Username') as HTMLInputElement).readOnly).toBe(false);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    });

    it('holds a typed username and reverts it on Cancel', async () => {
        renderSettings();
        await screen.findByDisplayValue('ash');
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        const input = screen.getByLabelText('Username') as HTMLInputElement;

        fireEvent.change(input, { target: { value: 'misty' } });
        expect(input.value).toBe('misty');

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(input.value).toBe('ash'); // back to the saved value loaded from the users table
    });

    it('holds typed security fields and clears them when the form is reopened', () => {
        renderSettings();
        fireEvent.click(screen.getByRole('button', { name: 'Change Email or Password' }));

        fireEvent.change(screen.getByLabelText('New Email'), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'Newpass1!' } });
        expect((screen.getByLabelText('New Email') as HTMLInputElement).value).toBe('new@example.com');
        expect((screen.getByLabelText('New Password') as HTMLInputElement).value).toBe('Newpass1!');

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        fireEvent.click(screen.getByRole('button', { name: 'Change Email or Password' }));
        expect((screen.getByLabelText('New Email') as HTMLInputElement).value).toBe('');
        expect((screen.getByLabelText('New Password') as HTMLInputElement).value).toBe('');
    });

    it('shows and hides the email/password form with the toggle button', () => {
        renderSettings();
        expect(screen.queryByLabelText('New Email')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Change Email or Password' }));
        expect(screen.getByLabelText('New Email')).toBeTruthy();
        expect(screen.getByLabelText('New Password')).toBeTruthy();
        expect(screen.getByLabelText('Confirm Password')).toBeTruthy();
        expect(screen.getByLabelText('Current Password')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Update' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.queryByLabelText('New Email')).toBeNull();
    });
});

describe('UserSettings - saving the username', () => {
    it('loads the saved username from the users table', async () => {
        renderSettings();

        expect(await screen.findByDisplayValue('ash')).toBeTruthy();
    });

    it('leaves edit mode without a request when the username did not change', async () => {
        renderSettings();
        await screen.findByDisplayValue('ash');

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(mockPatch).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    });

    it('saves a new username with the user token and confirms it', async () => {
        mockPatch.mockResolvedValue({ data: { username: 'misty' } });
        renderSettings();
        await screen.findByDisplayValue('ash');

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'misty' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(await screen.findByText('Username updated.')).toBeTruthy();
        expect(mockPatch).toHaveBeenCalledWith(
            expect.stringContaining('/user/username'),
            { username: 'misty' },
            { headers: { Authorization: 'Bearer test-token' } }
        );
        expect((screen.getByLabelText('Username') as HTMLInputElement).readOnly).toBe(true);
    });

    it("shows the backend's error message when saving fails", async () => {
        mockPatch.mockRejectedValue(serverError('Username already taken'));
        renderSettings();
        await screen.findByDisplayValue('ash');

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'brock' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(await screen.findByText('Username already taken')).toBeTruthy();
    });

    it('shows a general message for errors that are not from the backend', async () => {
        mockPatch.mockRejectedValue(new Error('boom'));
        renderSettings();
        await screen.findByDisplayValue('ash');

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'brock' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(await screen.findByText('Something went wrong...')).toBeTruthy();
    });
});

describe('UserSettings - changing email or password', () => {
    // opens the form and fills only the fields given
    function fillSecurity(fields: Partial<Record<'New Email' | 'New Password' | 'Confirm Password' | 'Current Password', string>>) {
        fireEvent.click(screen.getByRole('button', { name: 'Change Email or Password' }));
        for (const [label, value] of Object.entries(fields)) {
            fireEvent.change(screen.getByLabelText(label), { target: { value } });
        }
        fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    }

    it('asks for a new email or password when both are blank', async () => {
        renderSettings();
        fillSecurity({ 'Current Password': 'Oldpass1!' });

        expect(await screen.findByText('Enter a new email or password.')).toBeTruthy();
        expect(mockPatch).not.toHaveBeenCalled();
    });

    it('rejects a new email without a domain ending', async () => {
        renderSettings();
        // the browser's own type="email" check blocks text with no @ before our code runs,
        // so this uses one the browser allows but our validator rejects (no .com/.ca ending)
        fillSecurity({ 'New Email': 'ash@pokemon', 'Current Password': 'Oldpass1!' });

        expect(await screen.findByText('Please enter a valid email address.')).toBeTruthy();
    });

    it('rejects a weak new password', async () => {
        renderSettings();
        fillSecurity({ 'New Password': 'weak', 'Confirm Password': 'weak', 'Current Password': 'Oldpass1!' });

        expect(await screen.findByText(/at least one uppercase letter/)).toBeTruthy();
    });

    it("rejects new passwords that don't match", async () => {
        renderSettings();
        fillSecurity({ 'New Password': 'Newpass1!', 'Confirm Password': 'Newpass2!', 'Current Password': 'Oldpass1!' });

        expect(await screen.findByText("New passwords don't match.")).toBeTruthy();
    });

    it('requires the current password', async () => {
        renderSettings();
        fillSecurity({ 'New Password': 'Newpass1!', 'Confirm Password': 'Newpass1!' });

        expect(await screen.findByText('Enter your current password')).toBeTruthy();
    });

    it('sends only the changed fields, then signs the user out', async () => {
        mockPatch.mockResolvedValue({ data: { message: 'Credentials updated. Please sign in again' } });
        renderSettings();
        fillSecurity({ 'New Password': 'Newpass1!', 'Confirm Password': 'Newpass1!', 'Current Password': 'Oldpass1!' });

        await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
        expect(mockPatch).toHaveBeenCalledWith(
            expect.stringContaining('/user/credentials'),
            { currentPassword: 'Oldpass1!', newPassword: 'Newpass1!' },
            { headers: { Authorization: 'Bearer test-token' } }
        );
    });

    it("shows the backend's error, e.g. a wrong current password, and stays signed in", async () => {
        mockPatch.mockRejectedValue(serverError('Current password is incorrect'));
        renderSettings();
        fillSecurity({ 'New Email': 'new@example.com', 'Current Password': 'Wrong1!x' });

        expect(await screen.findByText('Current password is incorrect')).toBeTruthy();
        expect(mockSignOut).not.toHaveBeenCalled();
    });
});

describe('UserSettings - logout', () => {
    it('signs the user out', () => {
        renderSettings();

        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

        expect(mockSignOut).toHaveBeenCalled();
    });
});