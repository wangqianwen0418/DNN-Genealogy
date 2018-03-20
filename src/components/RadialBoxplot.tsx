    import * as React from "react"
import "./RadialBoxplot.css"
import { getColor } from "../helper"
import * as d3 from "d3"
import { NN } from "../types"
import { nonsequenceBenchmarks, sequenceBenchmarks } from "../constants"

export interface Dot {
    [key: string]: any
}

export interface Network {
    dot: Dot[],
    network: string
}

export interface Props {
    database: string,
    nn: NN,
    op: number
}

export interface State {
    selected: string[],
    // nns: Dot[],
    nns: Network[],
    attr_names: any[],
}

let simulation = d3.forceSimulation()
    // .force("charge", d3.forceManyBody().strength(2))

export default class RadialBoxplot extends React.Component<Props, State> {
    public nodes: any; r : number; node_dist = 10
    private ref: HTMLDivElement|null; width: number; height: number
    constructor(props: Props) {
        super(props)
        this.arc = this.arc.bind(this)
        this.state = {
            selected: [],
            nns: [],
            attr_names: nonsequenceBenchmarks
        }
        this.selectNode = this.selectNode.bind(this)
        this.deleteNN = this.deleteNN.bind(this)
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
        let x: number = attr.map((d: number, idx: number) => (100-d) * Math.cos(Math.PI / len * idx)).reduce((a, b) => a + b, 0)
        return x
    }
    getForceY(attr: number[]) {
        let len = attr.length
        let y: number = attr.map((d: number, idx: number) => (100-d) * Math.sin(Math.PI / len * idx)).reduce((a, b) => a + b, 0)
        return y
    }

    polygon(r: number, edges: number) {
        var i = 0, angle = (360 / edges) * Math.PI / 180
        var points = ''
        if (r < 4) {
            r = 4
        } else if (r > 10) {
            r = 10
        }
        while (i < edges) {
           points += Math.cos(angle * i) * r + ',' + Math.sin(angle * i) * r + ' '
           i += 1
        }
        return points
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

    deleteNN(nn: Network) {
        let { selected, nns } = this.state
        let nn_idx = nns.indexOf(nn)
        for (let d of nn.dot) {
            var name_idx = selected.indexOf(d.name)
            selected.splice(name_idx, 1)
        }
        nns.splice(nn_idx, 1)
        this.setState({ selected, nns })
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.op !== 1 || this.props === nextProps)
            return
        this.updateData(nextProps.nn)
    }

    componentDidUpdate() {
        this.draw()
        
    }

    updateData(nn: NN) {
        let database = this.props.database, { nns, attr_names } = this.state
        if (database === 'nonsequence') {
            attr_names = nonsequenceBenchmarks
        } else {
            attr_names = sequenceBenchmarks
        }
        for (let existedNN of nns) {
            if (existedNN.network === nn.ID) return
        }
        let newdots: Dot[] = []
        for (let name of nn.names) {
            let tmpAttr: number[] = []
            for (let index in attr_names) {
                tmpAttr[index] = name[attr_names[index].dataset] ? name[attr_names[index].dataset] : 0
            }
            newdots.push({
                r: name.params,
                name: name.name,
                attr: tmpAttr,
                parent: nn.ID
            })
        }
        nns = nns.concat({
            network: nn.ID,
            dot: newdots
        })

        this.setState({ attr_names, nns })
        
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
        this.r = this.height / 2 - 6 * margin 
        let selected_nns = selected.map((name: string) => nns.filter((nn) => {
            for (let d of nn.dot)
                if (d.name == name) return true
            return false
        })[0].dot.filter((d) => d.name == name)[0])
        let networks = nns.map((nn: Network) => nn.network)

        let svg = d3.select('.RadialBoxplot').insert('svg')
            .attr('width', '100%')
            .attr('height', '100%')
        
        let g = svg.append('g')
            .attr('class', 'compareView')
            .attr('transform', 'translate(' + String(this.r + 6 * margin) + ',' + String(this.r + 6 * margin) +')')
        
        // Axis(include quartiles) and Circle
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
            .attr('key', (attr: any) => 'axis_' + attr.dataset)
            .attr('id', (attr: any) => 'axis_' + attr.dataset)
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * i, bar_a * (i + 1) - margin))
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('stroke', 'grey')
            .attr('stroke-dasharray', '5, 5')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_start')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * i, bar_a * i + 0.5))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'grey')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_end')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * (i + 1) - margin - 1.5, bar_a * (i + 1) - margin))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'grey')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_lowerQuartile')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2,
                 bar_a * i + (attr.lowerQuartile - attr.minimum) / attr.range * (bar_a - margin), bar_a * i + (attr.lowerQuartile - attr.minimum) / attr.range * (bar_a - margin) + 0.5))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'grey')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_median')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2,
                 bar_a * i + (attr.median- attr.minimum) / attr.range * (bar_a - margin) - 0.25, bar_a * i + (attr.median- attr.minimum) / attr.range * (bar_a - margin) + 0.25))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'grey')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_higherQuartile')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2,
                 bar_a * i + (attr.higherQuartile - attr.minimum) / attr.range * (bar_a - margin) - 0.5, bar_a * i + (attr.higherQuartile - attr.minimum) / attr.range * (bar_a - margin)))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'grey')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_upperbox')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w,
                 bar_a * i + (attr.lowerQuartile - attr.minimum) / attr.range * (bar_a - margin), bar_a * i + (attr.higherQuartile - attr.minimum) / attr.range * (bar_a - margin)))
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('stroke', 'grey')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_lowerbox')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin,
                 bar_a * i + (attr.lowerQuartile - attr.minimum) / attr.range * (bar_a - margin), bar_a * i + (attr.higherQuartile - attr.minimum) / attr.range * (bar_a - margin)))
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('stroke', 'grey')
        axis.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 12)
            .attr('font-size', '7px')
            .attr('opacity', 0.5)
            .insert('textPath')
            .attr('xlink:href', (attr: any) => '#axis_' + attr.dataset)
            .attr('startOffset', '50%')
            .text((attr: any) => attr.dataset)

        // Performances
        if (selected_nns.length > 0) {
            let marks = selected_nns.map((d: Dot, idx: number) => {
                return d.attr.map((attr: number, attr_i: number) => {
                    if (attr)
                        return {
                            name: d.name,
                            angle: bar_a * attr_i + (bar_a - margin) * (attr - nonsequenceBenchmarks[attr_i].minimum) / nonsequenceBenchmarks[attr_i].range
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
            tags.append('path')
                .attr('d', (d: any) => this.arc(0, 0, this.r + margin + bar_w / 2, d.angle - 0.5, d.angle + 0.5))
                .attr('fill', 'none')
                .attr('stroke-width', bar_w)
                .attr('stroke', (d: any) => getColor(d.name))
        }

        // Nodes
        let NNnodes :Dot[] = []
        for (let nn of nns) {
            NNnodes = NNnodes.concat(nn.dot)
        }
        let that = this
        this.nodes = d3.select('.compareView')
            .append('g')
            .attr('id', 'nodes')
            .selectAll('.dot')
            .attr('class', 'dot')
            .data(NNnodes)
            .enter().append('g')
            .append('polygon')
            .attr("transform", d=>`translate(${d.x}, ${d.y})`)
            .attr('fill', (d: Dot) => that.state.selected.indexOf(d.name) !== -1 ? getColor(d.name) : '#666')
            .attr('stroke-width', 1)
            .attr('points', (d :Dot) => this.polygon(Math.sqrt(d.r), networks.indexOf(d.parent) + 3))
            .on('click', function(d) {
                that.selectNode(d)
            })

        simulation = simulation
            .nodes(NNnodes)
            .force('collide',d3.forceCollide().strength(.5).radius((d:Dot)=>Math.sqrt(d.r)).iterations(10))
            // .force('forceX', d3.forceX().strength(.1).x((d: Dot) => this.getForceX(d.attr)))
            // .force("forceY", d3.forceY().strength(.1).y((d: Dot) => this.getForceY(d.attr)))
            .on('tick', ticked)
            
        let nodes = this.nodes
        function ticked() {
            nodes.attr("transform", (d:Dot)=>`translate(${d.x}, ${d.y})`)
        }
        simulation.alpha(1).restart()
        // for (let i = 0; i < 300; ++i) {
        //     console.info("tick")
        //     simulation.tick()
        // };

        // Legend
        var legend_nn = svg.append("g")
            .attr("id", "legend_nn")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(this.state.nns)
            .enter().append("g")
            .attr("transform", (d: Network, i: number) => "translate(-20," + (i * 15 + 20) + ")")
        legend_nn.append('g')
            .attr("transform", (d: Network, i: number) => "translate(" + (this.width - 5) + ", 5)")
            .append('polygon')
            .attr('fill', '#666')
            .attr('stroke-width', 1)
            .attr('points', (d :Network, idx: number) => this.polygon(5, idx + 3))
        legend_nn.append("text")
            .attr("x", this.width - 14)
            .attr("y", 6.5)
            .attr("dy", "0.15em")
            .text((d: Network) => d.network)
        legend_nn.append("text")
            .attr("x", this.width + 12)
            .attr("y", 6.5)
            .attr("dy", "0.15em")
            .attr('class', 'remove')
            .text("×")
            .on('click', (d: Network) => this.deleteNN(d))
        
        var legend_name = svg.append("g")
            .attr("id", "legend_name")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(selected_nns)
            .enter().append("g")
            .attr("transform", (d: Dot, i: number) => "translate(-20," + (this.height - i * 15 - 20) + ")")
        legend_name.append("rect")
             .attr("x", this.width - 9)
             .attr("width", 9)
             .attr("height", 9)
             .attr("fill", (d: Dot, idx: number) => String(getColor(d.name)))
        legend_name.append("text")
             .attr("x", this.width - 14)
             .attr("y", 6.5)
             .attr("dy", "0.15em")
             .text((d: Dot) => d.name)


    }

    render() {
        return <div className="RadialBoxplot View ViewBottom" ref={(ref)=>{this.ref=ref}}>
            {/* {this.drawPlot()} */}
        </div>
    }

}