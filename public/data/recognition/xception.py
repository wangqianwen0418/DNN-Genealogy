import keras
import json

model = keras.applications.xception.Xception(include_top=True, weights=None, input_tensor=None, input_shape=None, pooling=None, classes=1000)
json_string = model.to_json()

with open("xception.json", "w") as jsonf:
    jsonf.write(json_string)
jsonf.close()