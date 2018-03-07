import { Menu, Icon, Card } from 'antd';
import "./Train.css"
import * as React from "react";
import axios from 'axios';

const SubMenu = Menu.SubMenu;


export interface Props{
    treeType:string;
    onSelect:(node:string)=>void
}
export interface State{
    menuData: any
}

export default class Sider extends React.Component<Props, State>{
  // submenu keys of first level
  constructor(props:Props){
      super(props)
      this.state = {
        menuData:[]
      }
  }
  async getData() {
    let res = await axios.get('../../data/train.json')
    this.setState({ menuData: res.data })
}
//   onOpenChange = (openKeys:string[]) => {
//     const latestOpenKey = openKeys.find((key:string) => this.state.openKeys.indexOf(key) === -1)||'';
//     if (this.rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
//       this.setState({ openKeys });
//     } else {
//       this.setState({
//         openKeys: latestOpenKey ? [latestOpenKey] : [],
//       });
//     }
//   }
  componentWillMount(){
      this.getData()
  }
  render() {
    let menu = this.state.menuData.map((subMenu:any)=>{
        return <SubMenu key={subMenu.name} title={<span className="sub1">{subMenu.name}</span>}>
        {subMenu.children.map((menuItem:any)=>{
            return <SubMenu key={menuItem.name} title={<span className="sub2">{menuItem.name}</span>}>
                <Menu.Item>
                    {menuItem.url}
                </Menu.Item>
            </SubMenu>
        })}
        </SubMenu>
    })
    return (
        <Card 
        bordered={false}
        title={<span style={{fontSize:"1.2em"}}>Training</span>} 
        className="View ViewBottom"
        >
      <Menu
        mode="inline"
        defaultOpenKeys={[]}
        // onOpenChange={this.onOpenChange}
      >
        {menu}
      </Menu>
      </Card>
    );
  }
}
