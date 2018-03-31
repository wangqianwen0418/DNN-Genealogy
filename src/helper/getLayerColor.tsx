let layers: string[] = []

const LAYERCOLORS: string[] = [
    ' #ef6140',
    ' #cb9c6b',
    ' #be9062',
    ' #907b50',
    ' #9eab7f',
    ' #3e2f31',
    ' #5d7263',
    ' #93c88c',
    ' #d8cd20',
    ' #f5c775',
]

const getLayerColor = (layer: string): string => {
    let idx: number = layers.indexOf(layer)
    let numColor = LAYERCOLORS.length
    if (idx === -1) {
        layers.push(layer)
        return LAYERCOLORS[(layers.length - 1) % numColor]
    } else {
        return LAYERCOLORS[idx % numColor]
    }
}

export default getLayerColor