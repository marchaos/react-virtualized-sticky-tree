import React from 'react';
import ReactDOM from 'react-dom';
import CountriesTree from './CountriesTree';
import CitiesList from "./CitiesList";

class App extends React.PureComponent {

    render() {
        const url = new URL(window.location.href);
        const render = url.searchParams.get('render');

        if (render === 'cities') {
            return <CitiesList />
        } else if (render === 'countries') {
            return <CountriesTree />
        }

        return (
            <div style={{width: '80%', margin: '0 auto', padding: '20px'}}>
                <div><a href="/?render=countries">Sticky Tree Example</a></div>
                <div><a href="/?render=cities">List Example</a></div>
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('app'));