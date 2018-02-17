import Evolution from '../components/Evolution3';
import * as actions from '../actions/';
import { StoreState } from '../types/index';
import { connect, Dispatch } from 'react-redux';

export function mapStateToProps(state:StoreState) {
    return {
        arc:state.arc,
        app:state.app,
        train:state.train
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.SelectNN>) {
    return {
        onSelect:(nns:string[])=>{dispatch(actions.selectNN(nns))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Evolution);