import React from 'react';
import Measure from 'react-measure';
import StickyTree from './StickyTree';

export default class AutoSizedStickyTree extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <Measure
                bounds={true}
                onResize={rect => {
                    this.setState({ width: rect.bounds.width, height: rect.bounds.height });
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
