
import * as React from 'react';
import "./App.css";
// import SiderBar from "../containers/SideBar";
import Graph from "../containers/Graph";

// import { Row, Col} from 'antd';

class App extends React.Component{
    
    render() {
        return (
            <div className="app" >
                <div className="header" style={{ width: "100vw", height: "70px" }}>Model Picker</div>
                <Graph  />
            </div>
        );
    }
}

export default App;

// helpers

// function getExclamationMarks(numChars: number) {
//     return Array(numChars + 1).join('!');
// }