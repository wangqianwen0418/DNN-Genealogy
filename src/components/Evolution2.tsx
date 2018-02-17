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
    node_link: NNS,
    appValue: string | undefined,
    appData: any,
    nnChain: string[]
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
const get_r = (r: number) => Math.log(r / 100 + 1) / Math.log(1.5) + 5

export default class Evolution extends React.Component<Props, State>{
    private ref: HTMLElement | null;
    simulation: any;
    clicked: boolean = false;
    zoom_r: number = 80;

    constructor(props: Props) {
        super(props)
        this.getAppData = this.getAppData.bind(this)
        this.getNodeData = this.getNodeData.bind(this)
        this.unHover = this.unHover.bind(this)
        this.hoverNode = this.hoverNode.bind(this)
        this.clickNode = this.clickNode.bind(this)
        this.state = {
            node_link: { nodes: [], links: [] },
            appValue: undefined,
            appData: [],
            nnChain: []
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
        let node_link: NNS = { nodes: data, links: [] }
        if (data.length > 0) {
            data.forEach((nn: NN) => {
                nn.r = get_r(nn.citation)
                nn.parents.forEach((parent: Parent) => {
                    node_link.links.push({
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
            .force("link", d3.forceLink().id((d: any) => d.ID).strength(0.1))
            .force("collide", d3.forceCollide(
                (d: any) => (d.r + 8)).iterations(3)
            )
            .force("charge", d3.forceManyBody().distanceMax(40))
            .force("center", d3.forceCenter(chartWidth / 2, chartHeight / 2))
            .force("y", d3.forceY((d: any, i: number) => {
                return this.get_foci(d.application[0]).y
            }).strength(1))
            .force("x", d3.forceX((d: any, i: number) => {
                let pub_date = moment(d.date, 'YYYY-MM-DD')
                let dif = pub_date.diff(moment(), "months")
                return this.get_foci(d.application[0]).x + dif * 3
            }).strength(10))

        let nnChain = data.map((d: NN) => d.ID)
        this.setState({ nnChain })

        this.calc(node_link)

    }
    componentWillMount() {
        this.getAppData()
    }
    componentDidMount() {
        this.getNodeData()
        let svg = d3.select("svg.Evolution")
        svg.call(d3.zoom().on("zoom", function () {
            svg.attr("transform", d3.event.transform)
        }))
    }
    calc(node_link: NNS) {
        this.simulation
            .nodes(node_link.nodes)
        this.simulation.force("link")
            .links(node_link.links)
        this.simulation.alpha(1).restart()
        for (var i = 0, n = Math.ceil(Math.log(this.simulation.alphaMin()) / Math.log(1 - this.simulation.alphaDecay())); i < n; ++i) {
            this.simulation.tick();
            if (i == n - 1) {
                node_link.nodes = this.simulation.nodes()
                node_link.links = this.simulation.force("link").links()
                this.setState({ node_link })
            }
        }
    }
    get_foci(app: string) {
        let foci = [
            { x: 800, y: 250 },
            { x: 300, y: 450 },
            { x: 1000, y: 250 },
            { x: 500, y: 450 },
            { x: 800, y: 450 }
        ];
        if (apps.indexOf(app) == -1) {
            apps.push(app)
            return foci[apps.length - 1]
        } else {
            return foci[apps.indexOf(app)]
        }


    }

    onChange(appValue: string) {
        d3.select('g.pan')
            .attr("transform", (d) => {
                return `translate(200, 0)`
            })
        this.setState({ appValue });
    }
    getChain(nodes:NN[], selectedNN:NN){
        let selectedID = selectedNN.ID
        let nnChain = nodes.filter((node: NN) => {
            return node.ID == selectedID
                || node.parents.map(d => d.ID).indexOf(selectedID) != -1
                || selectedNN.parents.map(d => d.ID).indexOf(node.ID) != -1
        }).map(d => d.ID)
        return nnChain
    }
    hoverNode(nn: NN) {
        if (!this.clicked) {
            let { node_link } = this.state
            let nnChain = this.getChain(node_link.nodes, nn)
            this.setState({ nnChain })
        }
    }
    unHover() {
        if (!this.clicked) {
            let { nnChain, node_link } = this.state

            nnChain = node_link.nodes.map(d => d.ID)
            this.setState({ nnChain })
        }
    }
    clickNode(nn: NN) {
        let { node_link } = this.state
        this.clicked = !this.clicked

        let nnChain = this.getChain(node_link.nodes, nn)

        node_link.nodes.forEach((node: NN) => {
            if (nnChain.indexOf(node.ID) != -1) {
                if (node._r) {
                    node.r = node._r
                    node._r = null
                } else {
                    node._r = node.r
                    node.r = this.zoom_r
                }
            }
        })
        this.calc(node_link)
    }
    drawNodes() {
        if (this.simulation) {
            let { nodes } = this.state.node_link
            let { nnChain } = this.state

            return <g className="Nodes">
                {nodes.map((node: NN) => {
                    let tip = `${node.ID}`
                    let selectedNN
                    return <Tooltip title={tip}>
                        <g className={node.ID}
                            onMouseEnter={() => this.hoverNode(node)}
                            onMouseLeave={this.unHover}
                            onClick={() => this.clickNode(node)}
                            transform={`translate(${node.x - node.r * 0.9}, ${node.y - node.r * 0.9})`}
                        >
                            <circle
                                key={node.ID}
                                fill={getColor(node.application[0])}
                                opacity={nnChain.indexOf(node.ID) == -1 ? 0.2 : 1}
                                r={node.r}
                                cx={node.r * 0.9}
                                cy={node.r * 0.9}

                            />
                            {node._r ? <foreignObject>
                                <img src={`../../images/${node.ID}.png`}
                                    height={this.zoom_r * 1.8}
                                    width={this.zoom_r * 1.8}
                                    style={{ borderRadius: "50%" }}
                                />
                            </foreignObject> : <span />}

                        </g>
                    </Tooltip>
                })}
            </g>
        }
        return <g className="Nodes" />
    }
    drawLinks() {
        if (this.simulation) {
            let { links } = this.state.node_link
            let { nnChain } = this.state
            return <g className="links">
                {links.map((link: NNLink) => {
                    let show: boolean = nnChain.indexOf(link.source.ID) != -1
                        && nnChain.indexOf(link.target.ID) != -1
                    return <line
                        key={`${link.source.ID}=>${link.target.ID}`}
                        x1={link.source.x}
                        y1={link.source.y}
                        x2={link.target.x}
                        y2={link.target.y}
                        strokeWidth="1"
                        stroke={show ? "gray" : "transparent"}
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
                {this.drawLinks()}
                {this.drawNodes()}
            </svg>
        </div>
    }
}