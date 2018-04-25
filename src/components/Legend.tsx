import * as React from "react";
import { getColor } from "../helper/index";
import { Popover } from "antd";

const info = {
    "streamlined": "layers are stacked on top of one another",
    "multi-branch": "the output of one layer goes through multiple branches and then converges",
    "skip connections": "a connection skips one or more layers",
    "depthwise separable conv": "a depthwise convolution and a 1x1 convolution called a pointwise convolution",
    "stacked": "",
    "bidirectional": "",
    "multiple time scale": "",
    "tree-structured": "",
    "gated": ""
}

export interface LegendProps {
    items: Items,
    selectItem: (key: string, op: "click" | "hover") => void
}
export interface Items {
    [key: string]: Item
}
export interface Item {
    name: string,
    key: string,
    click: boolean,
    hover: boolean
}
export default class Legend extends React.Component<LegendProps, {}>{
    render() {
        let { items, selectItem } = this.props
        // everClick:boolean = false
        // Object.keys(items).forEach((key:string)=>{
        //     let item = items[key]
        //     if(item.click){everClick=true}
        // })
        return <ul>
            {Object.keys(items).map((key: string) => {
                let item = items[key]
                return <Popover
                    placement="left"
                    title={item.name}
                    content={
                        <div style={{ width: '150px' }}>
                            <img
                                src={`../../images/types/${item.name}.png`}
                                width='100%'
                            />
                            <div>{info[item.name]}</div>
                        </div>
                    }
                >
                    <li style={{float:"left", clear:"left"}}>
                        <div onClick={() => {
                            selectItem(item.key, "click")

                            }}
                            onMouseEnter={() => {
                                selectItem(item.key, "hover")
                            }}
                            onMouseLeave={() => {
                                selectItem(item.key, "hover")
                            }}
                            style={{cursor: "pointer"}}>
                            <div style={{
                                width: item.hover ? "13px" : "10px",
                                height: item.hover ? "13px" : "10px",
                                float: "left",
                                position: "relative",
                                top: "4px",
                                marginRight: "3px",
                                backgroundColor: item.click ? "gray" : getColor(item.key)
                            }}
                            />
                            <span style={{ fontSize: item.hover ? "12px" : "9px" }}>
                                {item.name}
                            </span>
                        </div>
                    </li>
                </Popover>
            })}
        </ul>
    }
}