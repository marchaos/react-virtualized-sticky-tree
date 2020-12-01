import React from 'react';
import StickyTree, { StickyTreeNode, StickyTreeProps, TreeNode } from './StickyTree';

type OmitProps = 'getChildren' | 'root' | 'renderRoot';

export interface StickyListProps<TNodeType extends TreeNode = TreeNode> extends Omit<StickyTreeProps<TNodeType>, OmitProps> {
    items: TNodeType[];
    getHeight?: (item: TNodeType) => number;
    treeRef?: React.Ref<StickyTree<TNodeType>>;
}

export default class StickyList<TNodeType extends TreeNode = TreeNode> extends React.PureComponent<StickyListProps<TNodeType>> {
    getChildren: StickyTreeProps<TNodeType>['getChildren'] = (node) => {
        const { items, getHeight } = this.props;
        if (node.id === 'root') {
            // If they don't specify a getHeight function, they must be using the rowHeight prop.
            return items.map((item) => ({ node: item, height: getHeight ? getHeight(item) : undefined }));
        }
        return undefined;
    };

    render() {
        const { items, rowRenderer, width, height, treeRef, getHeight, ...rest } = this.props;

        return (
            <StickyTree<TNodeType>
                ref={treeRef}
                getChildren={this.getChildren}
                renderRoot={false}
                root={{ node: { id: 'root' } } as StickyTreeNode<TNodeType>}
                rowRenderer={rowRenderer}
                width={width}
                height={height}
                {...rest}
            />
        );
    }
}
