import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import TeamViewer from './TeamViewer';

// purely visual background, swapped for a plain div
vi.mock('@/components/animate-ui/components/backgrounds/hexagon', () => ({
    HexagonBackground: () => <div data-testid="hexagon-background" />,
}));

// TeamViewer reads :teamId from the URL, so it has to sit inside a matching Route
function renderViewer() {
    return render(
        <MemoryRouter initialEntries={['/team-viewer/team-1']}>
            <Routes>
                <Route path="/team-viewer/:teamId" element={<TeamViewer />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('TeamViewer', () => {
    it('renders the background, team name input and Save Team button', () => {
        renderViewer();

        expect(screen.getByTestId('hexagon-background')).toBeTruthy();
        expect(screen.getByPlaceholderText('Team Name')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Save Team' })).toBeTruthy();
    });

    it('renders six empty slots, each with an Add button', () => {
        const { container } = renderViewer();

        expect(container.querySelectorAll('.team_slot')).toHaveLength(6);
        expect(screen.getAllByAltText('Empty team slot')).toHaveLength(6);
        expect(screen.getAllByRole('button', { name: 'Add' })).toHaveLength(6);
    });

    it('holds a typed team name', () => {
        renderViewer();
        const input = screen.getByPlaceholderText('Team Name') as HTMLInputElement;

        fireEvent.change(input, { target: { value: 'Rain Team' } });

        expect(input.value).toBe('Rain Team');
    });

    it('does not show Delete buttons, a status message or a modal on first render', () => {
        renderViewer();

        expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
        expect(screen.queryByText('Saved')).toBeNull();
        expect(screen.queryByText('Save Failed')).toBeNull();
    });
});