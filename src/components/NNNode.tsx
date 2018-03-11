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
    hovered: boolean,
    apiArr: number[],
    transX:number,
    transY:number,
    scale:number,
    selectNode: (node: Node) => void
}


export default class NNNode extends React.Component<Props, {}>{
    private dragFlag:boolean=false
    constructor(props:Props){
        super(props)
        this.mouseDown = this.mouseDown.bind(this)
        this.mouseMove = this.mouseMove.bind(this)
        this.mouseUp = this.mouseUp.bind(this)
    }
    //prevent drag trigger the onclick event
    mouseDown(e:React.MouseEvent<any>){
        this.dragFlag = false
        document.addEventListener("mousemove", this.mouseMove)
    }
    mouseMove(e:MouseEvent){
        this.dragFlag = true
    }
    mouseUp(e:React.MouseEvent<any>, node:Node){
        document.removeEventListener("mousemove", this.mouseMove)
        if(!this.dragFlag){
            this.props.selectNode(node)
        }else{
            this.dragFlag = false
        }
    }
    render() {
        let { node, zoomed, selected, isTop, hovered, selectNode, apiArr, transX, transY, scale } = this.props,
            tooLong: boolean = node.label.length > labelL,
            bg: JSX.Element | any = (node.variants.length > 0 && !zoomed)? <rect width={node.width*scale} height={node.height*scale}
                className="NodeBg"
                transform={`translate(${zoomed ? 8 : 4}, ${zoomed ? -8 : -4})`}
                rx={1}
                ry={1}
                fill="white"
                stroke={hovered?"#111":"gray"}
                strokeWidth={1.5}
            /> : []
        let capFirstLetter = (name:string)=>{
            return name.charAt(0).toUpperCase() + name.slice(1)
        }
        //a trick. calculate position
        //if assign transX, transY, scale to another group, the transition animiation will be wired
        return <g key={node.label} className="Node"
            transform={`translate (${(node.x - node.width / 2)*scale+transX}, ${(node.y - node.height / 2)*scale+transY})`}
            onMouseDown={this.mouseDown}
            onMouseUp={(e)=>{this.mouseUp(e, node)}}

            >
            {bg}
            <rect width={node.width*scale} height={node.height*scale}                             
                className={`Node ${hovered?"pop":'no'}`}
                rx={1}
                ry={1}
                fill={"white"}
                stroke={hovered?"#111":"gray"}
                // opacity={zoomed?0:1}
                // stroke={zoomed ? "none" : (isTop ? "#7dc1f2" : "gray")}
                // strokeWidth={hovered ? 2 : 1.5}
                strokeWidth={1.5}
                cursor="pointer"
            ></rect>
            {zoomed ?
                <g/>:
                <g>
                    <Tooltip title={tooLong ? node.label : null}>
                    <text 
                    className="Node"
                    textAnchor="middle"
                        fontSize={0.7 * node.height*scale}
                        cursor="pointer"
                        x={node.width*scale / 2}
                        y={.85 * node.height * scale}
                    >
                        {
                            capFirstLetter(tooLong ? (node.label.slice(0, labelL) + '...') : node.label) 
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