import yaml
from main import PATH

# 读取yaml文件
def read_yaml(file_name,keyword=None):
    data = []
    file_path = PATH+"/data/"+file_name
    with open(file_path,'r',encoding='UTF-8') as f:
        values=yaml.safe_load(f)

    # 遍历values，将title和原yaml数据添加到data列表中
    for item in values:
        data.append((item['title'],item))

    # 如果传入了keyword，则只返回包含该keyword的数据
    if keyword:
        new_values=[]
        for title, item in data:
            if item['keyword']==keyword:
                new_values.append((title, item))
        return new_values
    # 没有传入keyword，则返回data
    return data