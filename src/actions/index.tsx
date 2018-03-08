import * as constants from '../constants'
import { NN } from '../types'

export interface SelectDatabase{
    type:constants.SELECT_DATABASE,
    db:string
}
export function selectDatabase(db:string):SelectDatabase{
    return {
        type:constants.SELECT_DATABASE,
        db
    }
}

export interface SelectArc{
    type:constants.SELECT_ARC,
    node:string
}
export function selectArc(node:string):SelectArc{
    return {
        type:constants.SELECT_ARC,
        node
    }
}

export interface SelectTrain{
    type:constants.SELECT_TRAIN,
    node:string
}
export function selectTrain(node:string):SelectTrain{
    return {
        type:constants.SELECT_TRAIN,
        node
    }
}

export interface SelectApp{
    type:constants.SELECT_APP,
    node:string
}
export function selectApp(node:string):SelectApp{
    return {
        type:constants.SELECT_APP,
        node
    }
}

export interface SelectNN{
    type:constants.SELECT_NN,
    nn:NN
}
export function selectNN(nn:NN):SelectNN{
    return {
        type:constants.SELECT_NN,
        nn
    }
}

export interface SelectNNMotion{
    type:constants.SELECT_NNMOTION,
    op:number
}
export function selectNNMotion(op:number):SelectNNMotion{
    return {
        type:constants.SELECT_NNMOTION,
        op
    }
}

// export type EnthusiasmAction = IncrementEnthusiasmAction | DecrementEnthusiasmAction
export type AllActions = SelectDatabase|SelectApp|SelectArc|SelectTrain|SelectNN|SelectNNMotion
