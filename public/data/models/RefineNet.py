from keras.layers import UpSampling2D, Activation, Conv2D, Add, MaxPooling2D

# from keras_applications.resnet50 import ResNet50
from resnet import ResNet50

from keras.models import Model

from generate_template import generate_json

# import tensorflow as tf

# def unpool(inputs,scale):
#     return tf.image.resize_bilinear(inputs, size=[tf.shape(inputs)[1]*scale,  tf.shape(inputs)[2]*scale])


def ResidualConvUnit(inputs,features=256,kernel_size=3):
    net=Activation("relu")(inputs)
    net=Conv2D(features, kernel_size, padding="same")(net)
    net=Activation("relu")(inputs)
    net=Conv2D(features, kernel_size, padding="same")(net)
    net=Add()([net,inputs])
    return net

def ChainedResidualPooling(inputs,features=256):
    net_relu=Activation("relu")(inputs)
    net=MaxPooling2D( [5, 5],strides=1,padding='SAME')(net_relu)
    net=Conv2D(features,3, padding="same")(net)
    net_sum_1=Add()([net,net_relu])

    net = MaxPooling2D([5, 5], strides=1, padding='SAME')(net_relu)
    net = Conv2D(features, 3, padding="same")(net)
    net_sum_2 = Add()([net,net_sum_1])

    return net_sum_2


def MultiResolutionFusion(high_inputs=None,low_inputs=None,features=256):

    if high_inputs is None:#refineNet block 4
        rcu_low_1 = low_inputs[0]
        rcu_low_2 = low_inputs[1]

        rcu_low_1 = Conv2D(features, 3, padding="same")(rcu_low_1)
        rcu_low_2 = Conv2D(features, 3, padding="same")(rcu_low_2)

        return Add()([rcu_low_1,rcu_low_2])

    else:
        rcu_low_1 = low_inputs[0]
        rcu_low_2 = low_inputs[1]
        # print('rcu_low', rcu_low_1.shape)

        rcu_low_1 = Conv2D(features, 3, padding="same")(rcu_low_1)
        rcu_low_2 = Conv2D(features, 3, padding="same")(rcu_low_2)
        print('rcu_low', rcu_low_1.shape)
        

        rcu_low = Add()([rcu_low_1,rcu_low_2])

        print('rcu_low', rcu_low.shape)

        rcu_high_1 = high_inputs[0]
        rcu_high_2 = high_inputs[1]

        # print('rcu_high', rcu_high_1.shape)

        rcu_high_1 = Conv2D( features, 3, padding="same")(rcu_high_1)
        rcu_high_2 = Conv2D( features, 3, padding="same")(rcu_high_2)
        # print('rcu_high', rcu_high_1.shape)

        rcu_high_1 = MaxPooling2D( 2 )( rcu_high_1 )
        rcu_high_2 = MaxPooling2D( 2 )( rcu_high_2 )

        
        # print('rcu_high', rcu_high_1.shape)

        rcu_high = Add()([rcu_high_1,rcu_high_2])

        return Add()([rcu_low, rcu_high])


def RefineBlock(high_inputs=None,low_inputs=None):

    if high_inputs is None: # block 4
        rcu_low_1= ResidualConvUnit(low_inputs, features=256)
        rcu_low_2 = ResidualConvUnit(low_inputs, features=256)
        rcu_low = [rcu_low_1, rcu_low_2]

        fuse = MultiResolutionFusion(high_inputs=None, low_inputs=rcu_low, features=256)
        fuse_pooling = ChainedResidualPooling(fuse, features=256)
        output = ResidualConvUnit(fuse_pooling, features=256)
        return output
    else:
        rcu_low_1 = ResidualConvUnit(low_inputs, features=256)
        rcu_low_2 = ResidualConvUnit(low_inputs, features=256)
        rcu_low = [rcu_low_1, rcu_low_2]

        rcu_high_1 = ResidualConvUnit(high_inputs, features=256)
        rcu_high_2 = ResidualConvUnit(high_inputs, features=256)
        rcu_high = [rcu_high_1, rcu_high_2]

        fuse = MultiResolutionFusion(rcu_high, rcu_low,features=256)
        fuse_pooling = ChainedResidualPooling(fuse, features=256)
        output = ResidualConvUnit(fuse_pooling, features=256)
        return output


def RefineNet():
    resnet = ResNet50()

    # resnet.summary()
    
    endpoints = ['activation_9', 'activation_21', 'activation_39', 'activation_48']
    f = [resnet.get_layer(name).output for name in endpoints]
    
    g = [None, None, None, None]
    h = [None, None, None, None]

    for i in range(4):
        h[i]=Conv2D(256, 1, padding="same")(f[i])

    for i in range(4):
        print(i, h[i].shape)
    

    g[0]=RefineBlock(high_inputs=None,low_inputs=h[0])
    print(0, g[0], h[1])
    g[1]=RefineBlock(g[0],h[1])
    print(1, g[1],h[2])
    g[2]=RefineBlock(g[1],h[2])
    print(2, g[2],h[3])
    g[3]=RefineBlock(g[2],h[3])
    print(3)
    F_score = Conv2D(21, 1, activation="relu", padding="same")(g[3])

    return Model(resnet.inputs, F_score)

model = RefineNet()
model.summary()
generate_json(model, "RefineNet")
