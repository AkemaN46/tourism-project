// 图片地址统一处理。
// 部分初始化数据使用了 example.com 示例地址，开发环境中无法访问，
// 因此在小程序端回退到项目内置的本地图片。
const fallbackImages = [
  'ho1_1.jpg', 'ho1_2.jpg', 'ho1_3.jpg', 'ho1_4.jpg', 'ho1_5.jpg',
  'ho1_6.jpg', 'ho1_7.jpg', 'ho1_8.jpg', 'ho1_9.jpg', 'ho2.jpg',
  'ho2_1.jpg', 'ho3.jpg', 'ho4.jpg', 'ho5.jpg'
];
const config = require('./config');

function normalizeUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/assets/')) return url;
  return `${config.API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function getFallbackRoomImage(roomId, index = 0) {
  const numericId = Number(roomId) || 1;
  const imageIndex = (numericId - 1 + index) % fallbackImages.length;
  return `/assets/images/${fallbackImages[imageIndex]}`;
}

function isInvalidImageUrl(url) {
  return !url
    || url.indexOf('example.com') >= 0
    || url.indexOf('fuss10.elemecdn.com') >= 0
    || url.indexOf('http://tmp/') === 0
    || url.indexOf('https://tmp/') === 0
    || url.indexOf('wxfile://') === 0;
}

function resolveRoomImage(url, roomId, index = 0) {
  return isInvalidImageUrl(url)
    ? getFallbackRoomImage(roomId, index)
    : normalizeUrl(url);
}

function normalizeRoomImage(room) {
  const item = { ...room };
  item.coverImage = resolveRoomImage(item.coverImage, item.roomId || item.id);
  return item;
}

function normalizeRoomDetail(room) {
  const item = normalizeRoomImage(room);
  let gallery = Array.isArray(item.gallery) ? item.gallery : [];
  gallery = gallery.map((url, index) =>
    isInvalidImageUrl(url) ? getFallbackRoomImage(item.id, index) : normalizeUrl(url)
  );
  if (gallery.length === 0) {
    gallery = [item.coverImage];
  }
  item.gallery = gallery;
  return item;
}

module.exports = {
  getFallbackRoomImage,
  isInvalidImageUrl,
  normalizeRoomImage,
  normalizeRoomDetail,
  normalizeUrl,
  resolveRoomImage
};
