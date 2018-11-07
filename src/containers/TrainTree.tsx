import Train from '../components/TrainInfo/';
import * as actions from '../actions/';
import { StoreState } from '../types/index';
import { connect, Dispatch } from 'react-redux';

export function mapStateToProps(state:StoreState) {
    return {
        treeType:'Train',
        selectedNN: state.selectedNN,
        trainInfo: state.trainInfo
    };
}

export function mapDispatchToProps(dispatch: Dispatch<actions.SelectTrain>) {
    return {
        onSelect:(arcNode:string)=>{dispatch(actions.selectTrain(arcNode))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Train);