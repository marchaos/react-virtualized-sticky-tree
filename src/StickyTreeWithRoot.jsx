import React from 'react';
import { StickyTree } from 'react-virtualized-sticky-tree';
import Measure from 'react-measure';

export default class StickyTreeWithRoot extends React.PureComponent {

    constructor(props) {
        super(props);

        this.getChildren = this.getChildren.bind(this);
        this.rowRenderer = this.rowRenderer.bind(this);

        this.nodes = require('./countries.json');

        this.backgroundColors = [
            '#45b3e0',
            '#5bbce4',
            '#71c5e7',
            '#87ceeb'
        ];
        this.state = {
            dimensions: {}
        }
    }

    getNodeStyle(node) {
        const isSticky = !!node.children;
        return (isSticky) ? {
            position: 'sticky',
            top: 30 * node.depth,
            zIndex: 4 - node.depth,
            height: 30,
            backgroundColor: this.backgroundColors[node.depth]
        } : {
            backgroundColor: this.backgroundColors[node.depth],
            height: 30
        };
    }

    rowRenderer(id) {
        const node = this.nodes[id];
        return (
            <div className="my-sticky-row" style={this.getNodeStyle(node)}>{node.name}</div>
        );
    }

    getChildren(id) {
        return this.nodes[id].children;
    }

    render() {
        return (
            <Measure
                bounds
                onResize={(contentRect) => {
                    this.setState({ dimensions: contentRect.bounds });
                }}
            >
                {({ measureRef }) => {

                    console.info(this.state.dimensions);

                    return (<div ref={measureRef} className="sticky-tree-wrapper">
                        <StickyTree
                            width={this.state.dimensions.width}
                            height={this.state.dimensions.height}
                            root={0}
                            renderRoot={true}
                            rowRenderer={this.rowRenderer}
                            getChildren={this.getChildren}
                            getHeight={() => 30}
                            overscanRowCount={20}
                        />
                    </div>)
                }
                }
            </Measure>
        );
    }
}