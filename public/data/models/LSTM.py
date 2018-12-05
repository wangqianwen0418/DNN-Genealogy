'''
based on https://github.com/keras-team/keras/blob/master/examples/imdb_GRU.py
Trains an GRU model on the IMDB sentiment classification task.
The dataset is actually too small for GRU to be of any advantage
compared to simpler, much faster methods such as TF-IDF + LogReg.
# Notes
- RNNs are tricky. Choice of batch size is important,
choice of loss and optimizer is critical, etc.
Some configurations won't converge.
- GRU loss decrease patterns during training can be quite different
from what you see with CNNs/MLPs/etc.
'''
from __future__ import print_function

from keras.preprocessing import sequence
from keras.models import Model
from keras.layers import Dense, Embedding, GRU
from keras import layers
from keras.datasets import imdb

max_features = 20000
# cut texts after this number of words (among top max_features most common words)
maxlen = 80
batch_size = 32

# print('Loading data...')
# (x_train, y_train), (x_test, y_test) = imdb.load_data(num_words=max_features)
# print(len(x_train), 'train sequences')
# print(len(x_test), 'test sequences')

# print('Pad sequences (samples x time)')
# x_train = sequence.pad_sequences(x_train, maxlen=maxlen)
# x_test = sequence.pad_sequences(x_test, maxlen=maxlen)
# print('x_train shape:', x_train.shape)
# print('x_test shape:', x_test.shape)

print('Build model...')
# model = Sequential()
model_input = layers.Input(shape=(max_features,))
x = Embedding(max_features, 128)(model_input)
x = GRU(128, dropout=0.2, recurrent_dropout=0.2)(x)
x = Dense(1, activation='sigmoid')(x)
model = Model(model_input, x)


from generate_template import generate_json
generate_json(model, "GRU")

# # try using different optimizers and different optimizer configs
# model.compile(loss='binary_crossentropy',
#               optimizer='adam',
#               metrics=['accuracy'])

# print('Train...')
# model.fit(x_train, y_train,
#           batch_size=batch_size,
#           epochs=15,
#           validation_data=(x_test, y_test))
# score, acc = model.evaluate(x_test, y_test,
#                             batch_size=batch_size)
# print('Test score:', score)
# print('Test accuracy:', acc)