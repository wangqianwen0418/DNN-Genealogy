import keras
from keras import layers
from keras.models import Model

def denseblock(inputLayer,blocknum=1,step=48,is_train=True,name='denseblock',reuse=None):
    nettemp = inputLayer
    for x in range(blocknum):
        netbn = layers.BatchNormalization( name='bn/' +str(x)+ name)(nettemp)
        net=layers.Conv2D(filters=step, kernel_size=(1, 1), strides=(1, 1), padding='SAME',name='conv1/'+str(x)+ name)(netbn)
        netbn = layers.BatchNormalization( name='bn2/' + str(x)+name)(net)
        net=layers.Conv2D(filters=step, kernel_size=(3, 3), strides=(1, 1), padding='SAME',name='conv2/'+str(x)+ name)(netbn)
        nettemp= layers.Concatenate(axis=-1, name='concat/'+str(x)+ name)([nettemp,net])
        net = nettemp
    return net

def translayer(inputLayer, filters, name='trans'):
    x = layers.Conv2D(filters, kernel_size=1, padding='same', activation='relu', name='conv/'+name)(inputLayer)
    x = layers.MaxPool2D(pool_size=(2,2), strides=2, name='maxpool/'+name)(x)
    return x



# def denseblockpl(input,step=256,firstchannel=256,is_train=True,name='densepl',reuse=None):
#     with tf.variable_scope(name, reuse=reuse):
#         tl.layers.set_name_reuse(reuse)
#         input = LambdaLayer(input, lambda x: tf.identity(x), name="INPUTS")
#         netbn2=MaxPool2d(input,(2,2),(2,2),padding='SAME', name='bnpool2')
#         netbn2 = BatchNormLayer(netbn2, is_train=is_train, decay=conv_bn_decay, act=tf.nn.relu, name=name + 'bn2pl' )
#         netbn2 = Conv2D(netbn2, firstchannel, (1, 1), (1, 1), padding='SAME', name='bnconv2' )
#         netbn = BatchNormLayer(input, is_train=is_train, decay=conv_bn_decay, act=tf.nn.relu, name= 'bn' )
#         net=Conv2D(netbn, firstchannel, (1, 1), (1, 1), padding='SAME',name='neta')
#         netbn = BatchNormLayer(net, is_train=is_train, decay=conv_bn_decay, act=tf.nn.relu, name='bn2')
#         net=Conv2D(netbn, step, (3, 3), (2, 2), padding='SAME',name='netb')
#         nettemp = ConcatLayer([net,netbn2], -1,name='concat')
#     return nettemp

# def denseblockfin(input,step=256,firstchannel=256,is_train=True,name='densepl',reuse=None):
#     with tf.variable_scope(name, reuse=reuse):
#         tl.layers.set_name_reuse(reuse)
#         input = LambdaLayer(input, lambda x: tf.identity(x), name="INPUTS")
#         netbn2=MaxPool2d(input,(3,3),(1,1),padding='VALID', name='bnpool2')
#         netbn2 = BatchNormLayer(netbn2, is_train=is_train, decay=conv_bn_decay, act=tf.nn.relu, name=name + 'bn2pl' )
#         netbn2 = Conv2D(netbn2, firstchannel, (1, 1), (1, 1), padding='SAME', name='bnconv2' )
#         netbn = BatchNormLayer(input, is_train=is_train, decay=conv_bn_decay, act=tf.nn.relu, name= 'bn' )
#         net=Conv2D(netbn, firstchannel, (1, 1), (1, 1), padding='SAME',name='neta')
#         netbn = BatchNormLayer(net, is_train=is_train, decay=conv_bn_decay, act=tf.nn.relu, name='bn2')
#         net=Conv2D(netbn, step, (3, 3), (1, 1), padding='VALID',name='netb')
#         nettemp = ConcatLayer([net,netbn2], -1,name='concat')
#     return nettemp

def DSOD():

    class_num = 21

    img_input = layers.Input(shape=(300, 300, 3))
    x = layers.Conv2D(64, 3, strides=2, padding="same")(img_input)
    x = layers.Conv2D(64, 3, strides=1, padding="same")(x)
    x = layers.Conv2D(128, 3, strides=1, padding="same")(x)
    x = layers.MaxPool2D(pool_size=(2,2), strides=2)(x)

    x1 = denseblock(x, blocknum=6, name='denseblock1')
    x1 = translayer(x1, filters=416, name='trans1')

    x2 = denseblock(x1, blocknum=8, name='denseblock2')
    x2 = translayer(x2, filters=800, name='trans2')

    x3 = denseblock(x2, blocknum=8, name='denseblock3')
    x3 = translayer(x3, filters=1184, name='trans3')

    x4 = denseblock(x3, blocknum=8, name='denseblock4')
    x4 = layers.Conv2D(1156, kernel_size=(1,1), activation='relu')(x4)

    num_anchors = (4, 6, 6, 4)

    x1 = layers.Conv2D((class_num+4)*4, kernel_size=3, activation='relu')(x1)
    x1 = layers.Reshape(target_shape=(-1, class_num+4))(x1)

    x2 = layers.Conv2D((class_num+4)*6, kernel_size=3, activation='relu')(x2)
    x2 = layers.Reshape(target_shape=( -1, class_num+4))(x2)

    x3 = layers.Conv2D((class_num+4)*6, kernel_size=3, activation='relu')(x3)
    x3 = layers.Reshape(target_shape=( -1, class_num+4))(x3)

    x4 = layers.Conv2D((class_num+4)*4, kernel_size=3, activation='relu')(x4)
    x4 = layers.Reshape(target_shape=( -1, class_num+4))(x4)

    output = layers.Concatenate(axis=1)([x1, x2, x3, x4])

    return Model(img_input, output)


model = DSOD()
model.summary()

import json
from generate_template import generate_json
generate_json(model, 'DSOD')