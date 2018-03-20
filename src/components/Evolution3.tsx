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
import { TreeSelect, Button, Dropdown, Menu, Tooltip, Switch } from "antd"
import moment from 'moment';
import NNNode from "./NNNode";
import Legend, { LegendProps } from "./Legend";
import ExtendNode from "./ExtendNode";
import { showDetailedStructure } from './ImageModel'
import { nonsequenceDatasets, nonsequenceBenchmarks } from "../constants";

// const {TreeNode} = TreeSelect

export interface Props {
    arc: string,
    app: string,
    train: string,
    onSelectNN: (nn: NN) => void,
    onSelectNNMotion: (op: number) => void,
    onSelectDatabase: (db: string) => void
}

const appData = [
    // {
    //     label: "all",
    //     key: "all",
    //     value: "1."
    // }, 
    {
        label: "Non-Sequential Data",
        key: "Non-Sequential Data",
        value: "1.1."
    },
    {
        label: "Sequential Data",
        key: "Sequential Data",
        value: "1.2."
    }
]

let CNN = ["streamlined", "skip connections", "multi-branch", "seperatable conv"]
let RNN = ["stacked", "bidirectional", "multiple time scale", "gated", "recursive"]

let legend = (Names: string[]) => {
    let items = {}
    Names.forEach((name: string, i: number) => {
        let key = String.fromCharCode(i + 97)
        let item = {
            name,
            key,
            click: false,
            hover: false
        }
        items[key] = item
    })
    return items
}
let legendCNN = legend(CNN)
let legendRNN = legend(RNN)

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
    topChild: Node | undefined,
    pinNodes: string[],
    scale: number,
    transX: number,
    transY: number,
    hoverEdge: string,
    showLabel: boolean,
    legend: LegendProps['items']
}

const nodeH = 55, nodeW = 220, margin = 30, labelL = 20, tabH = 24,
    expandH = 180 + tabH, expandW = 240,
    r = nodeH / 3,
    boxH = 10,
    labelFont = 13,
    textMargin = 20,
    r_api = 1, r_dist = -0.1, r_diff = 0 //factors for DOI calculation

// for the lablel fade in/out animiation 
const duration = 1000;

const defaultStyle = {
    transition: `opacity ease-in-out`,
    opacity: 0
}

const transitionStyles = {
    entering: { opacity: 0, transition: `opacity 1000ms ease-in-out`, },
    entered: { opacity: 1 },
    exited: { opacity: 0 }
};

export default class Evolution extends React.Component<Props, State>{
    private updateEdge: boolean = true; ref: any; x0: number; y0: number; dragFlag = false
    constructor(props: Props) {
        super(props)
        this.getData = this.getData.bind(this)
        this.selectNode = this.selectNode.bind(this)
        this.onclickMenu = this.onclickMenu.bind(this)
        this.pinNode = this.pinNode.bind(this)
        this.handleMouseWheel = this.handleMouseWheel.bind(this)
        this.pan = this.pan.bind(this)
        this.mouseDown = this.mouseDown.bind(this)
        this.mouseUp = this.mouseUp.bind(this)
        this.selectItem = this.selectItem.bind(this)
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
            topParent: undefined,
            scale: 1,
            pinNodes: [],
            transX: 0,
            transY: 0,
            hoverEdge: '',
            showLabel: false,
            legend: legendCNN
        }
    }
    async getData() {
        let res = await axios.get('../../data/evolution_dag.json'),
            datum: NN[] = res.data,
            { appValue } = this.state

        datum = datum.filter((d: NN) => d.application[0].startsWith(appValue))
        datum.forEach((d: NN) => {

            let pub_date = moment(d.date, 'YYYY-MM-DD'),
                dif = moment().diff(pub_date, "months")
            d.api = (d.citation / dif) || 0
        })
        //normalize the api value
        let maxApi = Math.max(...datum.map(d => d.api || 1))
        datum.forEach(d => {
            d.api = Math.log2((d.api || 1) / maxApi + 1)
            d.doi = d.api
        })
        let { nodes, edges, width: w, height: h, topDoi, scale, transX, transY } = this.getDag(datum)
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

        // Get benchmarks of datasets
        if (appValue === '1.1.' && nonsequenceBenchmarks.length === 0) {
            let stat : any[] = [] 
            for (let d of datum)
                for (let name of d.names)
                    stat.push(name)
            for (let dataset of nonsequenceDatasets) {
                let benchmarkData = stat.map((d: any) => d[dataset])
                let sortedData = benchmarkData.sort((x, y) => x - y).filter((x) => x)
                let length: number = sortedData.length
                nonsequenceBenchmarks.push({
                    dataset: dataset,
                    minimum: sortedData[0],
                    lowerQuartile: sortedData[Math.floor(length / 4)],
                    median: sortedData[Math.floor(length / 2)],
                    higherQuartile: sortedData[Math.floor(length * 3 / 4)],
                    maximum: sortedData[length - 1],
                    range: sortedData[length - 1] - sortedData[0]
                })
                console.log(sortedData)
            }
            console.log(nonsequenceBenchmarks)
        }

        this.setState({ nodes, edges, w, h, datum, topDoi, transX, transY, scale })
    }
    getDag(datum: NN[], selectedNode: Node | undefined = undefined) {
        let selectedID = selectedNode ? selectedNode.ID : undefined
        let { pinNodes } = this.state
        let dag = new dagre.graphlib.Graph();
        dag.setGraph({
            ranksep: nodeW * .8,
            marginx: margin * 2,
            marginy: margin,
            rankdir: 'LR',
            edgesep: nodeH * 0.4,
            nodesep: nodeH * .5,
            // ranker: "tight-tree"
            ranker: "longest-path"
        });
        dag.setDefaultEdgeLabel(() => { return {}; });

        //control the min value after resizing the nodes, 
        const resizeNode = (w: number, ratio: number) => {
            // let newW = w * ratio
            // if (newW > w * 0.3) {
            //     return newW
            // } else {
            //     return w * 0.3
            // }
            return w * (.4*ratio + .6)
        }
        datum.forEach((node: NN) => {
            // let label = `${layer.name}:${layer.class_name}`

            dag.setNode(node.ID, {
                label: node.ID,
                fullname: node.fullname,
                ID: node.ID,
                api: node.api,
                arc: node.architecture,
                variants: node.variants,
                width: nodeW,
                height: nodeH,
            })
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
                            to: node.ID,
                            cate: parent.link_category.split('=>')[0].split("+"),
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


        //calculate doi and size for each node
        dag.nodes().forEach((v) => {
            if (dag.node(v)) {
                let node: Node = dag.node(v),
                    api = node.api || 1,
                    distance = selectedNode ? distanceDict[v].distance : 0,
                    selected: boolean = (v == selectedID),
                    pinned: boolean = (pinNodes.indexOf(v) != -1)

                let api_diff = Math.max(
                    api,
                    Math.max(...(dag.neighbors(v) || []).map((neighbor: Node) => {
                        return r_diff * (neighbor.api || 0) / getEI({ v, w: neighbor.label })
                    }))
                ),
                    doi = api_diff + r_dist * distance
                dag.setNode(v, {
                    ...node,
                    api: api,
                    doi: doi,
                    variants: node.variants,
                    width: (selected || pinned) ? expandW : resizeNode(nodeW, doi),
                    height: (selected || pinned) ? expandH : resizeNode(nodeH, doi),
                })
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
                    ...topParent,
                    width: expandW,
                    height: expandH
                })
            }
            if (children && children.length != 0) {
                topChild = children.map(v => dag.node(v)).sort((a, b) => b.doi - a.doi)[0]
                dag.setNode(topChild.label, {
                    ...topChild,
                    width: expandW,
                    height: expandH
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
            height = (dag.graph().height || 0),
            width = dag.graph().width || 0
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

        let scaleX = this.ref.clientWidth / (width),
            scaleY = this.ref.clientHeight / (height),
            scale = Math.min(
                scaleX,
                scaleY
            ),
            transX = scaleX > scaleY ? (this.ref.clientWidth - width * scale) / 2 : 0,
            transY = scaleY > scaleX ? (this.ref.clientHeight - height * scale) / 2 : 0

        return { nodes, edges, height, width, topDoi, topParent, topChild, scale, transX, transY }
    }
    drawNodes(nodes: Node[]) {
        let { selectedNode, topDoi, scale, transX, transY, hoverEdge } = this.state,
            selectedID = selectedNode ? selectedNode.ID : undefined,
            apiArr = this.state.nodes.map(d => d.api || 0).sort(d3.ascending)

        return (<g className="nodes" >
            {nodes.map((node: Node) => {
                let selected: boolean = (node.ID === selectedID),
                    isTop: boolean = topDoi.map(d => d.ID).indexOf(node.ID) != -1,
                    zoomed: boolean = node.width == expandW,
                    hoverNodes = hoverEdge.split("->"),
                    hovered = hoverNodes.indexOf(node.label) != -1
                return <NNNode
                    node={node}
                    selected={selected}
                    isTop={isTop}
                    zoomed={zoomed}
                    hovered={hovered}
                    apiArr={apiArr}
                    transX={transX}
                    transY={transY}
                    scale={scale}
                    selectNode={this.selectNode} />
            })}
        </g>)
    }
    drawExtendNodes(nodes: Node[]) {
        let { selectedNode, topDoi, scale, transX, transY, hoverEdge } = this.state,
            selectedID = selectedNode ? selectedNode.ID : undefined,
            apiArr = this.state.nodes.map(d => d.api || 0).sort(d3.ascending)

        return nodes.map((node: Node) => {
            let selected: boolean = (node.ID === selectedID),
                zoomed: boolean = node.width == expandW,
                hoverNodes = hoverEdge.split("->"),
                hovered = hoverNodes.indexOf(node.label) != -1
            return <ExtendNode
                zoomed={zoomed}
                hovered={hovered}
                scale={scale}
                transX={transX}
                transY={transY}
                margin={tabH}
                node={node}
                selected={selected}
                selectNode={this.selectNode}
                onclickMenu={this.onclickMenu}
                pinNode={this.pinNode}
                duration={duration}
            />
        })
    }
    oneEdge(edge: GraphEdge, i: number) {
        let { points, from, to, label_s, label_l, cate } = edge,
            { selectedNode, hoverEdge, transX, transY, scale, showLabel, legend } = this.state,
            selectedID = selectedNode ? selectedNode.label : undefined,
            // clickLegend = this.state.legend[cate] ? this.state.legend[cate].click : false,
            // hoverLegend = this.state.legend[cate] ? this.state.legend[cate].hover : false
            clickLegend:boolean=false, hoverLegend:boolean=false,
            everHover=false, everClick=false
            cate.forEach((k:string)=>{
                let item = legend[k]
                if(item&&item.click){
                    clickLegend=true
                }
                if(item&&item.hover){
                    hoverLegend=true
                }
            })
            // Object.keys(legend).forEach(k=>{
            //     let item = legend[k]
            //     if(item.click){everClick=true}
            //     if(item.hover){everHover=true}
            // })

        //a trick. if assign transX, transY, scale to a group, the transition animiation will be wired
        const movePoint = (p: Point, x: number, y: number, s: number) => {
            return { x: p.x * s + x, y: p.y * s + y }
        }
        points = points.map(p => movePoint(p, transX, transY, scale))


        let len = points.length
        if (len == 0) { return }
        let start = `M ${points[0].x} ${points[0].y}`,
            vias = [],
            circles = []
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
            hovered: boolean = hoverEdge == `${from}->${to}`,
            k = (points[points.length - 1].y - points[0].y) / (points[points.length - 1].x - points[0].x)

        return <g className='Edge EdgeGroup' key={`${i}_${from}->${to}`}>
            {cate.map((key:string, i:number)=>{
                return <path
                className="Edge"
                id={`${from}->${to}`}
                d={pathData}
                stroke={clickLegend?"gray":getColor(key)}
                fill='none'
                transform={`translate(${i*4}, ${i*4})`}
                strokeWidth={(hoverLegend||hovered)&&!clickLegend ? 6 : 3}
                opacity={hoverLegend? 1:(clickLegend?0.4: 0.7)}
            />
            })}
            

            <path
                id={`label_${from}->${to}`}
                opacity={0}
                d={pathData}
            />
            {/* a trick for the edge label, two transition: one for fade in, one for fade out */}
            {showLabel ?
                <Tooltip title={label_l} mouseEnterDelay={.3}>
                    <g className="edgeLable" cursor="pointer"
                        opacity={hoverLegend?1:0.8}
                        onMouseOver={(e: React.MouseEvent<any>) => this.setState({ hoverEdge: `${from}->${to}` })}
                        onMouseLeave={(e: React.MouseEvent<any>) => this.setState({ hoverEdge: `` })}
                    >
                        <Transition in={this.updateEdge} timeout={{ enter: duration, exit: 10 }}>
                            {(status: 'entering' | 'entered' | 'exiting' | 'exited' | 'unmounted') => {
                                // console.info(status)
                                return <text className="link_info fadeIn"
                                    dy={-0.2 * labelFont}
                                    scale={1 / scale}
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
                                    dy={-0.2 * labelFont}
                                    scale={1 / scale}
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
                    </g>
                </Tooltip> : <g/>
                // <path
                //     className="EdgeMarker"
                //     strokeWidth={10}
                //     stroke="transparent"
                //     fill="none"
                //     d={pathData}
                //     cursor="pointer"
                // >
                // </path>
            }
        </g>

    }
    drawEdges(edges: GraphEdge[]) {
        let { scale, transX, transY } = this.state
        return (<g className="edges" >
            {edges.map((edge: GraphEdge, i: number) => {
                return this.oneEdge(edge, i)

            })}
        </g>)
    }
    handleMouseWheel(evt: React.WheelEvent<any>) {
        let { scale, transX, transY } = this.state
        console.info("wheel", evt)
        this.updateEdge = !this.updateEdge
        if (evt.deltaY > 0) { 
            scale = scale * 1.1 
            transX =  transX * 1.1
            transY = transY*1.1
            
        } else if (evt.deltaY < 0) {
            scale = scale * .9 
            transX =  transX * .9
            transY = transY* .9
        }
        this.setState({ scale, transX, transY });
    }
    componentDidMount() {
        this.getData()
    }
    // componentDidMount() {

    //     const zoomed = () => {
    //         svg.attr("transform", d3.event.transform);
    //     }
    //     let svg = d3.select('svg')
    //         .call(
    //             d3.zoom()
    //                 .on("zoom", zoomed))
    //                 .on("mousedown.zoom", null)
    //                 .on("touchstart.zoom", null)

    // }
    onChange = (appValue: "1.1." | "1.2.") => {
        let legend = appValue == "1.1." ? legendCNN : legendRNN
        this.setState({ appValue, legend });
        this.getData()
        let { onSelectDatabase } = this.props
        if (appValue === '1.1.')
            onSelectDatabase('nonsequence')
        else if (appValue === '1.2.')
            onSelectDatabase('sequence')
        else
            onSelectDatabase('all')
    }
    pinNode(pinNode: Node) {
        let { pinNodes } = this.state,
            index = pinNodes.indexOf(pinNode.label)
        if (index == -1) {
            pinNodes.push(pinNode.label)
        } else {
            pinNodes.splice(index, 1)
        }

        this.setState({ pinNodes })
    }
    selectNode(selectedNode: Node | undefined) {
        let { datum } = this.state
        let { onSelectNN } = this.props
        // this.updateEdge = !this.updateEdge
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
        let { nodes, edges, width: w, height: h, topChild, topParent, topDoi, scale, transX, transY } = this.getDag(datum, selectedNode)
        this.setState({
            nodes, edges, w, h, datum, selectedNode,
            topChild, topParent, topDoi, scale,
            transX, transY
        })

        /*if (selectedNode) {
            for (let nn of datum) {
                if (nn.ID === selectedNode.label) {
                    onSelectNN(nn)
                    console.log('selected a node')
                }
            }
        }
        else {
            console.log('select undefined')
        }*/
    }
    mouseDown(e: React.MouseEvent<any>) {
        e.stopPropagation()
        e.preventDefault()

        document.addEventListener("mousemove", this.pan)
        this.x0 = e.clientX
        this.y0 = e.clientY
        this.updateEdge = !this.updateEdge
    }
    pan(e: any) {
        let { transX, transY } = this.state
        transX += e.clientX - this.x0
        transY += e.clientY - this.y0
        this.x0 = e.clientX
        this.y0 = e.clientY
        this.dragFlag = true
        this.setState({ transX, transY })
    }
    mouseUp(e: React.MouseEvent<any>) {
        e.stopPropagation()
        e.preventDefault()
        // if (this.dragFlag) {
            
        //     this.dragFlag = false
        // }

        document.removeEventListener("mousemove", this.pan)
    }
    onclickMenu(selectedNode: Node, menu: string) {
        let { datum } = this.state
        let { onSelectNN } = this.props
        let { onSelectNNMotion } = this.props

        for (let nn of datum) {
            if (nn.ID === selectedNode.label) {
                onSelectNN(nn)
            }
        }

        switch (menu) {
            case 'text':
                console.log('text')
                onSelectNNMotion(2)
                break
            case 'compare':
                console.log('compare')
                onSelectNNMotion(1)
                break
            case 'detailed':
                console.log('detailed')
                showDetailedStructure(selectedNode.label)
                break
            default:
                break
        }
    }
    selectItem(key: string, op:"click"|"hover") {
        let { legend } = this.state
        legend[key][op] = !legend[key][op]
        this.setState({ legend })
    }
    render() {
        let { nodes, edges, w, h, appValue, legend } = this.state
        // let screen_w = (window.innerWidth - 2 * margin) / 2
        // let screen_h = (window.innerHeight - HEADER_H - 2 * margin) / 2

        // let ratio = Math.min(screen_w/(w||1), screen_h/(h||1))
        let { train, arc } = this.props

        return <div
            className="Evolution View"
            onWheel={this.handleMouseWheel}
            onMouseDown={this.mouseDown}
            onMouseUp={this.mouseUp}
            onMouseLeave={this.mouseUp}
            ref={(ref) => this.ref = ref}>
            {/* <div style={{ position: "absolute", left: "20px", top: "20px" }}>
                Training methods:{train}
            </div>
            <div style={{ position: "absolute", left: "20px", top: "40px" }}>
                Architecture:{arc}
            </div> */}
            <div className="controlPanel"
                style={{
                    position: "absolute",
                    left: "20px",
                    top: "10px",
                    zIndex: 100,
                    padding: "5px"
                }}
            >
                <TreeSelect
                    value={appValue}
                    // dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    //treeData = {this.state.appData}
                    style={{ width: 180 }}
                    treeData={appData}
                    placeholder="select your data type"
                    //multiple
                    treeDefaultExpandAll
                    onChange={this.onChange}
                />
                <div>
                    <Button
                        size="small"
                        onClick={() => this.selectNode(undefined)}
                        style={{ position: "relative", top: "2px", marginRight: "3px" }}
                    >
                        Reset
                </Button>
                    <Switch
                        // className="evoSwitch"
                        checkedChildren="label" unCheckedChildren="no label"
                        onChange={() => this.setState({ showLabel: !this.state.showLabel })}
                    />
                </div>
                <Legend items={legend} selectItem={this.selectItem} />
            </div>
            <div className="container">
                <div className="extendNodes"
                    style={{
                        // height:this.ref?this.ref.clientHeight:0, 
                        // width:this.ref?this.ref.clientWidth:0,
                        position: "relative"
                    }}>
                    {this.drawExtendNodes(nodes)}
                </div>
                <svg
                    //alway show the whole dag
                    width="100%" height="100%"
                // viewBox={`0 0 ${w} ${h}`}
                //or show part and let the users pan and zoom
                // width={w||1*scale} height={h||1*scale}

                >

                    <defs>
                        <marker id='red' orient='auto' markerWidth={4 * r} markerHeight={4 * r}
                            refX={2 * r} refY={2 * r}>
                            <circle r={r} fill='red' />
                        </marker>
                        <marker id='blue' orient='auto' markerWidth={4 * r} markerHeight={4 * r}
                            refX={2 * r} refY={2 * r}>
                            <circle r={r} fill='blue' />
                        </marker>
                        <marker id='black' orient='auto' markerWidth={4 * r} markerHeight={4 * r}
                            refX={2 * r} refY={2 * r}>
                            <circle r={r} fill='black' />
                        </marker>
                    </defs>{this.drawEdges(edges)}
                    {this.drawNodes(nodes)}

                </svg>


            </div>
        </div>
    }
}


