import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import BrowseTeams from './BrowseTeams';

// ---------- mocks ----------

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockDelete: vi.fn(),
}));

vi.mock('axios', () => ({
    default: { get: mockGet, post: mockPost, delete: mockDelete },
}));

vi.mock('@/lib/supabase', () => ({
    default: {
        auth: {
            getSession: async () => ({ data: { session: { access_token: 'test-token' } } }),
        },
    },
}));

// purely visual background, swapped for a plain div
vi.mock('@/components/animate-ui/components/backgrounds/hexagon', () => ({
    HexagonBackground: () => <div data-testid="hexagon-background" />,
}));

// navbar is tested on its own, swapped for a plain element
vi.mock('../Dashboard/Navbar', () => ({
    default: () => <nav data-testid="navbar" />,
}));

// ---------- data ----------

const HOME = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home';
const AUTH = { headers: { Authorization: 'Bearer test-token' } };

// two teams as GET /teams returns them
const TEAMS = [
    {
        id: 't1',
        name: 'Rain Balance',
        updated_at: '2026-11-20T12:00:00Z',
        team_pokemon: [
            { slot: 0, species_id: 445, shiny: false, gender: 'male' },
            { slot: 2, species_id: 279, shiny: true, gender: 'female' },
        ],
    },
    { id: 't2', name: 'Sun Room', updated_at: '2026-11-18T12:00:00Z', team_pokemon: [] },
];

// cards link to the team viewer, so the page sits in a router with a stand-in viewer route
function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/browse-teams']}>
            <Routes>
                <Route path="/browse-teams" element={<BrowseTeams />} />
                <Route path="/team-viewer/:teamId" element={<p>Team Viewer Page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

// the card that contains the given team name
function card(name: string) {
    return screen.getByText(name).closest('.team_container') as HTMLElement;
}

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockResolvedValue({ data: [] });
});

// ---------- page ----------

describe('BrowseTeams - page', () => {
    it('renders the background, the Add Team button and the teams container', () => {
        const { container } = renderPage();

        expect(screen.getByTestId('hexagon-background')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Add Team' })).toBeTruthy();
        expect(container.querySelector('.teams_container')).not.toBeNull();
    });

    it('starts with no team containers before any teams have loaded', () => {
        const { container } = renderPage();

        expect(container.querySelector('.teams_container')!.children).toHaveLength(0);
        expect(screen.getByText('0 teams')).toBeInTheDocument();
    });

    it("loads the user's teams with their token", async () => {
        mockGet.mockResolvedValue({ data: TEAMS });
        renderPage();

        expect(await screen.findByText('Rain Balance')).toBeInTheDocument();
        expect(screen.getByText('Sun Room')).toBeInTheDocument();
        expect(screen.getByText('2 teams')).toBeInTheDocument();
        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/teams'), AUTH);
    });

    it('says "1 team" for a single team', async () => {
        mockGet.mockResolvedValue({ data: [TEAMS[1]] });
        renderPage();

        expect(await screen.findByText('1 team')).toBeInTheDocument();
    });

    it('shows no teams if loading fails', async () => {
        mockGet.mockRejectedValue(new Error('500'));
        renderPage();

        await waitFor(() => expect(console.error).toHaveBeenCalled());
        expect(screen.getByText('0 teams')).toBeInTheDocument();
    });

    it('adds a new empty team from Add Team', async () => {
        mockPost.mockResolvedValue({ data: { id: 't3', name: 'New Team', updated_at: '2026-11-24T12:00:00Z', team_pokemon: [] } });
        renderPage();

        await userEvent.click(screen.getByRole('button', { name: 'Add Team' }));

        expect(await screen.findByText('New Team')).toBeInTheDocument();
        expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/teams'), {}, AUTH);
    });
});

// ---------- team cards ----------

describe('BrowseTeams - team cards', () => {
    it('puts each Pokemon in its slot with the right HOME sprite', async () => {
        mockGet.mockResolvedValue({ data: TEAMS });
        renderPage();
        await screen.findByText('Rain Balance');

        const images = within(card('Rain Balance')).getAllByRole('img');

        expect(images).toHaveLength(6);
        expect(images[0]).toHaveAttribute('src', `${HOME}/445.png`);
        expect(images[1]).toHaveAttribute('alt', 'Empty team slot');
        // shiny + female sprite folder for slot 2
        expect(images[2]).toHaveAttribute('src', `${HOME}/shiny/female/279.png`);
        expect(within(card('Rain Balance')).getByText('2/6')).toBeInTheDocument();
    });

    it('falls back to the normal sprite when a female sprite does not exist', async () => {
        mockGet.mockResolvedValue({ data: TEAMS });
        renderPage();
        await screen.findByText('Rain Balance');
        const female = within(card('Rain Balance')).getAllByRole('img')[2];

        fireEvent.error(female);

        expect(female).toHaveAttribute('src', `${HOME}/shiny/279.png`);
    });

    it('Edit opens the team viewer for that team', async () => {
        mockGet.mockResolvedValue({ data: TEAMS });
        renderPage();
        await screen.findByText('Rain Balance');

        await userEvent.click(within(card('Rain Balance')).getByRole('button', { name: 'Edit' }));

        expect(screen.getByText('Team Viewer Page')).toBeInTheDocument();
    });

    it('asks for confirmation before deleting, and Keep cancels', async () => {
        mockGet.mockResolvedValue({ data: TEAMS });
        renderPage();
        await screen.findByText('Rain Balance');

        await userEvent.click(within(card('Rain Balance')).getByRole('button', { name: 'Delete' }));
        expect(screen.getByText("Delete Rain Balance? This can't be undone.")).toBeInTheDocument();
        expect(mockDelete).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', { name: 'Keep' }));
        expect(screen.queryByText("Delete Rain Balance? This can't be undone.")).toBeNull();
        expect(screen.getByText('Rain Balance')).toBeInTheDocument();
    });

    it('deletes the team after confirming', async () => {
        mockGet.mockResolvedValue({ data: TEAMS });
        mockDelete.mockResolvedValue({ data: {} });
        renderPage();
        await screen.findByText('Rain Balance');

        await userEvent.click(within(card('Rain Balance')).getByRole('button', { name: 'Delete' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete team' }));

        await waitFor(() => expect(screen.queryByText('Rain Balance')).toBeNull());
        expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('/teams/t1'), AUTH);
        expect(screen.getByText('1 team')).toBeInTheDocument();
    });

    it('keeps the team if the delete request fails', async () => {
        mockGet.mockResolvedValue({ data: TEAMS });
        mockDelete.mockRejectedValue(new Error('500'));
        renderPage();
        await screen.findByText('Rain Balance');

        await userEvent.click(within(card('Rain Balance')).getByRole('button', { name: 'Delete' }));
        await userEvent.click(screen.getByRole('button', { name: 'Delete team' }));

        await waitFor(() => expect(console.error).toHaveBeenCalled());
        expect(screen.getByText('Rain Balance')).toBeInTheDocument();
    });
});