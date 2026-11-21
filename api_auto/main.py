import pytest
import os
from tools.get_log import log

PATH=os.path.dirname(__file__)

if __name__ == "__main__":
    log.info("开始执行测试用例")
    pytest.main()
    log.info("用例执行完成,准备生成报告")
    os.system(r'allure generate report\json_report -o report\html_report --clean')
    log.info("测试报告生成完成")
