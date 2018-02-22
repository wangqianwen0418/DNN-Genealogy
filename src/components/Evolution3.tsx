import * as React from "react"
import * as dagre from "dagre"
// import * as graphlib from "graphlib"
import "./Evolution.css"
import "./App.css"
import axios from "axios"
import * as d3 from "d3"
import { NN, NNLink, Node, GraphEdge } from "../types"
import { getColor } from "../helper/index";
import { TreeSelect, Button, Dropdown, Menu } from "antd"
import moment from 'moment';
// const {TreeNode} = TreeSelect
export interface Props {
    arc: string,
    app: string,
    train: string,
    onSelect: (nns: string[]) => void
}

const appData = [
    {
        label: "sequence data",
        key:"sequence data",
        value: "0-0"
    }, {
        label: "nonsequence data",
        value: "nonsequence data",
        key:"2"
    }
]



export interface State {
    datum: NN[],
    nodes: Node[],
    edges: GraphEdge[],
    selectedNode: Node | undefined,
    h: number | undefined,
    w: number | undefined,
    appValue: string | undefined,
    // appData: any,
    topDoi:Node[],
    topParent: Node|undefined,
    topChild: Node|undefined
}
const margin = 30, nodeH = 20, nodeW = 100, labelL=8,
    expandH = 300,expandW=400,
    r_api = 1, r_dist = -100, r_diff=0.01 //factors for DOI calculation
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
            // appData: [],
            topDoi:[],
            topChild: undefined,
            topParent: undefined
        }
    }
    async getData() {
        let res = await axios.get('../../data/survey.json')
        let datum: NN[] = res.data
        datum = datum.filter((d: NN) => d.application[0] === "1.1.1.general recognition")
        datum.forEach((d: NN) => {
            d.width = nodeW
            d.height = nodeH

            let pub_date = moment(d.date, 'YYYY-MM-DD'),
                dif = moment().diff(pub_date, "months")
            d.api = d.citation/dif
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
        

        this.setState({ nodes, edges, w, h,  datum, topDoi })
    }
    getDag(datum: NN[], selectedNode:Node|undefined=undefined) {
        let selectedID = selectedNode?selectedNode.ID:undefined
        let dag = new dagre.graphlib.Graph();
        dag.setGraph({
            ranksep: nodeW * 1,
            marginx: margin,
            marginy: margin,
            rankdir: 'LR',
            // edgesep: nodeH * 2,
            // ranker: "tight-tree"
            // ranker: "longest-path"
        });
        dag.setDefaultEdgeLabel(() => { return {}; });
        

        datum.forEach((node: NN) => {
            // let label = `${layer.name}:${layer.class_name}`
            let selected:boolean = (node.ID==selectedID)
            dag.setNode(node.ID, 
                { 
                    label: node.ID, 
                    width: selected?expandW:nodeW, 
                    height: selected?expandH:nodeH,
                    ID: node.ID,
                    api: node.api
                }
            )
            //IR model or keras model
            if (node.parents.length > 0) {
                node.parents.forEach((parent: any) => {
                    dag.setEdge(
                        parent.ID, 
                        node.ID, 
                        { 
                            label: parent.link_info,
                            from: parent.ID,
                            to: node.ID
                        }
                    )
                })
            }
        })
        

        

        const getEdgeWeight = (e:dagre.Edge)=>dag.node(e.v).api+dag.node(e.w).api
        // const getEdgeWeight = (e:dagre.Edge)=>1
        const getEI = (v:dagre.Edge)=>1
        let distanceDict:any
        if(selectedNode){
            distanceDict = dagre.graphlib.alg
                                .dijkstra(dag, selectedNode.label, (e)=>1, v=>dag.nodeEdges(v))            
        }
        // let tree = dagre.graphlib.alg.prim(dag, getEdgeWeight)
        // console.info(tree.edges)
        

        //calculate doi for each node
        dag.nodes().forEach((v) => {
            if (dag.node(v)) {
                let node:Node = dag.node(v),
                distance = selectedNode?distanceDict[v].distance:0
                node.api_diff = Math.max(
                    node.api||0,
                    Math.max(...(dag.neighbors(v)||[]).map((neighbor:Node)=>{
                        return r_diff * (neighbor.api||0)/getEI({v, w: neighbor.label})
                    })) 
                )
                node.doi = node.api_diff + r_dist*distance
            }
        })
        dag.edges().forEach((e, i) => {
            let edge:GraphEdge = dag.edge(e)
            edge.weight = getEdgeWeight(e)
        });

        //calculate the top N doi nodes, and update their size
        let topParent:Node|undefined = undefined
        let topChild:Node|undefined = undefined
        if(selectedNode){
            let parents = dag.predecessors(selectedNode.label),
                children = dag.successors(selectedNode.label)
            if(parents&&parents.length!=0){
                topParent = parents.map(v=>dag.node(v)).sort((a,b)=>b.doi-a.doi)[0]
                dag.setNode(topParent.label, { 
                    label: topParent.ID, 
                    width: expandW, 
                    height: expandH,
                    ID: topParent.ID,
                    api: topParent.api
                })
            }
            if(children&&children.length!=0){
                topChild = children.map(v=>dag.node(v)).sort((a,b)=>b.doi-a.doi)[0]
                dag.setNode(topChild.label, { 
                    label: topChild.ID, 
                    width: expandW, 
                    height: expandH,
                    ID: topChild.ID,
                    api: topChild.api
                })
            }
            
        }

        const topN = (nodes:string[], n:number=3)=>{
            let topDoi:Node[] = []
            for(let i=0;i<nodes.length;i++){
                let v = nodes[i]
                let node = dag.node(v)
                //exclude topParent and topChild from topN
                if((topChild&&v==topChild.label)
                    ||(topParent&&v==topParent.label)
                    ||(selectedNode&&v==selectedNode.label)){                   
                }else{
                    topDoi.push(node)
                }
                
                if(topDoi.length>n){
                    topDoi.sort((a,b)=>(b.doi||0)-(a.doi||0))
                    topDoi.pop()
                }
            }
            return topDoi
        }
        let topDoi:Node[] = topN(dag.nodes())


        //calculate layout
        dagre.layout(dag)

        let nodes:Node[] = dag.nodes().map(v=>dag.node(v)),
            edges:GraphEdge[] = dag.edges().map(e=>dag.edge(e)),
            height = dag.graph().height,
            width = dag.graph().width
        return { nodes, edges, height, width, topDoi, topParent, topChild }
    }
    drawNodes(nodes: Node[]) {
        let {selectedNode, topDoi} = this.state, 
            selectedID = selectedNode?selectedNode.ID:undefined
        const menu = (
            <Menu >
                <Menu.Item key="1">text intro</Menu.Item>
                <Menu.Item key="2">compare performance</Menu.Item>
                <Menu.Item key="3">detailed structure</Menu.Item>
            </Menu>
            );
            
        return (<g className="nodes" >
            {nodes.map((node: Node) => {
                let selected:boolean = (node.ID===selectedID),
                    isTop:boolean = topDoi.map(d=>d.ID).indexOf(node.ID)!=-1
                return <g key={node.label}
                    transform={`translate (${node.x - node.width / 2}, ${node.y - node.height / 2})`}
                    onClick={() => this.selectNode(node)}
                    
                >
                    
                    <rect width={node.width} height={node.height}
                    fill="transparent"
                    stroke={selected?"red":(isTop?"blue":"gray")}
                    strokeWidth={selected?2:(isTop?2:1)}
                    cursor="pointer"
                    ></rect>
                    {node.height>nodeH?<foreignObject>
                        <div style={{height:node.height}}>
                            <img 
                            className="abstract"
                            src={`../../images/${node.label}.png`}
                                //    height={node.height}
                                    width={node.width}
                                />
                            </div>
                            <Dropdown overlay={menu} className="infoButton">
                            <Button>{node.label}</Button>
                            </Dropdown>
                        
                    </foreignObject>
                    :<text textAnchor="middle"
                        fontSize={0.7*nodeH}
                        cursor="pointer"
                        x={node.width / 2}
                        y={node.height-0.1*nodeH}
                        >
                        {
                             (node.label.length<labelL)?
                             node.label:(node.label.slice(0, labelL)+'...')
                        }                       
                    </text>
                    }
                    
                </g>
            })}
        </g>)
    }
    oneEdge(edge: GraphEdge, i: number) {
        let { points, from, to, label } = edge,
            {selectedNode} = this.state,
            selectedID = selectedNode?selectedNode.label:undefined
        
        
        // let len = points.length
        // if (len == 0) { return }
        // let start = `M ${points[0].x} ${points[0].y}`
        // let vias = [];
        // for (let i = 0; i < len - 2; i += 2) {
        //     let cPath = [0, 1, 2].map(k => `${points[i + k].x} ${points[i + k].y}`)
        //     vias.push(`M ${points[i].x} ${points[i].y} C ${cPath}`)

        // }
        // let pathData = `${start}  ${vias.join(' ')}`
        //change curve path to straight line
        let pathData = `M ${points[0].x} ${points[0].y} 
        L ${points[points.length-1].x} ${points[points.length-1].y}`
        let highlight:boolean = ((from==selectedID)||(to==selectedID))
        return <g className='link' key={`${i}_${from}->${to}`}>
            <path
                strokeLinecap="round"
                d={pathData}
                stroke={highlight?"gray":"gray"}
                fill='none'
                strokeWidth={highlight?2:1}
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
        this.setState({ appValue });
    }
    selectNode(selectedNode: Node) {
        let { datum } = this.state
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
                //treeData = {this.state.appData}
                treeData={appData}
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