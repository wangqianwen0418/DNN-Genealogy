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

export interface State {
    cnnTables: Performances[],
    rnnTables: Performances[]
}

const TabPane = Tabs.TabPane;

export default class PerformanceCompare extends React.Component<Props, State>{
    constructor(props: Props) {
        super(props)
        this.state = {
            cnnTables: [],
            rnnTables: []
        }
    }
    async getData() {
            let res = await axios.get('../../data/recognition.csv')
            let csvData = res.data
            let cnnTable: Performances = {
                name: 'image classification',
                modelIDs: [],
                datasets: [],
                models: {}
            }
            let lines = csvData.split('\n').slice(0, -2)
            let header = lines[0]
            cnnTable.datasets = header.split('|').slice(3, 9)
            lines.slice(1).forEach((line: string) => {
                let cells = line.split('|')
                let modelName = cells[1]
                cnnTable.models[modelName] = cells.slice(3, 9).map((d: string, i: number) => {
                    if (d === 'na') {
                        return 0
                    } else if (i > 0) {
                        // if it is performance
                        return (100 - parseFloat(d))
                    }
                    return parseFloat(d) // model number of parameters
                }
                )
                cnnTable.modelIDs.push(modelName.split('-')[0].split('_')[0])

            })
        
            let rnnres = await axios.get('../../data/rnn_scores.json')
            let rnnTables = rnnres.data
            this.setState({cnnTables: [cnnTable], rnnTables})
        
    }
    getTables(){
        if (this.props.database === 'nonsequence'){
            return this.state.cnnTables
        }else{ 
            return  this.state.rnnTables.filter(
                (table:Performances)=>
                table.modelIDs
                .indexOf(this.props.nn.ID)>-1
            )
        }

    }

    componentDidMount() {
        this.getData()
    }
    
    render() {
        let tables = this.getTables()
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
                        tab={table.name} 
                        key={tabIdx.toString()} 
                        style={{height:'100%', width:'100%'}}
                        // forceRender={true}
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
