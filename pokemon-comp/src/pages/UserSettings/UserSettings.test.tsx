import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import UserSettings from './UserSettings';

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
    it('renders the background and every nav button', () => {
        renderSettings();

        expect(screen.getByTestId('hexagon-background')).toBeTruthy();
        expect(screen.getByRole('button', { name: '⇐' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Manage User Profile' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Manage Pokemon Teams' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Import New Team' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Logout' })).toBeTruthy();
    });

    it('links the return arrow to /dashboard', () => {
        renderSettings();

        fireEvent.click(screen.getByRole('button', { name: '⇐' }));

        expect(screen.getByText('Dashboard Page')).toBeTruthy();
    });
});

describe('UserSettings - profile tab', () => {
    it('is the default tab and shows the account fields as read-only', () => {
        renderSettings();

        expect(screen.getByText('Account Information')).toBeTruthy();
        expect((screen.getByLabelText('Username:') as HTMLInputElement).readOnly).toBe(true);
        expect((screen.getByLabelText('Email:') as HTMLInputElement).readOnly).toBe(true);
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
        expect((screen.getByLabelText('Username:') as HTMLInputElement).readOnly).toBe(false);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    });

    it('holds a typed username and reverts it on Cancel', () => {
        renderSettings();
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        const input = screen.getByLabelText('Username:') as HTMLInputElement;

        fireEvent.change(input, { target: { value: 'misty' } });
        expect(input.value).toBe('misty');

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(input.value).toBe(''); // back to the saved value, which is empty when nothing loaded
    });

    it('holds typed security fields and clears them when the form is reopened', () => {
        renderSettings();
        fireEvent.click(screen.getByRole('button', { name: 'Change Email or Password' }));

        fireEvent.change(screen.getByLabelText('New Email:'), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getByLabelText('New Password:'), { target: { value: 'Newpass1!' } });
        expect((screen.getByLabelText('New Email:') as HTMLInputElement).value).toBe('new@example.com');
        expect((screen.getByLabelText('New Password:') as HTMLInputElement).value).toBe('Newpass1!');

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        fireEvent.click(screen.getByRole('button', { name: 'Change Email or Password' }));
        expect((screen.getByLabelText('New Email:') as HTMLInputElement).value).toBe('');
        expect((screen.getByLabelText('New Password:') as HTMLInputElement).value).toBe('');
    });

    it('shows and hides the email/password form with the toggle button', () => {
        renderSettings();
        expect(screen.queryByLabelText('New Email:')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Change Email or Password' }));
        expect(screen.getByLabelText('New Email:')).toBeTruthy();
        expect(screen.getByLabelText('New Password:')).toBeTruthy();
        expect(screen.getByLabelText('Confirm Password:')).toBeTruthy();
        expect(screen.getByLabelText('Current Password:')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Update' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.queryByLabelText('New Email:')).toBeNull();
    });
});

describe('UserSettings - other tabs', () => {
    it('shows the Pokemon teams tab and hides the profile tab', () => {
        renderSettings();

        fireEvent.click(screen.getByRole('button', { name: 'Manage Pokemon Teams' }));

        expect(screen.getByText('Last Edited Teams')).toBeTruthy();
        expect(screen.getByText('Trick Room')).toBeTruthy();
        expect(screen.queryByText('Account Information')).toBeNull();
    });

    it('shows the import tab with its input', () => {
        renderSettings();

        fireEvent.click(screen.getByRole('button', { name: 'Import New Team' }));

        expect(screen.getByText('Insert your Team import code here')).toBeTruthy();
        expect(screen.getByLabelText('Import Code:')).toBeTruthy();
        expect(screen.queryByText('Account Information')).toBeNull();
    });

    it('switches back to the profile tab', () => {
        renderSettings();
        fireEvent.click(screen.getByRole('button', { name: 'Import New Team' }));

        fireEvent.click(screen.getByRole('button', { name: 'Manage User Profile' }));

        expect(screen.getByText('Account Information')).toBeTruthy();
    });
});