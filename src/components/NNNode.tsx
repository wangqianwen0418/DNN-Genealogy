import * as React from "react";
import { Node } from "../types";
import BoxPlot from "./BoxPlot";
import { Button, Dropdown, Menu, Tooltip, Tabs } from "antd";
import * as d3 from "d3";
import { getColor } from "../helper";
const TabPane = Tabs.TabPane

const margin = 40, nodeH = 20, nodeW = 100, labelL = 6,
    expandH = 150, expandW = 200,
    boxH = 10,
    labelFont = 12



export interface Props {
    node: Node,
    selected: boolean,
    isTop: boolean,
    zoomed: boolean,
    hovered: boolean,
    apiArr: number[],
    transX: number,
    transY: number,
    scale: number,
    selectNode: (node: Node) => void
}


export default class NNNode extends React.Component<Props, {}>{
    private dragFlag: boolean = false
    constructor(props: Props) {
        super(props)
        this.mouseDown = this.mouseDown.bind(this)
        this.mouseMove = this.mouseMove.bind(this)
        this.mouseUp = this.mouseUp.bind(this)
    }
    //prevent drag trigger the onclick event
    mouseDown(e: React.MouseEvent<any>) {
        this.dragFlag = false
        document.addEventListener("mousemove", this.mouseMove)
    }
    mouseMove(e: MouseEvent) {
        this.dragFlag = true
    }
    mouseUp(e: React.MouseEvent<any>, node: Node) {
        document.removeEventListener("mousemove", this.mouseMove)
        if (!this.dragFlag) {
            this.props.selectNode(node)
        } else {
            this.dragFlag = false
        }
    }
    render() {
        let { node, zoomed, selected, isTop, hovered, selectNode, apiArr, transX, transY, scale } = this.props,
            tooLong: boolean = node.label.length > labelL,
            bg: JSX.Element | any = (node.variants.length > 0 && !zoomed) ? <rect width={node.width * scale} height={node.height * scale}
                className="NodeBg"
                transform={`translate(${zoomed ? 8 : 4}, ${zoomed ? -8 : -4})`}
                rx={1}
                ry={1}
                fill="white"
                stroke={hovered ? "#111" : "gray"}
                strokeWidth={1.5}
            /> : [],
            arc:string[]=node.arc,
            arc_num = arc.length
        let capFirstLetter = (name: string) => {
            return name.charAt(0).toUpperCase() + name.slice(1)
        }
        //a trick. calculate position
        //if assign transX, transY, scale to another group, the transition animiation will be wired
        
        return <g key={node.label} className="Node"
            transform={`translate (${(node.x - node.width / 2) * scale + transX}, ${(node.y - node.height / 2) * scale + transY})`}
            onMouseDown={this.mouseDown}
            onMouseUp={(e) => { this.mouseUp(e, node) }}

        >
            <g className={`Node ${hovered ? "pop" : 'no'}`}>
                {bg}
                <g>
                    <rect
                        className="Node"
                        width={node.width * scale} height={node.height * scale}
                        // rx={1}
                        // ry={1}
                        fill={"white"}
                        stroke={hovered ? "#111" : "gray"}
                        // opacity={zoomed?0:1}
                        // stroke={zoomed ? "none" : (isTop ? "#7dc1f2" : "gray")}
                        // strokeWidth={hovered ? 2 : 1.5}
                        strokeWidth={1.5}
                        cursor="pointer"
                    ></rect>
                    {<g>
                        {arc.map((key, i)=>{
                            return <rect
                            className="arcIcon Node"
                            y={node.height * scale * i /arc_num}
                            width={node.width * scale * 0.2} height={node.height * scale /arc_num}
                            fill={zoomed ? "none" : getColor(key)}
                        />
                        })}
                        <rect
                        className="perIcon"
                        x={node.width * scale * 0.2}
                        y={node.height * scale * 0.8}
                        width={node.width * scale * 0.8} height={node.height * scale * 0.2}
                        fill={zoomed ? "none" : getColor('unkonw')}
                    />
                    </g>}
                                   
                </g>
            </g>
            {zoomed ?
                <g /> :
                <Tooltip
                    title={node.fullname}
                    mouseEnterDelay={0.2}
                // title={tooLong ? node.label : null}
                ><g>

                        <text
                            className="Node"
                            textAnchor="middle"
                            fontSize={0.7 * node.height * scale}
                            cursor="pointer"
                            x={node.width * scale * 0.6}
                            y={.8 * node.height * scale}
                        >
                            {
                                capFirstLetter(tooLong ? (node.label.slice(0, labelL) + '...') : node.label)
                            }
                        </text>
                        {/* <BoxPlot
                        width={nodeW} height={boxH}
                        datum={apiArr}
                        key={node.label}
                        value={node.api || 0}
                        offset={[0, nodeH + boxH / 2]}
                    /> */}
                    </g>
                </Tooltip>
            }
        </g>

    }
}