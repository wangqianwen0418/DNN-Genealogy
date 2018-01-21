import * as React from "react";
import "./SunBurst.css"
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
    radius: number,
    tittle: string,
    idx: number
}

export default class SunBurst extends React.Component<Arc_props, {}> {
    render() {
        let { pos, tittle, data, radius, idx } = this.props

        let arc = d3.arc()

        let partition = d3.partition()
            .size([2 * Math.PI, radius]);

        let node2arc = (d: any) => {
            return {
                startAngle: d.x0,
                endAngle: d.x1,
                padAngle: 0,
                innerRadius: d.y0,
                outerRadius: d.y1
            }
        }

        let root = d3.hierarchy(data)
            .sum((d: any) => d.value)

        let arc_datum = partition(root).descendants().filter(d => d.depth > 0)

        let arcs = arc_datum.map((arc_d: any, i) => {
            let d = arc(node2arc(arc_d))
            let name = arc_d.data.name

            // let startAngle = arc_d.x0
            // let endAngle = arc_d.x1
            return <g className="arc">
                <path
                    d={d || ""}
                    fill={getColor(name, idx + 1)}
                    stroke="white"
                    strokeWidth="2"
                    key={`arc_${name}`}
                    id={`arc_${name}`}
                // style={{filter:"url(#shadow)"}}
                >
                </path>
                {/* <text
                    // x={radius * Math.cos((startAngle + endAngle) / 2 - Math.PI / 2)}
                    // y={radius * Math.sin((startAngle + endAngle) / 2 - Math.PI / 2)}
                >
                <textPath xlinkHref={`#arc_${name}`}>
                    {name}
                    </textPath>
                </text> */}
            </g>
        })


        return <div className="SunBurst">
            <svg width={pos[2]} height={pos[3]}>
                <defs>
                    <filter id="shadow">
                        <feGaussianBlur in="alpha-channel-of-feDropShadow-in"
                            stdDeviation={8} />
                        <feOffset dx={4} dy={8}
                            result="offsetblur" />
                        <feFlood floodColor="flood-color-of-feDropShadow"
                            floodOpacity="flood-opacity-of-feDropShadow" />
                        <feComposite in2="offsetblur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="in-of-feDropShadow" />
                        </feMerge>
                    </filter>
                </defs>
                <g className="donut" transform={`translate(${pos[0]}, ${pos[1]})`}>
                    {arcs}
                </g>
                <text fontSize="10" textAnchor="middle"
                    transform={`translate(${pos[0]}, ${radius * 1.3 + pos[3] / 2})`}
                >
                    {tittle}
                </text>
            </svg>
        </div>
    }
}

