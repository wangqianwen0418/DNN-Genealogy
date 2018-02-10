import * as React from "react"
import * as dagre from "dagre"
import { Node, GraphEdge } from "dagre"
import "./Evolution.css"
import "./App.css"
import axios from "axios"
import * as d3 from "d3"
import { EvoNode, EvoLink } from "../types"
import { getColor } from "../helper/index";
import { TreeSelect } from "antd"
// const {TreeNode} = TreeSelect
export interface Props {
    arc: string,
    app: string,
    train: string,
    onSelect: (nns: string[]) => void
}

// const appData = [{
//     label: 'Node1',
//     value: '0-0',
//     key: '0-0',
//     children: [{
//       label: 'Child Node1',
//       value: '0-0-1',
//       key: '0-0-1',
//     }, {
//       label: 'Child Node2',
//       value: '0-0-2',
//       key: '0-0-2',
//     }],
//   }, {
//     label: 'Node2',
//     value: '0-1',
//     key: '0-1',
//   }];

export interface State {
    nodes: Node[],
    edges: GraphEdge[],
    h: number | undefined,
    w: number | undefined,
    appValue:string|undefined,
    appData:any
}
const margin = 30
export default class Evolution extends React.Component<Props, State>{
    constructor(props: Props) {
        super(props)
        this.getData = this.getData.bind(this)
        this.state = {
            nodes: [],
            edges: [],
            w: 0,
            h: 0,
            appValue:undefined,
            appData:[]
        }
    }
    async getData() {
        let res = await axios.get("../../data/rnn_dev.json")
        let evoNodes: EvoNode[] = res.data
        let { nodes, edges, width: w, height: h } = this.getDag(evoNodes)

        let appRes = await axios.get('../../data/taxonomy.json')
        let appData = appRes.data.children[0]

        const label = (d:any)=>{
            d.label = d.name
            d.value = d.name
            if(d.children){
                d.children.forEach(label)
            }
        }
        
        label(appData)
        this.setState({ nodes, edges, w, h })

        this.setState({ nodes, edges, w, h, appData })
    }
    getDag(evoNodes: EvoNode[]) {
        const nodeR = 20
        let g = new dagre.graphlib.Graph();
        g.setGraph({
            ranksep: nodeR * 15,
            marginx: margin,
            marginy: margin,
            rankdir: 'LR',
            edgesep: nodeR * 2,
            ranker: "tight-tree"
        });
        g.setDefaultEdgeLabel(() => { return {}; });
        evoNodes.forEach(node => {
            // let label = `${layer.name}:${layer.class_name}`
            g.setNode(node.name, { label: node.name, width: nodeR, height: nodeR })
            //IR model or keras model
            if (node.inputs.length > 0) {
                node.inputs.forEach((input: EvoLink) => {
                    g.setEdge(input.name, node.name, { label: input.link })
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
                let pie = d3.pie()
                let arc = d3.arc()
                let pie2arc = (d: any) => {
                    let arc = d
                    arc.innerRadius = 0
                    arc.outerRadius = 20
                    return arc
                }
                let arc_paths = pie([Math.random(), Math.random(), Math.random()]).map((pie) => {
                    return arc(pie2arc(pie))
                })
                return <g key={node.label} transform={`translate (${node.x}, ${node.y})`}>

                    {/* <circle r={node.width/2}
                        style={{ fill: "transparent", strokeWidth: 3, stroke: "gray" }} /> */}
                    {arc_paths.map((d, i) => {
                        return <path d={d || ''} fill={getColor(i.toString(), 1)} stroke="white" strokeWidth="3">
                        </path>
                    })}

                    <text textAnchor="middle"
                        // fontSize={node.height}
                        x={node.width / 2}
                        y={1.5 * node.height}>
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
    onChange = (appValue:string) => {
        console.info('onchage', appValue)
        this.setState({ appValue });
      }
    render() {
        let { nodes, edges, w, h, appValue } = this.state
        // let screen_w = (window.innerWidth - 2 * margin) / 2
        // let screen_h = (window.innerHeight - HEADER_H - 2 * margin) / 2

        // let ratio = Math.min(screen_w/(w||1), screen_h/(h||1))
        let { train, arc } = this.props
        return <div className="Evolution View">
            <div style={{ position: "absolute", left: "20px", top:"20px" }}>
                Training methods:{train}
            </div>
            <div style={{ position: "absolute", left: "20px", top:"40px" }}>
                Architecture:{arc}
            </div>
            <TreeSelect
                style={{ position: "absolute", width: 250, left: "20px", top:"60px" }}
                value={appValue}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                treeData={this.state.appData}
                placeholder="select your task" 
                multiple
                treeDefaultExpandAll
                onChange={this.onChange}
            />
            
            <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
                {this.drawEdges(edges)}
                {this.drawNodes(nodes)}
            </svg>
        </div>
    }
}