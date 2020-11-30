import React, {useCallback, useState} from 'react';
import Measure from 'react-measure';
import countries from './countries.json';
import StickyTree from "../src/StickyTree";

const backgroundColors: string[] = [
    '#45b3e0',
    '#5bbce4',
    '#71c5e7',
    '#87ceeb'
];

interface Dimensions {
    width?: number,
    height?: number
}

const CountriesTree: React.FC<{}> = () => {
    const [dimensions, setDimensions] = useState<Dimensions>({});

    const rowRenderer = useCallback(({id, style}) => {
        const node = countries[id];
        style = {...style, backgroundColor: backgroundColors[node.depth]};

        return (
            <div className="my-sticky-row" style={style}>{node.name}</div>
        );
    }, []);

    const getChildren = useCallback((id) => {
        if (countries[id].children) {
            return countries[id].children?.map(childId => ({
                id: childId,
                height: 30,
                isSticky: !!countries[childId].children,
                stickyTop: 30 * countries[childId].depth,
                zIndex: 4 - countries[childId].depth,
            }));
        }
    }, [])

    return (
        <Measure
            bounds
            onResize={(contentRect) => {
                setDimensions({width: contentRect.bounds?.width, height: contentRect.bounds?.height});
            }}
        >
            {({measureRef}) => {

                return (<div ref={measureRef} className="sticky-tree-wrapper">
                    <StickyTree
                        width={dimensions.width}
                        height={dimensions.height}
                        root={{id: 0, height: 30, isSticky: true, top: 0, zIndex: 4}}
                        renderRoot={true}
                        rowRenderer={rowRenderer}
                        getChildren={getChildren}
                        overscanRowCount={20}
                    />
                </div>)
            }
            }
        </Measure>
    );
}
export default CountriesTree;
