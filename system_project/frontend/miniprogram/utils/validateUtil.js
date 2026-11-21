/**
 * 数据验证工具函数
 * 提供常用输入验证功能
 */

/**
 * 验证手机号（中国大陆）
 * @param {string} phone 手机号
 * @returns {boolean} 验证结果
 */
const isValidPhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

/**
 * 验证邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean} 验证结果
 */
const isValidEmail = (email) => {
  return /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(email);
};

/**
 * 验证字符串是否为空
 * @param {string} str 待检查的字符串
 * @returns {boolean} true 如果为空
 */
const isBlank = (str) => {
  return str === null || str === undefined || String(str).trim() === '';
};

/**
 * 验证字符串是否不为空
 * @param {string} str 待检查的字符串
 * @returns {boolean} true 如果不为空
 */
const isNotBlank = (str) => {
  return !isBlank(str);
};

/**
 * 验证字符串长度是否在指定范围内
 * @param {string} str 待检查的字符串
 * @param {number} min 最小长度
 * @param {number} max 最大长度
 * @returns {boolean} 验证结果
 */
const isValidLength = (str, min, max) => {
  if (str === null || str === undefined) {
    return false;
  }
  const length = String(str).length;
  return length >= min && length <= max;
};

/**
 * 验证数字是否在指定范围内
 * @param {number} number 数字值
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {boolean} 验证结果
 */
const isValidRange = (number, min, max) => {
  if (number === null || number === undefined || min === null || max === null) {
    return false;
  }
  return number >= min && number <= max;
};

/**
 * 去除 HTML 标签
 * @param {string} str 原始字符串
 * @returns {string} 去除标签后的字符串
 */
const stripHtmlTags = (str) => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
};

/**
 * 转义 HTML 特殊字符
 * @param {string} str 原始字符串
 * @returns {string} 转义后的字符串
 */
const escapeHtml = (str) => {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

module.exports = {
  isValidPhone,
  isValidEmail,
  isBlank,
  isNotBlank,
  isValidLength,
  isValidRange,
  stripHtmlTags,
  escapeHtml
};
