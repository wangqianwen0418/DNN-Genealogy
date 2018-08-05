import Evolution from '../components/Evolution/';
import * as actions from '../actions/';
import { StoreState } from '../types/index';
import { connect, Dispatch } from 'react-redux'
import { NN } from '../types'

export function mapStateToProps(state:StoreState) {
    return {
        arc:state.arc,
        app:state.app,
        train:state.train
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.SelectNN|actions.SelectNNMotion|actions.SelectDatabase>) {
    return {
        onSelectNN:(currentNNs:NN[], selectedNN: NN)=>{dispatch(actions.selectNN(currentNNs, selectedNN))},
        onSelectNNMotion:(op:number)=>{dispatch(actions.selectNNMotion(op))},
        onSelectDatabase:(db:string)=>{dispatch(actions.selectDatabase(db))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Evolution);