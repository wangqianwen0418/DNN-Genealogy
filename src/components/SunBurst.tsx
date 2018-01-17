import * as React from "react";
import * as d3 from "d3";
import { getColor } from "../helper";
export interface Arc {
    name: string,
    value?: number,
    children?: Arc[]
}
export interface Arc_props {
    data: Arc,
    pos: number[],
    tittle: string
}

export default class SunBurst extends React.Component<Arc_props, {}> {
    render() {
        let radius = 100
        // let donutWidth = 30
        let { pos, tittle, data } = this.props

        let arc = d3.arc()

        let partition = d3.partition()
            .size([2 * Math.PI, radius*radius]);

        let node2arc = (d: any) => {
            return {
                startAngle: d.x0,
                endAngle: d.x1,
                padAngle: 0.03,
                innerRadius: Math.sqrt(d.y0),
                outerRadius: Math.sqrt(d.y1)
            }
        }

        let root = d3.hierarchy(data)
            .sum((d: any) => d.value)

        let arc_datum = partition(root).descendants().filter(d=>d.depth>0)

        let arcs = arc_datum.map((arc_d:any, i) => {
            let d = arc(node2arc(arc_d))
            let name = arc_d.data.name

            // let startAngle = arc_d.x0
            // let endAngle = arc_d.x1
            return <g className="arc">
                <path
                    d={d || ""}
                    fill={getColor(name)}
                >
                </path>
                {/* <text
                    textAnchor="middle"
                    x={radius * Math.cos((startAngle + endAngle) / 2 - Math.PI / 2)}
                    y={radius * Math.sin((startAngle + endAngle) / 2 - Math.PI / 2)}
                >
                    {name}
                </text> */}
            </g>
        })


        return <g className="donut" transform={`translate(${pos[0]}, ${pos[1]})`}>
            {arcs}
            <text fontSize="20" textAnchor="middle">{tittle}</text>
        </g>
    }
}