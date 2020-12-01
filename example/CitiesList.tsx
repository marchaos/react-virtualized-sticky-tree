import React, { useCallback } from 'react';
import countries from './countries.json';
import AutoSizedStickyList from '../src/AutoSizedStickyList';
import { StickyTreeRowRenderer } from '../src/StickyTree';

export interface CityTreeNode {
    id: number;
    name: string;
    depth: number;
}

const cities = countries.filter((node) => node.depth === 3).map((city, index) => ({ id: index, ...city }));

const CitiesList: React.FC = () => {
    const rowRenderer: StickyTreeRowRenderer<CityTreeNode> = useCallback(({ node, style }) => {
        style = { ...style, backgroundColor: '#87ceeb' };

        return (
            <div className="node-row" style={style} key={node.id}>
                {node.name}
            </div>
        );
    }, []);

    return (
        <AutoSizedStickyList<CityTreeNode>
            className="sticky-tree-wrapper"
            rowHeight={30}
            rowRenderer={rowRenderer}
            items={cities}
            overscanRowCount={20}
        />
    );
};
export default CitiesList;
