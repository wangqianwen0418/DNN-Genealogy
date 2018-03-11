import * as React from "react"
import "./RadialBoxplot.css"
import { getColor } from "../helper"
import * as d3 from "d3"
import { NN } from "../types"

export interface Dot {
    [key: string]: any
}

export interface Props {
    database: string,
    nn: NN,
    op: number
}

export interface State {
    selected: string[],
    nns: Dot[],
    attr_names: string[],
}

let simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(-30))

const sequenceDatasets = ['abc'],
      nonsequenceDatasets= ['SVHN', 'cifar10', 'cifar100', 'imageNet val top1', 'imagenet val top 5']

export default class RadialBoxplot extends React.Component<Props, State> {
    public nodes: any; r : number = 100; node_dist = 10
    constructor(props: Props) {
        super(props)
        this.arc = this.arc.bind(this)
        this.state = {
            selected: [],
            nns: [],
            attr_names: nonsequenceDatasets
        }
        this.selectNode = this.selectNode.bind(this)
    }

    arc(x: number = 0, y: number = 0, r: number, startAngle: number, endAngle: number) {
        var start = this.polarToCartesian(x, y, r, endAngle),
            end = this.polarToCartesian(x, y, r, startAngle)
        var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        var d = [
            "M", start.x, start.y,
            "A", r, r, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ")

        return d
    }
    polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
        var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        }
    }

    getForceX(attr: number[]) {
        let len = attr.length
        let x: number = attr.map((d: number, idx: number) => d * Math.cos(Math.PI / len * idx)).reduce((a, b) => a + b, 0)
        return x
    }
    getForceY(attr: number[]) {
        let len = attr.length
        let y: number = attr.map((d: number, idx: number) => d * Math.sin(Math.PI / len * idx)).reduce((a, b) => a + b, 0)
        console.log('forcey', y)
        return y
    }

    selectNode(d: Dot) {
        let { selected } = this.state
        let name_idx = selected.indexOf(d.name)
        if (name_idx === -1) {
            selected.push(d.name)
        } else {
            selected.splice(name_idx, 1)
        }
        this.setState({ selected })
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.op !== 1 || this.props === nextProps)
            return
        console.log(nextProps.nn)
        this.updateData(nextProps.nn)
        }

    componentDidUpdate() {
        this.draw()
    }

    updateData(nn: NN) {
        let database = this.props.database, { nns, attr_names } = this.state
        if (database === 'nonsequence') {
            attr_names = nonsequenceDatasets
        } else {
            attr_names = sequenceDatasets
        }
        let newnns: Dot[] = []
        for (let name of nn.names) {
            let tmpAttr: number[] = []
            for (let index in attr_names) {
                tmpAttr[index] = name[attr_names[index]] ? name[attr_names[index]] : 0
            }
            newnns.push({
                r: name.params,
                name: name.name,
                attr: tmpAttr
            })
        }
        // Update Nodes
        let that = this
        this.nodes = d3.select('.compareView')
            .selectAll('.dot')
            .attr('class', 'dot')
            .data(newnns)
            .enter().append('circle')
            .attr('r', (d) => {
                let radius = Math.sqrt(d.r)
                if (radius < 3)
                    radius = 3
                else if (radius > 10)
                    radius = 10
                return radius
            })
            .attr('cx', (d, i) => this.getForceX(d.attr) || 0)
            .attr('cy', (d, i) => this.getForceY(d.attr) || 0)
            .attr('fill', (d) => '#666')
            .attr('title', d => d.name)
            .on('click', function(d) {
                let selected_idx: number = that.state.selected.indexOf(d.name)
                d3.select(this)
                    .attr('fill', (d: Dot) => selected_idx === -1 ? getColor(d.name) : '#666')
                    // .attr('r', (d) => selected_idx === -1 ? that.node_r * 1.3 : that.node_r)
                    .style('z-index', selected_idx === -1 ? 100 : 3)
                that.selectNode(d)
            })

        nns = nns.concat(newnns)

        this.setState({ attr_names, nns })
    }

    draw() {
        let { selected, nns } = this.state
        console.log(nns)
        simulation
            .nodes(nns)
            .force('collide', d3.forceCollide().strength(.5).radius(this.node_dist).iterations(3))
            .force('forceX', d3.forceX().strength(.1).x((d: Dot) => this.getForceX(d.attr)))
            .force("forceY", d3.forceY().strength(.1).y((d: Dot) => this.getForceY(d.attr)))
            .on('tick', ticked)
        let nodes = this.nodes
        function ticked() {
            nodes.attr('cx', (d: any) => d.x || 0)
                 .attr('cy', (d: any) => d.y || 0)
        }
    }

    render() {
        let { nns, attr_names, selected } = this.state
        let margin: number = 5,
            bar_a: number = 360 / attr_names.length,
            bar_w: number = 15
        let selected_nns = selected.map((name: string) =>nns.filter((nn) => nn.name == name)[0])
        let bars: JSX.Element[][] = selected_nns
            .map((data: Dot, idx: number) => {
                return data.attr.map((attr: number, attr_i: number) => 
                    attr ? <g>
                            <path key={`point_${idx}_attr_${attr_i}`}
                                d={
                                    this.arc(0, 0,
                                    this.r + margin + bar_w / 2,
                                    bar_a * attr_i + (bar_a - margin) * attr / 100 - 0.5,
                                    bar_a * attr_i + (bar_a - margin) * attr / 100 + 0.5)
                                }
                                fill='none'
                                strokeWidth={bar_w}
                                stroke={getColor(data.name)}></path>
                            </g> : ""
                )
            })
        let axis: JSX.Element[] = attr_names.map((attr: string, i: number) => {
            return <g>
                <path key={`axis_${attr}`} id={`axis_${attr}`}
                    d={this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * i, bar_a * (i + 1) - margin)}
                    fill='none'
                    strokeWidth={1}
                    stroke='grey'
                    stroke-dasharray='5, 5'></path>
                <path key={`axis_${attr}_start`}
                    d={this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * i, bar_a * i + 0.5)}
                    fill='none'
                    strokeWidth={bar_w}
                    stroke='grey'></path>
                <path key={`axis_${attr}_end`}
                    d={this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * (i + 1) - margin - 1.5, bar_a * (i + 1) - margin)}
                    fill='none'
                    strokeWidth={bar_w}
                    stroke='grey'></path>
                {/* <path key={`aixs_${i}_bg`}
                    d={
                        this.arc(0, 0,
                        this.r + margin + bar_w / 2,
                        bar_a * i,
                        bar_a * (i + 1) - margin)
                    }
                    fill='none'
                    strokeWidth={bar_w}
                    opacity='0.2'
                    stroke='grey'></path> */}
                <text textAnchor="middle" dy='-3' opacity='0.5'>
                    <textPath
                        xlinkHref={`#axis_${attr}`}
                        startOffset='50%'>
                    {attr}
                    </textPath>
                </text>
                
            </g>
        })
        
        return <svg width='1000' height='1000'>
            <g className='compareView'
               transform='translate(300, 300)'>
               <circle r={this.r} fill='none' stroke='grey'></circle>
               {axis}               
               {bars}
            </g>
        </svg>
    }

}