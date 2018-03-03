import * as React from "react"
import * as dagre from "dagre"
import { Transition } from "react-transition-group"
// import * as graphlib from "graphlib"
import "./Evolution.css"
import "./App.css"
import axios from "axios"
import * as d3 from "d3"
import { NN, NNLink, Node, GraphEdge, Point } from "../types"
import { getColor } from "../helper/index";
import { TreeSelect, Button, Dropdown, Menu, Tooltip} from "antd"
import moment from 'moment';
import NNNode from "./NNNode"
// const {TreeNode} = TreeSelect
export interface Props {
    arc: string,
    app: string,
    train: string,
    onSelect: (nns: string[]) => void
}

const appData = [
    {
        label: "all",
        key: "all",
        value: "1."
    }, {
        label: "non sequence data",
        key: "non sequence data",
        value: "1.1."
    }, {
        label: "sequence data",
        key: "sequence data",
        value: "1.2."
    }
]



export interface State {
    datum: NN[],
    nodes: Node[],
    edges: GraphEdge[],
    selectedNode: Node | undefined,
    h: number | undefined,
    w: number | undefined,
    appValue: "1.1." | "1.2.",
    // appData: any,
    topDoi: Node[],
    topParent: Node | undefined,
    topChild: Node | undefined
}

const nodeH = 20, nodeW = 100, margin=nodeW*0.5, labelL = 10,
    expandH = 150, expandW = 200,
    boxH = 10,
    labelFont = 12,
    textMargin = 20,
    r_api = 1, r_dist = -100, r_diff = 0.01 //factors for DOI calculation

// for the lablel fade in/out animiation 
const duration = 1000;

const defaultStyle = {
    transition: `opacity ${duration}ms ease-in-out`,
    opacity: 0
}

const transitionStyles = {
    entering: { opacity: 0 },
    entered: { opacity: 1 },
    exited: { opacity: 0 }
};



export default class Evolution extends React.Component<Props, State>{
    private updateEdge: boolean = true
    constructor(props: Props) {
        super(props)
        this.getData = this.getData.bind(this)
        this.selectNode = this.selectNode.bind(this)
        this.state = {
            datum: [],
            nodes: [],
            edges: [],
            selectedNode: undefined,
            w: 0,
            h: 0,
            appValue: "1.1.",
            // appData: [],
            topDoi: [],
            topChild: undefined,
            topParent: undefined
        }
    }
    async getData() {
        let res = await axios.get('../../data/evolution_dag.json'),
            datum: NN[] = res.data,
            { appValue } = this.state

        datum = datum.filter((d: NN) => d.application[0].startsWith(appValue))
        datum.forEach((d: NN) => {
            d.width = nodeW
            d.height = nodeH

            let pub_date = moment(d.date, 'YYYY-MM-DD'),
                dif = moment().diff(pub_date, "months")
            d.api = (d.citation / dif) || 0
        })
        let { nodes, edges, width: w, height: h, topDoi } = this.getDag(datum)

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


        this.setState({ nodes, edges, w, h, datum, topDoi })
    }
    getDag(datum: NN[], selectedNode: Node | undefined = undefined) {
        let selectedID = selectedNode ? selectedNode.ID : undefined
        let dag = new dagre.graphlib.Graph();
        dag.setGraph({
            ranksep: nodeW * 2,
            marginx: margin,
            marginy: margin,
            rankdir: 'LR',
            edgesep: nodeH,
            nodesep: nodeH * 2
            // ranker: "tight-tree"
            // ranker: "longest-path"
        });
        dag.setDefaultEdgeLabel(() => { return {}; });


        datum.forEach((node: NN) => {
            // let label = `${layer.name}:${layer.class_name}`
            let selected: boolean = (node.ID == selectedID)
            dag.setNode(node.ID,
                {
                    label: node.ID,
                    width: selected ? expandW : nodeW,
                    height: selected ? expandH : nodeH,
                    ID: node.ID,
                    api: node.api,
                    variants: node.variants
                }
            )
            //IR model or keras model
            if (node.parents.length > 0) {
                node.parents.forEach((parent: any) => {
                    dag.setEdge(
                        parent.ID,
                        node.ID,
                        {
                            label_s: parent.link_info_s,
                            label_l: parent.link_info_l,
                            from: parent.ID,
                            to: node.ID
                        }
                    )
                })
            }
        })




        // const getEdgeWeight = (e: dagre.Edge) => dag.node(e.v).api + dag.node(e.w).api
        // const getEdgeWeight = (e:dagre.Edge)=>1
        const getEI = (v: dagre.Edge) => 1
        let distanceDict: any
        if (selectedNode) {
            distanceDict = dagre.graphlib.alg
                .dijkstra(dag, selectedNode.label, (e) => 1, v => dag.nodeEdges(v))
        }
        // let tree = dagre.graphlib.alg.prim(dag, getEdgeWeight)
        // console.info(tree.edges)


        //calculate doi for each node
        dag.nodes().forEach((v) => {
            if (dag.node(v)) {
                let node: Node = dag.node(v),
                    distance = selectedNode ? distanceDict[v].distance : 0

                node.api_diff = Math.max(
                    node.api || 0,
                    Math.max(...(dag.neighbors(v) || []).map((neighbor: Node) => {
                        return r_diff * (neighbor.api || 0) / getEI({ v, w: neighbor.label })
                    }))
                )
                node.doi = node.api_diff + r_dist * distance
            }
        })
        dag.edges().forEach((e, i) => {
            let edge: GraphEdge = dag.edge(e)
            // edge.weight = getEdgeWeight(e)
        });

        //calculate the top N doi nodes, and update their size
        let topParent: Node | undefined = undefined
        let topChild: Node | undefined = undefined
        if (selectedNode) {
            let parents = dag.predecessors(selectedNode.label),
                children = dag.successors(selectedNode.label)
            if (parents && parents.length != 0) {
                topParent = parents.map(v => dag.node(v)).sort((a, b) => b.doi - a.doi)[0]
                dag.setNode(topParent.label, {
                    label: topParent.ID,
                    width: expandW,
                    height: expandH,
                    ID: topParent.ID,
                    api: topParent.api,
                    variants: topParent.variants
                })
            }
            if (children && children.length != 0) {
                topChild = children.map(v => dag.node(v)).sort((a, b) => b.doi - a.doi)[0]
                dag.setNode(topChild.label, {
                    label: topChild.ID,
                    width: expandW,
                    height: expandH,
                    ID: topChild.ID,
                    api: topChild.api,
                    variants: topChild.variants
                })
            }

        }

        const topN = (nodes: string[], n: number = 4) => {
            let topDoi: Node[] = []
            for (let i = 0; i < nodes.length; i++) {
                let v = nodes[i]
                let node = dag.node(v)
                //exclude topParent and topChild from topN
                if ((topChild && v == topChild.label)
                    || (topParent && v == topParent.label)
                    || (selectedNode && v == selectedNode.label)) {
                } else {
                    topDoi.push(node)
                }

                if (topDoi.length > n) {
                    topDoi.sort((a, b) => (b.doi || 0) - (a.doi || 0))
                    topDoi.pop()
                }
            }
            return topDoi
        }
        let topDoi: Node[] = topN(dag.nodes())


        //calculate layout
        dagre.layout(dag)

        let nodes: Node[] = [], edges: GraphEdge[] = [],
            height = dag.graph().height,
            width = dag.graph().width
        dag.nodes().forEach(v => {
            if (dag.node(v)) {
                nodes.push(dag.node(v))
            }
        }),
            dag.edges().forEach(e => {
                if (dag.node(e.v) && dag.node(e.w)) {
                    edges.push(dag.edge(e))
                }
            })

        console.info(height)
        return { nodes, edges, height, width, topDoi, topParent, topChild }
    }
    drawNodes(nodes: Node[]) {
        let { selectedNode, topDoi } = this.state,
            selectedID = selectedNode ? selectedNode.ID : undefined,
            apiArr = this.state.nodes.map(d => d.api || 0).sort(d3.ascending)

        return (<g className="nodes" >
            {nodes.map((node: Node) => {
                let selected: boolean = (node.ID === selectedID),
                    isTop: boolean = topDoi.map(d => d.ID).indexOf(node.ID) != -1,
                    zoomed:boolean = node.width>nodeW
                    

                return <NNNode 
                   node = {node}
                   selected={selected} 
                   isTop={isTop} 
                   zoomed={zoomed} 
                   apiArr={apiArr} 
                   selectNode={this.selectNode}/>
            })}
        </g>)
    }
    oneEdge(edge: GraphEdge, i: number) {
        let { points, from, to, label_s, label_l } = edge,
            { selectedNode } = this.state,
            selectedID = selectedNode ? selectedNode.label : undefined


        let len = points.length
        if (len == 0) { return }
        let start = `M ${points[0].x} ${points[0].y}`
        let vias = [];
        // // curve
        // for (let i = 0; i < len - 2; i += 2) {
        //     let cPath = [0, 1, 2].map(k => `${points[i + k].x} ${points[i + k].y}`)
        //     vias.push(`C ${cPath}`)

        // }
        // // straight
        // for (let i = 0; i < len; i ++) {

        //     vias.push(`L ${points[i].x} ${points[i].y}`)

        // }
        //refined curve
        const getInter = (p1: Point, p2: Point, n: number) => {
            return `${p1.x * n + p2.x * (1 - n)} ${p1.y * n + p2.y * (1 - n)}`
        }
        const getCurve = (points: Point[]) => {
            let vias = [], len = points.length
            const ratio = 0.5
            for (let i = 0; i < len - 2; i++) {
                let p1, p2, p3, p4, p5;
                if (i == 0) {
                    p1 = `${points[i].x} ${points[i].y}`
                } else {
                    p1 = getInter(points[i], points[i + 1], ratio)
                }
                p2 = getInter(points[i], points[i + 1], 1 - ratio)
                p3 = `${points[i + 1].x} ${points[i + 1].y}`
                p4 = getInter(points[i + 1], points[i + 2], ratio)
                if (i == len - 3) {
                    p5 = `${points[i + 2].x} ${points[i + 2].y}`
                } else {
                    p5 = getInter(points[i + 1], points[i + 2], 1 - ratio)
                }

                let cPath = `M ${p1} L${p2} Q${p3} ${p4} L${p5}`
                vias.push(cPath)

            }
            return vias
        }
        vias = getCurve(points)

        let pathData = `${start}  ${vias.join(' ')}`,
            //change curve path to straight line
            // let pathData = `M ${points[0].x} ${points[0].y} 
            //                 L ${points[points.length - 1].x} ${points[points.length - 1].y}`,
            highlight: boolean = ((from == selectedID) || (to == selectedID)),
            k = (points[points.length - 1].y - points[0].y) / (points[points.length - 1].x - points[0].x)
      
        return <g className='link' key={`${i}_${from}->${to}`}>
            <path
                id={`${from}->${to}`}
                strokeLinecap="round"
                d={pathData}
                stroke={highlight ? "gray" : "gray"}
                fill='none'
                strokeWidth={highlight ? 2 : 1}
                className="Edge"
            />

            <path
                id={`label_${from}->${to}`}
                opacity={0}
                d={pathData}
            />
            {/* a trick, two transition: one for fade in, one for fade out */}
            <Transition in={this.updateEdge} timeout={{ enter: duration, exit: 10 }}>
                {(status: 'entering' | 'entered' | 'exiting' | 'exited' | 'unmounted') => {
                    // console.info(status)
                    return <text className="link_info fadeIn"
                        textAnchor="middle"
                        style={{
                            fontSize: labelFont,
                            ...defaultStyle,
                            ...transitionStyles[status]
                        }}>
                        <textPath
                            xlinkHref={`#label_${from}->${to}`}
                            startOffset="50%"
                        >
                            {label_s}
                        </textPath>
                    </text>
                }}
            </Transition>

            <Transition in={!this.updateEdge} timeout={{ enter: duration, exit: 10 }}>
                {(status: 'entering' | 'entered' | 'exiting' | 'exited' | 'unmounted') => {
                    return <text className="link_info fadeIn"
                        textAnchor="middle"
                        style={{
                            fontSize: labelFont,
                            ...defaultStyle,
                            ...transitionStyles[status]
                        }}>
                        <textPath xlinkHref={`#label_${from}->${to}`}
                            startOffset="50%">
                            {label_s}
                        </textPath>
                    </text>
                }}
            </Transition>
            {/* mask over edge for better hover responsive */}
            <Tooltip title={label_l}>
                <path
                    strokeWidth={10}
                    // opacity={0}
                    stroke="transparent"
                    fill="none"
                    d={pathData}
                />
            </Tooltip>
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
    componentDidMount() {

        const zoomed = () => {
            svg.attr("transform", d3.event.transform);
        }
        let svg = d3.select('svg')
            .call(d3.zoom().on("zoom", zoomed));

    }
    onChange = (appValue: "1.1." | "1.2.") => {
        this.setState({ appValue });
        this.getData()
    }
    selectNode(selectedNode: Node) {
        let { datum } = this.state
        this.updateEdge = !this.updateEdge
        // datum.forEach((d: NN) => {
        //     if (nodeID == d.ID) {
        //         if (!d._width) {
        //             d._width = d.width
        //             d.width = 4*d._width
        //             d._height = d.height
        //             d.height = 3*d._width
        //             selectedNode = d
        //         } else {
        //             d.width = d._width
        //             d.height = d._height
        //             d._width = null
        //             d._height = null
        //             selectedNode = undefined
        //         }
        //     }
        // })
        let { nodes, edges, width: w, height: h, topChild, topParent, topDoi } = this.getDag(datum, selectedNode)
        this.setState({ nodes, edges, w, h, datum, selectedNode, topChild, topParent, topDoi })
    }
    render() {
        let { nodes, edges, w, h, appValue } = this.state
        // let screen_w = (window.innerWidth - 2 * margin) / 2
        // let screen_h = (window.innerHeight - HEADER_H - 2 * margin) / 2

        // let ratio = Math.min(screen_w/(w||1), screen_h/(h||1))
        let { train, arc } = this.props

        return <div className="Evolution View">
            {/* <div style={{ position: "absolute", left: "20px", top: "20px" }}>
                Training methods:{train}
            </div>
            <div style={{ position: "absolute", left: "20px", top: "40px" }}>
                Architecture:{arc}
            </div> */}
            <TreeSelect
                style={{ position: "absolute", width: 180, left: "20px", top: "20px", zIndex:100 }}
                value={appValue}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                //treeData = {this.state.appData}
                treeData={appData}
                placeholder="select your data type"
                //multiple
                treeDefaultExpandAll
                onChange={this.onChange}
            />

            <svg
                //alway show the whole dag
                width="100%" height="100%"
                viewBox={`0 0 ${w} ${h}`}
            //or show part and let the users pan and zoom
            // width={w} height={h}
            >

                {this.drawEdges(edges)}
                {this.drawNodes(nodes)}
            </svg>
        </div>
    }
}