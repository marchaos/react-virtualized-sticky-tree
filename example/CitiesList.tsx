import React, { useCallback } from 'react';
import countries from './countries.json';
import AutoSizedStickyList from '../src/AutoSizedStickyList';

const cities = countries.filter((node) => node.depth === 3).map((city, index) => ({ id: index, ...city }));

const CitiesList: React.FC<{}> = () => {
    const rowRenderer = useCallback(({ id, style }) => {
        const node = cities[id];
        style = { ...style, backgroundColor: '#87ceeb' };

        return (
            <div className="node-row" style={style}>
                {node.name}
            </div>
        );
    }, []);

    return (
        <AutoSizedStickyList
            className="sticky-tree-wrapper"
            rowHeight={30}
            rowRenderer={rowRenderer}
            items={cities}
            overscanRowCount={20}
        />
    );
};
export default CitiesList;
