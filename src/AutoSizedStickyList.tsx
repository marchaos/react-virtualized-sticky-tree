import React, { useState } from 'react';
import Measure, { ContentRect } from 'react-measure';
import StickyTree, { TreeNode } from './StickyTree.js';
import StickyList, { StickyListProps } from './StickyList.js';

export interface AutoSizedStickyListProps<TNodeType extends TreeNode = TreeNode, TMeta = any>
    extends Omit<StickyListProps<TNodeType, TMeta>, 'width' | 'height'> {
    onResize?: (rect: ContentRect) => void;
    treeRef?: React.Ref<StickyTree<TNodeType, TMeta>>;
    className?: string;
}

interface Bounds {
    width: number;
    height: number;
}

const AutoSizedStickyList = <TNodeType extends TreeNode = TreeNode, TMeta = any>({
    onResize,
    className,
    treeRef,
    ...rest
}: AutoSizedStickyListProps<TNodeType, TMeta>) => {
    const [bounds, setBounds] = useState<Bounds>({} as Bounds);

    return (
        <Measure
            bounds={true}
            onResize={(rect) => {
                setBounds({ width: rect.bounds!.width, height: rect.bounds!.height });
                if (onResize !== undefined) {
                    onResize(rect);
                }
            }}
        >
            {({ measureRef }) => (
                <div ref={measureRef} className={className}>
                    <StickyList<TNodeType, TMeta> treeRef={treeRef} width={bounds.width} height={bounds.height} {...rest} />
                </div>
            )}
        </Measure>
    );
};

export default AutoSizedStickyList;
