import React from 'react';
import ReactDOM from 'react-dom';
import StickTreeWithRoot from './StickyTreeWithRoot';

class App extends React.PureComponent {

    render() {
        return (
            <StickTreeWithRoot />
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('app'));
