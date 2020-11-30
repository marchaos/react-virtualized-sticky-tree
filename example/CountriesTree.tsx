import React, { useCallback } from 'react';
import countries from './countries.json';
import {StickyTreeNode, StickyTreeNodeInfo} from '../src/StickyTree';
import { AutoSizedStickyTree } from '../src';

const backgroundColors: string[] = ['#45b3e0', '#5bbce4', '#71c5e7', '#87ceeb'];

const CountriesTree: React.FC<{}> = () => {
    const rowRenderer = useCallback(({ id, style }) => {
        const node = countries[id];
        style = { ...style, backgroundColor: backgroundColors[node.depth] };

        return (
            <div className="node-row" style={style}>
                {node.name}
            </div>
        );
    }, []);

    const getChildren = useCallback((id, nodeInfo: StickyTreeNodeInfo): StickyTreeNode[] | undefined => {
        if (countries[id].children) {
            return countries[id].children?.map((childId) => ({
                id: childId,
                isSticky: !!countries[childId].children,
                stickyTop: 30 * countries[childId].depth,
                zIndex: 4 - countries[childId].depth,
            }));
        }
    }, []);

    return (
        <AutoSizedStickyTree
            className="sticky-tree-wrapper"
            root={{ id: 0, isSticky: true, stickyTop: 0, zIndex: 4 }}
            renderRoot={true}
            rowHeight={30}
            rowRenderer={rowRenderer}
            getChildren={getChildren}
            overscanRowCount={20}
        />
    );
};
export default CountriesTree;
