export const IMPORT_MODEL = "IMPORT_MODEL" 
export type IMPORT_MODEL = typeof IMPORT_MODEL

export const SELECT_LAYER = "SELECT_LAYER" 
export type SELECT_LAYER = typeof SELECT_LAYER

export const SELECT_DATABASE = "SELECT_DATABASE"
export type SELECT_DATABASE = typeof SELECT_DATABASE

export const SELECT_ARC = "SELECT_ARC" 
export type SELECT_ARC = typeof SELECT_ARC 

export const SELECT_TRAIN = "SELECT_TRAIN" 
export type SELECT_TRAIN = typeof SELECT_TRAIN 

export const SELECT_APP = "SELECT_APP" 
export type SELECT_APP = typeof SELECT_APP

export const SELECT_NN = "SELECT_NN" 
export type SELECT_NN = typeof SELECT_NN

export const SELECT_NNMOTION = "SELECT_NNMOTION"
export type SELECT_NNMOTION = typeof SELECT_NNMOTION

// style config
export const BG_COLOR="#333";
export const FG_COLOR=["#49a9ee", "#F29C30", "#75C277", "#DA5246"]

export const sequenceDatasets = [],
             nonsequenceDatasets= ['SVHN', 'cifar10', 'cifar100', 'imageNet val top1', 'imagenet val top5']
export let sequenceBenchmarks: any[] = [],
           nonsequenceBenchmarks: any[] = []