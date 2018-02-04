
import * as React from 'react';
import "./App.css";
// import SiderBar from "../containers/SideBar";
// import MultiSunBurst from "./MultiSunBurst";
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
                <Header><div className="header">DNN Genealogy</div></Header>
                <Content>
                    <Col span={12}> <SimpleTree treeType="Architecture" /> </Col>
                    <Col span={12}> <SimpleTree treeType="Training" /> </Col>
                </Content>
                <Content>
                    <Col span={10}> <CorpusCompare models={[]}/> </Col>
                    <Col span={10}> <Evolution /> </Col>
                    <Col span={4}> <Evolution /> </Col>
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