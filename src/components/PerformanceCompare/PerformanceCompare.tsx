import * as React from 'react';
import axios from 'axios';
import './PerformanceCompare.css';
import { NN, Performances } from 'types';
import { Tabs, Tooltip, Card } from 'antd';
import Box from './Box';

export interface Props {
    database: string,
    currentNNs: NN[],
    selectedNN: NN,
    op: number
}

export interface State {
    cnnTables: Performances[],
    rnnTables: Performances[],
    tables: Performances[]
}

const TabPane = Tabs.TabPane;

export default class PerformanceCompare extends React.Component<Props, State>{
    constructor(props: Props) {
        super(props)
        this.state = {
            cnnTables: [],
            rnnTables: [],
            tables: []
        }
    }
    async getData() {
        // let res = await axios.get('../../data/recognition.csv')
        // let csvData = res.data
        // let cnnTable: Performances = {
        //     name: 'image classification',
        //     modelIDs: [],
        //     datasets: [],
        //     models: {}
        // }
        // let lines = csvData.split('\n').slice(0, -2)
        // let header = lines[0]
        // cnnTable.datasets = header.split('|').slice(3, 9)
        // lines.slice(1).forEach((line: string) => {
        //     let cells = line.split('|')
        //     let modelName = cells[1]
        //     cnnTable.models[modelName] = cells.slice(3, 9).map((d: string, i: number) => {
        //         if (d === 'na') {
        //             return 0
        //         } else if (i > 0) {
        //             // if it is performance
        //             return (100 - parseFloat(d))
        //         }
        //         return parseFloat(d) // model number of parameters
        //     }
        //     )
        //     cnnTable.modelIDs.push(modelName.split('-')[0].split('_')[0])

        // })

        // let cnnres = await axios.get('../../data/performances.json')
        // let cnnTables = cnnres.data

        // let rnnres = await axios.get('../../data/rnn_scores.json')
        // let rnnTables = rnnres.data
        // this.setState({cnnTables, rnnTables})

        let res = await axios.get('../../data/performances.json')
        let tables = res.data
        this.setState({ tables })

    }
    getTables() {
        // if (this.props.database === 'nonsequence'){
        //     return this.state.cnnTables
        // }else{ 
        //     return  this.state.rnnTables.filter(
        //         (table:Performances)=>
        //         table.modelIDs.map(d=>d[0])
        //         .indexOf(this.props.selectedNN.ID)>-1
        //     )
        // }
        return this.state.tables.filter(
            (table: Performances) =>
                table.modelIDs.map(d => d[0])
                    .indexOf(this.props.selectedNN.ID) > -1
        )

    }

    componentDidMount() {
        this.getData()
    }

    render() {
        let { currentNNs, selectedNN } = this.props
        let tables = this.getTables()
        console.info("tables", tables)
        if (tables.length > 0 && selectedNN.ID) {
            // if (this.props.database === 'nonsequence') {
            //     return <Box performances={tables[0]}/>
            // } else {
            //     return <BarChart database={this.props.database} nn={this.props.nn} op={this.props.op} />
            // }
            return (
                <Card
                    bordered={false}
                    title={<span style={{ fontSize: '1.2em' }}>Performances</span>}
                    className="View ViewBottom"
                    bodyStyle={{ height: 'calc(100% - 48px)' }}
                >
                    <Tabs defaultActiveKey="0" className="performance" style={{ height: '100%' }}>
                        {tables.map((table: Performances, tabIdx: number) => {
                            return (
                                <TabPane
                                    tab={table.name}
                                    key={tabIdx.toString()}
                                    style={{ height: '100%', width: '100%' }}
                                // forceRender={true}
                                >
                                    <Box performances={table} currentNNs={currentNNs} selectedNN={selectedNN} />
                                </TabPane>
                            )
                        })}
                    </Tabs>
                </Card>
            )
        } else {
            return <Card
                bordered={false}
                title={<span style={{ fontSize: '1.2em' }}>Performances</span>}
                className="View ViewBottom"
                bodyStyle={{ height: 'calc(100% - 48px)' }}
            > <div>
                    Click DNNs to compare performance here.
            </div>
            </Card>
        }

    }
}
