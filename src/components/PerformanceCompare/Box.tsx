import {Performances} from 'types';
import * as React from 'react';
import {prepareBoxplotData} from 'helper/';
import ReactEcharts from 'echarts-for-react';

export default class Box extends React.Component<{ performances: Performances }, {}>{
    constructor(props: { performances: Performances }) {
        super(props)
        
    }

    getOption() {
        let { models, datasets } = this.props.performances
        let option = {}

        let left = 25, right = 15, top=25, bottom=20, 
            step = (100-left-right)/(datasets.length-1)
        let layout = {
            left: `${left}%`,
            right: `${right}%`,
            bottom: `${bottom}%`,
            top: `${top}%`,
        }

        if (datasets.length===1 || Object.keys(models).length<3){
        ///////// if only one dataset, just use bar charts
            let series = Object.keys(models).map((modelName:string)=>{
                let records = models[modelName]
                return {
                    name: modelName.split('_')[0],
                    type:'bar',
                    data: records
                }
            })
            option = {
                legend:{
                    top: `${top/2}%`,
                    orient: 'vertical',
                    left:'left'
                    },
                tooltip:{},
                grid:{...layout},
                xAxis: {
                    type: 'category',
                    data: datasets,
                    axisLabel:{
                        interval: 0
                    },
                    axisTick:{
                        interval: 0
                    }
                    // axisLabel:{
                    //     rotate: 45
                    // }
                },
                yAxis: {
                    type:'value'
                },
                series,
            }
            return option

        }else{
            console.info('draw parallel box')
            let parallelAxis = datasets.map((name:string, idx:number) => {
                return {
                    dim: idx,
                    name,
                    min: Math.min(...Object.values(models).map(d=>d[idx])),
                    max: Math.max(...Object.values(models).map(d=>d[idx])),
                    // max:idx!==0?100:Math.max(...Object.values(models).map(d=>d[0])),
                    axisLine:{
                        lineStyle:{
                            opacity: 0.4
                        }
                    },
                    nameRotate: 45
                }
            })
            console.info(models)
            let parallelSeries = Object.keys(models).map((modelName)=>{
                return  {
                    name: modelName,
                    type: 'parallel',
                    data: [models[modelName]],
                    smooth: true,
                    lineStyle:{
                        width: 2,
                        opacity: 1
                    },
                    inactiveOpacity: 0.45,
                    activeOpacity: 1,
                }
            })
    
            // layout
           
            let grid = []
            for (let i=0;i<datasets.length;i++){
                grid.push({
                    left: `${left+i*step}%`,
                    right: `${100-(left+i*step)}%`,
                    bottom: `${bottom}%`,
                    top: `${top}%`,
                    id: i
                })
            }
            // // boxplot
            let xAxis = datasets.map((dataset:string, i:number)=>{
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
                    min: Math.min(...Object.values(models).map(d=>d[i]) ),
                    max: Math.max(...Object.values(models).map(d=>d[i]) ),
                    // max:i!==0?100:Math.max(...Object.values(models).map(d=>d[0])),
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
                    boxWidth: [20, 20.5],
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
                        color:'transparent',
                        borderColor: 'black',
                        borderWidth: 1.5
                    },
                    data: boxData[idx].outliers.map(d=>d[0])
                }
            })
    
            let selected = {}
            Object.keys(models).forEach((modelName, i)=>{
                selected[modelName] = (i<6)
            })
            
            option = {
                legend:{
                    type:'scroll',
                    data: Object.keys(models),
                    top: `${top/2}%`,
                    orient: 'vertical',
                    left:'left',
                    selected,
                    formatter: function (name:string) {
                        return name.split('_')[0]
                    },
                    tooltip: {
                        show: true,
                        formatter: (params:{[key:string]:any})=>{
                            return models[params.name]
                                    .map((score, i)=>{return `${datasets[i]}: ${score}`})
                                    .join('<br/>')
                        }
                    }
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
                series: [...boxSeries, ...outlierSeries, ...parallelSeries],
            }
            return option
        }
        
        ////////// parallel coordinates
        
    }
    
    render() {
        return (
            <ReactEcharts
                notMerge={true}
                lazyUpdate={true}
                option={this.getOption()}
                style={{ height: `100%`, width: '100%' }}
            />
        )
        
    }
}