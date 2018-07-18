import * as React from 'react';
import axios from 'axios';
import { NN } from 'types';
import { Tabs, Tooltip } from 'antd';

export interface Props {
    database: string,
    nn: NN,
    op: number
}

export default class PerformanceCompare extends React.Component<Props, {}>{
    
    render(){
        return <div className="View ViewBottom"/>
    }
}