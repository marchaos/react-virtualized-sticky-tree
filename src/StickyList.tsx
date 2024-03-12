import React, { useCallback, useMemo } from 'react';
import StickyTree, { StickyTreeNode, StickyTreeProps, TreeNode } from './StickyTree.js';

type OmitProps = 'getChildren' | 'root' | 'renderRoot';

export type StickyListNode = TreeNode & Pick<StickyTreeNode, 'zIndex' | 'isSticky' | 'stickyTop' | 'height'>;

export interface StickyListProps<TNodeType extends TreeNode = TreeNode, TMeta = any>
    extends Omit<StickyTreeProps<TNodeType, TMeta>, OmitProps> {
    items: TNodeType[];
    getRowHeight?: (item: TNodeType) => number;
    treeRef?: React.Ref<StickyTree<TNodeType, TMeta>>;
}

const StickyList = <TNodeType extends StickyListNode = StickyListNode, TMeta = any>({
    items,
    rowRenderer,
    width,
    height,
    treeRef,
    getRowHeight,
    wrapAllLeafNodes = false,
    ...rest
}: StickyListProps<TNodeType, TMeta>) => {
    const root = useMemo(() => ({ node: { id: 'root' }, height: 0 } as StickyTreeNode<TNodeType>), []);

    const getChildren: StickyTreeProps<TNodeType, TMeta>['getChildren'] = useCallback(
        (node) => {
            if (node.id === 'root') {
                return items.map((item) => ({
                    node: item,
                    // If they don't specify a getHeight function, they must be using either a height on the node or the rowHeight prop to StickyList.
                    height: getRowHeight ? getRowHeight(item) : item.height,
                    isSticky: item.isSticky,
                    stickyTop: item.stickyTop,
                    zIndex: item.zIndex,
                }));
            }
            return undefined;
        },
        [items, getRowHeight]
    );

    return (
        <StickyTree<TNodeType, TMeta>
            ref={treeRef}
            getChildren={getChildren}
            renderRoot={false}
            wrapAllLeafNodes={wrapAllLeafNodes}
            root={root}
            rowRenderer={rowRenderer}
            width={width}
            height={height}
            {...rest}
        />
    );
};

export default StickyList;
