import type { Stats, StatKey } from "@/types/pokemon";
import { STAT_LABELS } from "@/types/pokemon";
import './StatHexagon.css';

const HEX_ORDER: StatKey[] = ['hp', 'atk', 'def', 'spe', 'spdef', 'spatk'];
const HEX_WIDTH = 260;
const HEX_HEIGHT = 230;
const HEX_CX = 130; //center of hexagon
const HEX_CY = 115;
const HEX_RADIUS = 80; //center to corner, when a stat is at its cap
const HEX_LABEL_RATIO = 1.18; //labels sit outside ring of hexagon
const HEX_RINGS = [1 /3, 2 / 3, 1]; //guide rings for background of hexagon

//x,y of corner i, pushed out from the center by ration (0 = center, 1 = outer ring)
function hexPoint(i: number, ratio: number){
    const angle = (-90 + i * 60) * Math.PI / 180; //starts straight up, then every 60 degrees
    return {
        x: HEX_CX + Math.cos(angle) * HEX_RADIUS * ratio,
        y: HEX_CY + Math.sin(angle) * HEX_RADIUS * ratio
    };
}

//turns 6 ratios into the "x,y x,y ..." text for an svg polygon
function toPoints(ratios: number[]){
    return ratios.map((ratio, i) => {
        const p = hexPoint(i, ratio);
        return `${p.x},${p.y}`;
    }).join(' ');
}

//how far each stat is toward its cap, in hexagon order, stops at 1 like the bars do
function statRatios(values: Stats, caps: Stats){
    return HEX_ORDER.map(stat => Math.min(values[stat] / caps[stat], 1));
}

interface StatHexagonProps {
    untrained: Stats; //real stats with 0 evs and neutral nature
    real: Stats; //curr real stats
    caps: Stats; //the cap for each corner, a full stat
    up: StatKey | null; //stat the nature raises
    down: StatKey | null; //stat the nature lowers
}

//hexagon chart: faint shape = pokemon's natural stats, solid shape = with user's evs and nature
export default function StatHexagon({ untrained, real, caps, up, down }: StatHexagonProps){
    return (
        <svg className="stat_hexagon" viewBox={`0 0 ${HEX_WIDTH} ${HEX_HEIGHT}`}>
            {/* background rings and spokes */}
            {HEX_RINGS.map(ring => (
                <polygon key={ring} className="hex_ring" points={toPoints(Array(6).fill(ring))} />
            ))}
            {HEX_ORDER.map((stat, i) => {
                const corner = hexPoint(i, 1);
                return <line key={stat} className="hex_ring" x1={HEX_CX} y1={HEX_CY} x2={corner.x} y2={corner.y} />;
            })}

            <polygon className="hex_untrained" points={toPoints(statRatios(untrained, caps))} />
            <polygon className="hex_real" points={toPoints(statRatios(real, caps))} />

            {/* corner labels, blue/red for nature like stat rows */}
            {HEX_ORDER.map((stat, i) => {
                const pos = hexPoint(i, HEX_LABEL_RATIO);
                const anchor = Math.abs(pos.x - HEX_CX) < 1 ? 'middle' : pos.x > HEX_CX ? 'start' : 'end';
                const boostClass = up === stat ? ' hex_label_up': down === stat ? ' hex_label_down' : '';
                return (
                    <text
                        key={stat}
                        className={`hex_label${boostClass}`}
                        x={pos.x}
                        y={pos.y}
                        textAnchor={anchor}
                        dominantBaseline="middle"
                    >
                        {STAT_LABELS[stat]} {real[stat]}
                    </text>
                );
            })}
        </svg>
    )
}