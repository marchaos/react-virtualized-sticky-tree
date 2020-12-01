import React, { useCallback } from 'react';
import countries from './countries.json';
import AutoSizedStickyList from '../src/AutoSizedStickyList';
import { StickyListProps } from '../src/StickyList';

export interface City {
    id: number;
    name: string;
    depth: number;
}

const cities = countries.filter((node) => node.depth === 3).map((city, index) => ({ id: index, ...city }));

const CitiesList: React.FC = () => {
    const rowRenderer: StickyListProps<City>['rowRenderer'] = useCallback(({ node, style }) => {
        style = { ...style, backgroundColor: '#87ceeb' };

        return (
            <div className="node-row" style={style} key={node.id}>
                {node.name}
            </div>
        );
    }, []);

    return (
        <AutoSizedStickyList<City>
            className="sticky-tree-wrapper"
            rowHeight={30}
            rowRenderer={rowRenderer}
            items={cities}
            overscanRowCount={20}
        />
    );
};
export default CitiesList;
