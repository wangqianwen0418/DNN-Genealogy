import warnings

from keras import backend as K
from keras.models import Model
from keras.layers import Convolution2D, MaxPooling2D, Input, AtrousConvolution2D
from keras.layers import Dropout, UpSampling2D, ZeroPadding2D

from keras.utils.layer_utils import convert_all_kernels_in_model
from keras.utils.data_utils import get_file

from generate_template import generate_json

# from utils import softmax

def get_dilation_model_voc(
        input_shape=(500, 500, 3), 
        apply_softmax=True, 
        classes=21
        ):
   
    model_in = Input(shape=input_shape)

    # else:
    #     if not K.is_keras_tensor(input_tensor):
    #         model_in = Input(tensor=input_tensor, shape=input_shape)
    #     else:
    #         model_in = input_tensor

    h = Convolution2D(64, 3, 3, activation='relu', name='conv1_1')(model_in)
    h = Convolution2D(64, 3, 3, activation='relu', name='conv1_2')(h)
    h = MaxPooling2D(pool_size=(2, 2), strides=(2, 2), name='pool1')(h)
    h = Convolution2D(128, 3, 3, activation='relu', name='conv2_1')(h)
    h = Convolution2D(128, 3, 3, activation='relu', name='conv2_2')(h)
    h = MaxPooling2D(pool_size=(2, 2), strides=(2, 2), name='pool2')(h)
    h = Convolution2D(256, 3, 3, activation='relu', name='conv3_1')(h)
    h = Convolution2D(256, 3, 3, activation='relu', name='conv3_2')(h)
    h = Convolution2D(256, 3, 3, activation='relu', name='conv3_3')(h)
    h = MaxPooling2D(pool_size=(2, 2), strides=(2, 2), name='pool3')(h)
    h = Convolution2D(512, 3, 3, activation='relu', name='conv4_1')(h)
    h = Convolution2D(512, 3, 3, activation='relu', name='conv4_2')(h)
    h = Convolution2D(512, 3, 3, activation='relu', name='conv4_3')(h)
    h = AtrousConvolution2D(512, 3, 3, atrous_rate=(2, 2), activation='relu', name='conv5_1')(h)
    h = AtrousConvolution2D(512, 3, 3, atrous_rate=(2, 2), activation='relu', name='conv5_2')(h)
    h = AtrousConvolution2D(512, 3, 3, atrous_rate=(2, 2), activation='relu', name='conv5_3')(h)
    h = AtrousConvolution2D(4096, 7, 7, atrous_rate=(4, 4), activation='relu', name='fc6')(h)
    h = Dropout(0.5, name='drop6')(h)
    h = Convolution2D(4096, 1, 1, activation='relu', name='fc7')(h)
    h = Dropout(0.5, name='drop7')(h)
    h = Convolution2D(classes, 1, 1, activation='relu', name='fc-final')(h)
    h = ZeroPadding2D(padding=(33, 33))(h)
    h = Convolution2D(2 * classes, 3, 3, activation='relu', name='ct_conv1_1')(h)
    h = Convolution2D(2 * classes, 3, 3, activation='relu', name='ct_conv1_2')(h)
    h = AtrousConvolution2D(4 * classes, 3, 3, atrous_rate=(2, 2), activation='relu', name='ct_conv2_1')(h)
    h = AtrousConvolution2D(8 * classes, 3, 3, atrous_rate=(4, 4), activation='relu', name='ct_conv3_1')(h)
    h = AtrousConvolution2D(16 * classes, 3, 3, atrous_rate=(8, 8), activation='relu', name='ct_conv4_1')(h)
    h = AtrousConvolution2D(32 * classes, 3, 3, atrous_rate=(16, 16), activation='relu', name='ct_conv5_1')(h)
    h = Convolution2D(32 * classes, 3, 3, activation='relu', name='ct_fc1')(h)
    model_out = Convolution2D(classes, 1, 1, name='ct_final', activation="softmax")(h)

    # if apply_softmax:
    #     model_out = softmax(logits)
    # else:
    #     model_out = logits

    model = Model(input=model_in, output=model_out, name='dilation_voc12')

    return model

model = get_dilation_model_voc()
generate_json(model, "DilatedNet")
