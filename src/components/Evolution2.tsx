import * as React from "react"
// import * as dagre from "dagre"
import { Node, GraphEdge } from "dagre"
import "./Evolution.css"
import "./App.css"
import axios from "axios"
import * as d3 from "d3"
import { NN, Parent } from "../types"
import { getColor } from "../helper/index"
import { TreeSelect, Tooltip } from "antd"
import moment from "moment"

// const {TreeNode} = TreeSelect
let apps: string[] = []
export interface Props {
    arc: string,
    app: string,
    train: string,
    onSelect: (nns: string[]) => void
}


export interface State {
    nns: NNS,
    appValue: string | undefined,
    appData: any,
    selectedNN: NN|undefined
}

export interface NNS {
    nodes: NN[],
    links: NNLink[]
}

export interface NNLink {
    source: any,
    target: any,
    [key: string]: any
}


const margin = { top: 10, left: 10, bottom: 0, right: 0 }
const get_r = (r: number) => Math.log(r / 100 + 1) / Math.log(2)

export default class Evolution extends React.Component<Props, State>{
    private ref: HTMLElement | null; simulation: any
    constructor(props: Props) {
        super(props)
        this.getAppData = this.getAppData.bind(this)
        this.getNodeData = this.getNodeData.bind(this)
        this.state = {
            nns: { nodes: [], links: [] },
            appValue: undefined,
            appData: [],
            selectedNN: undefined
        }

    }
    async getAppData() {

        let appRes = await axios.get('../../data/taxonomy.json')
        let appData = appRes.data.children[0]
        const label = (d: any) => {
            d.label = d.name
            d.value = d.name
            if (d.children) {
                d.children.forEach(label)
            }
        }
        label(appData)
        this.setState({ appData })
    }
    async getNodeData() {
        let res = await axios.get('../../data/survey.json')
        let data = res.data
        let nns: NNS = { nodes: data, links: [] }
        if (data.length > 0) {
            data.forEach((nn: NN) => {
                nn.r = get_r(nn.citation)
                nn.parents.forEach((parent: Parent) => {
                    nns.links.push({
                        source: nn.ID,
                        target: parent.ID
                    })
                })
            })
        }

        let width = this.ref ? this.ref.clientWidth : 0,
            height = this.ref ? this.ref.clientHeight : 0,
            chartWidth = width - (margin.left + margin.right),
            chartHeight = height - (margin.top + margin.bottom)

        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id((d: any) => d.ID).strength(0))
            .force("collide", d3.forceCollide(
                (d: any) => (d.r + 8)).iterations(3)
            )
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(chartWidth / 2, chartHeight / 2))
            .force("y", d3.forceY((d: any, i: number) => {
                return this.get_foci(d.application[0]).y
            }).strength(1))
            .force("x", d3.forceX((d: any, i: number) => {
                let pub_date = moment(d.date, 'YYYY-MM-DD')
                let dif = pub_date.diff(moment(), "years")
                return this.get_foci(d.application[0]).x + dif * 20
            }).strength(10))

        this.calc(chartWidth, chartHeight, nns)

    }
    componentWillMount() {
        this.getAppData()
    }
    componentDidMount() {
        this.getNodeData()
    }
    calc(chartWidth: number, chartHeight: number, nns: NNS) {
        this.simulation
            .nodes(nns.nodes)
        this.simulation.force("link")
            .links(nns.links)
        for (var i = 0, n = Math.ceil(Math.log(this.simulation.alphaMin()) / Math.log(1 - this.simulation.alphaDecay())); i < n; ++i) {
            this.simulation.tick();
            nns.nodes = this.simulation.nodes()
            nns.links = this.simulation.force("link").links()
            if (i == n - 1) {
                this.setState({ nns })
            }
        }
    }
    get_foci(app: string) {
        let foci = [
            { x: 150, y: 250 },
            { x: 100, y: 450 },
            { x: 400, y: 250 },
            { x: 500, y: 450 },
            { x: 300, y: 450 }
        ];
        if (apps.indexOf(app) == -1) {
            apps.push(app)
            return foci[apps.length - 1]
        } else {
            return foci[apps.indexOf(app)]
        }


    }

    onChange = (appValue: string) => {
        d3.select('g.pan')
            .attr("transform", (d) => {
                return `translate(200, 0)`
            })
        this.setState({ appValue });
    }
    clickNode(nn:NN){
        console.info("click")
        this.setState({selectedNN:nn})
    }
    getNodes() {
        if (this.simulation) {
            let { nodes } = this.state.nns
            let { selectedNN } = this.state
            let nnChain:string[]=[]
            let selectedID:string = ''
            if(selectedNN!=undefined){
                selectedID = selectedNN.ID
                let nn_arr = nodes.filter((node:NN)=>{
                    return node.ID == selectedID
                    ||node.parents.map(d=>d.ID).indexOf(selectedID)!=-1
                    // ||selectedNN.parents.map(d=>d.ID).indexOf(node.ID)!=-1
                })
            }
    
            return <g className="Nodes">
                {nodes.map((node: NN) => {
                    let tip = `${node.ID}: ${node.url}`
                    let selectedNN
                    return <Tooltip title={tip}>
                    <circle
                        key={node.ID}
                        cx={node.x}
                        cy={node.y}
                        fill={nnChain.indexOf(node.ID)==-1?getColor(node.application[0]):"gray"}
                        opacity={nnChain.indexOf(node.ID)==-1?1:0.2}
                        r={node.r}
                        onClick={()=>this.clickNode(node)}
                    />
                    </Tooltip>
                })}
            </g>
        }
        return <g className="Nodes" />
    }
    getLinks() {
        if (this.simulation) {
            let { links } = this.state.nns
            return <g className="links">
                {links.map((link: NNLink) => {
                    return <line
                        key={`${link.source.ID}=>${link.target.ID}`}
                        x1={link.source.x}
                        y1={link.source.y}
                        x2={link.target.x}
                        y2={link.target.y}
                        strokeWidth="1" stroke="gray"
                    />
                })}
            </g>
        }
        return <g className="links" />
    }
    render() {
        let { appValue } = this.state
        // let screen_w = (window.innerWidth - 2 * margin) / 2
        // let screen_h = (window.innerHeight - HEADER_H - 2 * margin) / 2

        // let ratio = Math.min(screen_w/(w||1), screen_h/(h||1))
        let { train, arc } = this.props
        return <div className="Evolution View" ref={(ref) => { this.ref = ref }}>
            <div style={{ position: "absolute", left: "20px", top: "20px" }}>
                Training methods:{train}
            </div>
            <div style={{ position: "absolute", left: "20px", top: "40px" }}>
                Architecture:{arc}
            </div>
            <TreeSelect
                style={{ position: "absolute", width: 250, left: "20px", top: "60px" }}
                value={appValue}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                treeData={this.state.appData}
                placeholder="select your task"
                multiple
                treeDefaultExpandAll
                onChange={this.onChange}
            />

            <svg width="100%" height="100%" className="Evolution">
                {this.getLinks()}
                {this.getNodes()}
            </svg>
        </div>
    }
}