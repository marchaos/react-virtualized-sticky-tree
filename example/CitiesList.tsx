import React, { useCallback } from 'react';
import countries from './countries.json';
import { AutoSizedStickyList } from '../src/';
import { StickyTreeRowRenderer } from '../src';

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

    const getRowHeight = useCallback((node: CityTreeNode) => {
        return 30;
    }, []);

    return (
        <AutoSizedStickyList<CityTreeNode>
            className="sticky-tree-wrapper"
            getRowHeight={getRowHeight}
            rowRenderer={rowRenderer}
            items={cities}
        />
    );
};
export default CitiesList;
