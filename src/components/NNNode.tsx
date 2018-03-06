import * as React from "react";
import { Node } from "../types";
import BoxPlot from "./BoxPlot";
import { Button, Dropdown, Menu, Tooltip, Tabs } from "antd";
import * as d3 from "d3";
const TabPane = Tabs.TabPane

const margin = 40, nodeH = 20, nodeW = 100, labelL = 10,
    expandH = 150, expandW = 200,
    boxH = 10,
    labelFont = 12



export interface Props {
    node: Node,
    selected: boolean,
    isTop: boolean,
    zoomed: boolean,
    apiArr: number[],
    selectNode: (node: Node) => void
}


export default class NNNode extends React.Component<Props, {}>{
    render() {
        let { node, zoomed, selected, isTop, selectNode, apiArr } = this.props,
            tooLong: boolean = node.label.length > labelL,
            bg: JSX.Element | any = (node.variants.length > 0 && !zoomed)? <rect width={node.width} height={node.height}
                className="NodeBg"
                transform={`translate(${zoomed ? 8 : 4}, ${zoomed ? -8 : -4})`}
                rx={1}
                ry={1}
                fill="white"
                stroke={"gray"}
                strokeWidth={1.5}
            /> : []

        return <g key={node.label} className="Node"
            transform={`translate (${node.x - node.width / 2}, ${node.y - node.height / 2})`}
            onClick={(e:React.MouseEvent<any>) => {
                e.stopPropagation()
                selectNode(node)
            }}>
            {bg}
            <rect width={node.width} height={node.height}
                className="Node"
                rx={1}
                ry={1}
                fill="white"
                stroke={zoomed ? "none" : (isTop ? "#7dc1f2" : "gray")}
                strokeWidth={selected ? 3 : (isTop ? 3 : 1.5)}
                cursor="pointer"
            ></rect>
            {zoomed ?
                <g/>:
                <g>
                    <Tooltip title={tooLong ? node.label : null}><text textAnchor="middle"
                        fontSize={0.7 * nodeH}
                        cursor="pointer"
                        x={node.width / 2}
                        y={node.height - 0.1 * nodeH}
                    >
                        {
                            tooLong ? (node.label.slice(0, labelL) + '...') : node.label
                        }
                    </text>
                    </Tooltip>
                    {/* <BoxPlot
                        width={nodeW} height={boxH}
                        datum={apiArr}
                        key={node.label}
                        value={node.api || 0}
                        offset={[0, nodeH + boxH / 2]}
                    /> */}
                </g>
            }
        </g>
    }
}