import logging
import os
import time

class GetLog:

    def __init__(self):
        # 定义一个记录器
        self.logger = logging.getLogger()
        # 设置记录器的级别
        self.logger.setLevel(logging.DEBUG)
        # 定义一个控制台处理器
        sh = logging.StreamHandler()
        # 设置控制台处理器的级别
        sh.setLevel(logging.INFO)
        # 设置log文件名和保存目录
        file_name = '{}.log'.format(time.strftime("%Y-%m-%d"))
        path=os.path.dirname(__file__)
        path=os.path.join(path,"..","log")
        # 判断目录是否存在，不存在则创建
        if not os.path.isdir(path):
            os.makedirs(path)
        # 定义一个文件处理器
        fh = logging.FileHandler(os.path.join(path, file_name), encoding='utf-8')
        # 设置文件处理器的级别
        fh.setLevel(logging.INFO)
        # 定义日志输出格式
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(filename)s - %(lineno)s - %(message)s')
        # 将日志格式添加到控制台处理器和文件处理器中
        sh.setFormatter(formatter)
        fh.setFormatter(formatter)
        # 将控制台处理器和文件处理器添加到记录器中
        self.logger.addHandler(sh)
        self.logger.addHandler(fh)

log=GetLog().logger
# log.info("这是info等级的日志")