import * as React from "react"
import * as dagre from "dagre"
import { Node, GraphEdge } from "dagre"
import "./Evolution.css"
import "./App.css"
import axios from "axios"
import * as d3 from "d3"
import { EvoNode, EvoLink, NN, NNLink } from "../types"
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
    datum: NN[],
    nodes: Node[],
    edges: GraphEdge[],
    selectedNode: NN | undefined,
    h: number | undefined,
    w: number | undefined,
    appValue: string | undefined,
    appData: any
}
const margin = 30, nodeH = 40, nodeW = 200
export default class Evolution extends React.Component<Props, State>{
    constructor(props: Props) {
        super(props)
        this.getData = this.getData.bind(this)
        this.state = {
            datum: [],
            nodes: [],
            edges: [],
            selectedNode: undefined,
            w: 0,
            h: 0,
            appValue: undefined,
            appData: []
        }
    }
    async getData() {
        let res = await axios.get('../../data/survey.json')
        let datum: NN[] = res.data
        datum = datum.filter((d: NN) => d.application[0] === "1.1.1.general recognition")
        datum.forEach((d: NN) => {
            d.width = nodeW
            d.height = nodeH
        })
        let { nodes, edges, width: w, height: h } = this.getDag(datum)

        // let appRes = await axios.get('../../data/taxonomy.json')
        // let appData = appRes.data.children[0]

        // const label = (d:any)=>{
        //     d.label = d.name
        //     d.value = d.name
        //     if(d.children){
        //         d.children.forEach(label)
        //     }
        // }

        // label(appData)
        let appData = [
            {
                label: "sequence data",
                value: "0-0"
            }, {
                label: "nonsequence data",
                value: "0-1"
            }
        ]

        this.setState({ nodes, edges, w, h, appData, datum })
    }
    getDag(datum: NN[]) {
        let g = new dagre.graphlib.Graph();
        g.setGraph({
            ranksep: nodeW * 1,
            marginx: margin,
            marginy: margin,
            rankdir: 'LR',
            edgesep: nodeH * 2,
            ranker: "tight-tree"
            // ranker: "longest-path"
        });
        g.setDefaultEdgeLabel(() => { return {}; });
        datum.forEach((node: NN) => {
            // let label = `${layer.name}:${layer.class_name}`
            g.setNode(node.ID, { label: node.ID, width: node.width, height: node.height })
            //IR model or keras model
            if (node.parents.length > 0) {
                node.parents.forEach((parent: any) => {
                    g.setEdge(parent.ID, node.ID, { label: parent.link_info })
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
                return <g key={node.label}
                    transform={`translate (${node.x - node.width / 2}, ${node.y - node.height / 2})`}
                    onClick={() => this.selectNode(node.label)}
                >
                    <text textAnchor="middle"
                        fontSize={0.8*nodeH}
                        x={node.width / 2}
                        y={0.9 * node.height}>
                        {node.label}
                    </text>
                    <rect width={node.width} height={node.height}
                    fill="transparent"
                    stroke="gray"
                    strokeWidth="2"
                    ></rect>
                    {node.width>250?<foreignObject>
                        <img src={`../../images/${node.label}.png`}
                                    height={node.height}
                                    width={node.width}
                                />
                    </foreignObject>:<g/>
                    }
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
        pathData = `M ${points[0].x} ${points[0].y} 
        L ${points[points.length-1].x} ${points[points.length-1].y}`
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
    onChange = (appValue: string) => {
        console.info('onchage', appValue)
        this.setState({ appValue });
    }
    selectNode(nodeID: string) {
        let { datum, selectedNode } = this.state
        datum.forEach((d: NN) => {
            if (nodeID == d.ID) {
                if (!d._width) {
                    d._width = d.width
                    d.width = 4*d._width
                    d._height = d.height
                    d.height = 3*d._width
                } else {
                    d.width = d._width
                    d.height = d._height
                    d._width = null
                    d._height = null
                }
            }
        })
        let { nodes, edges, width: w, height: h } = this.getDag(datum)
        this.setState({ nodes, edges, w, h, datum })
    }
    render() {
        let { nodes, edges, w, h, appValue } = this.state
        // let screen_w = (window.innerWidth - 2 * margin) / 2
        // let screen_h = (window.innerHeight - HEADER_H - 2 * margin) / 2

        // let ratio = Math.min(screen_w/(w||1), screen_h/(h||1))
        let { train, arc } = this.props
        return <div className="Evolution View">
            <div style={{ position: "absolute", left: "20px", top: "20px" }}>
                Training methods:{train}
            </div>
            <div style={{ position: "absolute", left: "20px", top: "40px" }}>
                Architecture:{arc}
            </div>
            <TreeSelect
                style={{ position: "absolute", width: 180, left: "20px", top: "60px" }}
                value={appValue}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                treeData={this.state.appData}
                placeholder="select your task"
                //multiple
                treeDefaultExpandAll
                onChange={this.onChange}
            />

            <svg width="100%" height="100%" 
            viewBox={`0 0 ${w} ${h}`}
            >
                
                {this.drawEdges(edges)}
                {this.drawNodes(nodes)}
            </svg>
        </div>
    }
}