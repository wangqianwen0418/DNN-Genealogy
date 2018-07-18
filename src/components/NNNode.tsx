import * as React from 'react';
import { Node } from '../types';
import BoxPlot from './BoxPlot';
import { Button, Dropdown, Menu, Tooltip, Tabs } from 'antd';
import * as d3 from 'd3';
import { getColor, capFirstLetter,cutLabel } from '../helper';
const TabPane = Tabs.TabPane

const margin = 40, nodeH = 20, nodeW = 100, labelL = 4,
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
    show:boolean,
    selectNode: (node: Node) => void,
    
}

export default class NNNode extends React.Component<Props, {}>{
    private dragFlag: boolean = false
    constructor(props: Props) {
        super(props)
        this.mouseDown = this.mouseDown.bind(this)
        this.mouseMove = this.mouseMove.bind(this)
        this.mouseUp = this.mouseUp.bind(this)
    }
    // prevent drag trigger the onclick event
    mouseDown(e: React.MouseEvent<any>) {
        this.dragFlag = false
        document.addEventListener('mousemove', this.mouseMove)
    }
    mouseMove(e: MouseEvent) {
        this.dragFlag = true
    }
    mouseUp(e: React.MouseEvent<any>, node: Node) {
        document.removeEventListener('mousemove', this.mouseMove)
        if (!this.dragFlag) {
            this.props.selectNode(node)
        } else {
            this.dragFlag = false
        }
    }
    render() {
        let { node, zoomed, selected, isTop, hovered, selectNode, apiArr, transX, transY, scale, show} = this.props,
            bg: JSX.Element | any = 
            (node.variants.length > 0 && !zoomed) ? 
            (
            <rect 
                width={node.width * scale} 
                height={node.height * scale}
                className="NodeBg"
                transform={`translate(${zoomed ? 8 : 4}, ${zoomed ? -8 : -4})`}
                rx={1}
                ry={1}
                fill="white"
                stroke={hovered ? '#111' : 'gray'}
                strokeWidth={1.5}
            />
            ) : [],
            arc:string[]=node.arc,
            arcNum = arc.length
        
        // a trick. calculate position
        // if assign transX, transY, scale to another group, the transition animiation will be wired
        
        return (
        <g 
            id={`nnnode_${node.ID}`} 
            key={node.label} 
            className="NNNode Node"
            transform={`translate (
                ${(node.x - node.width / 2) * scale + transX}, 
                ${(node.y - node.height / 2) * scale + transY}
            )`}
            onMouseDown={this.mouseDown}
            onMouseUp={(e) => { this.mouseUp(e, node) }}
            opacity={show?1:.2}

        >
            <g className={`Node ${hovered ? 'pop' : 'no'}`}>
                {bg}
                <g>
                    <rect
                        className="Node bounder"
                        width={node.width * scale} 
                        height={node.height * scale}
                        // rx={1}
                        // ry={1}
                        fill={'white'}
                        stroke={hovered ? '#111' : 'gray'}
                        // opacity={zoomed?0:1}
                        // stroke={zoomed ? "none" : (isTop ? "#7dc1f2" : "gray")}
                        // strokeWidth={hovered ? 2 : 1.5}
                        strokeWidth={1.5}
                        cursor="pointer"
                    />
                    {<g>
                        {arc.map((key, i)=>{
                            return <rect
                                key={key}
                                className="arcIcon Node"
                                y={node.height * scale * i /arcNum}
                                width={node.width * scale * 0.2} 
                                height={node.height * scale /arcNum}
                                fill={zoomed ? 'none' : getColor(key)}
                            />
                        })}
                        {/* <rect
                        className="perIcon"
                        x={node.width * scale * 0.2}
                        y={node.height * scale * 0.8}
                        width={node.width * scale * 0.8} height={node.height * scale * 0.2}
                        fill={zoomed ? "none" : getColor('unkonw')}
                    /> */}
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
                            {capFirstLetter(cutLabel(node.label, labelL))
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
        )

    }
}