import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import BrowseTeams from './BrowseTeams';

// purely visual background, swapped for a plain div
vi.mock('@/components/animate-ui/components/backgrounds/hexagon', () => ({
    HexagonBackground: () => <div data-testid="hexagon-background" />,
}));

describe('BrowseTeams', () => {
    it('renders the background, the Add Team button and the teams container', () => {
        const { container } = render(<BrowseTeams />);

        expect(screen.getByTestId('hexagon-background')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Add Team' })).toBeTruthy();
        expect(container.querySelector('.teams_container')).not.toBeNull();
    });

    it('starts with no team containers before any teams have loaded', () => {
        const { container } = render(<BrowseTeams />);

        expect(container.querySelector('.teams_container')!.children).toHaveLength(0);
    });
});