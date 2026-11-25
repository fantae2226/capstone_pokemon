import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import PokemonEditor from './PokemonEditor';
import type { TeamPokemon, DetailMaps } from '@/types/pokemon';

// ---------- test data ----------

// a level 50 Jolly Garchomp: 252 Atk / 4 SpD / 252 Spe, 2 EVs left
function makeGarchomp(overrides: Partial<TeamPokemon> = {}): TeamPokemon {
    return {
        id: '445',
        name: 'garchomp',
        spriteUrl: 'garchomp.png',
        baseStats: { hp: 108, atk: 130, def: 95, spatk: 80, spdef: 85, spe: 102 },
        moves: ['earthquake', null, null, null],
        item: 'choice-scarf',
        availableMoves: ['earthquake', 'dragon-claw', 'dragon-dance', 'stone-edge'],
        nature: 'jolly',
        ability: 'rough-skin',
        availableAbilities: [
            { name: 'sand-veil', hidden: false },
            { name: 'rough-skin', hidden: true },
        ],
        gender: 'male',
        genderOptions: ['male', 'female'],
        shiny: false,
        level: 50,
        evs: { hp: 0, atk: 252, def: 0, spatk: 0, spdef: 4, spe: 252 },
        sprites: { default: 'garchomp.png', shiny: null, female: null, shinyFemale: null },
        ...overrides,
    };
}

const DETAILS: DetailMaps = {
    move: {
        'earthquake': { name: 'earthquake', type: 'ground', category: 'physical', power: 100, accuracy: 100, pp: 10, description: 'Hits every adjacent Pokemon.' },
        'dragon-claw': { name: 'dragon-claw', type: 'dragon', category: 'physical', power: 80, accuracy: 100, pp: 15, description: 'Slashes with sharp claws.' },
        'dragon-dance': { name: 'dragon-dance', type: 'dragon', category: 'status', power: null, accuracy: null, pp: 20, description: 'Raises Attack and Speed.' },
    },
    item: {
        'choice-scarf': { name: 'choice-scarf', spriteUrl: 'scarf.png', description: 'Raises Speed, locks the holder into one move.' },
    },
    ability: {
        'rough-skin': { name: 'rough-skin', description: 'Hurts attackers that make contact.' },
    },
};

// renders the editor with spies for onChange and loadDetails
function renderEditor(pokemon = makeGarchomp(), details: DetailMaps = DETAILS) {
    const onChange = vi.fn();
    const loadDetails = vi.fn();
    const utils = render(
        <PokemonEditor
            pokemon={pokemon}
            onChange={onChange}
            itemOptions={['choice-scarf', 'choice-band', 'leftovers']}
            details={details}
            loadDetails={loadDetails}
        />
    );
    return { ...utils, onChange, loadDetails };
}

// the six real stat numbers on the left screen, in HP / Atk / Def / SpA / SpD / Spe order
function statValues(container: HTMLElement) {
    return Array.from(container.querySelectorAll('.stat_value')).map(el => el.textContent);
}

// ---------- left screen ----------

describe('PokemonEditor - left screen', () => {
    it('shows the name, level, sprite and info rows', () => {
        renderEditor();

        expect(screen.getByText('garchomp')).toBeInTheDocument();
        expect(screen.getByText('Lv.50')).toBeInTheDocument();
        expect(screen.getByAltText('garchomp')).toHaveAttribute('src', 'garchomp.png');
        expect(screen.getByText('rough skin')).toBeInTheDocument();
        expect(screen.getByText('jolly')).toBeInTheDocument();
    });

    it('calculates real stats with EVs, nature and level', () => {
        const { container } = renderEditor();

        // HP 183, Atk 182, Def 115, SpA 90 (Jolly -10%), SpD 106 (the 4 EVs add 1), Spe 169 (Jolly +10%)
        expect(statValues(container)).toEqual(['183', '182', '115', '90', '106', '169']);
    });

    it('marks the stat the nature raises and the one it lowers', () => {
        const { container } = renderEditor();

        expect(container.querySelector('.stat_label_up')).toHaveTextContent('Spe');
        expect(container.querySelector('.stat_label_down')).toHaveTextContent('SpA');
    });

    it('marks no stats for a neutral nature', () => {
        const { container } = renderEditor(makeGarchomp({ nature: 'serious' }));

        expect(container.querySelector('.stat_label_up')).toBeNull();
        expect(container.querySelector('.stat_label_down')).toBeNull();
    });

    it('gives Shedinja (base 1 HP) exactly 1 HP', () => {
        const shedinja = makeGarchomp({
            name: 'shedinja',
            baseStats: { hp: 1, atk: 90, def: 45, spatk: 30, spdef: 30, spe: 40 },
            evs: { hp: 252, atk: 0, def: 0, spatk: 0, spdef: 0, spe: 0 },
        });
        const { container } = renderEditor(shedinja);

        expect(statValues(container)[0]).toBe('1');
    });
});

// ---------- loading details ----------

describe('PokemonEditor - loading card details', () => {
    it('asks for details of its moves, held item and possible abilities', () => {
        const { loadDetails } = renderEditor();

        expect(loadDetails).toHaveBeenCalledWith('move', ['earthquake']);
        expect(loadDetails).toHaveBeenCalledWith('item', ['choice-scarf']);
        expect(loadDetails).toHaveBeenCalledWith('ability', ['sand-veil', 'rough-skin']);
    });

    it('does not ask for moves or an item when there are none', () => {
        const { loadDetails } = renderEditor(makeGarchomp({ moves: [null, null, null, null], item: null }));

        expect(loadDetails).not.toHaveBeenCalledWith('move', expect.anything());
        expect(loadDetails).not.toHaveBeenCalledWith('item', expect.anything());
    });
});

// ---------- moves tab ----------

describe('PokemonEditor - moves tab', () => {
    it('shows a rich card for a move whose details are loaded', () => {
        renderEditor();

        expect(screen.getByText('earthquake')).toBeInTheDocument();
        expect(screen.getByText('Hits every adjacent Pokemon.')).toBeInTheDocument();
        expect(screen.getByText('Pow 100 · Acc 100 · PP 10')).toBeInTheDocument();
    });

    it('shows plain text for a move whose details have not loaded yet', () => {
        renderEditor(makeGarchomp(), { move: {}, item: {}, ability: {} });

        expect(screen.getByText('earthquake')).toBeInTheDocument();
        expect(screen.queryByText('Hits every adjacent Pokemon.')).toBeNull();
    });

    it('labels empty move slots', () => {
        renderEditor();

        expect(screen.getAllByText('Choose a move')).toHaveLength(3);
    });

    it('opens a search for a move slot, hides moves already chosen, and picks one', async () => {
        const { onChange } = renderEditor();

        await userEvent.click(screen.getAllByText('Choose a move')[0]);
        await userEvent.type(screen.getByPlaceholderText('Search moves for garchomp...'), 'e');

        // earthquake is already on the set, so it is not offered again
        const results = screen.getByRole('list');
        expect(within(results).queryByText('earthquake')).toBeNull();
        expect(within(results).getByText('stone edge')).toBeInTheDocument();

        await userEvent.click(within(results).getByText('stone edge'));
        expect(onChange).toHaveBeenCalledWith({ moves: ['earthquake', 'stone-edge', null, null] });
    });

    it('shows rich cards in the move search and loads details for the results', async () => {
        const { loadDetails } = renderEditor();

        await userEvent.click(screen.getAllByText('Choose a move')[0]);
        await userEvent.type(screen.getByPlaceholderText('Search moves for garchomp...'), 'dragon');

        expect(loadDetails).toHaveBeenCalledWith('move', ['dragon-claw', 'dragon-dance']);
        expect(screen.getByText('Slashes with sharp claws.')).toBeInTheDocument();
        // status move: no power or accuracy
        expect(screen.getByText('Pow — · Acc — · PP 20')).toBeInTheDocument();
    });

    it('closes the move search on Cancel', async () => {
        renderEditor();

        await userEvent.click(screen.getAllByText('Choose a move')[0]);
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByPlaceholderText('Search moves for garchomp...')).toBeNull();
    });

    it('shows the held item card and picks a new item', async () => {
        const { onChange } = renderEditor();

        expect(screen.getByText('Raises Speed, locks the holder into one move.')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Raises Speed, locks the holder into one move.'));
        await userEvent.type(screen.getByPlaceholderText('Search Items...'), 'left');
        await userEvent.click(screen.getByText('leftovers'));

        expect(onChange).toHaveBeenCalledWith({ item: 'leftovers' });
    });
});

// ---------- stats tab ----------

describe('PokemonEditor - stats tab', () => {
    async function openStats() {
        await userEvent.click(screen.getByRole('tab', { name: 'Stats' }));
    }

    // the six EV rows in HP / Atk / Def / SpA / SpD / Spe order
    function evRow(container: HTMLElement, index: number) {
        return container.querySelectorAll('.ev_row')[index] as HTMLElement;
    }

    it('shows how many EVs are left', async () => {
        renderEditor();
        await openStats();

        expect(screen.getByText('Remaining: 2 / 510')).toBeInTheDocument();
    });

    it('adds one EV with the + button', async () => {
        const { container, onChange } = renderEditor();
        await openStats();

        await userEvent.click(within(evRow(container, 0)).getByRole('button', { name: '+' }));

        expect(onChange).toHaveBeenCalledWith({ evs: expect.objectContaining({ hp: 1 }) });
    });

    it('disables + on a stat already at 252 and - on a stat at 0', async () => {
        const { container } = renderEditor();
        await openStats();

        expect(within(evRow(container, 1)).getByRole('button', { name: '+' })).toBeDisabled(); // Atk 252
        expect(within(evRow(container, 0)).getByRole('button', { name: '-' })).toBeDisabled(); // HP 0
    });

    it('caps a typed EV so the total never passes 510', async () => {
        const { container, onChange } = renderEditor();
        await openStats();

        // only 2 EVs are left, so typing 252 into HP becomes 2
        const hpBox = evRow(container, 0).querySelector('.ev_number') as HTMLInputElement;
        fireEvent.change(hpBox, { target: { value: '252' } });

        expect(onChange).toHaveBeenCalledWith({ evs: expect.objectContaining({ hp: 2 }) });
    });

    it('changes the nature from the dropdown', async () => {
        const { onChange } = renderEditor();
        await openStats();

        await userEvent.selectOptions(screen.getByRole('combobox'), 'adamant');

        expect(onChange).toHaveBeenCalledWith({ nature: 'adamant' });
    });

    it('draws the stat hexagon', async () => {
        const { container } = renderEditor();
        await openStats();

        expect(container.querySelector('.stat_hexagon')).not.toBeNull();
    });
});

// ---------- details tab ----------

describe('PokemonEditor - details tab', () => {
    async function openDetails() {
        await userEvent.click(screen.getByRole('tab', { name: 'Details' }));
    }

    it('keeps a typed level between 1 and 100', async () => {
        const { onChange } = renderEditor();
        await openDetails();

        const level = screen.getByRole('spinbutton');
        fireEvent.change(level, { target: { value: '150' } });
        expect(onChange).toHaveBeenLastCalledWith({ level: 100 });

        fireEvent.change(level, { target: { value: '0' } });
        expect(onChange).toHaveBeenLastCalledWith({ level: 1 });
    });

    it('toggles shiny', async () => {
        const { onChange } = renderEditor();
        await openDetails();

        await userEvent.click(screen.getByRole('checkbox'));

        expect(onChange).toHaveBeenCalledWith({ shiny: true });
    });

    it('changes gender', async () => {
        const { onChange } = renderEditor();
        await openDetails();

        await userEvent.selectOptions(screen.getByRole('combobox'), 'female');

        expect(onChange).toHaveBeenCalledWith({ gender: 'female' });
    });

    it('shows Genderless instead of a dropdown for genderless Pokemon', async () => {
        renderEditor(makeGarchomp({ gender: null, genderOptions: [] }));
        await openDetails();

        expect(screen.getByText('Genderless')).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).toBeNull();
    });

    it('shows every possible ability as a card, with the current one selected', async () => {
        renderEditor();
        await openDetails();

        const roughSkin = screen.getByRole('radio', { name: /rough skin/ });
        const sandVeil = screen.getByRole('radio', { name: /sand veil/ });

        expect(roughSkin).toHaveAttribute('aria-checked', 'true');
        expect(sandVeil).toHaveAttribute('aria-checked', 'false');
        expect(within(roughSkin).getByText('Hidden')).toBeInTheDocument();
        expect(within(roughSkin).getByText('Hurts attackers that make contact.')).toBeInTheDocument();
        // sand veil's details were not loaded in this test
        expect(within(sandVeil).getByText('Loading...')).toBeInTheDocument();
    });

    it('picks a different ability', async () => {
        const { onChange } = renderEditor();
        await openDetails();

        await userEvent.click(screen.getByRole('radio', { name: /sand veil/ }));

        expect(onChange).toHaveBeenCalledWith({ ability: 'sand-veil' });
    });
});