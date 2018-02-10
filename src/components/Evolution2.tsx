import * as React from "react"
// import * as dagre from "dagre"
import { Node, GraphEdge } from "dagre"
import "./Evolution.css"
import "./App.css"
import axios from "axios"
import * as d3 from "d3"
// import { EvoNode, EvoLink } from "../types"
// import { getColor } from "../helper/index";
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
    appValue: string | undefined,
    appData: any
}
export default class Evolution extends React.Component<Props, State>{
    private ref: HTMLElement | null
    constructor(props: Props) {
        super(props)
        this.getData = this.getData.bind(this)
        this.state = {
            nodes: [],
            edges: [],
            w: 0,
            h: 0,
            appValue: undefined,
            appData: []
        }
    }
    async getData() {

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
    componentWillMount() {
        this.getData()
    }
    componentDidUpdate() {
        let width = this.ref ? this.ref.clientWidth : 0,
            height = this.ref ? this.ref.clientHeight : 0,
            margin = { top: 10, left: 10, bottom: 0, right: 0 },
            chartWidth = width - (margin.left + margin.right),
            chartHeight = height - (margin.top + margin.bottom)

        let foci = [{ x: 0, y: 150 }, { x: 300, y: 450 }, { x: 600, y: 150 }];

        let svg = d3.select(".Evolution")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")
            .attr("class", "pan")

            svg.call(d3.zoom().on("zoom", function () {
                svg.attr("transform", d3.event.transform)
             }))
        let chartLayer = svg
            .append("g")
            .classed("chartLayer", true)
            .attr("transform", `translate(${margin.left}, ${margin.top})`)

        var range = 20
        var data = {
            nodes: d3.range(0, range).map(function (d: any) { 
                return { label: "l" + d, r: ~~d3.randomUniform(8, 28)() } 
            }),
            links: d3.range(0, range).map(function () { 
                return { 
                    source: ~~d3.randomUniform(range)(), 
                    target: ~~d3.randomUniform(range)() 
                } 
            })
        }

        



        var simulation: any = d3.forceSimulation()
            .force("link", d3.forceLink().id((d: any) => d.index))
            .force("collide", d3.forceCollide((d: any) => (d.r + 8)).iterations(3))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(chartWidth / 2, chartHeight / 2))
            .force("y", d3.forceY(0))
            .force("x", d3.forceX(0))

        var link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .attr("stroke", "black")

        var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(data.nodes)
            .enter().append("circle")
            .attr("r", function (d: any) { return d.r })
            .attr("fill", "gray")



        var ticked = function (e: any) {
            // let k = 0.1*e.alpha
            data.nodes.forEach(function(o:any, i) {
                let id = i%foci.length
                o.y += (foci[id].y - o.y) * 0.01;
                o.x += (foci[id].x - o.x) * 0.01;
              });

            link
                .attr("x1", function (d: any) { return d.source.x; })
                .attr("y1", function (d: any) { return d.source.y; })
                .attr("x2", function (d: any) { return d.target.x; })
                .attr("y2", function (d: any) { return d.target.y; });

            node
                .attr("cx", function (d: any) { return d.x; })
                .attr("cy", function (d: any) { return d.y; });
        }

        simulation
            .nodes(data.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(data.links)
    }
    onChange = (appValue: string) => {
        console.info('onchage', appValue)
        this.setState({ appValue });
    }
    render() {
        let { w, h, appValue } = this.state
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

            {/* <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} className="Evolution">
            </svg> */}
        </div>
    }
}