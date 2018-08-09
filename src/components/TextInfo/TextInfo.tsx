import * as React from 'react'
import { Card, Layout } from 'antd'
import { NN, NodeTextInfo } from 'types'
import axios from 'axios'
import './TextInfo.css'

const { Content } = Layout;

export interface Props{
    database: string,
    selectedNN: NN,
    op: number
}

export interface State{
    textinfo: NodeTextInfo[]
}

export default class TextInfo extends React.Component<Props, State>{
    constructor(props: Props) {
        super(props)
        this.state = { textinfo:[] }
        this.getData = this.getData.bind(this)
    }

    async getData() {
        let res = await axios.get('../../data/textInfo.json'),
            textinfo = res.data
        this.setState({ textinfo })
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        /*if (nextProps.op === 2) {
            return true
        } else {
            return false
        }*/

        // always update
        return true;
    }

    componentWillMount() {
        this.getData()
    }

    render(){
        let {selectedNN} = this.props
        
        if (selectedNN.ID) {
            let currentNN: NodeTextInfo = this.state.textinfo[selectedNN.ID]
            let links = currentNN.links.map(
                (d, i) => <div className="TextInfo-Link" key={i}><a href={d[1]}>{d[0]}</a></div>
            )
            return (
                <Card
                    bordered={false}
                    title={<span style={{fontSize:'1.2em'}}>{currentNN.fullname}</span>}
                    className="TextInfo View ViewBottom"
                    bodyStyle={{height: 'calc(100% - 48px)', overflow: 'auto'}}
                >
                    <div
                        className="TextInfo-Content"
                    >
                        <div className="TextInfo-Description">
                            {currentNN.info}
                        </div>
                        <div className="TextInfo-Links">
                            {links}
                        </div>
                        {currentNN.code?'Code:':''}<br/>
                        {currentNN.code?currentNN.code.map((d,i)=>(
                            <div className="TextInfo-Link" key={i}><a href={d[1]}>{d[0]}</a></div>
                        )):<div/>}
                    </div>
                </Card>)
        } else {
            return (
                <Card
                    bordered={false}
                    className="TextInfo View ViewBottom"
                />)
        }
    }
}