import React, { useCallback } from 'react';
import StickyTree, { NodeId, StickyTreeProps } from './StickyTree';

export interface StickListNode {
    id: NodeId;
    height?: number;
}

type OmitProps = 'getChildren' | 'root' | 'renderRoot';

export interface StickyListProps<TNodeType extends StickListNode = StickListNode> extends Omit<StickyTreeProps, OmitProps> {
    items: TNodeType[];
    treeRef?: React.Ref<StickyTree>;
}

export const StickyList = <TNodeType extends StickListNode = StickListNode>({
    items,
    rowRenderer,
    width,
    height,
    treeRef,
    ...rest
}: StickyListProps<TNodeType>): React.ReactElement<StickyListProps<TNodeType>> => {
    const getChildren = useCallback(
        (id: NodeId) => {
            if (id === 'root') {
                return items;
            }
            return undefined;
        },
        [items]
    );

    return (
        <StickyTree
            ref={treeRef}
            getChildren={getChildren}
            renderRoot={false}
            root={{ id: 'root' } as TNodeType}
            rowRenderer={rowRenderer}
            width={width}
            height={height}
            {...rest}
        />
    );
};
