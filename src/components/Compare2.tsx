import * as React from "react";
import "./Compare.css";
// import { IRNode } from "../types";
// import * as dagre from 'dagre';
// import { Node, Edge, GraphEdge, NodeConfig } from 'dagre';
import { getColor } from "../helper";
import * as d3 from "d3";
import axios from "axios";

export interface Dot {
    [key: string]: any
}
export interface State {
    selected: string[],
    nns: Dot[],
    attr_names: string[]
}
// export interface Props {
//     drawDag: (name: string, task: string) => void
// }

// let datum: Dot[] = [
//     { name: "a", attr: [98, 76, 65, 66, 87, 90] },
//     { name: "b", attr: [20, 66, 75, 86, 67, 50] },
//     { name: "c", attr: [90, 66, 75, 76, 57, 57] },
//     { name: "d", attr: [50, 96, 55, 80, 70, 30] },
//     { name: "e", attr: [60, 46, 45, 56, 87, 25] }
// ]

let simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(-5))



export default class Compare2 extends React.Component<{}, State>{
    public nodes: any; r: number = 150; node_r = 4
    constructor(props: {}) {
        super(props)
        this.arc = this.arc.bind(this)
        this.state = {
            selected: [],
            nns: [],
            attr_names: []
        }
    }
    arc(x: number = 0, y: number = 0, r: number, startAngle: number, endAngle: number) {
        var start = this.polarToCartesian(x, y, r, endAngle);
        var end = this.polarToCartesian(x, y, r, startAngle);

        var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        var d = [
            "M", start.x, start.y,
            "A", r, r, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");

        return d;
    }
    polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
        var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    getForceX(attr: number[]) {
        let len = attr.length
        let x: number = attr.map((d: number, idx: number) => d * Math.cos(Math.PI / len * idx)).reduce((a, b) => a + b, 0)
        return x / len
    }
    getForceY(attr: number[]) {
        let len = attr.length
        let y: number = attr.map((d: number, idx: number) => d * Math.sin(Math.PI / len * idx)).reduce((a, b) => a + b, 0)
        return y / len
    }
    async getData() {
        let res = await axios.get('../../data/recognition.csv')
        let datum = res.data
        let lines = datum.split('\n')
        let attr_names = lines[0].split('|').slice(4, 9)
        // console.info(attr_names)
        lines = lines.slice(1)
        let nns: Dot[] = []
        lines.forEach((line: string) => {
            let attrs: string[] = line.split('|')
            nns.push(
                {
                    name: attrs[1],
                    attr: attrs.slice(4, 9)
                        .map((d: string) => {
                            return d == "na" ? 0 : 100 - parseFloat(d)
                        })
                })

        })
        this.setState({ nns, attr_names })
        console.log(this.state)
    }
    componentWillMount() {
        this.getData()
    }
    componentDidUpdate() {
        let { selected, nns } = this.state
        let selectNode = (d: Dot) => {
            //   d3.select(this)
            //   .classed("selected", true)

            let name_idx = selected.indexOf(d.name)
            if (name_idx == -1) {
                selected.push(d.name)
            } else {
                selected.splice(name_idx, 1)
            }
            this.setState({ selected })
            // this.props.drawDag(d.name, "recognition")
        }
        selectNode = selectNode.bind(this)
        let node_r = this.node_r
        this.nodes = d3.select(".compareView1")
            .selectAll(".dot")
            .attr("class", "dot")
            .data(nns)
            .enter().append("circle")
            .attr("r", node_r)
            .attr("cx", (d, i) => this.getForceX(d.attr) || 0)
            .attr("cy", (d, i) => this.getForceY(d.attr) || 0)
            .attr("fill", (d) => "#666")
            .attr("title", d => d.name)
            .on("click", function (d) {
                // d3.select(this).classed("selected", selected.indexOf(d.name) == -1)
                let selected_idx: number = selected.indexOf(d.name)
                d3.select(this)
                    .attr("fill", (d: Dot) => selected_idx == -1 ? getColor(d.name) : "#666")
                    .attr("r", (d) => selected_idx == -1 ? node_r * 1.3 : node_r)
                    .style("z-index", selected_idx == -1 ? 100 : 3)
                // .style("stroke", (d:Dot)=>selected_idx==-1?"blue":"none")
                selectNode(d)
            })


        simulation
            .nodes(nns)
            .force("collide", d3.forceCollide().strength(.5).radius(this.node_r * 1.1).iterations(3))
            .force("forceX", d3.forceX().strength(.1).x((d: Dot) => this.getForceX(d.attr)))
            .force("forceY", d3.forceY().strength(.1).y((d: Dot) => this.getForceY(d.attr)))
            .on("tick", ticked);
        let nodes = this.nodes
        function ticked() {
            nodes.attr("cx", function (d: any) { return d.x || 0; })
                .attr("cy", function (d: any) { return d.y || 0; })
        }
    }
    render() {
        let { nns, attr_names, selected } = this.state
        let margin: number = 5
        let bar_a: number = 360 / attr_names.length
        let bar_w: number = 15

        let selected_nns = selected.map((name: string) => {
            return nns.filter((nn) => nn.name == name)[0]
        })

        let bars: JSX.Element[][] = selected_nns
            .map((data: Dot, idx: number) => {
                return data.attr.map((attr: number, attr_i: number) => {
                    return <g>
                        <path key={`point_${idx}_attr_${attr_i}_bg`}
                            d={
                                this.arc(0, 0,
                                    this.r + margin + (bar_w + margin) * idx + bar_w / 2,
                                    bar_a * attr_i,
                                    bar_a * (attr_i + 1) - margin)
                            }
                            fill="none"
                            strokeWidth={bar_w}
                            opacity="0.5"
                            stroke="gray">
                        </path>
                        <path key={`point_${idx}_attr_${attr_i}`}
                            d={
                                this.arc(0, 0,
                                    this.r + margin + (bar_w + margin) * idx + bar_w / 2,
                                    bar_a * attr_i,
                                    bar_a * attr_i + (bar_a - margin) * attr / 100)
                            }
                            fill="none"
                            strokeWidth={bar_w}
                            stroke={getColor(data.name)}>
                        </path>
                    </g>
                })
            })

        let axis: JSX.Element[] = attr_names.map((attr: string, i: number) => {
            return <g>
                <path key={`axis_${attr}`}
                    d={this.arc(0, 0, this.r + margin, bar_a * i, bar_a * (i + 1) - margin)}
                    fill="none"
                    strokeWidth={2}
                    stroke="gray"
                // stroke={getColor(i.toString())}
                >
                </path>
                <text 
                x={(this.r) * Math.cos((bar_a*i-45)/180*Math.PI)} 
                y={(this.r) * Math.sin((bar_a*i-45)/180*Math.PI)}
                >
                {attr}
                </text>
            </g>
        })
        console.log(selected_nns, this.state)
        // let dots: JSX.Element[] = datum.map((data: { [key: string]: any }, i: number) => {
        //     return <circle
        //         className="dot"
        //         r="10" fill={getColor("dot")}
        //         key={`point_${i}`}>
        //     </circle>
        // })
        return <svg width="1000" height="1000">
            <g
            className="compareView1"
            transform={`translate(${this.r * 2}, ${this.r * 2}) `}
        >
            <circle r={this.r} fill="none" stroke="gray">
            </circle>
            {bars}
            {axis}
            {/* {dots} */}
            </g>
        </svg>
    }
}