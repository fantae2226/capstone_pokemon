import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import Dashboard from './Dashboard';
import Navbar from './Navbar';

// purely visual background, swapped for a plain div
vi.mock('@/components/animate-ui/components/backgrounds/hexagon', () => ({
    HexagonBackground: () => <div data-testid="hexagon-background" />,
}));

// Renders Navbar at "/" plus stand-in pages for each link, so we can check a
// click really lands on the right route (no mocking of useNavigate needed)
function renderNavbar() {
    return render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<Navbar />} />
                <Route path="/browse-teams" element={<p>Browse Teams Page</p>} />
                <Route path="/user-settings" element={<p>User Settings Page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('Navbar', () => {
    it('renders the logo and all nav buttons', () => {
        renderNavbar();

        expect(screen.getByText('Poke-Comp')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Browse Pokemon' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Browse Teams' })).toBeTruthy();
        expect(screen.getByText('TestUser1')).toBeTruthy();
    });

    it('toggles the mobile menu when the hamburger is clicked', () => {
        const { container } = renderNavbar();
        const nav = container.querySelector('.main_nav')!;

        expect(nav.className).not.toContain('menu-open');
        fireEvent.click(container.querySelector('.menu_hamburger')!);
        expect(nav.className).toContain('menu-open');
        fireEvent.click(container.querySelector('.menu_hamburger')!);
        expect(nav.className).not.toContain('menu-open');
    });

    it('links Browse Teams to /browse-teams', () => {
        renderNavbar();

        fireEvent.click(screen.getByRole('button', { name: 'Browse Teams' }));

        expect(screen.getByText('Browse Teams Page')).toBeTruthy();
    });

    it('links the user button to /user-settings', () => {
        renderNavbar();

        fireEvent.click(screen.getByText('TestUser1').closest('button')!);

        expect(screen.getByText('User Settings Page')).toBeTruthy();
    });
});

describe('Dashboard', () => {
    it('renders the heading, description, background and navbar', () => {
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Welcome to your Dashboard!');
        expect(
            screen.getByText(
                'This is where you can manage your profile, view your Pokemon collection, and more.'
            )
        ).toBeTruthy();
        expect(screen.getByTestId('hexagon-background')).toBeTruthy();
        expect(screen.getByText('Poke-Comp')).toBeTruthy();
    });
});