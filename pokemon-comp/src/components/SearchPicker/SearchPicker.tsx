import { useState } from "react";
import './SearchPicker.css';

interface SearchPickerProps {
    options: string[];
    placeholder?:string;
    onPick: (name: string) => void;
    onCancel?: () => void;
}

//component that allows user to type to filter a list of names, and click a result to pick it
export default function SearchPicker({options, placeholder = 'Search...', onPick, onCancel}: SearchPickerProps){
    const [query, setQuery] = useState('');

    //we clean the query so that it fits the PokeAPI format of querying data
    const cleaned = query.trim().toLowerCase().replace(/\s+/g, '-');

    //if the cleaned data is empty, return nothing, else we run the filter
    const matches = cleaned === ''
        ? []
        : options
            .filter(name => name.includes(cleaned))
            .sort( (a, b) => Number(b.startsWith(cleaned)) - Number(a.startsWith(cleaned)))
            .slice(0, 8);
    return (
        <div className="search_picker">
            <input 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={placeholder}
                autoFocus
            />
            {onCancel && <button onClick={onCancel}>Cancel</button>}
            <ul>
                {matches.map(name => (
                    <li key={name}>
                        <button onClick={() => onPick(name)}>{name.replace(/-/g, ' ')}</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}