import { Performances } from 'types';
import * as React from 'react';
import { prepareBoxplotData, getColor } from 'helper/';
import ReactEcharts from 'echarts-for-react';
import { NN } from 'types';
import * as d3 from 'd3';

interface Props {
    performances: Performances,
    currentNNs: NN[],
    selectedNN: NN
}

export default class Box extends React.Component<Props, {}>{
    public ref: any
    constructor(props: Props) {
        super(props)

    }

    getBestDNNs() {
        let { models, datasets } = this.props.performances
        let bestDNNs: Array<any> = datasets.map((dataset: string, i) => {
            let bestScore = (dataset === 'params' ? Infinity : -Infinity)
            let bestDNN = ' '
            Object.keys(models).forEach((k) => {
                let scores = models[k]
                let score = scores[i]
                if (dataset !== 'params' && score > bestScore && score !== null) {
                    bestScore = score
                    bestDNN = k
                } else if (dataset === 'params' && score < bestScore && score !== null) {
                    bestScore = score
                    bestDNN = k
                }
            })
            return [bestDNN, bestScore]
        })
        return bestDNNs
    }

    getOption() {
        let { models, datasets, modelIDs } = this.props.performances,
            currentIDs = this.props.currentNNs.map(d => d.ID)

        

        let left = 20, right = 0, top = 10, bottom = 30, margin = 2,
            step = (100 - left - right) / (datasets.length ) ,

            layout = {
                left: `${left}%`,
                right: `${right}%`,
                bottom: `${bottom}%`,
                top: `${top}%`,
            }

        let currentVariants: string[] = []
        currentIDs.forEach((ID, i) => {
            let modelID = modelIDs.filter(d => (d[0] === ID))[0]
            if (modelID){
                currentVariants = currentVariants.concat(modelID[1])
            }
            
        })
        // if(currentIDs.length<4){
        //     currentVariants = Object.keys(models).concat(currentVariants.filter(v=>!(v in  Object.keys(models))))
        // }

        let grid = []
        for (let i = 0; i < datasets.length; i++) {
            grid.push({
                left: `${left + i * step}%`,
                right: `${100 - (left + (i + 1) * step) + margin}%`,
                bottom: `${bottom}%`,
                top: `${top}%`,
                id: i
            })
        }
        // let selected = {}
        //     currentIDs.forEach(id=>{
        //         selected[id] = (id===this.props.selectedNN.ID)
        //     })

        // let boxData = prepareBoxplotData(
        //     datasets.map((dataset, idx) => {
        //         return Object.values(models)
        //             .map(model => model[idx])
        //             .filter(d => (d > 0))

        //     })
        // )
        // // best performed DNN at each dataset

        // let bestDNNs = this.getBestDNNs()
        // let boxSeries = {
        //     name: 'boxplot',
        //     type: 'boxplot',
        //     boxWidth: ['90%', '95%'],
        //     itemStyle: {
        //         borderWidth: 1.4,
        //         color: 'rgba(128, 128, 128, 0)',
        //         borderColor: 'rgba(230, 137, 0, 0.5)',
        //     },
        //     data: boxData.boxData,
        //     tooltip: {
        //         formatter: (params: any, ticket: string) => {
        //             let dataIdx = params.dataIndex
        //             return `best in ${datasets[dataIdx]} </br>
        //                 ${bestDNNs[dataIdx][0]}: ${bestDNNs[dataIdx][1]}`
        //         }
        //     },
        // }

        // let barSeries: any[] = []
        // // this.props.currentNNs.forEach(nn=>{
        // //     let id = nn.ID 
        // //     modelIDs.forEach((k:any)=>{
        // //         let variant = modelIDs[k]
        // //         series.push({
        // //             name: id,
        // //             type:"bar",
        // //             data: models[variant]
        // //         })
        // //     })
        // // })
        // modelIDs.forEach((d, idx) => {
        //     if (currentIDs.indexOf(d[0]) !== -1) {
        //         d[1].forEach(variant => {
        //             barSeries.push({
        //                 name: d[0],
        //                 type: 'bar',
        //                 data: models[variant],
        //                 tooltip: {
        //                     formatter: (params: any, ticket: string) => {
        //                         // console.info(params)
        //                         return `${variant} </br>
        //                             ${params.name}: ${params.value}`
        //                     }
        //                 },
        //                 itemStyle: {
        //                     color: getColor(currentIDs.indexOf(d[0]).toString(), 2)
        //                 },
        //                 emphasis: {
        //                     itemStyle:{
        //                         borderColor: "gray",
        //                         borderWidth: 1.5
        //                     }
        //                 },

        //             })
        //         })
        //     }
        // })

        // option = {
        //     legend: {
        //         top: `${top / 2}%`,
        //         orient: 'vertical',
        //         left: 'left',
        //         data: currentIDs
        //         // selected
        //     },
        //     tooltip: {},
        //     grid: { ...layout },
        //     xAxis: {
        //         type: 'category',
        //         data: datasets,
        //         // data: boxData[0].axisData,
        //         axisLabel: {
        //             interval: 0,
        //             rotate: 30
        //         },
        //         axisTick: {
        //             interval: 0
        //         },
        //         splitArea: {
        //             show: true
        //         },
        //         // axisPointer:{
        //         //     show: true,
        //         //     type: 'none',
        //         //     snap: false
        //         // }
        //     },
        //     yAxis: {
        //         type: 'value',
        //         splitLine: {
        //             show: false
        //             }
        //     },
        //     // yAxis: [
        //     //     {
        //     //     type: 'value',
        //     //     splitLine: {
        //     //         show: false
        //     //         }
        //     //     }],
        //     series: [boxSeries, ...barSeries],
        // }
        // return option

        let xAxis = datasets.map((dataset: string, i: number) => {
            return {
                type: 'category',
                data: [dataset],
                gridIndex: i,
                axisLine: {
                    show: true
                },
                axisLabel: {
                    show: true,
                    // rotate: -20
                },
                axisTick: {
                    show: false
                }
            }
        })

        let yAxis = datasets.map((dataset: string, i: number) => {
            return {
                type: 'value',
                gridIndex: i,
                min: function(value:any) {
                    return Math.max(value.min - (value.max-value.min)/3, 0)
                },
                max: 'dataMax',
                // min: Math.min(...Object.values(models).map(d=>d[i]) ),
                // max: Math.max(...Object.values(models).map(d=>d[i]) ),
                // // max:i!==0?100:Math.max(...Object.values(models).map(d=>d[0])),
                axisLine:{
                    show: true,
                    margin: 0,
                    rotate: 30,
                    interval: 3
                },
                axisLabel:{
                    show: true,
                    showMinLabel: false,
                    showMaxLabel: false,
                    margin: 3,
                    rotate: -10
                },
                axisTick:{
                    show:false
                },
                splitLine:{
                    show: false
                }
            }
        })

        let boxData = prepareBoxplotData(
            datasets.map((dataset, idx) => {
                return Object.values(models)
                    .map(model => model[idx])
                    .filter(d => (d > 0))

            })
        )
        // best performed DNN at each dataset
        let bestDNNs = this.getBestDNNs()
        let boxSeries = datasets.map((dataset, idx) => {
            return {
                name: 'boxplot_' + dataset,
                type: 'boxplot',
                boxWidth: ['50%', '65%'],
                itemStyle: {
                    borderWidth: 1.4,
                    color: 'rgba(128, 128, 128, 0)',
                    borderColor: 'rgba(230, 137, 0, 0.5)',
                },
                xAxisIndex: idx,
                yAxisIndex: idx,
                data: [boxData.boxData[idx]],
                tooltip: {
                    formatter: (params: any, ticket: string) => {
                        return `best in ${datasets[idx]} </br>
                            ${bestDNNs[idx][0]}: ${bestDNNs[idx][1]}`
                    }
                },
            }
        })



        let getScores = (dataset: string, datasetIdx: number) => {
            let scores: any[] = []
            // tslint:disable-next-line:forin
            currentIDs.forEach((ID, i) => {
                let model = modelIDs.filter(d => (d[0] === ID))[0]
                if(!model){
                    return
                }
                let variants = model[1]
                // tslint:disable-next-line:forin
                for (let k in variants) {
                    let variant = variants[k]
                    scores.push({
                        name: model[0],
                        type: 'bar',
                        xAxisIndex: datasetIdx,
                        yAxisIndex: datasetIdx,
                        emphasis: {
                            itemStyle: {
                                borderColor: 'gray',
                                borderWidth: 2,
                                borderType:'dotted',
                                color: '#fcc9e1'
                            }
                        },
                        data: [models[variant][datasetIdx]],
                        itemStyle: {
                            color: getColor(i.toString(), 2)
                        },
                        tooltip: {
                            formatter: (params: any, ticket: string) => {
                                return `${variant} </br>
                                    ${params.name}: ${params.value}`
                            }
                        },
                    })
                }
            })
            return scores
        }

        let barSeries: any[] = []
        datasets.forEach((dataset: string, datasetIdx: number) => {
            let scores = getScores(dataset, datasetIdx)

            barSeries = barSeries.concat(scores)
        })

        let option = {
            legend: {
                top: `${top / 2}%`,
                orient: 'vertical',
                left: 'left',
                data: currentIDs
                // selected
            },
            tooltip: {},
            grid: grid,
            xAxis: xAxis,
            yAxis: yAxis,
            series: [...boxSeries, ...barSeries],
        }
        return option

    }
    componentDidMount() {
        if (this.ref) {
            let myChart = this.ref.getEchartsInstance();
            let modelID = ' '

            myChart.on('mouseover', (params: any) => {
                // console.info('mouser over params', params)

                if (params.seriesType === 'bar') {
                    modelID = params.seriesName

                } else if (params.seriesType === 'boxplot') {

                    let idx = params.seriesIndex
                    let bestDNNs = this.getBestDNNs()
                    modelID = bestDNNs[idx][0].split('\b')[0]
                }

                d3.selectAll(`g.NNNode`)
                    .classed('faded', true)
                // .style('opacity', 0.3)

                d3.selectAll(`.ExtendNode`)
                    .classed('faded', true)
                // .style('opacity', 0.3)

                d3.select(`#exnode_${modelID}`)
                    .classed('faded', false)
                // .style('opacity', 1)

                d3.select(`#nnnode_${modelID}`)
                    .classed('faded', false)
                // .style('opacity', 1)

            })

            myChart.on('mouseout', (params: any) => {
                d3.selectAll(`.Node`)
                    .classed('faded', false)
                // .style('opacity', 1)

            })
        }
    }

    render() {
        return (
            <ReactEcharts
                ref={(e) => { this.ref = e; }}
                notMerge={true}
                lazyUpdate={true}
                option={this.getOption()}
                style={{ height: `100%`, width: '100%' }}
                opts={{ renderer: 'svg' }}
            />
        )

    }
}