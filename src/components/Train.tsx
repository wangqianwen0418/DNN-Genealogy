import { Tabs, Collapse, Icon, Card } from 'antd';
import "./Train.css"
import * as React from "react";
import axios from 'axios';

const TabPane = Tabs.TabPane
const Panel = Collapse.Panel;


export interface Props {
    treeType: string;
    onSelect: (node: string) => void
}
export interface State {
    tabsData: any,
    current: string
}

export default class Train extends React.Component<Props, State>{
    // submenu keys of first level
    constructor(props: Props) {
        super(props)
        this.state = {
            tabsData: [],
            current: ''
        }
    }
    async getData() {
        let res = await axios.get('../../data/train.json')
        this.setState({ tabsData: res.data })
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
    changeTab(key: string) {

    }
    componentWillMount() {
        this.getData()
    }
    render() {
        let panes = this.state.tabsData.map((tab: any, i: number) => {
            return <TabPane tab={tab.name} key={i} 
            className="Train"
            style={{
                overflowY:"auto",
                height:"inherit"
                }}
                >
                <Collapse bordered={false} >
                {tab.children.map((pane:any)=>{
                    console.info(tab.name, pane.name)
                    return <Panel header={pane.name} key={pane.name}>
                    <p>{pane.url}</p>
                </Panel>
                })}
                </Collapse>
            </TabPane>
        })
        return (
            <Card
                bordered={false}
                title={<span style={{ fontSize: "1.2em" }}>Training</span>}
                className="View ViewBottom"
            >
                <Tabs onChange={this.changeTab}>
                    {panes}
                </Tabs>
            </Card>
        );
    }
}
