import csv
import re
import json


class DagParser:
    """
    Model {
        ID: str,
        url: str,
        date: str,
        *citation: str,
        application: list(str),
        training: list(str),
        architecture: list(str),
        names: array(Name),
        parents: array(Parents),
        variants: array(Model|{ID:str})
    }

    Parent {
        ID: str,
        link_info_s: str,
        link_info_l: str,
        link_category: str
    }

    Name {
        name: str,
        datasets: indexer,
        params: float,
    }
    """
    def __init__(self, filepath):
        self.data = list(csv.reader(open(filepath, 'r'), delimiter='\t'))

    def get_split_data(self, s):
        return [datum.strip() for datum in s.split(';') if datum]

    def save_json(self, filepath):
        models = set()  # check the validity of 'parent' attr
        result = list()
        title_line = []
        dataset_start = -1
        for label, datum in enumerate(self.data):
            # a title line indicates the beginning of a new classification
            if 'application' and 'training' and 'architecture' in datum:
                title_line = datum
                dataset_start = datum.index('name')
                continue

            # add a new model
            if datum[0]:
                if datum[0] in models:
                    print('Error in line %d: Model "%s" already exists.' % (label, datum[0]))
                    break

                models.add(datum[0])
                result.append({
                    'ID': datum[0],
                    'url': datum[1],
                    'date': datum[2],
                    'citation': datum[3],
                    'application': self.get_split_data(datum[4]),
                    'training': self.get_split_data(datum[5]),
                    'architecture': self.get_split_data(datum[6]),
                    'names': list(),
                    'parents': list(),
                    'variants': list()
                })

            # add a parent to current model
            if datum[7]:
                if datum[7] not in models:
                    print('Error in line %d: Parent "%s" not exists.' % (label, datum[7]))
                result[-1]['parents'].append({
                    'ID': datum[7],
                    'link_info_l': datum[8],
                    'link_info_s': datum[9],
                    'link_category': datum[10]
                })
            # add variants' ID to current model
            if datum[11]:
                result[-1]['variants'].append({
                    'ID': datum[11]
                })

            # add datasets to current model
            if datum[dataset_start]:
                cur_name = {
                    'name': datum[dataset_start],
                    'params': 0.0 if not datum[dataset_start + 1] or datum[dataset_start + 1] == 'na' else float(datum[dataset_start + 1]),
                }
                for i in range(dataset_start + 2, len(datum)):
                    if not title_line[i] or title_line[i] == 'model path':
                        continue
                    if not datum[i] or datum[i].lower() == 'na':
                        cur_name[title_line[i]] = None
                    else:
                        cur_name[title_line[i]] = float(datum[i])
                result[-1]['names'].append(cur_name)
        # insert variants data
        ID_arr = [model['ID'] for model in result]
        for i, model in enumerate(result):
            for j, variant in enumerate(model['variants']):
                try:
                   index = ID_arr.index(variant['ID'])
                   result[i]['variants'][j] = result[index]
                   ID_arr.remove(variant['ID'])
                   result.remove(result[index])
                except Exception:
                    pass


        result_json = json.dumps(result, indent=2, sort_keys=True)
        f = open(filepath, 'w')
        f.write(result_json)
        f.close()

if __name__ == '__main__':
    parser = DagParser('../public/data/evolution_dag.tsv')
    parser.save_json('../public/data/evolution_dag.json')
