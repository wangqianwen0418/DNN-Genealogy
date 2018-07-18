import * as React from 'react';
import './Network.css';
import { EvoNode } from 'types';
import * as dagre from 'lib/dagre';
import { Node, GraphEdge } from 'lib/@types/dagre';
import { getLayerColor } from 'helper';
import { color } from 'd3';
// import worker_script from '../worker';
// var myWorker = new Worker(worker_script);

// export interface Node {
//     class?:string
// }
const node_w: number = 110, margin: number = 10;
const nodeH = 40, nodeW = 200, expandMaxH = 200

export interface Props {
    nodes: EvoNode[],
    name: string,
    isReady:(mounted:boolean)=>void
}
export interface State {
    x: number,
    y: number,
    scale: number,
    nodes: Node[],
    edges: GraphEdge[],
    h: number,
    w: number,
    selectedLayers: any[]
}
export default class Network extends React.Component<Props, State> {
    public graphWindow: any; shiftDown: boolean
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
            selectedLayers: []
        }
        this.shiftDown = false
        this.selectLayer = this.selectLayer.bind(this)
        this.handleMouseWheel = this.handleMouseWheel.bind(this)
    }
    async getDag(layers: EvoNode[], selectedLayers: string[]) {
        return new Promise<{nodes:Node[]; edges:GraphEdge[];height:number;width:number;}>((resolve, reject)=>{
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
                let details = JSON.stringify(layer.config, null, 2)
                            .replace(/"/g, '').split('\n'), 
                    textLength = details.length * 12 + 30
                dag.setNode(layer.name, { 
                    label: layer.name,
                    width: layer.name.length*nodeH/4 + nodeH,
                    height: nodeH,
                    className: layer.class_name,
                    config: layer.config,
                    expand: false,
                    location: 0,
                    textLength: textLength,
                    details: details,
                })
                // IR model or keras model
                if (layer.inbound_nodes.length > 0) {
                    let inputs = layer.inbound_nodes[0]
                    inputs.forEach((input:string[]|any[]) => {
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
                    expand: true
                })
            })
    
            dagre.layout(dag)
            let nodes:Node[] = [], edges:GraphEdge[] = []
            dag.nodes().forEach((v:string) => {
                if (dag.node(v)) {
                    nodes.push(dag.node(v))
                }
            })
            dag.edges().forEach((e:string) => {    
                edges.push(dag.edge(e))
            });
            let height = dag.graph().height,
                width = dag.graph().width
                // console.log(nodes)        
            resolve({ nodes, edges, height, width });
        });
    }
    drawNodes(nodes: Node[]) {
        return (<g className="nodes" >
            {nodes.map((node: Node) => {
                
                return <g 
                        className="layers node"
                        id={`layer_${node.label}`}
                        key={`layer_${node.label}`}
                        transform={`translate (${node.x - node.width / 2}, ${node.y - node.height / 2})`}
                        onClick={() => this.selectLayer(node)}
                        onWheel={this.handleMouseWheel}
                        style={{ cursor: 'pointer'}}
                >
                    <rect 
                        width={node.width} 
                        height={node.height}
                        style={{ fill: getLayerColor(node.className), strokeWidth: 3 }} 
                    />
                    {node.expand ?
                        (<svg width={node.width} height={node.height}>
                        <g>
                            <text 
                                textAnchor="middle"
                                fill="white"
                                fontSize={nodeH/2}
                                x={node.width / 2}
                                y={nodeH/2}
                            >
                            {node.label}
                            </text>
                            <text 
                                textAnchor="middle"
                                fill="white"
                                fontSize={nodeH/2}
                                x={node.width / 2}
                                y={nodeH}
                            >
                                -----------------------------
                            </text>
                            {node.details.map((str:string, idx: number) => {
                                return <text 
                                    key={`${node.label}_config_line_${idx}`}
                                    textAnchor="left"
                                    fill="white"
                                    xmlSpace="preserve"
                                    fontSize={nodeH * .4}
                                    x={5}
                                    y={nodeH * .4 * idx + nodeH*1.2}
                                >
                                    {str}
                                </text>
                            })}
                            </g></svg>)
                        : <text 
                            textAnchor="middle"
                            fill="white"
                            fontSize={nodeH/2}
                            x={node.width / 2}
                            y={node.height * 0.6}
                        >
                            {node.label}
                        </text>}
                </g>
            })}
        </g>
        )
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
        let { nodes: EvoNodes } = this.props
        let { nodes, edges } = await this.getDag(EvoNodes, selectedLayers.map((l: any) => l.label))
        this.setState({ nodes, edges, selectedLayers })
    }
    handleMouseWheel(evt: React.WheelEvent<any>) {
        let g: any = evt.target
        while (!g.getAttribute('class') || g.getAttribute('class').indexOf('layers') === -1) {
            g = g.parentElement
        }
        let { selectedLayers }= this.state, 
            idx = this.state.selectedLayers
                    .map((l: any) => l.label).indexOf(g.id.substring(6))
        if (idx !== -1) {
            evt.preventDefault()
            g = g.children[1].firstChild
            var node = selectedLayers[idx]
            var location = node.location + evt.deltaY, offset: number
            if (location < 0) {
                location = 0
            }else if (node.height + location > node.textLength) {
                location = node.textLength - node.height
                 }
            g.setAttribute('transform', `translate (0, ${-location})`)
            selectedLayers[idx].location = location
            this.setState({ selectedLayers })
        }

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
        let { nodes: EvoNodes } = this.props
        let { nodes, edges } = await this.getDag(EvoNodes, []);
        this.setState({ nodes, edges })
        if(nodes.length>0){
            this.props.isReady(true)
        }
    }
    async componentWillReceiveProps(nextProps: Props) {
        if (nextProps.name !== this.props.name) {
            let { nodes: EvoNodes } = nextProps
            let { nodes, edges } = await this.getDag(EvoNodes, [])
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
        let svgWidth = Math.max.apply(null, nodes.map((node: Node) => node.x)) + 120,
            svgHeight = Math.max.apply(null, nodes.map((node: Node) => node.y)) + 120
        if (nodes.length > 0) {
            // let { nodes, edges} = this.getDag(EvoNodes)
            // let svg_h = Math.max(h, this.graphWindow.clientHeight)
            // let svg_w = Math.max(w, this.graphWindow.clientWidth)
            // let svg_h = this.graphWindow.clientHeight
            // let svg_w = this.graphWindow.clientWidth
            return (
            <div className="wrapped-graph">
                <svg
                    width={`${svgWidth}px`}
                    height={`${svgHeight}px`}
                >
                    <g
                        className="graph"
                        // transform={`translate(${x+40}, ${y}) scale(${scale})`}
                    >
                        {this.drawEdges(edges)}
                        {this.drawNodes(nodes)}
                    </g>
                </svg>
            </div>)
        } else {
            return <div className="graphWindow" ref={(ref) => { this.graphWindow = ref }} />
        }

    }
}
