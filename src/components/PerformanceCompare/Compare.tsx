import * as React from 'react'
import { NN } from 'types'
import { nonsequenceBenchmarks, sequenceBenchmarks } from 'constants/'
import RadialBoxplot from './RadialBoxplot'
import BarChart from './BarChart'

export interface Props {
    database: string,
    nn: NN,
    op: number
}

export interface States {

}

export default class Comapre9 extends React.Component<Props, States> {
    constructor(props: Props) {
        super(props)
    }

    render() {
        if (this.props.database === 'nonsequence') {
            return <RadialBoxplot database={this.props.database} nn={this.props.nn} op={this.props.op}/>
        } else {
            return <BarChart database={this.props.database} nn={this.props.nn} op={this.props.op}/>
        }
    }
}