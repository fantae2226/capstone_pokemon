import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import PokemonBrowser from './PokemonBrowser';
import type { PokemonSummary } from '@/types/pokemon';

// ---------- test data ----------

function mon(id: string, name: string, types: string[], spe: number, abilities: string[]): PokemonSummary {
    return {
        id,
        name,
        spriteUrl: `${name}.png`,
        types,
        baseStats: { hp: 80, atk: 80, def: 80, spatk: 80, spdef: 80, spe },
        abilities,
    };
}

const POKEMON: PokemonSummary[] = [
    mon('445', 'garchomp', ['dragon', 'ground'], 102, ['sand-veil', 'rough-skin']),
    mon('279', 'pelipper', ['water', 'flying'], 65, ['keen-eye', 'drizzle']),
    mon('1006', 'iron-valiant', ['fairy', 'fighting'], 116, ['quark-drive']),
    mon('973', 'barraskewda', ['water'], 136, ['swift-swim', 'propeller-tail']),
];

const MOVE_NAMES = ['earthquake', 'surf', 'swift'];

function renderBrowser(fetchMoveLearners = vi.fn().mockResolvedValue(new Set(['445']))) {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    const utils = render(
        <PokemonBrowser
            pokemon={POKEMON}
            moveNames={MOVE_NAMES}
            fetchMoveLearners={fetchMoveLearners}
            onPick={onPick}
            onCancel={onCancel}
        />
    );
    return { ...utils, onPick, onCancel, fetchMoveLearners };
}

// names of the rows currently in the table, top to bottom
function rowNames(container: HTMLElement) {
    return Array.from(container.querySelectorAll('.row_name')).map(el => el.textContent);
}

async function openFilters() {
    await userEvent.click(screen.getByRole('button', { name: 'Add Filter' }));
}

// ---------- table, search, pick ----------

describe('PokemonBrowser - table and search', () => {
    it('lists every Pokemon with its sprite and type icons', () => {
        const { container } = renderBrowser();

        expect(rowNames(container)).toEqual(['garchomp', 'pelipper', 'iron valiant', 'barraskewda']);
        expect(screen.getByText('4 of 4')).toBeInTheDocument();
        expect(screen.getByAltText('garchomp')).toHaveAttribute('src', 'garchomp.png');
        // garchomp's two type icons
        const garchompRow = screen.getByText('garchomp').closest('tr')!;
        expect(within(garchompRow).getByAltText('dragon')).toBeInTheDocument();
        expect(within(garchompRow).getByAltText('ground')).toBeInTheDocument();
    });

    it('filters by name, treating spaces like the hyphens in PokeAPI names', async () => {
        const { container } = renderBrowser();

        await userEvent.type(screen.getByPlaceholderText('Search for a pokemon...'), 'iron val');

        expect(rowNames(container)).toEqual(['iron valiant']);
        expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });

    it('calls onPick with the PokeAPI name when a row is clicked', async () => {
        const { onPick } = renderBrowser();

        await userEvent.click(screen.getByText('iron valiant'));

        expect(onPick).toHaveBeenCalledWith('iron-valiant');
    });

    it('calls onCancel from the Cancel button', async () => {
        const { onCancel } = renderBrowser();

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onCancel).toHaveBeenCalled();
    });
});

// ---------- sorting ----------

describe('PokemonBrowser - sorting', () => {
    it('sorts by a stat ascending, then descending on a second click', async () => {
        const { container } = renderBrowser();
        const speHeader = screen.getByRole('columnheader', { name: /SPE/ });

        await userEvent.click(speHeader);
        expect(rowNames(container)).toEqual(['pelipper', 'garchomp', 'iron valiant', 'barraskewda']);
        expect(speHeader).toHaveClass('th_sorted');

        await userEvent.click(speHeader);
        expect(rowNames(container)).toEqual(['barraskewda', 'iron valiant', 'garchomp', 'pelipper']);
    });

    it('sorts by name', async () => {
        const { container } = renderBrowser();

        await userEvent.click(screen.getByRole('columnheader', { name: /Name/ }));

        expect(rowNames(container)).toEqual(['barraskewda', 'garchomp', 'iron valiant', 'pelipper']);
    });

    it('shows a SORT chip that removes the sort', async () => {
        const { container } = renderBrowser();

        await userEvent.click(screen.getByRole('columnheader', { name: /SPE/ }));
        expect(screen.getByText('SORT')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Remove sort' }));
        expect(screen.queryByText('SORT')).toBeNull();
        expect(rowNames(container)).toEqual(['garchomp', 'pelipper', 'iron valiant', 'barraskewda']);
    });
});

// ---------- filter panel ----------

describe('PokemonBrowser - filter panel', () => {
    it('opens inline (no popup), and the button switches to Close Filters', async () => {
        renderBrowser();

        await openFilters();

        expect(screen.getByText('Pick Ability, Moves, or Types to add a filter.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close Filters' })).toHaveAttribute('aria-expanded', 'true');
        expect(document.querySelector('.modal-overlay')).toBeNull();
    });

    it('filters by type only after Apply', async () => {
        const { container } = renderBrowser();
        await openFilters();

        await userEvent.click(screen.getByRole('button', { name: 'Types' }));
        await userEvent.click(screen.getByRole('button', { name: 'water' }));

        // nothing changes until Apply
        expect(rowNames(container)).toHaveLength(4);

        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(rowNames(container)).toEqual(['pelipper', 'barraskewda']);
        expect(screen.getByText('TYPE')).toBeInTheDocument();
    });

    it('allows at most two types', async () => {
        renderBrowser();
        await openFilters();
        await userEvent.click(screen.getByRole('button', { name: 'Types' }));

        await userEvent.click(screen.getByRole('button', { name: 'water' }));
        await userEvent.click(screen.getByRole('button', { name: 'flying' }));

        expect(screen.getByRole('button', { name: 'fire' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'water' })).not.toBeDisabled();
    });

    it('filters by ability, and the chip removes it again', async () => {
        const { container } = renderBrowser();
        await openFilters();

        await userEvent.click(screen.getByRole('button', { name: 'Ability' }));
        await userEvent.type(screen.getByPlaceholderText('Search for an ability...'), 'swift');
        await userEvent.click(screen.getByRole('button', { name: 'swift swim' }));
        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        expect(rowNames(container)).toEqual(['barraskewda']);

        await userEvent.click(screen.getByRole('button', { name: 'Remove ability filter' }));
        expect(rowNames(container)).toHaveLength(4);
    });

    it('filters by move using the learners lookup', async () => {
        const fetchMoveLearners = vi.fn().mockResolvedValue(new Set(['445', '279']));
        const { container } = renderBrowser(fetchMoveLearners);
        await openFilters();

        await userEvent.click(screen.getByRole('button', { name: 'Moves' }));
        await userEvent.type(screen.getByPlaceholderText('Search for a move...'), 'earth');
        await userEvent.click(screen.getByRole('button', { name: 'earthquake' }));
        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        expect(fetchMoveLearners).toHaveBeenCalledWith(['earthquake']);
        await waitFor(() => expect(rowNames(container)).toEqual(['garchomp', 'pelipper']));
        expect(screen.getByText('MOVE')).toBeInTheDocument();
    });

    it('keeps the old results if the learners lookup fails', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const fetchMoveLearners = vi.fn().mockRejectedValue(new Error('network down'));
        const { container } = renderBrowser(fetchMoveLearners);
        await openFilters();

        await userEvent.click(screen.getByRole('button', { name: 'Moves' }));
        await userEvent.type(screen.getByPlaceholderText('Search for a move...'), 'surf');
        await userEvent.click(screen.getByRole('button', { name: 'surf' }));
        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        await waitFor(() => expect(errorSpy).toHaveBeenCalled());
        expect(rowNames(container)).toHaveLength(4);
        errorSpy.mockRestore();
    });

    it('throws away unapplied choices on Cancel', async () => {
        const { container } = renderBrowser();
        await openFilters();

        await userEvent.click(screen.getByRole('button', { name: 'Types' }));
        await userEvent.click(screen.getByRole('button', { name: 'water' }));
        // the panel's own Cancel (the browser's Cancel is the first one)
        const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
        await userEvent.click(cancelButtons[cancelButtons.length - 1]);

        expect(rowNames(container)).toHaveLength(4);
        expect(screen.queryByText('TYPE')).toBeNull();
    });

    it('Reset Filters clears types, ability and sort together', async () => {
        const { container } = renderBrowser();
        await userEvent.click(screen.getByRole('columnheader', { name: /SPE/ }));
        await openFilters();
        await userEvent.click(screen.getByRole('button', { name: 'Types' }));
        await userEvent.click(screen.getByRole('button', { name: 'water' }));
        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        await userEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));

        expect(rowNames(container)).toEqual(['garchomp', 'pelipper', 'iron valiant', 'barraskewda']);
        expect(screen.queryByRole('button', { name: 'Reset Filters' })).toBeNull();
    });
});