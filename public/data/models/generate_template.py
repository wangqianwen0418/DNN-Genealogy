import json
import keras


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
