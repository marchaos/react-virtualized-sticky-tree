import React, { useCallback } from 'react';
import countries from './countries.json';
import { StickyTreeProps } from '../src/StickyTree';
import { AutoSizedStickyTree } from '../src';

const backgroundColors: string[] = ['#45b3e0', '#5bbce4', '#71c5e7', '#87ceeb'];

interface CountriesTreeNode {
    id: number;
    name: string;
    index: number;
    depth: number;
    children?: number[];
}

const countryNodes: CountriesTreeNode[] = countries.map((country) => ({ ...country, id: country.index }));
const rootNode = countryNodes[0];

const CountriesTree: React.FC<{}> = () => {
    const rowRenderer = useCallback(({ node, style }) => {
        style = { ...style, backgroundColor: backgroundColors[node.depth] };

        return (
            <div className="node-row" style={style}>
                {node.name}
            </div>
        );
    }, []);

    const getChildren: StickyTreeProps<CountriesTreeNode>['getChildren'] = useCallback((node, nodeInfo) => {
        if (node.children) {
            return node.children?.map((childId) => ({
                isSticky: !!countryNodes[childId].children,
                stickyTop: 30 * countryNodes[childId].depth,
                zIndex: 4 - countryNodes[childId].depth,
                node: countryNodes[childId],
            }));
        }
    }, []);

    return (
        <AutoSizedStickyTree<CountriesTreeNode>
            className="sticky-tree-wrapper"
            root={{ isSticky: true, stickyTop: 0, zIndex: 4, node: rootNode }}
            renderRoot={true}
            rowHeight={30}
            rowRenderer={rowRenderer}
            getChildren={getChildren}
            overscanRowCount={20}
        />
    );
};
export default CountriesTree;
