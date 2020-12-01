import React from 'react';
import Measure, { ContentRect } from 'react-measure';
import StickyTree, { StickyTreeProps, TreeNode } from './StickyTree';

export interface AutoSizedStickyTreeProps<TNodeType extends TreeNode = TreeNode>
    extends Omit<StickyTreeProps<TNodeType>, 'width' | 'height'> {
    onResize?: (rect: ContentRect) => void;
    treeRef?: React.Ref<StickyTree<TNodeType>>;
    className?: string;
}

export interface AutoSizedStickyTreeState {
    width: number;
    height: number;
}

export default class AutoSizedStickyTree<TNodeType extends TreeNode = TreeNode> extends React.PureComponent<
    AutoSizedStickyTreeProps<TNodeType>,
    AutoSizedStickyTreeState
> {
    constructor(props: AutoSizedStickyTreeProps<TNodeType>) {
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
                        <StickyTree ref={this.props.treeRef} width={this.state.width} height={this.state.height} {...this.props} />
                    </div>
                )}
            </Measure>
        );
    }
}
