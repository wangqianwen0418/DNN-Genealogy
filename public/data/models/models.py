import keras
from keras.layers import Input, Conv2D, MaxPooling2D, ZeroPadding2D, Flatten, Dense, Activation, Dropout, merge, Lambda
from keras.models import Model
import keras.backend as K
import json

def crosschannelnormalization(alpha=1e-4, k=2, beta=0.75, n=5, **kwargs):
    """
    This is the function used for cross channel normalization in the original
    Alexnet
    """

    def f(X):
        # b, ch, r, c = X.shape
        # half = n // 2
        # square = K.square(X)
        # extra_channels = K.spatial_2d_padding(K.permute_dimensions(square, (0, 2, 3, 1))
        #                                       , (0, half))
        # extra_channels = K.permute_dimensions(extra_channels, (0, 3, 1, 2))
        # scale = k
        # for i in range(n):
        #     scale += alpha * extra_channels[:, i:i + ch, :, :]
        # scale = scale ** beta
        # return X / scale
        return X

    return Lambda(f, output_shape=lambda input_shape: input_shape, **kwargs)


def splittensor(axis=1, ratio_split=1, id_split=0, **kwargs):
    def f(X):
        div = int(X.shape[axis] // ratio_split)

        if axis == 0:
            output = X[id_split * div:(id_split + 1) * div, :, :, :]
        elif axis == 1:
            output = X[:, id_split * div:(id_split + 1) * div, :, :]
        elif axis == 2:
            output = X[:, :, id_split * div:(id_split + 1) * div, :]
        elif axis == 3:
            output = X[:, :, :, id_split * div:(id_split + 1) * div]
        else:
            raise ValueError('This axis is not possible')

        return output

    def g(input_shape):
        output_shape = list(input_shape)
        output_shape[axis] = output_shape[axis] // ratio_split
        return tuple(output_shape)

    return Lambda(f, output_shape=lambda input_shape: g(input_shape), **kwargs)


def AlexNet(weights_path=None):
    inputs = Input(shape=(227, 227, 3))

    conv_1 = Conv2D(96, 11,  strides=(4, 4), activation='relu',
                           name='conv_1')(inputs)

    conv_2 = MaxPooling2D((5, 5), strides=(2, 2))(conv_1)
    conv_2 = crosschannelnormalization(name='convpool_1')(conv_2)
    conv_2 = ZeroPadding2D((2, 2))(conv_2)
    conv_2 = merge([
                       Conv2D(128, 5, activation='relu', name='conv_2_' + str(i + 1))(
                           splittensor(ratio_split=2, id_split=i)(conv_2)
                       ) for i in range(2)], mode='concat', concat_axis=1, name='conv_2')


    conv_3 = MaxPooling2D((3, 3), strides=(2, 2))(conv_2)
    conv_3 = crosschannelnormalization()(conv_3)
    conv_3 = ZeroPadding2D((1, 1))(conv_3)
    conv_3 = Conv2D(384, 3, activation='relu', name='conv_3')(conv_3)

    conv_4 = ZeroPadding2D((1, 1))(conv_3)
    conv_4 = merge([
                       Conv2D(192, 3, activation='relu', name='conv_4_' + str(i + 1))(
                           splittensor(ratio_split=2, id_split=i)(conv_4)
                       ) for i in range(2)], mode='concat', concat_axis=1, name='conv_4')

    conv_5 = ZeroPadding2D((1, 1))(conv_4)
    conv_5 = merge([
                       Conv2D(128, 3, activation='relu', name='conv_5_' + str(i + 1))(
                           splittensor(ratio_split=2, id_split=i)(conv_5)
                       ) for i in range(2)], mode='concat', concat_axis=1, name='conv_5')

    dense_1 = MaxPooling2D((3, 3), strides=(2, 2), name='convpool_5')(conv_5)

    dense_1 = Flatten(name='flatten')(dense_1)
    dense_1 = Dense(4096, activation='relu', name='dense_1')(dense_1)
    dense_2 = Dropout(0.5)(dense_1)
    dense_2 = Dense(4096, activation='relu', name='dense_2')(dense_2)
    dense_3 = Dropout(0.5)(dense_2)
    dense_3 = Dense(1000, name='dense_3')(dense_3)
    prediction = Activation('softmax', name='softmax')(dense_3)

    model = Model(inputs=inputs, outputs=prediction)

    if weights_path:
        model.load_weights(weights_path)

    return model

if __name__=="__main__":
    model = keras_applications.inception_v3.InceptionV3(include_top=True, weights=None, input_tensor=None, input_shape=None, pooling=None, classes=1000)
    model.summary()
    json_string = model.to_json()
    summary = json.loads(json_string)

    params = {}
    for layer in model.layers:
        params[layer.name] = layer.count_params()
    summary['params'] = params

    with open("inception_v3.json", "w") as jsonf:
        jsonf.write(json.dumps(summary))
    jsonf.close()