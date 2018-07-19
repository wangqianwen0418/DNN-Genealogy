import * as React from 'react';
import axios from 'axios';
import './PerformanceCompare.css';
import { NN, Performances } from 'types';
import { Tabs, Tooltip } from 'antd';
import Box from './Box';

export interface Props {
    database: string,
    nn: NN,
    op: number
}

const TabPane = Tabs.TabPane;

export default class PerformanceCompare extends React.Component<Props, { tables: Performances[] }>{
    constructor(props: Props) {
        super(props)
        this.state = {
            tables: []
        }
    }
    async getData() {
        console.info('getdata')
        if (this.props.database === 'nonsequence'){
            let res = await axios.get('../../data/recognition.csv')
            let csvData = res.data
            let performances: Performances = {
                datasets: [],
                models: {}
            }
            let lines = csvData.split('\n').slice(0, -2)
            let header = lines[0]
            performances.datasets = header.split('|').slice(3, 9)
            lines.slice(1).forEach((line: string) => {
                let cells = line.split('|')
                let modelName = cells[1]
                performances.models[modelName] = cells.slice(3, 9).map((d: string, i: number) => {
                    if (d === 'na') {
                        return 0
                    } else if (i > 0) {
                        // if it is performance
                        return (100 - parseFloat(d))
                    }
                    return parseFloat(d) // model number of parameters
                }
                )

            })
            this.setState({ tables: [performances] })
        }else{
            let res = await axios.get('../../data/rnn_scores.json')
            let tables = res.data.filter(
                (table:Performances)=>
                Object.keys(table.models)
                .indexOf(this.props.nn.ID)>-1
            )
            console.info(res, tables, this.props.nn.ID)
            this.setState({tables})
        }
        
    }

    componentDidMount() {
        this.getData()
    }
    componentWillReceiveProps(nextProps: Props){
        this.getData()
    }

    render() {
        let {tables} = this.state
        console.info(tables)
        if(tables.length>0){
            // if (this.props.database === 'nonsequence') {
            //     return <Box performances={tables[0]}/>
            // } else {
            //     return <BarChart database={this.props.database} nn={this.props.nn} op={this.props.op} />
            // }
            return (
            <Tabs defaultActiveKey="0" className="View ViewBottom">
                {tables.map((table:Performances, tabIdx:number)=>{
                    return (
                    <TabPane 
                        tab="Tab 1" 
                        key={tabIdx.toString()} 
                        style={{height:'100%', width:'100%'}}
                        forceRender={true}
                    >
                       <Box performances={table}/>
                    </TabPane>
                    )
                })}
            </Tabs>
            )
        }else{
            return <div className="View ViewBottom"/>
        }
        
    }
}
