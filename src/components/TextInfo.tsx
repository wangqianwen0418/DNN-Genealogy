import * as React from 'react'
import {Card} from 'antd'
import { NN, NodeTextInfo } from '../types'
import axios from 'axios'
import './App.css'
import './TextInfo.css'

export interface Props{
    database: string,
    nn: NN,
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
        let res = await axios.get('../../data/text_info.json'),
            textinfo = res.data
        this.setState({ textinfo })
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        if (nextProps.op === 2) {
            return true
        } else {
            return false
        }
    }

    componentWillMount() {
        this.getData()
    }

    render(){
        let nn = this.props.nn
        
        let p: number = -1
        for (let i in this.state.textinfo) {
            if (this.state.textinfo[i].ID === nn.ID) {
                p = +i
                break
            }
        }

        if (p !== -1) {
            let cur: NodeTextInfo = this.state.textinfo[p]
            let links = this.state.textinfo[p].links.map(
                (d, i) => <div key={i}><a href={d}>{d}</a></div>
            )
            return (
                <Card
                    bordered={false}
                    title={<span style={{fontSize:'1.2em'}}>{nn.ID}</span>}
                    className="TextInfo View ViewBottom"
                >
                    <div className="TextInfo-Description">
                        {cur.info}
                    </div>
                    <div className="TextInfo-Links">
                        {links}
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