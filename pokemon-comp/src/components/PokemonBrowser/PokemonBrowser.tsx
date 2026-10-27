import type { PokemonSummary } from "@/types/pokemon";
import './PokemonBrowser.css';

interface PokemonBrowserProps {
    pokemon: PokemonSummary[];
    onPick: (name: string) => void;
    onCancel: () => void;
}

type StatKey = keyof PokemonSummary['baseStats'];
const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spatk', 'spdef', 'spe'];

export default function PokemonBrowser( { pokemon, onPick, onCancel } : PokemonBrowserProps){
    return (
        <div className="pokemon_browser">
            <button onClick={onCancel}>Cancel</button>
            
            <div className="table_scroll">
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Name</th>
                            <th>Types</th>
                            {STAT_KEYS.map(k => <th key={k}>{`${k.toUpperCase()}|`}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {pokemon.map(p => (
                            <tr key={p.id} onClick={() => onPick(p.name)}>
                                <td>
                                    <img 
                                        src={p.spriteUrl} 
                                        alt={p.name}
                                        loading="lazy"
                                        width={48}
                                        height={48} 
                                    />
                                </td>
                                <td>{p.name.replace(/-/g, ' ')}</td>
                                <td>{p.types.join(' / ')}</td>
                                {STAT_KEYS.map(k => <td key={k}>{p.baseStats[k]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}