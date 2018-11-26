# based on https://github.com/fabianbormann/Tensorflow-DeconvNet-Segmentation/blob/master/DeconvNet.py

import tensorflow as tf

from keras import Model, Input
from keras.layers import Conv2D, MaxPooling2D, Conv2DTranspose, Lambda, Layer, BatchNormalization, Activation
from keras import backend as K
from keras.models import load_model, save_model
from keras_applications.vgg16 import VGG16

from generate_template import generate_json
from SegNet import MaxPoolingWithArgmax2D, MaxUnpooling2D

import os
import random
import time
# import wget
import tarfile
import numpy as np
import cv2

import math



class DeconvNet:
    def __init__(self, use_cpu=True, print_summary=False):
        # self.maybe_download_and_extract()
        self.build(use_cpu=use_cpu, print_summary=print_summary)

        
    # def maybe_download_and_extract(self):
    #     """Download and unpack VOC data if data folder only contains the .gitignore file"""
    #     if os.listdir('data') == ['.gitignore']:
    #         filenames = ['VOC_OBJECT.tar.gz', 'VOC2012_SEG_AUG.tar.gz', 'stage_1_train_imgset.tar.gz', 'stage_2_train_imgset.tar.gz']
    #         url = 'http://cvlab.postech.ac.kr/research/deconvnet/data/'

    #         for filename in filenames:
    #             wget.download(url + filename, out=os.path.join('data', filename))

    #             tar = tarfile.open(os.path.join('data', filename))
    #             tar.extractall(path='data')
    #             tar.close()

    #             os.remove(os.path.join('data', filename))

                
    def predict(self, image):
        return self.model.predict(np.array([image]))
    
    def save(self, file_path='model.h5'):
        print(self.model.to_json())
        self.model.save_weights(file_path)
        
    def load(self, file_path='model.h5'):
        self.model.load_weights(file_path)
    
    def random_crop_or_pad(self, image, truth, size=(224, 224)):
        assert image.shape[:2] == truth.shape[:2]

        if image.shape[0] > size[0]:
            crop_random_y = random.randint(0, image.shape[0] - size[0])
            image = image[crop_random_y:crop_random_y + size[0],:,:]
            truth = truth[crop_random_y:crop_random_y + size[0],:]
        else:
            zeros = np.zeros((size[0], image.shape[1], image.shape[2]), dtype=np.float32)
            zeros[:image.shape[0], :image.shape[1], :] = image                                          
            image = np.copy(zeros)
            zeros = np.zeros((size[0], truth.shape[1]), dtype=np.float32)
            zeros[:truth.shape[0], :truth.shape[1]] = truth
            truth = np.copy(zeros)

        if image.shape[1] > size[1]:
            crop_random_x = random.randint(0, image.shape[1] - size[1])
            image = image[:,crop_random_x:crop_random_x + 224,:]
            truth = truth[:,crop_random_x:crop_random_x + 224]
        else:
            zeros = np.zeros((image.shape[0], size[1], image.shape[2]))
            zeros[:image.shape[0], :image.shape[1], :] = image
            image = np.copy(zeros)
            zeros = np.zeros((truth.shape[0], size[1]))
            zeros[:truth.shape[0], :truth.shape[1]] = truth
            truth = np.copy(zeros)            

        return image, truth

    #(0=background, 1=aeroplane, 2=bicycle, 3=bird, 4=boat, 5=bottle, 6=bus, 7=car , 8=cat, 9=chair, 
    # 10=cow, 11=diningtable, 12=dog, 13=horse, 14=motorbike, 15=person, 16=potted plant, 
    # 17=sheep, 18=sofa, 19=train, 20=tv/monitor, 255=no_label)

    # def max_pool_with_argmax(self, x):
    #     return tf.nn.max_pool_with_argmax(x, ksize=[1, 2, 2, 1], strides=[1, 2, 2, 1], padding='SAME')
    
    # def max_pool_with_argmax_output_shape(self, input_shape):
    #     shape = list(input_shape)
    #     shape[1] = math.ceil(shape[1]/2)
    #     shape[2] = math.ceil(shape[2]/2)
    #     return tuple(shape)

    
    def BatchGenerator(self, train_stage=1, batch_size=8, image_size=(224, 224, 3), labels=21):
        if train_stage == 1:
            trainset = open('data/stage_1_train_imgset/train.txt').readlines()
        else:
            trainset = open('data/stage_2_train_imgset/train.txt').readlines()

        while True:
            images = np.zeros((batch_size, image_size[0], image_size[1], image_size[2]))
            truths = np.zeros((batch_size, image_size[0], image_size[1], labels))

            for i in range(batch_size):
                random_line = random.choice(trainset)
                image_file = random_line.split(' ')[0]
                truth_file = random_line.split(' ')[1]
                image = np.float32(cv2.imread('data' + image_file)/255.0)

                truth_mask = cv2.imread('data' + truth_file[:-1], cv2.IMREAD_GRAYSCALE)
                truth_mask[truth_mask == 255] = 0 # replace no_label with background  
                images[i], truth = self.random_crop_or_pad(image, truth_mask, image_size)
                truths[i] = (np.arange(labels) == truth[...,None]-1).astype(int) # encode to one-hot-vector
            yield images, truths
            

    def train(self, steps_per_epoch=1000, epochs=10, batch_size=32):
        batch_generator = self.BatchGenerator(batch_size=batch_size)
        self.model.fit_generator(batch_generator, steps_per_epoch=steps_per_epoch, epochs=epochs)

    def buildConv2DBlock(self, block_input, filters, block, depth):
        for i in range(1, depth + 1):
            if i == 1:
                conv2d = Conv2D(filters, 3, padding='same', name='conv{}-{}'.format(block, i), use_bias=False)(block_input)
            else:
                conv2d = Conv2D(filters, 3, padding='same', name='conv{}-{}'.format(block, i), use_bias=False)(conv2d)
            
            conv2d = BatchNormalization(name='batchnorm{}-{}'.format(block, i))(conv2d)
            conv2d = Activation('relu', name='relu{}-{}'.format(block, i))(conv2d)
            
        return conv2d
        
    def build(self, use_cpu=False, print_summary=False):
        vgg16 = VGG16(weights = "imagenet", include_top=False, input_shape = (224, 224, 3))
        
        
        inputs = Input(shape=(224, 224, 3))

        conv_block_1 = self.buildConv2DBlock(inputs, 64, 1, 2)
        pool1, pool1_argmax = MaxPoolingWithArgmax2D()(conv_block_1) 

        conv_block_2 = self.buildConv2DBlock(pool1, 128, 2, 2)
        pool2, pool2_argmax = MaxPoolingWithArgmax2D()(conv_block_2) 

        conv_block_3 = self.buildConv2DBlock(pool2, 256, 3, 3)
        pool3, pool3_argmax = MaxPoolingWithArgmax2D()(conv_block_3) 

        conv_block_4 = self.buildConv2DBlock(pool3, 512, 4, 3)
        pool4, pool4_argmax = MaxPoolingWithArgmax2D()(conv_block_4) 

        conv_block_5 = self.buildConv2DBlock(pool4, 512, 5, 3)
        pool5, pool5_argmax = MaxPoolingWithArgmax2D()(conv_block_5)

        fc6 = Conv2D(512, 7, use_bias=False, padding='valid', name='fc6')(pool5) #4096
        fc6 = BatchNormalization(name='batchnorm_fc6')(fc6)
        fc6 = Activation('relu', name='relu_fc6')(fc6)
        
        fc7 = Conv2D(512, 1, use_bias=False, padding='valid', name='fc7')(fc6)   #4096
        fc7 = BatchNormalization(name='batchnorm_fc7')(fc7)
        fc7 = Activation('relu', name='relu_fc7')(fc7)
        
        x = Conv2DTranspose(512, 7, use_bias=False, padding='valid', name='deconv-fc6')(fc7)
        x = BatchNormalization(name='batchnorm_deconv-fc6')(x)
        x = Activation('relu', name='relu_deconv-fc6')(x)            
        x = MaxUnpooling2D( name='unpool5')([x, pool4_argmax])
        x.set_shape(conv_block_5.get_shape())

        x = Conv2DTranspose(512, 3, use_bias=False, padding='same', name='deconv5-1')(x)
        x = BatchNormalization(name='batchnorm_deconv5-1')(x)
        x = Activation('relu', name='relu_deconv5-1')(x)  
        
        x = Conv2DTranspose(512, 3, use_bias=False, padding='same', name='deconv5-2')(x)
        x = BatchNormalization(name='batchnorm_deconv5-2')(x)
        x = Activation('relu', name='relu_deconv5-2')(x)  
        
        x = Conv2DTranspose(512, 3, use_bias=False, padding='same', name='deconv5-3')(x)
        x = BatchNormalization(name='batchnorm_deconv5-3')(x)
        x = Activation('relu', name='relu_deconv5-3')(x)  
        
        x = MaxUnpooling2D(name='unpool4')([x, pool4_argmax ])
        x.set_shape(conv_block_4.get_shape())

        x = Conv2DTranspose(512, 3, use_bias=False, padding='same', name='deconv4-1')(x)
        x = BatchNormalization(name='batchnorm_deconv4-1')(x)
        x = Activation('relu', name='relu_deconv4-1')(x)  
        
        x = Conv2DTranspose(512, 3, use_bias=False, padding='same', name='deconv4-2')(x)
        x = BatchNormalization(name='batchnorm_deconv4-2')(x)
        x = Activation('relu', name='relu_deconv4-2')(x)  
        
        x = Conv2DTranspose(256, 3, use_bias=False, padding='same', name='deconv4-3')(x)
        x = BatchNormalization(name='batchnorm_deconv4-3')(x)
        x = Activation('relu', name='relu_deconv4-3')(x)  
        
        x = MaxUnpooling2D(name='unpool3')([x, pool3_argmax])
        x.set_shape(conv_block_3.get_shape())

        x = Conv2DTranspose(256, 3, use_bias=False, padding='same', name='deconv3-1')(x)
        x = BatchNormalization(name='batchnorm_deconv3-1')(x)
        x = Activation('relu', name='relu_deconv3-1')(x)  
        
        x = Conv2DTranspose(256, 3, use_bias=False, padding='same', name='deconv3-2')(x)
        x = BatchNormalization(name='batchnorm_deconv3-2')(x)
        x = Activation('relu', name='relu_deconv3-2')(x)  
        
        x = Conv2DTranspose(128, 3, use_bias=False, padding='same', name='deconv3-3')(x)
        x = BatchNormalization(name='batchnorm_deconv3-3')(x)
        x = Activation('relu', name='relu_deconv3-3')(x)  
        
        x = MaxUnpooling2D(name='unpool2')([x, pool2_argmax ])
        x.set_shape(conv_block_2.get_shape())

        x = Conv2DTranspose(128, 3, use_bias=False, padding='same', name='deconv2-1')(x)
        x = BatchNormalization(name='batchnorm_deconv2-1')(x)
        x = Activation('relu', name='relu_deconv2-1')(x)  
        
        x = Conv2DTranspose(64, 3, use_bias=False, padding='same', name='deconv2-2')(x)
        x = BatchNormalization(name='batchnorm_deconv2-2')(x)
        x = Activation('relu', name='relu_deconv2-2')(x)  
        
        x = MaxUnpooling2D(name='unpool1')([x, pool1_argmax ])
        x.set_shape(conv_block_1.get_shape())

        x = Conv2DTranspose(64, 3, use_bias=False, padding='same', name='deconv1-1')(x)
        x = BatchNormalization(name='batchnorm_deconv1-1')(x)
        x = Activation('relu', name='relu_deconv1-1')(x)  
        
        x = Conv2DTranspose(64, 3, use_bias=False, padding='same', name='deconv1-2')(x)
        x = BatchNormalization(name='batchnorm_deconv1-2')(x)
        x = Activation('relu', name='relu_deconv1-2')(x)              
        
        output = Conv2DTranspose(21, 1, activation='softmax', padding='same', name='output')(x)

        model = Model(inputs=inputs, outputs=output)
        vgg16 = VGG16(weights = "imagenet", include_top=False, input_shape = (224, 224, 3))

        self.model = model
        
        if print_summary:
            print(self.model.summary())
        
        for layer in self.model.layers:
            if layer.name.startswith('conv'):
                block = layer.name[4:].split('-')[0]
                depth = layer.name[4:].split('-')[1]
                # apply vgg16 weights without bias
                layer.set_weights([vgg16.get_layer('block{}_conv{}'.format(block, depth)).get_weights()[0]])
        
        
        self.model.compile(optimizer='adam',
                        loss='categorical_crossentropy',
                        metrics=['accuracy', 'mse'])

deconvNet = DeconvNet()
model = deconvNet.model

generate_json(model, "DeconvNet")