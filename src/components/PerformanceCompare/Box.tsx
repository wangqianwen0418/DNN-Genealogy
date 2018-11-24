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

    getBestDNNs(){
        let { models, datasets} = this.props.performances
        let bestDNNs:Array<any> = datasets.map((dataset: string, i) => {
            let bestScore = (dataset === 'params' ? Infinity : -Infinity)
            let bestDNN = ' '
            Object.keys(models).forEach((k) => {
                let scores = models[k]
                let score = scores[i]
                if (dataset !== 'params' && score > bestScore && score !== 0) {
                    bestScore = score
                    bestDNN = k
                }else if(dataset === 'params' && score < bestScore && score !== 0 ){
                    bestScore = score
                    bestDNN = k
                }
            })
            return [bestDNN, bestScore ]
        })

        return bestDNNs
    }

    getOption() {
        let { models, datasets, modelIDs } = this.props.performances
        let option = {}
        let currentIDs = this.props.currentNNs.map(d => d.ID)

        let left = 25, right = 5, top = 10, bottom = 30,
            step = (100 - left - right) / (datasets.length - 1)
        let layout = {
            left: `${left}%`,
            right: `${right}%`,
            bottom: `${bottom}%`,
            top: `${top}%`,
        }

        // let series = Object.keys(models).map((modelName: string) => {
        //     let records = models[modelName]
        //     return {
        //         name: modelName.split('_')[0].split('-')[0],
        //         type: 'bar',
        //         data: records
        //     }
        // })

        // let selected = {}
        //     currentIDs.forEach(id=>{
        //         selected[id] = (id===this.props.selectedNN.ID)
        //     })

        let boxData = prepareBoxplotData(
            datasets.map((dataset, idx) => {
                return Object.values(models)
                    .map(model => model[idx])
                    .filter(d => (d > 0))

            })
        )
        // best performed DNN at each dataset
        
        let bestDNNs = this.getBestDNNs()
        let boxSeries = {
            name: 'boxplot',
            type: 'boxplot',
            boxWidth: ['90%', '95%'],
            itemStyle: {
                borderWidth: 1.4,
                color: 'rgba(128, 128, 128, 0)',
                borderColor: 'rgba(230, 137, 0, 0.5)',
            },
            data: boxData.boxData,
            tooltip: {
                formatter: (params: any, ticket: string) => {
                    let dataIdx = params.dataIndex
                    return `best in ${datasets[dataIdx]} </br>
                        ${bestDNNs[dataIdx][0]}: ${bestDNNs[dataIdx][1]}`
                }
            },
        }

        let barSeries: any[] = []
        // this.props.currentNNs.forEach(nn=>{
        //     let id = nn.ID 
        //     modelIDs.forEach((k:any)=>{
        //         let variant = modelIDs[k]
        //         series.push({
        //             name: id,
        //             type:"bar",
        //             data: models[variant]
        //         })
        //     })
        // })
        modelIDs.forEach((d, idx) => {
            if (currentIDs.indexOf(d[0]) != -1) {
                d[1].forEach(variant => {
                    barSeries.push({
                        name: d[0],
                        type: "bar",
                        data: models[variant],
                        tooltip: {
                            formatter: (params: Object | Array<any>, ticket: string) => {
                                // console.info(params)
                                return `${variant} </br>
                                    ${params['name']}: ${params['value']}`
                            }
                        },
                        itemStyle: {
                            color: getColor(idx.toString(), 2)
                        }
                    })
                })
            }
        })

        option = {
            legend: {
                top: `${top / 2}%`,
                orient: 'vertical',
                left: 'left',
                data: currentIDs
                // selected
            },
            tooltip: {},
            grid: { ...layout },
            xAxis: {
                type: 'category',
                data: datasets,
                // data: boxData[0].axisData,
                axisLabel: {
                    interval: 0,
                    rotate: 30
                },
                axisTick: {
                    interval: 0
                },
                splitArea: {
                    show: true
                },
                // axisPointer:{
                //     show: true,
                //     type: 'none',
                //     snap: false
                // }
            },
            yAxis: {
                type: 'value'
            },
            series: [boxSeries, ...barSeries],
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
                    modelID = params.seriesId.replace(/\d+$/, '').replace(/\0/g, '')

                } else if (params.seriesType === 'boxplot') {
                    
                    let idx = params.dataIndex
                    let bestDNNs = this.getBestDNNs()
                    modelID = bestDNNs[idx][0].split('\b')[0]
                }

                d3.selectAll(`g.NNNode`)
                        .style('opacity', 0.3)

                d3.selectAll(`.ExtendNode`)
                    .style('opacity', 0.3)

                d3.select(`#exnode_${modelID}`)
                    .style('opacity', 1)

                d3.select(`#nnnode_${modelID}`)
                    .style('opacity', 1)


            })

            myChart.on('mouseout', (params: any) => {
                d3.selectAll(`.Node`)
                    .style('opacity', 1)

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