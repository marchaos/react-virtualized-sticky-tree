import React, {useCallback, useMemo} from 'react';
import countries from './countries.json';
import { StickyTreeGetChildren, StickyTreeRowRenderer } from '../src/StickyTree';
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

const CountriesTree: React.FC = () => {
    const rowRenderer: StickyTreeRowRenderer<CountriesTreeNode> = useCallback(({ node, style }) => {
        style = { ...style, backgroundColor: backgroundColors[node.depth] };

        return (
            <div className="node-row" style={style}>
                {node.name}
            </div>
        );
    }, []);

    const getChildren: StickyTreeGetChildren<CountriesTreeNode> = useCallback((node, nodeInfo) => {
        if (node.children) {
            return node.children?.map((childId) => ({
                isSticky: !!countryNodes[childId].children,
                stickyTop: 30 * countryNodes[childId].depth,
                zIndex: 4 - countryNodes[childId].depth,
                node: countryNodes[childId],
            }));
        }
    }, []);

    const root = useMemo(() => ({ isSticky: true, stickyTop: 0, zIndex: 4, node: rootNode }), []);

    return (
        <AutoSizedStickyTree<CountriesTreeNode>
            className="sticky-tree-wrapper"
            root={root}
            renderRoot={true}
            rowHeight={30}
            rowRenderer={rowRenderer}
            getChildren={getChildren}
            overscanRowCount={20}
        />
    );
};
export default CountriesTree;
