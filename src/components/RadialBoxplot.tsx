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
    public nodes: any; r : number; node_dist = 10
    private ref: HTMLDivElement|null; width: number; height: number
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
        //this.draw()
        this.updateData(nextProps.nn)
    }

    componentDidUpdate() {
        //this.drawPlot()
        //this.drawNodes()
        this.draw()
        //this.updateData(this.props.nn)
        
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
        nns = nns.concat(newnns)

        this.setState({ attr_names, nns })
        
    }

    drawNodes() {
        console.log('legend')
        d3.select(".CompareView").select("#legend").remove()
        var g = d3.select(".CompareView")
        console.log(g)
        var labels = g.append("g")
            .attr("id", "legend")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(this.state.selected)
            .enter().append("g")
            .attr("transform", (d: any, i: number) => "translate(50," + i * 10 + ")")
        labels.append("rect")
            .attr("class", (d: any) => "label")
            .attr("x", this.width - 9)
            .attr("width", 9)
            .attr("height", 9)
            .attr("fill", (d: any) => String(getColor(d)))
            .on("mousemove", (d: any) => {
                d3.selectAll(".bar")
                    .attr("opacity", (model: any) => {
                        if (model.key === d)
                            return 1
                        else
                            return 0.4
                    })
            })
            .on("mouseout", () => {
                d3.selectAll(".bar").attr("opacity", 1)
            })
        labels.append("text")
            .attr("x", this.width - 14)
            .attr("y", 6.5)
            .attr("dy", "0.15em")
            .text((d: any) => d)
    }

    drawPlot() {
        let { nns, attr_names, selected } = this.state
        if (nns.length === 0) return
        let margin: number = 5,
            bar_a: number = 360 / attr_names.length,
            bar_w: number = 10
        this.width = (this.ref?this.ref.clientWidth:50)
        this.height = (this.ref?this.ref.clientHeight:30)
        this.r = this.height / 2 - 4 * margin
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
                <text textAnchor="middle" dy='-3' fontSize='7px' opacity='0.5'>
                    <textPath
                        xlinkHref={`#axis_${attr}`}
                        startOffset='50%'>
                    {attr}
                    </textPath>
                </text>
                
            </g>
        })

        return <svg width='100%' height='100%'>
            <g className='compareView'
            transform={`translate(${this.r + 6 * margin}, ${this.r + 4 * margin})`}>
            <circle r={this.r} fill='none' stroke='grey'></circle>
            {axis}               
            {bars}
            </g>
        </svg>

    }

    draw() {
        d3.select('.RadialBoxplot')
            .select('svg')
            .remove()
        let { nns, attr_names, selected } = this.state
        let margin: number = 5,
            bar_a: number = 360 / attr_names.length,
            bar_w: number = 10
        this.width = (this.ref?this.ref.clientWidth:50)
        this.height = (this.ref?this.ref.clientHeight:30)
        this.r = this.height / 2 - 4 * margin 
        let selected_nns = selected.map((name: string) =>nns.filter((nn) => nn.name == name)[0])

        let svg = d3.select('.RadialBoxplot').insert('svg')
            .attr('width', '100%')
            .attr('height', '100%')
        
        let g = svg.append('g')
            .attr('class', 'compareView')
            .attr('transform', 'translate(' + String(this.r + 6 * margin) + ',' + String(this.r + 4 * margin) +')')
        
        // Axis and Circle
        g.append('circle')
            .attr('r', this.r)
            .attr('fill', 'none')
            .attr('stroke', 'grey')
        var axis = g.append('g')
            .attr('id', 'axis')
            .selectAll('g')
            .data(attr_names)
            .enter().append('g')
        axis.append('path')
            .attr('key', (attr: string) => 'axis_' + attr)
            .attr('id', (attr: string) => 'axis_' + attr)
            .attr('d', (attr: string, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * i, bar_a * (i + 1) - margin))
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('stroke', 'grey')
            .attr('stroke-dasharray', '5, 5')
        axis.append('path')
            .attr('key', (attr: string) => 'axis_' + attr + '_start')
            .attr('d', (attr: string, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * i, bar_a * i + 0.5))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'grey')
        axis.append('path')
            .attr('key', (attr: string) => 'axis_' + attr + '_end')
            .attr('d', (attr: string, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * (i + 1) - margin - 1.5, bar_a * (i + 1) - margin))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'grey')
        axis.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', -3)
            .attr('font-size', '7px')
            .attr('opacity', 0.5)
            .insert('textPath')
            .attr('xlink:href', (attr: string) => '#axis_' + attr)
            .attr('startOffset', '50%')
            .text((attr: string) => attr)

        // Performances
        if (selected_nns.length > 0) {
            let marks = selected_nns.map((d: Dot, idx: number) => {
                return d.attr.map((attr: number, attr_i: number) => {
                    if (attr)
                        return {
                            name: d.name,
                            angle: ((bar_a * attr_i + (bar_a - margin) * attr / 100) - 90) * Math.PI / 180.0,
                            attr: attr,
                            attr_i: attr_i
                        }
                    else
                        return null
                })
            })
            marks = marks.reduce((prev, item) => prev.concat(item))
            let perf = []
            for (let mark of marks) {
                if (mark) perf.push(mark)
            }
            let tags = g.append('g')
                .attr('id', 'marks')
                .selectAll('g')
                .data(perf)
                .enter().append('g')
                .attr('transform', (d: any) => 'translate('  + (this.r + bar_w) * Math.cos(d.angle) + ',' + (this.r + bar_w) * Math.sin(d.angle) + ')')
            tags.append('circle')
                .attr('r', 3)
                .attr('fill', 'none')
                .attr('stroke', (d: any) => getColor(d.name))
        }

        // Nodes
        let that = this
        this.nodes = d3.select('.compareView')
            .selectAll('.dot')
            .attr('class', 'dot')
            .data(nns)
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
            //.attr('fill', (d) => '#666')
            .attr('fill', (d: Dot) => that.state.selected.indexOf(d.name) !== -1 ? getColor(d.name) : '#666')
            .attr('title', d => d.name)
            .on('click', function(d) {
                let selected_idx: number = that.state.selected.indexOf(d.name)
                console.log('aaaa', selected_idx)
                console.log(this)
                d3.select(this)
                    .attr('fill', (d: Dot) => selected_idx === -1 ? getColor(d.name) : '#666')
                    // .attr('r', (d) => selected_idx === -1 ? that.node_r * 1.3 : that.node_r)
                    .style('z-index', selected_idx === -1 ? 100 : 3)
                that.selectNode(d)
            })

        // simulation
        //     .nodes(nns)
        //     .force('collide', d3.forceCollide().strength(.5).radius(this.node_dist).iterations(3))
        //     .force('forceX', d3.forceX().strength(.1).x((d: Dot) => this.getForceX(d.attr)))
        //     .force("forceY", d3.forceY().strength(.1).y((d: Dot) => this.getForceY(d.attr)))
        //     .on('tick', ticked)
        // let nodes = this.nodes
        // function ticked() {
        //     nodes.attr('cx', (d: any) => d.x || 0)
        //         .attr('cy', (d: any) => d.y || 0)
        // }

        // Legend
        var legend = svg.append("g")
            .attr("id", "legend")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(this.state.selected)
            .enter().append("g")
            .attr("transform", (d: any, i: number) => "translate(-20," + (i * 15 + 20) + ")")
        legend.append("rect")
            .attr("class", (d: any) => "label")
            .attr("x", this.width - 9)
            .attr("width", 9)
            .attr("height", 9)
            .attr("fill", (d: any) => String(getColor(d)))
            .on("mousemove", (d: any) => {
                // d3.selectAll(".bar")
                //     .attr("opacity", (model: any) => {
                //         if (model.key === d)
                //             return 1
                //         else
                //             return 0.4
                //     })
            })
            .on("mouseout", () => {
                d3.selectAll(".bar").attr("opacity", 1)
            })
        legend.append("text")
            .attr("x", this.width - 14)
            .attr("y", 6.5)
            .attr("dy", "0.15em")
            .text((d: any) => d)

    }

    render() {
        return <div className="RadialBoxplot View ViewBottom" ref={(ref)=>{this.ref=ref}}>
            {/* {this.drawPlot()} */}
        </div>
    }

}