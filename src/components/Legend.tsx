import * as React from "react";
import { getColor } from "../helper/index";

export interface LegendProps{
    items:Items,
    selectItem: (key:string, op:"click"|"hover")=>void
}
export interface Items{
    [key:string]:Item
}
export interface Item{
    name: string,
    key: string,
    click: boolean,
    hover: boolean
}
export default class Legend extends React.Component<LegendProps, {}>{
    render(){
        let {items, selectItem} = this.props
        // everClick:boolean = false
        // Object.keys(items).forEach((key:string)=>{
        //     let item = items[key]
        //     if(item.click){everClick=true}
        // })
        let everClick = false
        Object.keys(items).forEach(k=>{
            let item = items[k]
            if(item.click)everClick=true
        })
        return <ul>
            {Object.keys(items).map((key:string)=>{
                let item = items[key]
                return <li>
                <div style={{
                    width: item.hover?"13px":"10px",
                    height: item.hover?"13px":"10px",
                    float:"left",
                    position:"relative",
                    top:"4px",
                    marginRight:"3px",
                    backgroundColor:(item.click||!everClick)?getColor(item.key):"gray"
                }}
                onClick={()=>{
                    selectItem(item.key, "click")
                }}
                onMouseEnter={()=>{
                    selectItem(item.key, "hover")
                }}
                onMouseLeave={()=>{
                    selectItem(item.key, "hover")
                }}
                />
                {item.name}
                </li>
            })}
            </ul>
    }
}