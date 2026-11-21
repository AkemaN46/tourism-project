/**
 * 日期格式化工具
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 获取星期几
 * @param {string|Date} dateStr 日期字符串或日期对象
 * @returns {string} 星期几（今天/明天/周 X）
 */
const getWeekDay = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 检查是否是今天或明天
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  const diffTime = dateOnly - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  
  return weekDays[date.getDay()];
};

/**
 * 计算入住晚数
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 * @returns {number} 晚数
 */
const calculateNights = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  const timeDiff = endDateObj.getTime() - startDateObj.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * 格式化显示日期（MM 月 DD 日）
 * @param {string} dateStr 日期字符串
 * @returns {string} 格式化后的日期（MM 月 DD 日）
 */
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}月${day}日`;
};

/**
 * 格式化日期时间（包含时分秒）
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期时间
 */
const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

module.exports = {
  formatDate,
  getWeekDay,
  calculateNights,
  formatDisplayDate,
  formatDateTime
};
