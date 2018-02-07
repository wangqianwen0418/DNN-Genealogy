
import * as React from 'react';
import "./App.css";
// import SiderBar from "../containers/SideBar";
// import MultiSunBurst from "./MultiSunBurst";
import TextInfo from "./TextInfo";
import Evolution from "./Evolution";
import SimpleTree from "./SimpleTree";
import CorpusCompare from "./CorpusCompare";
// import Navi from "./Navi";
import { Col, Layout } from 'antd';
const { Header, Content } = Layout;

class App extends React.Component{
    selectedFilters = ['', '', '', '']
    onChildrenChanged(filter: string, newState: string) {
        const taxonomy = ['Application', 'Architecture', 'Training', 'Corpus']
        let index = taxonomy.indexOf(filter)
        this.selectedFilters[index] = newState
        this.forceUpdate()
    }
    render() {
        return (
            <div className="app">
                <Header className="header">DNN Genealogy</Header>
                <Content>
                    <Col span={12}> <SimpleTree treeType="Architecture" /> </Col>
                    <Col span={12}> <SimpleTree treeType="Training" /> </Col>
                </Content>
                <Content>
                    <Col span={12}> <Evolution /> </Col>
                    <Col span={8}> <CorpusCompare models={["A", "B"]}/> </Col>
                    <Col span={4}> <TextInfo title="title" content="" /> </Col>
                </Content>
            </div>
        );
    }
}

export default App;

// helpers

// function getExclamationMarks(numChars: number) {
//     return Array(numChars + 1).join('!');
// }