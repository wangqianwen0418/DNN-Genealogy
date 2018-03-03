// src/reducers/index.tsx

import { AllActions } from '../actions';
import { StoreState } from '../types';
import { SELECT_APP, SELECT_ARC, SELECT_TRAIN, SELECT_NN } from '../constants';

export function reducer(state: StoreState, action: AllActions): StoreState {
  switch (action.type) {
    // case INCREMENT_ENTHUSIASM:
    
    //   return { ...state, enthusiasmLevel:state.enthusiasmLevel+1 };
    // case DECREMENT_ENTHUSIASM:
    //   return { ...state, enthusiasmLevel:state.enthusiasmLevel-1 };
    case SELECT_APP:  
      return { ...state, app:action.node}
    case SELECT_ARC:  
      return { ...state, arc:action.node}
    case SELECT_TRAIN:  
      return { ...state, train:action.node}
    case SELECT_NN:
      return { ...state, nn:action.nn}
    default:
      return state;
  }
}