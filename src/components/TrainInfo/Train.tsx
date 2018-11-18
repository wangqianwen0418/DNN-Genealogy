import { Tabs, Collapse, Icon, Card } from 'antd';
import './Train.css'
import * as React from 'react';
import {TrainItemInfo, TrainInfo} from 'types';

const TabPane = Tabs.TabPane
const Panel = Collapse.Panel;

export interface Props {
    treeType: string;
    dnns: any,
    selectedID: string,
    trainInfo: TrainInfo[],
    onSelect: (node: string) => void
}
export interface State {
    // tabsData: any,
    // current: string
}

export default class Train extends React.Component<Props, State>{
    // submenu keys of first level
    // constructor(props: Props) {
    //     super(props)
    //     // this.state = {
    //     //     tabsData: [],
    //     //     current: ''
    //     // }
    // }
    // async getData() {
    //     let res = await axios.get('../../data/train.json')
    //     this.setState({ tabsData: res.data })
    // }
    // //   onOpenChange = (openKeys:string[]) => {
    // //     const latestOpenKey = openKeys.find((key:string) => this.state.openKeys.indexOf(key) === -1)||'';
    // //     if (this.rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
    // //       this.setState({ openKeys });
    // //     } else {
    // //       this.setState({
    // //         openKeys: latestOpenKey ? [latestOpenKey] : [],
    // //       });
    // //     }
    // //   }
    // // changeTab(key: string) {

    // // }

    // componentWillMount() {
    //     this.getData()
    // }
    highlight(a:TrainItemInfo){
        let dnn = this.props.dnns.filter((nn:any)=>nn.ID == this.props.selectedID)[0]
        let nnTrainInfo = dnn? dnn.training : []
        
        let flag = 0
        if (a.highlight){
            flag = 1
        }else{
            nnTrainInfo.forEach((item: string)=>{
                item = item.toLowerCase()
                if (item.includes(a.name.toLowerCase())){
                    flag = 1
                }
            })
        }
        return flag
    }
    render() {
        
        let panes = this.props.trainInfo.map((tab: any, i: number) => {

            return (
                <TabPane
                    tab={tab.name}
                    key={i}
                    className="Train"
                    style={{ height: 'calc(100% - 25px)', overflow: 'auto' }}
                >
                    <Collapse bordered={false}>
                        {
                            tab.children
                            .sort((a: TrainItemInfo, b: TrainItemInfo) => {
                                return this.highlight(b) - this.highlight(a) // put the highlight item in the front
                            }).map((pane: any) => {
                                let paneStyle: React.CSSProperties = this.highlight(pane) ? { fontWeight: "bold" } : {}
                                return <Panel
                                    header={
                                        <span style={paneStyle}>{pane.name}</span>
                                    }
                                    key={pane.name}>

                                    {pane.latex ?
                                        <div style={{ marginTop: '15px' }}>
                                            <img
                                                src={'http://latex.codecogs.com/gif.latex?\\begin{align*}'
                                                    + pane.latex + '\\end{align*}'}
                                            />
                                        </div>
                                        :
                                        <div />
                                    }
                                    <div>{pane.info}</div>
                                    <a href={pane.url}>{pane.url}</a>
                                </Panel>
                            })}
                    </Collapse>
                </TabPane>
            )
        })
        return (
            <Card
                bordered={false}
                title={<span style={{ fontSize: '1.2em' }}>Training</span>}
                className="View ViewBottom"
                bodyStyle={{ height: 'calc(100% - 48px)' }}
            >
                <Tabs
                    // onChange={this.changeTab} 
                    className="train"
                    style={{ height: '100%' }}
                    activeKey={'1'}
                >
                    {panes}
                </Tabs>
            </Card>
        );
    }
}
