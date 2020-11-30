import React from 'react';
import ReactDOM from 'react-dom';
import CountriesTree from './CountriesTree';

class App extends React.PureComponent {

    render() {
        return (
            <CountriesTree />
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('app'));