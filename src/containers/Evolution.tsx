import Evolution from '../components/Evolution3';
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

export function mapDispatchToProps(dispatch: Dispatch<actions.SelectNN>) {
    return {
        onSelectNN:(nn:NN)=>{dispatch(actions.selectNN(nn))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Evolution);