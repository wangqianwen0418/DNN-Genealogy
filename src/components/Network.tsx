import * as React from "react";
import "./Graph.css";
import { IRNode } from "../types";
import * as dagre from 'dagre';
import { Node, Edge, GraphEdge } from 'dagre';
import { getColor } from "../helper";

// export interface Node {
//     class?:string
// }
const node_w: number = 110, node_h: number = 20, margin: number = 10;
export interface Props {
    nodes: IRNode[]
}
export interface State {
    x: number,
    y: number,
    scale: number,
    nodes: Node[],
    edges: GraphEdge[],
    h: number,
    w: number
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
            w: 0
        }
        this.shiftDown = false
    }
    getDag(IRnodes: IRNode[]) {

        const g = new dagre.graphlib.Graph();
        g.setGraph({ ranksep: 10, marginx: margin, marginy: margin, rankdir: "BT" });
        g.setDefaultEdgeLabel((edge: Edge) => { return {} });
        IRnodes.forEach((node: any) => {
            g.setNode(node.name, { label: node.name, width: node_w, height: node_h, op: node.op })
            if (node.input) {
                node.input.forEach((input: string) => {
                    g.setEdge(input, node.name)
                })
            }
        })
        dagre.layout(g)
        let nodes: Node[] = []
        let edges: GraphEdge[] = []
        g.nodes().forEach((v) => {
            if (g.node(v)) {
                nodes.push(g.node(v))
            }
        })
        g.edges().forEach((e) => {
            let edge: GraphEdge = g.edge(e)
            edge['from'] = e.v
            edge['to'] = e.w
            edges.push(edge)
        });
        let h = Number(g.graph().height),
            w = Number(g.graph().width)
        return { nodes, edges, h, w }
    }
    drawNodes(nodes: Node[]) {
        return (<g className="nodes" >
            {nodes.map((node: Node) => {
                return <g key={node.label} transform={`translate (${node.x - node_w / 2}, ${node.y - node_h / 2})`}>
                    <rect width={node_w} height={node_h}
                        style={{ fill: getColor(node.op), strokeWidth: 3 }} />
                    <text textAnchor="middle"
                        fontSize={node_h * 0.5}
                        x={node_w / 2}
                        y={node_h * 0.6}>
                        {node.label}
                    </text>
                </g>
            })}
        </g>)
    }
    oneEdge(edge: GraphEdge, i: number) {
        let { points, from, to } = edge
        let len = points.length
        if (len == 0) { return }
        let start = `M ${points[0].x} ${points[0].y}`
        let vias = [];
        for (let i = 0; i < len - 2; i += 2) {
            let cPath = [0, 1, 2].map(k => `${points[i + k].x} ${points[i + k].y}`)
            vias.push(`M ${points[i].x} ${points[i].y} C ${cPath}`)

        }
        let pathData = `${start}  ${vias.join(' ')}`
        return <g className='link' key={`${from}->${to}`}>
            <path
                key={`${edge.from}->${edge.to}`}
                d={pathData}
                stroke="yellow"
                fill='transparent'
                strokeWidth="3"
            // markerEnd="url(#arrow)" 
            />
            {/* <path
                key={`${edge.from}->${edge.to}_mask`}
                d={pathData}
                stroke="transparent"
                fill='transparent'
                strokeWidth="6" /> */}
        </g>

    }
    drawEdges(edges: GraphEdge[]) {
        return (<g className="edges">
            {edges.map((edge: GraphEdge, i: number) => {
                return this.oneEdge(edge, i)

            })}
        </g>)
    }
    scroll(e: any) {
        if (this.shiftDown) {
            this.zoom(e.deltaY)
        } else {
            let { y } = this.state
            this.setState({ y: y + e.deltaY })
        }
    }
    zoom(delta: number) {
        let { scale } = this.state
        scale *= (delta > 0 ? 1.1 : 0.9)
        this.setState({ scale })
    }
    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any) {
        if (this.props.nodes.length != nextProps.nodes.length) {
            let { nodes: IRnodes } = nextProps
            let { nodes, edges } = this.getDag(IRnodes)
            // let scale: number = Math.min((this.graphWindow.clientHeight - 2 * margin) / h, (this.graphWindow.clientWidth - 2 * margin) / w)
            // let x: number = margin + 0.5 * this.graphWindow.clientWidth - 0.5 * w
            // let y: number = margin
            this.setState({ nodes, edges })
        }
    }
    // componentWillUpdate() {
    //     if(this.first && this.props.nodes.length > 0){
    //         this.first = false
    //         let { h, w } = this.getDag(this.props.nodes)
    //         let svg_h = Math.max(h, this.graphWindow.clientHeight)
    //         let svg_w = Math.max(w, this.graphWindow.clientWidth)
    //         let scale: number = Math.min((this.graphWindow.clientHeight - 2 * margin) / svg_h, (this.graphWindow.clientWidth - 2 * margin) / svg_w)
    //         let x:number = margin + 0.5 * this.graphWindow.clientWidth - 0.5 * w
    //         let y:number = margin
    //         console.info(h, w)
    //         this.setState({x, y, scale})
    //     }
    // }
    render() {
        let { nodes, edges, x, y, scale } = this.state
        if (nodes.length > 0) {
            // let { nodes, edges} = this.getDag(IRnodes)
            // let svg_h = Math.max(h, this.graphWindow.clientHeight)
            // let svg_w = Math.max(w, this.graphWindow.clientWidth)
            // let svg_h = this.graphWindow.clientHeight
            // let svg_w = this.graphWindow.clientWidth
            return <g className="graph"
                transform={`translate(${x}, ${y}) scale(${scale})`}
            >
                {this.drawNodes(nodes)}
                {this.drawEdges(edges)}
            </g>
        } else {
            return <div className="graphWindow" ref={(ref) => { this.graphWindow = ref }} />
        }

    }
}