import * as React from 'react';
import axios from 'axios';
import { NN } from 'types';
import {prepareBoxplotData} from 'helper/'
import BarChart from './BarChart';
import ReactEcharts from 'echarts-for-react';

export interface Props {
    database: string,
    nn: NN,
    op: number
}

interface Performances {
    datasets: string[],
    models: { [modelName: string]: number [] }
}

export default class PerformanceCompare extends React.Component<Props, { csv: Performance }>{
    render() {
        if (this.props.database === 'nonsequence') {
            return <Box />
        } else {
            return <BarChart database={this.props.database} nn={this.props.nn} op={this.props.op} />
        }
    }
}

class Box extends React.Component<{}, { performances: Performances }>{
    constructor(props: {}) {
        super(props)
        this.state = {
            performances: {
                datasets: [],
                models: {}
            }
        }
    }
    async getData() {
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
        this.setState({ performances })
    }
    getOption() {
        let { models, datasets } = this.state.performances
        /////////// use bar charts
        // let series = Object.keys(models).map((modelName:string)=>{
        //     let records = models[modelName]
        //     return {
        //         name: modelName.split('_')[0],
        //         type:'bar',
        //         data: records
        //     }
        // })
        // let option = {
        //     title:{
        //         text: 'Image Classification'
        //     },
        //     legend:{},
        //     tooltip:{},
        //     grid:{
        //         left:'25%'
        //     },
        //     yAxis: {
        //         type: 'category',
        //         data: datasets,
        //         axisLabel:{
        //             rotate: 45
        //         }
        //     },
        //     xAxis: {
        //         type:'value'
        //     },
        //     series,
        // }
        // return option

        ////////// parallel coordinates
        let parallelAxis = datasets.map((name, idx) => {
            return {
                dim: idx,
                name,
                min:0,
                max:idx!==0?100:Math.max(...Object.values(models).map(d=>d[0])),
                axisLine:{
                    lineStyle:{
                        opacity: 0.4
                    }
                },
                nameRotate: 45
            }
        })
        let parallelSeries = Object.keys(models).map((modelName)=>{
            return  {
                name: modelName,
                type: 'parallel',
                data: [models[modelName]],
                smooth: true,
                lineStyle:{
                    width: 2,
                    opacity: 1
                }
            }
        })

        // layout
        let left = 25, right = 15, top=25, bottom=10, 
            step = (100-left-right)/(datasets.length-1)
        let layout = {
            left: `${left}%`,
            right: `${right}%`,
            bottom: `${bottom}%`,
            top: `${top}%`,
        }
        let grid = []
        for (let i=0;i<6;i++){
            grid.push({
                left: `${left+i*step}%`,
                right: `${100-(left+i*step)}%`,
                bottom: `${bottom}%`,
                top: `${top}%`,
                id: i
            })
        }
        // // boxplot
        let xAxis = datasets.map((dataset, i)=>{
            return {
                type: 'category',
                data: [dataset],
                gridIndex: i,
                axisLine:{
                    show: false
                },
                axisLabel:{
                    show: false
                },
                axisTick:{
                    show:false
                }
            }
        })

        let yAxis = datasets.map((dataset, i)=>{
            return {
                type: 'value',
                gridIndex: i,
                min: 0,
                max:i!==0?100:Math.max(...Object.values(models).map(d=>d[0])),
                axisLine:{
                    show: false
                },
                axisLabel:{
                    show: false
                },
                axisTick:{
                    show:false
                }
            }
        })
        
        // let boxData = prepareBoxplotData(
        //     Object.values(models).map(scores=>{
        //         return scores.filter(score=>score>0)
        //     }),
        //     { layout: 'h' }
        // );

        let boxData = datasets.map((dataset, idx)=>{
            return prepareBoxplotData(
                [
                    Object.values(models)
                    .map(model=>model[idx])
                    .filter(d=>(d>0))
                ],
                { layout: 'vertical' }
            )
        })

        let boxSeries = datasets.map((dataset, idx)=>{
            return {
                name: dataset,
                type: 'boxplot',
                xAxisIndex: idx,
                yAxisIndex: idx,
                boxWidth: [20, 30],
                itemStyle:{
                    borderWidth: 1.5,
                    color: 'white',
                    borderColor: 'black',
                },
                data: boxData[idx].boxData
            }
        })

        let outlierSeries = datasets.map((dataset, idx)=>{
            return {
                name: dataset,
                type: 'scatter',
                xAxisIndex: idx,
                yAxisIndex: idx,
                symbolSize: 5,
                itemStyle: {
                    color:'white',
                    borderColor: 'black',
                    borderWidth: 1.5
                },
                data: boxData[idx].outliers.map(d=>d[0])
            }
        })

        let selected = {}
        Object.keys(models).forEach(modelName=>{
            selected[modelName] = (['alexNet', 'vgg19', 'inception'].indexOf(modelName)>-1)
        })
        
        let option = {
            legend:{
                type:'scroll',
                // data: Object.keys(models),
                orient: 'vertical',
                left:'left',
                selected,
            },
            tooltip:{},
            grid,
            xAxis, 
            yAxis,
            parallelAxis,         
            parallel: {
                ...layout,
                parallelAxisDefault: {
                    type: 'value',
                    name: 'params(M)',
                    nameLocation: 'end',
                }
            },
            series: [...parallelSeries, ...boxSeries, ...outlierSeries],
        }
        return option
    }
    componentDidMount() {
        this.getData()
    }
    render() {
        if(this.state.performances.datasets.length>0){
            return (
                <div className="View ViewBottom">
                    <ReactEcharts
                        option={this.getOption()}
                        style={{ height: `100%`, width: '100%' }}
                    />
                </div>
            )
        }else{
            return <div className="View ViewBottom"/>
        }
        
    }
}