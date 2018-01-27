
import * as React from 'react';
import "./App.css";
// import SiderBar from "../containers/SideBar";
import MultiSunBurst from "./MultiSunBurst";
import Evolution from "./Evolution";
import Navi from "./Navi";
import { Col } from "antd";

// import { Row, Col} from 'antd';

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
            <div className="app" >
                <div className="header" style={{ width: "100vw", height: "70px" }}>DNN Genealogy</div>
                <div>
                <Col span={4}>
                    <MultiSunBurst callbackParent={(filter, newState) => this.onChildrenChanged(filter, newState)}/>
                </Col>
                <Col span={20} style={{float: "left"}}>
                    <Navi selected={this.selectedFilters}/>
                    <Evolution/>
                </Col>
                </div>
            </div>
        );
    }
}

export default App;

// helpers

// function getExclamationMarks(numChars: number) {
//     return Array(numChars + 1).join('!');
// }