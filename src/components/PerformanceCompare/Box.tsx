import { Performances } from 'types';
import * as React from 'react';
import { prepareBoxplotData, getColor } from 'helper/';
import ReactEcharts from 'echarts-for-react';
import { NN } from 'types';

interface Props {
    performances: Performances,
    currentNNs: NN[],
    selectedNN: NN
}

export default class Box extends React.Component<Props, {}>{
    public ref: ReactEcharts | null
    constructor(props: Props) {
        super(props)

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
        let series: any[] = []
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
        modelIDs.forEach(d => {
            if (currentIDs.indexOf(d[0]) != -1) {
                d[1].forEach(variant => {
                    series.push({
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
                        itemStyle:{
                            color: getColor(d[0], 2)
                        }
                    })
                })
            }
        })
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

        option = {
            legend: {
                top: `${top / 2}%`,
                orient: 'vertical',
                left: 'left',
                // selected
            },
            tooltip: {},
            grid: { ...layout },
            xAxis: {
                type: 'category',
                data: datasets,
                axisLabel: {
                    interval: 0,
                    rotate: 45
                },
                axisTick: {
                    interval: 0
                }
            },
            yAxis: {
                type: 'value'
            },
            series,
        }
        return option

    }
    componentDidUpdate() {
        // if(this.ref){
        //     let myChart = this.ref.getEchartsInstance();

        //     myChart.on('legendselected', (params:any)=>{
        //         console.info(params)
        //     })
        //     myChart.on('legendselectchanged', (params:any)=>{
        //         console.info('legend select change', params)

        //         myChart.dispatchAction({
        //             type: 'highlight',
        //             seriesIndex: 13,
        //             dataIndex: 0
        //         });

        //         myChart.dispatchAction({
        //             type: 'legendUnSelect',
        //             // 图例名称
        //             name: 'resNet'
        //         })
        //     })
        //     myChart.on('click', (params:any)=>{
        //         console.info('click', params)
        //     })

        // }
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