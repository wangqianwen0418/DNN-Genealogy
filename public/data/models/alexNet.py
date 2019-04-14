# Import necessary components to build LeNet
from keras.models import Model
from keras.layers import Input, Dense, Dropout, Activation, Flatten, Conv2D, MaxPooling2D, ZeroPadding2D, BatchNormalization
from keras.regularizers import l2

import json

def alexnet_model(img_shape=(224, 224, 3), n_classes=1000, l2_reg=0.,
	weights=None):
	# Initialize model
	img_input = Input(shape=img_shape)
	# Layer 1
	x = Conv2D(96, (11, 11), padding='same', kernel_regularizer=l2(l2_reg), activation='relu')(img_input)
	# x = BatchNormalization()(x)
	# x = Activation('relu')(x)
	s = MaxPooling2D(pool_size=(2, 2))(x)

	# Layer 2
	x = Conv2D(256, (5, 5), padding='same', activation='relu')(x)
	# x = BatchNormalization()(x)
	# x = Activation('relu')(x)
	x = MaxPooling2D(pool_size=(2, 2))(x)

	# Layer 3
	# x = ZeroPadding2D((1, 1))(x)
	x = Conv2D(512, (3, 3), padding='same', activation='relu')(x)
	# x = BatchNormalization()(x)
	# x = Activation('relu')(x)
	x = MaxPooling2D(pool_size=(2, 2))(x)

	# Layer 4
	# x = ZeroPadding2D((1, 1))(x)
	x = Conv2D(1024, (3, 3), padding='same', activation='relu')(x)
	# x = BatchNormalization()(x)
	# x = Activation('relu')(x)

	# Layer 5
	# x = ZeroPadding2D((1, 1))(x)
	x = Conv2D(1024, (3, 3), padding='same', activation='relu')(x)
	# x = BatchNormalization()(x)
	# x = Activation('relu')(x)
	x = MaxPooling2D(pool_size=(2, 2))(x)

	# Layer 6
	x = Flatten()(x)
	x = Dense(3072, activation='relu', name='fc1')(x)
	# x = BatchNormalization()(x)
	# x = Activation('relu')(x)
	# x = Dropout(0.5)(x)

	# Layer 7
	x = Dense(4096, activation='relu', name="fc2")(x)
	# x = BatchNormalization()(x)
	# x = Activation('relu')(x)
	# x = Dropout(0.5)(x)

	# Layer 8
	x = Dense(n_classes, activation='softmax', name="fc3")(x)
	# x = BatchNormalization()(x)
	# x = Activation('softmax')(x)
	return Model(img_input, x)

model = alexnet_model()
# json_string = model.to_json()
# summary = json.loads(json_string)

# params = {}
# for layer in model.layers:
#     params[layer.name] = int(layer.count_params())
# summary['params'] = params
# filename = "alexnet"
# with open("{}.json".format(filename), "w") as jsonf:
#     json.dump(summary, jsonf)
# jsonf.close()

def generate_json(model, filename):
	json_string = model.to_json()
	summary = json.loads(json_string)

	params = {}
	for layer in model.layers:
		params[layer.name] = int(layer.count_params())
	summary['params'] = params

	with open("{}.json".format(filename), "w") as jsonf:
		json.dump(summary, jsonf)
	jsonf.close()

generate_json(model, "alexNet")