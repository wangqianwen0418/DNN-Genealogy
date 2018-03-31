let layers: string[] = []

const LAYERCOLORS: string[] = [
    ' #2b637b',
    ' #5fa49f',
    ' #d6767a',
    ' #acda9e',
    ' #ffb054',
    ' #8ecb78',
    ' #ee632a',
    ' #236d56',
    ' #b28582',
    ' #c29880',
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