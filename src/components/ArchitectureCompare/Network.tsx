import * as React from 'react';
import './Network.css';
import { EvoNode } from 'types';
import * as dagre from 'lib/dagre.js';
import { Node, GraphEdge } from 'lib/@types/dagre';
import { getLayerColor } from 'helper';
import * as d3 from 'd3';

const node_w: number = 110, margin: number = 10;
const nodeH = 40, nodeW = 200, expandMaxH = 200, dotBox = 20, dotRadius = 7.5

export interface Props {
    nodes: EvoNode[],
    params: {},
    name: string,
    isReady: (mounted: boolean) => void
}
export interface State {
    x: number,
    y: number,
    scale: number,
    nodes: Node[],
    edges: GraphEdge[],
    h: number,
    w: number,
    selectedLayers: any[],
}
export default class Network extends React.Component<Props, State> {
    public graphWindow: any; shiftDown: boolean; isMountedZoom: boolean = false; rand: string;
    constructor(props: Props) {
        super(props)
        this.state = {
            x: 1,
            y: 1,
            scale: 1,
            nodes: [],
            edges: [],
            h: 0,
            w: 0,
            selectedLayers: [],
        }
        this.shiftDown = false
        this.selectLayer = this.selectLayer.bind(this)
        this.handleMouseWheel = this.handleMouseWheel.bind(this)
        this.handleZoom = this.handleZoom.bind(this)
    }
    async getDag(layers: EvoNode[], params: object, selectedLayers: string[]) {
        return new Promise<{ nodes: Node[]; edges: GraphEdge[]; height: number; width: number; }>((resolve, reject) => {
            let dag = new dagre.graphlib.Graph();
            dag.setGraph({
                ranksep: nodeH * .6,
                marginx: margin,
                marginy: margin,
                rankdir: 'TB',
                edgesep: node_w * 0.02
            });
            dag.setDefaultEdgeLabel(() => { return {}; });
            layers.forEach(layer => {
                let lines = JSON.stringify(
                    layer.config, (
                        k, v) => Array.isArray(v) ? JSON.stringify(v) : v, // keep array in one line
                    2
                )
                    .replace(/"/g, '').split('\n'),
                    textLength = 120,
                    textWidth = Math.max(...lines.map(d => d.length)) * 6,
                    nodeExpand = false
                let details = lines.slice(1, lines.length-1) // remove the start and end bracket
                var dotsWidth: number = (
                    params[layer.name] ?
                        Math.trunc(Math.trunc(Math.log(params[layer.name]) / Math.log(10) + 1) / 2 + 1)
                        : 0
                ) * dotBox
                let nodeWidth = layer.name.length * nodeH / 3 + nodeH + dotsWidth
                dag.setNode(layer.name, {
                    label: layer.name,
                    // width: layer.name.length*nodeH/3 + nodeH + dotsWidth,
                    width: nodeWidth,
                    dotsWidth: dotsWidth,
                    textWidth: textWidth,
                    height: nodeH,
                    className: layer.class_name,
                    config: layer.config,
                    expand: nodeExpand,
                    location: 0,
                    textLength: textLength,
                    details,
                    params: params[layer.name]
                })
                // IR model or keras model
                if (layer.inbound_nodes.length > 0) {
                    let inputs = layer.inbound_nodes[0]
                    inputs.forEach((input: string[] | any[]) => {
                        dag.setEdge(input[0], layer.name)
                    })
                }
            })

            // Selected Layers
            selectedLayers.forEach(layer => {
                let node = dag.node(layer)
                dag.setNode(layer, {
                    ...node,
                    height: node.textLength > expandMaxH ? expandMaxH : node.textLength,
                    width: (node.textWidth + node.dotsWidth),
                    expand: true
                })
            })

            dagre.layout(dag)
            let nodes: Node[] = [], edges: GraphEdge[] = []
            dag.nodes().forEach((v: string) => {
                if (dag.node(v)) {
                    nodes.push(dag.node(v))
                }
            })
            dag.edges().forEach((e: string) => {
                edges.push(dag.edge(e))
            });
            let height = dag.graph().height,
                width = dag.graph().width
            // console.log(nodes)        
            resolve({ nodes, edges, height, width });
        });
    }
    drawNodes(nodes: Node[]) {
        let that = this
        return (<g className="nodes" >
            {nodes.map((node: Node) => {
                var dots: number = node.params ? Math.log(node.params) / Math.log(10) + 1 : 0, dotsPosition = [],
                    labelWidth = node.width - node.dotsWidth
                for (var i = 0; i < dots; ++i) {
                    dotsPosition.push({
                        x: labelWidth + (Math.trunc(i / 2) + 0.5) * dotBox,
                        y: ((i % 2) + 0.5) * dotBox
                    })
                }
                return <g
                    className="layers node"
                    id={`layer_${node.label}`}
                    key={`layer_${node.label}`}
                    transform={`translate (${node.x - node.width / 2}, ${node.y - node.height / 2})`}
                    onClick={() => this.selectLayer(node)}
                    onWheel={this.handleMouseWheel}
                    style={{ cursor: 'pointer' }}
                >

                    {dotsPosition.map(
                        (pos, i) => <circle
                            key={node.name + '_dot_' + i}
                            className="param-dot"
                            r={dotRadius}
                            cx={pos.x}
                            cy={pos.y}
                            fill="grey"
                        />
                    )}
                    {
                        node.expand ? <text
                            className="param-number2"
                            textAnchor="middle"
                            x={node.dotsWidth / 2 + labelWidth + 5}
                            y={nodeH * 1.6}
                            fontSize={nodeH / 2}
                            fill="grey"
                        >
                            {node.params.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </text> : null
                    }
                    {node.params ?
                        <text
                            className="param-number"
                            textAnchor="middle"
                            x={node.dotsWidth / 2 + labelWidth+5}
                            y={nodeH * 0.6}
                            fontSize={nodeH / 2}
                            fill="grey"
                            style={{ display: 'none' }}
                        >
                            {node.params.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </text>
                        : null}
                    <rect
                        x={labelWidth}
                        width={node.dotsWidth}
                        height={node.height}
                        opacity="0"
                        style={{ fill: 'white' }}
                        onMouseEnter={function () {
                            d3.selectAll('.param-dot').style('display', 'none')
                            d3.selectAll('.param-number').style('display', 'block')
                            d3.selectAll('.param-number2').style('display', 'none')
                        }}
                        onMouseOut={function () {
                            d3.selectAll('.param-dot').style('display', 'block')
                            d3.selectAll('.param-number').style('display', 'none')
                            d3.selectAll('.param-number2').style('display', 'block')
                        }}
                    />

                    <rect
                        width={labelWidth}
                        height={node.height}
                        style={{ fill: getLayerColor(node.className), strokeWidth: 3 }}
                    />

                    {node.expand ?
                        (<foreignObject>
                            <div
                                style={{
                                    width: node.textWidth,
                                    height: node.height,
                                    transform: `translate (${node.x - node.width / 2}, ${node.y - node.height / 2})`
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        textAlign: 'center',
                                        color: 'white',
                                        fontSize: nodeH / 2,
                                    }}
                                    className="nodeHeader"
                                >
                                    {node.label}
                                </div>
                                <div
                                    className="nodeDetails"
                                    style={{
                                        width: node.textWidth, height: node.height - nodeH,
                                        transform: `translate (${node.x - node.width / 2}, 
                                            ${node.y - node.height / 2})`,
                                        overflowY: 'scroll',
                                        overflowX: 'hidden'
                                    }}
                                >
                                    {node.details.map((info:string, lineIdx:number) => {
                                        return (<p
                                            key={'node_details_'+lineIdx}
                                            style={{
                                                position: 'relative',
                                                left: 5,
                                                color: 'white',
                                                fontSize: nodeH * .4,
                                                textAlign: 'left'
                                            }}
                                        >
                                            {info}
                                        </p>)

                                    })}
                                </div>
                            </div>
                        </foreignObject>)
                        : <text
                            textAnchor="middle"
                            fill="white"
                            fontSize={nodeH / 2}
                            x={labelWidth / 2}
                            y={node.height * 0.6}
                        >
                            {node.label}
                        </text>}
                </g>
            })}
        </g>)
    }
    oneEdge(edge: GraphEdge, i: number) {
        let { points, from, to } = edge
        let len = points.length
        if (len === 0) { return }
        let start = `M ${points[0].x} ${points[0].y}`
        let vias = [];
        for (let i = 0; i < len - 2; i += 2) {
            let cPath = [0, 1, 2].map(k => `${points[i + k].x} ${points[i + k].y}`)
            vias.push(`M ${points[i].x} ${points[i].y} C ${cPath}`)

        }
        let pathData = `${start}  ${vias.join(' ')}`
        return (
            <g
                className="link"
                key={`${i}_${from}->${to}`}
            >
                <path
                    d={pathData}
                    stroke="gray"
                    fill="none"
                    strokeWidth="2"
                // markerEnd="url(#arrow)" 
                />
                {/* <path
                key={`${edge.from}->${edge.to}_mask`}
                d={pathData}
                stroke="transparent"
                fill='transparent'
                strokeWidth="6" /> */}
            </g>
        )

    }
    drawEdges(edges: GraphEdge[]) {
        return (
            <g className="edges">
                {edges.map((edge: GraphEdge, i: number) => {
                    return this.oneEdge(edge, i)
                })}
            </g>)
    }
    // scroll(e: any) {
    //     if (this.shiftDown) {
    //         this.zoom(e.deltaY)
    //     } else {
    //         let { y } = this.state
    //         this.setState({ y: y + e.deltaY })
    //     }
    // }
    // zoom(delta: number) {
    //     let { scale } = this.state
    //     scale *= (delta > 0 ? 1.1 : 0.9)
    //     this.setState({ scale })
    // }

    async selectLayer(layer: Node) {
        let { selectedLayers } = this.state,
            idx = selectedLayers.map((l: any) => l.label).indexOf(layer.label)
        if (idx === -1) {
            selectedLayers.push({
                ...layer,
                height: layer.textLength > expandMaxH ? expandMaxH : layer.textLength
            })
        } else {
            selectedLayers.splice(idx, 1)
        }
        let { nodes: EvoNodes, params } = this.props
        let { nodes, edges } = await this.getDag(EvoNodes, params, selectedLayers.map((l: any) => l.label))
        this.setState({ nodes, edges, selectedLayers })
    }
    handleMouseWheel(evt: React.WheelEvent<any>) {
        let g: any = evt.target
        while (!g.getAttribute('class') || g.getAttribute('class').indexOf('layers') === -1) {
            g = g.parentElement
        }
        let { selectedLayers } = this.state,
            idx = this.state.selectedLayers
                .map((l: any) => l.label).indexOf(g.id.substring(6))
        if (idx !== -1) {
            evt.preventDefault()
            g = g.children[1].firstChild
            var node = selectedLayers[idx]
            var location = node.location + evt.deltaY, offset: number
            if (location < 0) {
                location = 0
            } else if (node.height + location > node.textLength) {
                location = node.textLength - node.height
            }
            g.setAttribute('transform', `translate (0, ${-location})`)
            selectedLayers[idx].location = location
            this.setState({ selectedLayers })
        }

    }
    handleZoom() {
        if (this.isMountedZoom) {
            return
        }
        var svg = d3.select('#' + this.rand + ' svg'),
            g = svg.select('.graph')
        if (svg.empty()) {
            return
        }
        var trans = svg.select('#layer_input_1').attr('transform'),
            rectWidth = svg.select('#layer_input_1').select('rect').attr('width'),
            offset = Number(trans.substring(11, trans.indexOf(','))) + Number(rectWidth) / 2
        svg.select('.graph-offset')
            .attr('transform', 'translate(' + (window.innerWidth * 0.35 / 2 - offset) + ', 0)')
        svg.select('.zoom-rect')
            .remove()
        var zoom = d3.zoom()
            .scaleExtent([0.001, 4])
            .on('zoom', zoomed)
        function zoomed() {
            g.attr('transform', d3.event.transform)
        }
        svg.insert('rect', 'g')
            .attr('width', window.innerWidth * 0.35)
            .attr('height', window.innerHeight * 0.65)
            .attr('class', 'zoom-rect')
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .call(zoom)
        this.isMountedZoom = true
    }
    async componentDidMount() {
        /*if (this.props.nodes.length !== nextProps.nodes.length) {
            let { nodes: EvoNodes } = nextProps
            let { nodes, edges } = this.getDag(EvoNodes)
            // let scale: number = Math.min(
                (this.graphWindow.clientHeight - 2 * margin) / h, 
                (this.graphWindow.clientWidth - 2 * margin) / w
            )
            // let x: number = margin + 0.5 * this.graphWindow.clientWidth - 0.5 * w
            // let y: number = margin
            this.setState({ nodes, edges })
        }*/

        let { nodes: EvoNodes, params } = this.props
        let { nodes, edges } = await this.getDag(EvoNodes, params, []);
        this.setState({ nodes, edges })
        if (nodes.length > 0) {
            this.props.isReady(true)
        }
        // let { nodes: EvoNodes } = this.props
        // let that = this
        // this.getDag(EvoNodes, []).then(function(response) {
        //     that.setState({
        //         nodes: response.nodes,
        //         edges: response.edges
        //     })
        //     if (response.nodes.length > 0)
        //         that.props.isReady(true)
        // })
    }
    componentDidUpdate() {
        this.handleZoom()
    }
    async componentWillReceiveProps(nextProps: Props) {
        if (nextProps.name !== this.props.name) {
            this.isMountedZoom = false
            let { nodes: EvoNodes, params } = nextProps
            let { nodes, edges } = await this.getDag(EvoNodes, params, [])
            this.setState({ nodes, edges })
        }
    }
    // componentWillUpdate() {
    //     if(this.first && this.props.nodes.length > 0){
    //         this.first = false
    //         let { h, w } = this.getDag(this.props.nodes)
    //         let svg_h = Math.max(h, this.graphWindow.clientHeight)
    //         let svg_w = Math.max(w, this.graphWindow.clientWidth)
    //         let scale: number = Math.min(
    //     (this.graphWindow.clientHeight - 2 * margin) / svg_h, 
    //     (this.graphWindow.clientWidth - 2 * margin) / svg_w
    // )
    //         let x:number = margin + 0.5 * this.graphWindow.clientWidth - 0.5 * w
    //         let y:number = margin
    //         console.info(h, w)
    //         this.setState({x, y, scale})
    //     }
    // }
    render() {
        let { nodes, edges, x, y, scale } = this.state
        // let svgWidth = Math.max.apply(null, nodes.map((node: Node) => node.x)) + 120,
        // svgHeight = Math.max.apply(null, nodes.map((node: Node) => node.y)) + 120
        let svgWidth = window.innerWidth * 0.35,
            svgHeight = window.innerHeight * 0.65

        function randomString(length: number, chars: string) {
            var result = '';
            for (var i = length; i > 0; --i) { result += chars[Math.floor(Math.random() * chars.length)]; }
            return result;
        }
        this.rand = randomString(8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')

        if (nodes.length > 0) {
            // let { nodes, edges} = this.getDag(EvoNodes)
            // let svg_h = Math.max(h, this.graphWindow.clientHeight)
            // let svg_w = Math.max(w, this.graphWindow.clientWidth)
            // let svg_h = this.graphWindow.clientHeight
            // let svg_w = this.graphWindow.clientWidth
            return (
                <div className="wrapped-graph" id={this.rand}>
                    <svg
                        width={`${svgWidth}px`}
                        height={`${svgHeight}px`}
                    >
                        <g className="graph-offset">
                            <g
                                className="graph"
                            // transform={`translate(${x+40}, ${y}) scale(${scale})`}
                            // transform={`translate(${svgWidth / 2 - Math.max.apply(null, nodes.map((node: Node) => node.x)) / 2 - 60}, 0)`}
                            >
                                {this.drawEdges(edges)}
                                {this.drawNodes(nodes)}
                            </g>
                        </g>
                    </svg>
                </div>)
        } else {
            return (<div className="graphWindow" ref={(ref) => { this.graphWindow = ref }}>
                <div className="loader" />
            </div>)
        }

    }
}
