import React from 'react';
import ReactDOM from 'react-dom';
import CountriesTree from './CountriesTree';
class App extends React.PureComponent {
    render() {
        return (React.createElement(CountriesTree, null));
    }
}
ReactDOM.render(React.createElement(App, null), document.getElementById('app'));
