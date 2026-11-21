-- 汐岸小筑 V1.1 增量校验脚本（在已有 V1.0 数据库上执行）
USE xi_an_xiao_zhu;

-- 房型必须关联房型分类；历史空值统一落到默认分类 1。
UPDATE rooms SET room_type_id = 1 WHERE room_type_id IS NULL;
ALTER TABLE rooms MODIFY COLUMN room_type_id BIGINT NOT NULL;

-- 订单号由服务端 UUID 方案生成，数据库继续提供最终唯一性保护。
SET @has_order_no_uk = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'order_no' AND non_unique = 0
);
SET @sql = IF(@has_order_no_uk = 0,
  'ALTER TABLE orders ADD UNIQUE KEY uk_orders_order_no (order_no)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
