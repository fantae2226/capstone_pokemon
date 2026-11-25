import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import TeamViewer from './TeamViewer';

// ---------- mocks ----------

const { mockGet, mockPut, mockPost } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPut: vi.fn(),
    mockPost: vi.fn(),
}));

// all backend + GraphQL calls go through axios
vi.mock('axios', () => ({
    default: { get: mockGet, put: mockPut, post: mockPost },
}));

// the page asks supabase for the logged in user's token
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

// ---------- fake PokeAPI data ----------

const GARCHOMP_RAW = {
    id: 445,
    name: 'garchomp',
    stats: [
        { stat: { name: 'hp' }, base_stat: 108 },
        { stat: { name: 'attack' }, base_stat: 130 },
        { stat: { name: 'defense' }, base_stat: 95 },
        { stat: { name: 'special-attack' }, base_stat: 80 },
        { stat: { name: 'special-defense' }, base_stat: 85 },
        { stat: { name: 'speed' }, base_stat: 102 },
    ],
    species: { url: 'https://pokeapi.co/api/v2/pokemon-species/445/' },
    abilities: [
        { ability: { name: 'sand-veil' }, is_hidden: false },
        { ability: { name: 'rough-skin' }, is_hidden: true },
    ],
    sprites: { other: { home: { front_default: 'home.png', front_shiny: 'shiny.png', front_female: null, front_shiny_female: null } } },
    moves: [{ move: { name: 'earthquake' } }, { move: { name: 'fire-fang' } }],
};

// REST responses by URL ending (fetch is used for PokeAPI REST)
const REST: Record<string, unknown> = {
    'pokemon/445': GARCHOMP_RAW,
    'pokemon/garchomp': GARCHOMP_RAW,
    'pokemon-species/445/': { gender_rate: 4 },
    'item-attribute/holdable-passive': { items: [{ name: 'leftovers' }] },
    'item-attribute/holdable-active': { items: [{ name: 'choice-scarf' }] },
    'move/earthquake': {
        name: 'earthquake', power: 100, accuracy: 100, pp: 10, effect_chance: null,
        type: { name: 'ground' }, damage_class: { name: 'physical' },
        effect_entries: [{ language: { name: 'en' }, short_effect: 'Hits every adjacent Pokemon.' }],
    },
    'move/fire-fang': {
        name: 'fire-fang', power: 65, accuracy: 95, pp: 15, effect_chance: 10,
        type: { name: 'fire' }, damage_class: { name: 'physical' },
        effect_entries: [{ language: { name: 'en' }, short_effect: 'Has a $effect_chance% chance to burn.' }],
    },
    'item/choice-scarf': {
        name: 'choice-scarf', sprites: { default: 'scarf.png' },
        effect_entries: [{ language: { name: 'en' }, short_effect: 'Raises Speed, locks the holder into one move.' }],
    },
    'ability/rough-skin': {
        name: 'rough-skin',
        effect_entries: [{ language: { name: 'en' }, short_effect: 'Hurts attackers that make contact.' }],
    },
    // no effect text: the card should fall back to the NEWEST English flavor text, with line breaks removed
    'ability/sand-veil': {
        name: 'sand-veil',
        effect_entries: [],
        flavor_text_entries: [
            { language: { name: 'en' }, flavor_text: 'Old description.' },
            { language: { name: 'de' }, flavor_text: 'Deutsch.' },
            { language: { name: 'en' }, flavor_text: 'Boosts evasion\nin a sandstorm.' },
        ],
    },
};

function mockFetch() {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
        const key = Object.keys(REST).find(k => url.endsWith(k));
        return key
            ? { ok: true, json: async () => REST[key] }
            : { ok: false, status: 404, json: async () => ({}) };
    });
}

// GraphQL (axios.post): the Pokemon table, the move name list, and move learners
function mockGraphQL() {
    mockPost.mockImplementation(async (_url: string, body: { query: string }) => {
        if (body.query.includes('pokemonforms')) {
            return { data: { data: { pokemon: [{
                id: 445,
                name: 'garchomp',
                pokemontypes: [{ type: { name: 'dragon' } }, { type: { name: 'ground' } }],
                pokemonstats: [{ base_stat: 102, stat: { name: 'speed' } }],
                pokemonabilities: [{ ability: { name: 'rough-skin' } }],
            }] } } };
        }
        if (body.query.includes('pokemonmoves')) {
            return { data: { data: { move: [{ name: 'earthquake' }, { name: 'fire-fang' }] } } };
        }
        return { data: { data: { pokemon: [] } } };
    });
}

// a saved team as the backend returns it
const SAVED_TEAM = {
    name: 'Rain Balance',
    team_pokemon: [{
        slot: 0, species_id: 445, item: 'choice-scarf',
        move1: 'earthquake', move2: 'fire-fang', move3: null, move4: null,
        nature: 'jolly', ability: 'rough-skin', gender: 'male', shiny: false, level: 50,
        ev_hp: 0, ev_atk: 252, ev_def: 0, ev_spa: 0, ev_spd: 4, ev_spe: 252,
    }],
};

// TeamViewer reads :teamId from the URL, so it has to sit inside a matching Route
function renderViewer() {
    return render(
        <MemoryRouter initialEntries={['/team-viewer/team-1']}>
            <Routes>
                <Route path="/team-viewer/:teamId" element={<TeamViewer />} />
                <Route path="/browse-teams" element={<p>Browse Teams Page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    mockFetch();
    mockGraphQL();
    mockGet.mockResolvedValue({ data: { name: '', team_pokemon: [] } });
    mockPut.mockResolvedValue({ data: {} });
});

// ---------- first render ----------

describe('TeamViewer - empty team', () => {
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

    it('goes back to Browse Teams from the back link', async () => {
        renderViewer();

        await userEvent.click(screen.getByRole('button', { name: '← Your teams' }));

        expect(screen.getByText('Browse Teams Page')).toBeInTheDocument();
    });
});

// ---------- loading and saving ----------

describe('TeamViewer - loading and saving', () => {
    it('loads the team name and its Pokemon from the backend with the user token', async () => {
        mockGet.mockResolvedValue({ data: SAVED_TEAM });
        renderViewer();

        expect(await screen.findByDisplayValue('Rain Balance')).toBeInTheDocument();
        expect(await screen.findByText('garchomp')).toBeInTheDocument();
        expect(mockGet).toHaveBeenCalledWith(
            expect.stringContaining('/teams/team-1'),
            { headers: { Authorization: 'Bearer test-token' } }
        );
        // slot 0 filled, the other 5 still empty
        expect(screen.getAllByRole('button', { name: 'Add' })).toHaveLength(5);
    });

    it('saves the whole team in one PUT and shows Saved', async () => {
        mockGet.mockResolvedValue({ data: SAVED_TEAM });
        renderViewer();
        await screen.findByText('garchomp');

        await userEvent.click(screen.getByRole('button', { name: 'Save Team' }));

        expect(await screen.findByText('Saved')).toBeInTheDocument();
        expect(mockPut).toHaveBeenCalledWith(
            expect.stringContaining('/teams/team-1'),
            {
                name: 'Rain Balance',
                pokemon: [{
                    slot: 0, species_id: 445, item: 'choice-scarf',
                    moves: ['earthquake', 'fire-fang', null, null],
                    nature: 'jolly', ability: 'rough-skin', gender: 'male', shiny: false, level: 50,
                    evs: { hp: 0, atk: 252, def: 0, spatk: 0, spdef: 4, spe: 252 },
                }],
            },
            { headers: { Authorization: 'Bearer test-token' } }
        );
    });

    it('shows Save Failed when the backend rejects the save', async () => {
        mockPut.mockRejectedValue(new Error('500'));
        renderViewer();

        await userEvent.click(screen.getByRole('button', { name: 'Save Team' }));

        expect(await screen.findByText('Save Failed')).toBeInTheDocument();
    });

    it('removes a Pokemon from its slot with Delete', async () => {
        mockGet.mockResolvedValue({ data: SAVED_TEAM });
        renderViewer();
        await screen.findByText('garchomp');

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(screen.queryByText('garchomp')).toBeNull();
        expect(screen.getAllByRole('button', { name: 'Add' })).toHaveLength(6);
    });
});

// ---------- adding and editing ----------

describe('TeamViewer - adding and editing', () => {
    it('Add opens the browser; picking a Pokemon fills the slot and opens the editor', async () => {
        renderViewer();

        await userEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
        const browserRow = await screen.findByText('garchomp');
        await userEvent.click(browserRow);

        // the editor (inside the popup) shows the new Pokemon's details
        expect(await screen.findByText('Lv.50')).toBeInTheDocument();
        // the browser closed when the editor opened: never two popups at once
        expect(document.querySelectorAll('.modal-overlay')).toHaveLength(1);
        expect(screen.queryByPlaceholderText('Search for a pokemon...')).toBeNull();
    });

    it('Save in the editor closes it and keeps the Pokemon in the slot', async () => {
        renderViewer();
        await userEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
        await userEvent.click(await screen.findByText('garchomp'));
        await screen.findByText('Lv.50');

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(document.querySelector('.modal-overlay')).toBeNull();
        expect(screen.getByText('garchomp')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Add' })).toHaveLength(5);
    });

    it('clicking a filled slot opens the editor with rich move and item cards', async () => {
        mockGet.mockResolvedValue({ data: SAVED_TEAM });
        renderViewer();

        await userEvent.click(await screen.findByText('garchomp'));

        // details come from PokeAPI REST through loadDetails
        expect(await screen.findByText('Hits every adjacent Pokemon.')).toBeInTheDocument();
        // $effect_chance is filled in with the move's real chance
        expect(await screen.findByText('Has a 10% chance to burn.')).toBeInTheDocument();
        expect(await screen.findByText('Raises Speed, locks the holder into one move.')).toBeInTheDocument();
    });

    it('ability cards fall back to the newest English flavor text', async () => {
        mockGet.mockResolvedValue({ data: SAVED_TEAM });
        renderViewer();
        await userEvent.click(await screen.findByText('garchomp'));

        await userEvent.click(screen.getByRole('tab', { name: 'Details' }));

        const sandVeil = screen.getByRole('radio', { name: /sand veil/ });
        await waitFor(() => expect(within(sandVeil).getByText('Boosts evasion in a sandstorm.')).toBeInTheDocument());
    });

    it('Cancel in the editor closes it', async () => {
        mockGet.mockResolvedValue({ data: SAVED_TEAM });
        renderViewer();
        await userEvent.click(await screen.findByText('garchomp'));

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(document.querySelector('.modal-overlay')).toBeNull();
    });
});