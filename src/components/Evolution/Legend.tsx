import * as React from 'react';
import { getColor } from 'helper/';
import { Popover } from 'antd';

const info = {
    'streamlined': 'Layers are stacked on top of one another',
    'multi-branch': 'The output of one layer goes through multiple branches and then converges',
    'skip connections': 'A connection skips one or more layers',
    'depthwise separable conv': 'A depthwise convolution and a 1x1 convolution called a pointwise convolution',
    'stacked': 'Layers are stacked to increase the depth of a RNN',
    'bidirectional': 'A standard RNN is split into two parts to process the input sequence in two directions',
    'multiple time scale': 'RNNs operates at multiple time scales',
    'tree-structured': 'The connection graph is structured as a tree',
    'gated': 'Add the gate mechanism to the hidden layer'
}

export interface LegendProps {
    items: Items,
    selectItem: (key: string, op: 'click' | 'hover') => void
}
export interface Items {
    [key: string]: Item
}
export interface Item {
    name: string,
    click: boolean,
    hover: boolean
}
export default class Legend extends React.Component<LegendProps, {}>{
    render() {
        let { items, selectItem } = this.props
        // everClick:boolean = false
        // Object.keys(items).forEach((key:string)=>{
        //     let item = items[key]
        //     if(item.click){everClick=true}
        // })
        return ( 
        <ul>
            {Object.keys(items).map((name: string) => {
                let item = items[name]
                return <Popover
                    key={name}
                    placement="left"
                    title={item.name}
                    content={
                        <div style={{ width: '150px' }}>
                            <img
                                src={`../../images/types/${item.name}.png`}
                                width="100%"
                            />
                            <div>{info[item.name]}</div>
                        </div>}
                >
                    <li style={{float:'left', clear:'left'}}>
                        <div 
                            onClick={() => {
                            selectItem(name, 'click')

                            }}
                            onMouseEnter={() => {
                                selectItem(name, 'hover')
                            }}
                            onMouseLeave={() => {
                                selectItem(name, 'hover')
                            }}
                            style={{cursor: 'pointer'}}
                        >
                            <div 
                                style={{
                                width: item.hover ? '13px' : '10px',
                                height: item.hover ? '13px' : '10px',
                                float: 'left',
                                position: 'relative',
                                top: '4px',
                                marginRight: '3px',
                                backgroundColor: item.click ? 'gray' : getColor(item.name)
                            }}
                            />
                            <span style={{ fontSize: item.hover ? '12px' : '9px' }}>
                                {item.name}
                            </span>
                        </div>
                    </li>
                </Popover>
            })}
        </ul>
        )
    }
}