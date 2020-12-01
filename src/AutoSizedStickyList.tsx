import React from 'react';
import Measure, { ContentRect } from 'react-measure';
import StickyTree, { TreeNode } from './StickyTree';
import StickyList, { StickyListProps } from './StickyList';

export interface AutoSizedStickyListProps<TNodeType extends TreeNode = TreeNode>
    extends Omit<StickyListProps<TNodeType>, 'width' | 'height'> {
    onResize?: (rect: ContentRect) => void;
    treeRef?: React.Ref<StickyTree<TNodeType>>;
    className?: string;
}

export interface AutoSizedStickyTreeState {
    width: number;
    height: number;
}

export default class AutoSizedStickyList<TNodeType extends TreeNode = TreeNode> extends React.PureComponent<
    AutoSizedStickyListProps<TNodeType>,
    AutoSizedStickyTreeState
> {
    constructor(props: AutoSizedStickyListProps<TNodeType>) {
        super(props);
        this.state = {} as AutoSizedStickyTreeState;
    }

    render() {
        return (
            <Measure
                bounds={true}
                onResize={(rect) => {
                    this.setState({ width: rect.bounds!.width, height: rect.bounds!.height });
                    if (this.props.onResize !== undefined) {
                        this.props.onResize(rect);
                    }
                }}
            >
                {({ measureRef }) => (
                    <div ref={measureRef} className={this.props.className}>
                        <StickyList treeRef={this.props.treeRef} width={this.state.width} height={this.state.height} {...this.props} />
                    </div>
                )}
            </Measure>
        );
    }
}
