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
            attr_names: [
                {dataset: 'SVHN'},
                {dataset: 'cifar10'}, 
                {dataset: 'cifar100'},
                {dataset: 'imageNet val top1'},
                {dataset: 'imagenet val top5'}
            ]
        }
        this.selectNode = this.selectNode.bind(this)
        this.deleteNN = this.deleteNN.bind(this)
        this.draw = this.draw.bind(this)        
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
        // return 0
        let len = attr.length
        let x: number = attr.map((d: number, idx: number) => (1-d/100) * Math.cos(2*Math.PI / (len+1) * (idx + .5) - Math.PI/2))
                            .reduce((a, b) => a + b, 0)
        return x*this.r/(len+1)
        // let x:number = attr.map((d:number, idx:number)=> this.polarToCartesian(0,0, this.r*0.8, 360/len*(idx+.5)).x)
        // .reduce((a, b) => a + b, 0)
        // return x/len
    }
    getForceY(attr: number[]) {
        // return 0
        let len = attr.length
        let y: number = attr.map((d: number, idx: number) => (1-d/100) * Math.sin( 2*Math.PI / (len+1) * (idx + .5) - Math.PI/2))
                            .reduce((a, b) => a + b, 0)
        return y*this.r/(len+1)
        // let len = attr.length
        // let y:number = attr.map((d:number, idx:number)=> this.polarToCartesian(0,0, this.r*0.8, 360/len*(idx+.5)).y)
        // .reduce((a, b) => a + b, 0)
        // return y/len
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
        return name_idx
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
        /*
        if (nextProps.op !== 1 || this.props === nextProps)
            return
        */

        if (nextProps.op !== 1 || this.props === nextProps || nextProps.nn.ID === '') {
            return
        }
        
        // do not update if rnn (hardcode)
        let ID = nextProps.nn.ID
        // console.log('ID =', ID)
        if (['SRN', 'attention', 'seq2seq', 'conv seq2seq', 'ESN', 'ESN with leaky units',
             'time skip connections','CW-RNN', 'leaky units', 'LSTM', 'GRU', 'recursive',
             'tree-LSTM', 'DGLSTM', 'BRNN', 'stacked RNN', 'DB-LSTM', 'DT-RNN', 'DT(S)-RNN'].indexOf(ID) >= 0) {
            return
        }
        // console.log(nextProps.nn)
        this.updateData(nextProps.nn)
    }

    componentDidUpdate() {
        this.draw()
    }

    componentDidMount() {
        window.addEventListener("resize", this.draw)
        this.draw()
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.draw)
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
                tmpAttr[index] = name[attr_names[index].dataset] ? name[attr_names[index].dataset] : 100
            }
            newdots.push({
                r: Math.min(Math.max(Math.sqrt(name.params), 4), 10),
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
            bar_w: number = 15
        this.width = (this.ref?this.ref.clientWidth:50)
        this.height = (this.ref?this.ref.clientHeight:30)
        this.r = this.height / 2 - bar_w - 2 - margin * 3
        let offsetX = this.r + 5 * margin + bar_w + 2,
            offsetY = this.r + 3 * margin + bar_w + 2
        let selected_nns = selected.map((name: string) => nns.filter((nn) => {
            for (let d of nn.dot)
                if (d.name == name) return true
            return false
        })[0].dot.filter((d) => d.name == name)[0])
        let networks = nns.map((nn: Network) => nn.network)
        let perf :any[] = []
        let noticing :Boolean = false
        
        let svg = d3.select('.RadialBoxplot').insert('svg')
            .attr('width', '100%')
            .attr('height', '100%')
        
        let g = svg.append('g')
            .attr('class', 'compareView')
            .attr('transform', 'translate(' + String(offsetX) + ',' + String(offsetY) +')')
        
        // Axis(include quartiles) and Circle
        g.append('circle')
            .attr('r', this.r)
            .attr('fill', 'none')
            .attr('stroke', 'black')
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
            .attr('stroke', 'black')
            .attr('stroke-dasharray', '5, 5')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_start')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * i, bar_a * i + 0.5))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'black')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_end')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2, bar_a * (i + 1) - margin, bar_a * (i + 1) - margin + 1))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'black')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_lowerQuartile')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2,
                 bar_a * i + (attr.lowerQuartile - attr.minimum) / attr.range * (bar_a - margin), bar_a * i + (attr.lowerQuartile - attr.minimum) / attr.range * (bar_a - margin) + 0.5))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'black')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_median')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2,
                 bar_a * i + (attr.median- attr.minimum) / attr.range * (bar_a - margin) - 0.25, bar_a * i + (attr.median- attr.minimum) / attr.range * (bar_a - margin) + 0.25))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'black')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_higherQuartile')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w / 2,
                 bar_a * i + (attr.higherQuartile - attr.minimum) / attr.range * (bar_a - margin) - 0.5, bar_a * i + (attr.higherQuartile - attr.minimum) / attr.range * (bar_a - margin)))
            .attr('fill', 'none')
            .attr('stroke-width', bar_w)
            .attr('stroke', 'black')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_upperbox')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin + bar_w,
                 bar_a * i + (attr.lowerQuartile - attr.minimum) / attr.range * (bar_a - margin), bar_a * i + (attr.higherQuartile - attr.minimum) / attr.range * (bar_a - margin)))
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('stroke', 'black')
        axis.append('path')
            .attr('key', (attr: any) => 'axis_' + attr.dataset + '_lowerbox')
            .attr('d', (attr: any, i: number) => this.arc(0, 0, this.r + margin,
                 bar_a * i + (attr.lowerQuartile - attr.minimum) / attr.range * (bar_a - margin), bar_a * i + (attr.higherQuartile - attr.minimum) / attr.range * (bar_a - margin)))
            .attr('fill', 'none')
            .attr('stroke-width', 1)
            .attr('stroke', 'black')
        axis.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', bar_w + 2)
            .attr('font-size', '7px')
            .attr('opacity', 0.5)
            .insert('textPath')
            .attr('xlink:href', (attr: any) => '#axis_' + attr.dataset)
            .attr('startOffset', '50%')
            .text((attr: any) => attr.dataset)

        // Performances
        if (nns.length > 0) {
            perf = nns.reduce((prev: any, nn: Network) => prev.concat(
                nn.dot.reduce((prev: any, d: Dot) => prev.concat(
                    d.attr.reduce((prev: any, attr: number, attr_i: number) => {
                        if (attr !== 100) {
                            return prev.concat({
                                name: d.name,
                                parent: d.parent,
                                angle: bar_a * attr_i + (bar_a - margin) * (attr - nonsequenceBenchmarks[attr_i].minimum) / nonsequenceBenchmarks[attr_i].range
                            })
                        } else {
                            return prev
                        }
                    }, [])
                ), [])
            ), [])

            let tags = g.append('g')
                .attr('id', 'marks')
                .selectAll('g')
                .data(perf)
                .enter().append('g')
            tags.append('path')
                .attr('class', (d: any) => 'mark_' + d.name)
                .attr('d', (d: any) => this.arc(0, 0, this.r + margin + bar_w / 2, d.angle - 0.5, d.angle + 0.5))
                .attr('fill', 'none')
                .attr('stroke-width', bar_w)
                .attr("stroke", (d: Dot) => getColor(d.parent))
        }

        // Nodes
        let NNnodes :Dot[] = []
        for (let nn of nns) {
            NNnodes = NNnodes.concat(nn.dot)
        }
        NNnodes = NNnodes.map((node:Dot)=>{
            return {
                ...node,
                x: this.getForceX(node.attr),
                y: this.getForceY(node.attr)
            }
        })
        let that = this

        this.nodes = d3.select('.compareView')
            .append('g')
            .attr('id', 'nodes')
            .selectAll('.dot')
            .attr('class', 'dot')
            .data(NNnodes)
            .enter().append('g')
            .attr("transform", d=>`translate(${d.x}, ${d.y})`)            
            //.append('polygon')
            //.attr('points', (d :Dot) => this.polygon(d.r, networks.indexOf(d.parent) + 3))            
            //.attr('stroke-width', 1)            
            .append('circle')
            .style('z-index', 10)
            .attr('id', (d: any) => 'bpnode_' + d.name)            
            .attr('r', (d: Dot) => d.r)
            .attr('fill', (d:Dot)=>getColor(d.parent))
            // .attr('fill', (d: Dot) => that.state.selected.indexOf(d.name) !== -1 ? getColor(d.name) : '#666')
            // .on('click', function(d) {
            //     that.selectNode(d)
            // })
            .on('mousemove', function(d) {
                let idx: number
                document.getElementsByClassName('edges')[0].setAttribute('style', 'opacity: 0.2;')
                let nnnodes = document.getElementsByClassName('NNNode')
                idx = 0
                while (idx < nnnodes.length) {
                    if (nnnodes[idx].id !== 'nnnode_' + d.parent)
                        nnnodes[idx].setAttribute('opacity', '0.2')
                    idx += 1
                }
                let exnodes = document.getElementsByClassName('ExtendNode')
                idx = 0
                while (idx < exnodes.length) {
                    if (exnodes[idx].id !== 'exnode_' + d.parent) {
                        if (exnodes[idx].classList.contains('zoomed'))
                            exnodes[idx].classList.add('faded')
                    }
                    idx += 1
                }
                noticeLines(d.name)
            })
            .on('mouseout', function(d) {
                let idx: number
                document.getElementsByClassName('edges')[0].setAttribute('style', 'opacity: 1;')
                let nnnodes = document.getElementsByClassName('NNNode')
                idx = 0
                while (idx < nnnodes.length) {
                    nnnodes[idx].setAttribute('opacity', '1')
                    idx += 1
                }
                let exnodes = document.getElementsByClassName('ExtendNode')
                idx = 0
                while (idx < exnodes.length) {
                    if (exnodes[idx].id !== 'exnode_' + d.parent) {
                        if (exnodes[idx].classList.contains('faded'))
                            exnodes[idx].classList.remove('faded')
                    }
                    idx += 1
                }
                noticing = false                
                d3.selectAll('.noticelines').remove()
            })

        function noticeLines(name: string) {
            if (!noticing) {
                noticing = true                    
                let attention = perf.filter((pf) => pf.name == name)
                d3.select('.RadialBoxplot').select('svg').append('g').attr('class', 'noticelines')
                    .selectAll('line')
                    .data(attention)
                    .enter().append('line')
                    .style('z-index', 1)
                    .attr('x1', d3.event.offsetX)
                    .attr('y1', d3.event.offsetY)
                    .attr('x2', (pf: any) => (that.r + margin)*(Math.cos((pf.angle - 90) * Math.PI / 180.0)) + offsetX)
                    .attr('y2', (pf: any) => (that.r + margin)*(Math.sin((pf.angle - 90) * Math.PI / 180.0)) + offsetY)
                    // .attr('stroke', getColor(name))
                    .attr("stroke", (d: Dot) => getColor(d.parent))
                    .attr('stroke-dasharray', '2, 2')
            }
        }

        simulation = simulation
            .nodes(NNnodes)
            .force('collide',d3.forceCollide().strength(.7).radius((d:Dot)=>d.r).iterations(5))
            // .force('forceX', d3.forceX().strength(.1).x((d: Dot) => this.getForceX(d.attr)))
            // .force("forceY", d3.forceY().strength(.1).y((d: Dot) => this.getForceY(d.attr)))
            .on('tick', ticked)
            
        let nodes = this.nodes
        function ticked() {
            nodes.attr("transform", (d:Dot)=>{
                if(d.x*d.x+d.y*d.y<that.r*that.r){
                    return `translate(${d.x}, ${d.y})`
                }else{
                    let k = d.y/d.x, theta = Math.atan(k) + (d.x>0?0:Math.PI)
                    return `translate(${that.r *0.8* Math.cos(theta)}, ${that.r *0.8* Math.sin(theta)})`
                }
                // return `translate(${d.x}, ${d.y})`
            })
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
            //.append('polygon')
            //.attr('points', (d :Network, idx: number) => this.polygon(5, idx + 3))
            //.attr('stroke-width', 1)
            .append('circle')
            .attr('r', 5)
            .attr('fill', (d: Network) => getColor(d.network))            
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
        
        // var legend_name = svg.append("g")
        //     .attr("id", "legend_name")
        //     .attr("font-family", "sans-serif")
        //     .attr("font-size", 10)
        //     .attr("text-anchor", "end")
        //     .selectAll("g")
        //     .data(selected_nns)
        //     .enter().append("g")
        //     .attr("transform", (d: Dot, i: number) => "translate(-20," + (this.height - i * 15 - 20) + ")")
        // legend_name.append("rect")
        //      .attr("x", this.width - 9)
        //      .attr("width", 9)
        //      .attr("height", 9)
        //      .attr("fill", (d: Dot) => getColor(d.parent))
        //     //  .attr("fill", (d: Dot, idx: number) => String(getColor(d.name)))
        // legend_name.append("text")
        //      .attr("x", this.width - 14)
        //      .attr("y", 6.5)
        //      .attr("dy", "0.15em")
        //      .text((d: Dot) => d.name)
    }

    render() {
        return <div className="RadialBoxplot View ViewBottom" ref={(ref)=>{this.ref=ref}}>
            {/* {this.drawPlot()} */}
        </div>
    }

}