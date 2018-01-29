import * as React from "react"
import * as dagre from "dagre"
import { Node, GraphEdge } from "dagre"
import "./Evolution.css"
import axios from "axios"
import * as d3 from "d3"
import { EvoNode, EvoLink } from "../types"
import { getColor } from "../helper/index";
import { Menu, Dropdown, Icon } from "antd"

export interface State {
    nodes: Node[],
    edges: GraphEdge[],
    h: number | undefined,
    w: number | undefined
}
const margin = 30
export default class Evolution extends React.Component<{}, State>{
    constructor(props: {}) {
        super(props)
        this.getData = this.getData.bind(this)
        this.state = {
            nodes: [],
            edges: [],
            w: 0,
            h: 0
        }
    }
    async getData() {
        let res = await axios.get("../../data/rnn_dev.json")
        let evoNodes: EvoNode[] = res.data
        let { nodes, edges, width: w, height: h } = this.getDag(evoNodes)
        this.setState({ nodes, edges, w, h })
    }
    getDag(evoNodes: EvoNode[]) {
        const nodeR = 20
        let g = new dagre.graphlib.Graph();
        g.setGraph({
            ranksep: nodeR * 15,
            marginx: margin,
            marginy: margin,
            rankdir: 'LR',
            edgesep: nodeR * 2
        });
        g.setDefaultEdgeLabel(() => { return {}; });
        evoNodes.forEach(node => {
            // let label = `${layer.name}:${layer.class_name}`
            g.setNode(node.name, { label: node.name, width: nodeR, height: nodeR })
            //IR model or keras model
            if (node.inputs.length > 0) {
                node.inputs.forEach((input: EvoLink) => {
                    g.setEdge(input.name, node.name, {label:input.link})
                })
            }
        })
        dagre.layout(g)
        let nodes: Node[] = [], edges: any[] = []
        g.nodes().forEach((v) => {
            if (g.node(v)) {
                nodes.push(g.node(v))
            }
        })
        g.edges().forEach((e, i) => {
            edges.push(g.edge(e))
        });
        let height = g.graph().height,
            width = g.graph().width
        return { nodes, edges, height, width }
    }
    drawNodes(nodes: Node[]) {
        return (<g className="nodes" >
            {nodes.map((node: Node) => {
                let pie=d3.pie()
                let arc=d3.arc()
                let pie2arc = (d: any) => {
                    let arc = d
                    arc.innerRadius=0
                    arc.outerRadius = 20
                    return arc
                }
                let arc_paths = pie([Math.random(),Math.random(), Math.random()]).map((pie)=>{
                    return arc(pie2arc(pie))
                })
                return <g key={node.label} transform={`translate (${node.x}, ${node.y})`}>

                    {/* <circle r={node.width/2}
                        style={{ fill: "transparent", strokeWidth: 3, stroke: "gray" }} /> */}
                    {arc_paths.map((d, i)=>{
                        return <path d={d||''} fill={getColor(i.toString(),1)} stroke="white" strokeWidth="3">
                        </path>
                    })}

                    <text textAnchor="middle"
                        // fontSize={node.height}
                        x={node.width / 2}
                        y={ 1.5*node.height }>
                        {node.label}
                    </text>
                </g>
            })}
        </g>)
    }
    oneEdge(edge: GraphEdge, i: number) {
        let { points, from, to, label } = edge
        let len = points.length
        if (len == 0) { return }
        let start = `M ${points[0].x} ${points[0].y}`
        let vias = [];
        for (let i = 0; i < len - 2; i += 2) {
            let cPath = [0, 1, 2].map(k => `${points[i + k].x} ${points[i + k].y}`)
            vias.push(`M ${points[i].x} ${points[i].y} C ${cPath}`)

        }
        let pathData = `${start}  ${vias.join(' ')}`
        return <g className='link' key={`${i}_${from}->${to}`}>
            <path
                d={pathData}
                stroke="gray"
                fill='none'
                strokeWidth="2"
            >
            <title>
                {label}
            </title>
            </path>
        </g>

    }
    drawEdges(edges: GraphEdge[]) {
        return (<g className="edges">
            {edges.map((edge: GraphEdge, i: number) => {
                return this.oneEdge(edge, i)

            })}
        </g>)
    }
    componentWillMount() {
        this.getData()
    }
    render() {
        let { nodes, edges, w, h} = this.state
        let headerHeight = 64
        let screen_w = (window.innerWidth - 2 * margin) / 2
        let screen_h = (window.innerHeight - headerHeight - 2 * margin) / 2
        let menu = (
            <Menu>
              <Menu.Item key="1">1st menu item</Menu.Item>
              <Menu.Item key="2">2nd memu item</Menu.Item>
              <Menu.Item key="3">3rd menu item</Menu.Item>
            </Menu>
          )
        // let ratio = Math.min(screen_w/(w||1), screen_h/(h||1))
        return <div className="Evolution">
            <div style={{position: "absolute", left: "10px"}}>
                Title
            </div>
            <Dropdown overlay={menu} trigger={['hover']}>
                <a className="ant-dropdown-link" href="#" style={{position: "absolute", right: "10px"}}>
                    Hover me <Icon type="down" />
                </a>
            </Dropdown>
            <svg width={screen_w} height={screen_h} viewBox={`0 0 ${w} ${h}`}>
                {this.drawEdges(edges)}
                {this.drawNodes(nodes)}
            </svg>
        </div>
    }
}