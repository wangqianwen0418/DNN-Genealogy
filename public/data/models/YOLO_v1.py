from keras import models
from keras.models import Model
from keras import layers
from keras.layers.advanced_activations import LeakyReLU

from generate_template import generate_json

def create_yolov1_tiny_model(shape=(224, 224, 3)):
    model_input = layers.Input(shape=shape)
    

    x = layers.Conv2D(16, (3, 3), strides=(1, 1), padding='same')(model_input)
    x = LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D(pool_size=(2, 2), strides=(2, 2), padding='valid')(x)

    x = layers.Conv2D(32, (3, 3), strides=(1, 1), padding='same')(x)
    x = LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D(pool_size=(2, 2), padding='valid')(x)

    x = layers.Conv2D(64, (3, 3), strides=(1, 1), padding='same')(x)
    x = LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D(pool_size=(2, 2), padding='valid')(x)

    x = layers.Conv2D(128, (3, 3), strides=(1, 1), padding='same')(x)
    x = LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D(pool_size=(2, 2), padding='valid')(x)

    x = layers.Conv2D(256, (3, 3), strides=(1, 1), padding='same')(x)
    x = LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D(pool_size=(2, 2), padding='valid')(x)

    x = layers.Conv2D(512, (3, 3), strides=(1, 1), padding='same')(x)
    x = LeakyReLU(alpha=0.1)(x)
    x = layers.MaxPooling2D(pool_size=(2, 2), padding='valid')(x)

    x = layers.Conv2D(1024, (3, 3), strides=(1, 1), padding='same')(x)
    x = LeakyReLU(alpha=0.1)(x)

    x = layers.Conv2D(1024, (3, 3), strides=(1, 1), padding='same')(x)
    x = LeakyReLU(alpha=0.1)(x)

    x = layers.Conv2D(1024, (3, 3), strides=(1, 1), padding='same')(x)
    x = LeakyReLU(alpha=0.1)(x)

    x = layers.Flatten()(x)
    x = layers.Dense(256)(x)
    x = layers.Dense(4096)(x)
    x = LeakyReLU(0.1)(x)
    x = layers.Dense(1470)(x)
    
    return Model(model_input, x)

model = create_yolov1_tiny_model()
generate_json(model, "YOLO_v1")