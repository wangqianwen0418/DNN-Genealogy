import * as React from "react";
import { Button, Dropdown, Menu, Tooltip, Tabs, Icon } from "antd";
import { Transition } from "react-transition-group";
import { Node } from "../types";
const TabPane = Tabs.TabPane
const defaultStyle = {
    transition: `opacity 1000ms ease-in-out`,
    opacity: 0
}

const transitionStyles = {
    entering: { opacity: 0 },
    entered: { opacity: 1 },
    exited: { opacity: 0 }
}

export interface Props {
    node: Node,
    selected: boolean,
    margin: number,
    scale: number,
    duration: number,
    // isTop: boolean,
    zoomed: boolean,
    transX:number,
    transY:number,
    // apiArr: number[],
    selectNode: (node: Node) => void,
    onclickMenu: (node: Node, menu: string) => void,    
    pinNode:(node:Node)=>void
}

export interface State{
    showpin:boolean;
    pin:boolean;
}

export default class ExtendNode extends React.Component<Props, State>{
    constructor(props:Props){
        super(props)
        this.state={
            showpin:false,
            pin:false
        }
    }
    render() {
        let { node, margin, selected, scale, duration, zoomed, selectNode, onclickMenu, pinNode, transX, transY } = this.props
        {/* <div style={{ height: node.height }}>
            <img
                className="abstract Node"
                src={`../../images/${node.label}.png`}
                //    height={node.height}
                width={zoomed ? node.width : 0}
            />

        </div> */}
        let {showpin, pin} = this.state

        let onclick = function(item :{ key: string }) {
            console.log('click')
            onclickMenu(node, item.key)
        }
        const menu = (
            <Menu onClick={onclick}>
                <Menu.Item key="text">text intro</Menu.Item>
                <Menu.Item key="compare">compare performance</Menu.Item>
                <Menu.Item key="detailed">detailed structure</Menu.Item>
            </Menu>
        )

        return <Transition in={zoomed} timeout={duration}>
            {(status: any) => {
                return <div className="ExtendNode Node"
                    onClick={(e:React.MouseEvent<any>) => {
                        e.stopPropagation()
                        e.preventDefault()
                        selectNode(node)
                    }}
                    onMouseEnter={()=>this.setState({showpin:true})}
                    onMouseLeave={()=>this.setState({showpin:false})}
                    // onMouseOut={()=>this.setState({showpin:false})}
                    style={{
                        position: "absolute",
                        left: transX + node.x * scale - node.width * scale / 2,
                        top: transY + node.y * scale - node.height * scale / 2,
                        backgroundColor: "white",
                        
                        height:  node.height * scale - margin,
                        width: node.width * scale,
                        ...defaultStyle,
                        ...transitionStyles[status]
                    }}>
                    <Tabs defaultActiveKey="0" >
                        <TabPane tab={node.label} key="0">
                            <img
                                className="abstract"
                                src={`../../images/${node.label}.png`}
                                style={{
                                    border: `1px solid ${selected?"red":"gray"}`,
                                }}
                                //   height={node.height}
                                width={node.width * scale}
                            />
                        </TabPane>
                        {node.variants.map((d: any, i: number) => {
                            return <TabPane tab={d.ID} key={`${i + 1}`}>
                                <img
                                    className="abstract Node"
                                    src={`../../images/${node.label}.png`}
                                    style={{border: `1px solid ${selected?"red":"none"}`,}}
                                    //   height={node.height}
                                    width={node.width * scale}
                                />
                            </TabPane>
                        })}
                    </Tabs>
                    <Icon className="pin" type="pushpin" 
                    style={{
                        opacity: pin||showpin?1:0,
                        color: pin?"red":"gray"
                    }}
                    onClick={(e:React.MouseEvent<any>)=>{
                        let {pin} = this.state
                        e.stopPropagation()
                        e.preventDefault()
                        this.setState({pin:!pin})
                        pinNode(node)
                        
                        }}/>
                    <Dropdown overlay={menu} className="infoButton">
                    <a className="infoTrigger">more<Icon type="down" /></a>
                </Dropdown> 
                </div>
            }}

        </Transition>
    }
}