-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS xi_an_xiao_zhu 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE xi_an_xiao_zhu;

-- 2. 基础表
DROP TABLE IF EXISTS homestay;
CREATE TABLE IF NOT EXISTS homestay (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '民宿ID',
    name VARCHAR(100) NOT NULL COMMENT '民宿名称',
    phone VARCHAR(20) COMMENT '联系电话',
    address VARCHAR(255) COMMENT '详细地址',
    description TEXT COMMENT '民宿描述',
    status TINYINT DEFAULT 1 COMMENT '状态 1-上架 0-下架',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='民宿基础信息表';

-- 插入5个民宿（青岛、三亚；其余：西安、成都、丽江）
INSERT INTO homestay (name, phone, address, description, status)
VALUES 
-- 民宿1：西安
('西安曲江民宿', '13800138000', '陕西省西安市雁塔区曲江池西路88号', '紧邻大唐不夜城，唐风设计，步行5分钟到曲江池', 1),
-- 民宿2：青岛（海景）
('青岛崂山临海民宿', '13900139000', '山东省青岛市崂山区崂山路128号', '崂山脚下一线海景，步行3分钟到海滩，配套观海露台', 1),
-- 民宿3：三亚（海景）
('三亚亚龙湾海景民宿', '13700137000', '海南省三亚市亚龙湾国家旅游度假区龙海路66号', '直面亚龙湾海滩，热带风情，私人沙滩体验', 1),
-- 民宿4：成都
('成都青城山云境民宿', '13600136000', '四川省成都市都江堰市青城山镇青城山路99号', '青城山脚下，禅意风格，负氧离子充沛', 1),
-- 民宿5：丽江
('丽江束河古镇民宿', '13500135000', '云南省丽江市古城区束河古镇仁里路58号', '纳西族风格建筑，古镇核心区，静谧舒适', 1);

-- ============================================
-- 3. 核心业务表
-- ============================================
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    openid VARCHAR(100) UNIQUE COMMENT '微信openid',
    nickname VARCHAR(50) COMMENT '用户昵称',
    avatar_url VARCHAR(255) COMMENT '用户头像',
    phone VARCHAR(20) UNIQUE COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    gender TINYINT DEFAULT 0 COMMENT '性别 0未知 1男 2女',
    birthday DATE COMMENT '生日',
    status TINYINT DEFAULT 1 COMMENT '状态 0禁用 1正常',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '管理员ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '联系电话',
    email VARCHAR(100) COMMENT '邮箱',
    role VARCHAR(20) DEFAULT 'admin' COMMENT '角色 admin-超级管理员 manager-普通管理员',
    status TINYINT DEFAULT 1 COMMENT '状态 0禁用 1正常',
    last_login TIMESTAMP COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 房源类型表
CREATE TABLE IF NOT EXISTS room_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '房型ID',
    name VARCHAR(50) NOT NULL COMMENT '房型名称',
    description TEXT COMMENT '房型描述',
    cover_image VARCHAR(255) COMMENT '封面图片',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态 0禁用 1启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房源类型表';

-- 房源信息表
CREATE TABLE IF NOT EXISTS rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '房源ID',
    homestay_id BIGINT NOT NULL COMMENT '民宿ID',
    room_type_id BIGINT NOT NULL COMMENT '房型ID',
    name VARCHAR(100) NOT NULL COMMENT '房源名称',
    description TEXT COMMENT '房源描述',
    cover_image VARCHAR(255) COMMENT '封面图片',
    gallery TEXT COMMENT '图片集(json格式)',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    original_price DECIMAL(10,2) COMMENT '原价',
    area INT COMMENT '面积(平方米)',
    bed_type VARCHAR(50) COMMENT '床型',
    people_num INT DEFAULT 2 COMMENT '可住人数',
    facilities TEXT COMMENT '配套设施(json格式)',
    address VARCHAR(255) COMMENT '地址',
    longitude DECIMAL(10,6) COMMENT '经度',
    latitude DECIMAL(10,6) COMMENT '纬度',
    stock INT DEFAULT 0 COMMENT '库存数量',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态 0下架 1上架',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    -- 外键约束
    FOREIGN KEY (homestay_id) REFERENCES homestay(id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房源信息表';

-- 房态表(每日房态)
CREATE TABLE IF NOT EXISTS room_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '房态ID',
    room_id BIGINT NOT NULL COMMENT '房源ID',
    date DATE NOT NULL COMMENT '日期（2025.12-2026.02）',
    price DECIMAL(10,2) COMMENT '当日价格',
    stock INT DEFAULT 0 COMMENT '当日库存',
    status TINYINT DEFAULT 1 COMMENT '状态 0不可预订 1可预订',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_room_date (room_id, date),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房态表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单编号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    room_id BIGINT NOT NULL COMMENT '房源ID',
    room_name VARCHAR(100) NOT NULL COMMENT '房源名称',
    room_image VARCHAR(255) COMMENT '房源图片',
    check_in_date DATE NOT NULL COMMENT '入住日期（2025.12-2026.02）',
    check_out_date DATE NOT NULL COMMENT '离店日期（2025.12-2026.02）',
    nights INT NOT NULL COMMENT '入住晚数',
    price DECIMAL(10,2) NOT NULL COMMENT '单价',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '总金额',
    real_amount DECIMAL(10,2) NOT NULL COMMENT '实付金额',
    contact_name VARCHAR(50) COMMENT '联系人姓名',
    contact_phone VARCHAR(20) COMMENT '联系人电话',
    remark TEXT COMMENT '备注',
    status TINYINT DEFAULT 0 COMMENT '订单状态 0待支付 1已支付 2已入住 3已完成 4已取消 5已退款',
    payment_method VARCHAR(20) COMMENT '支付方式 wxpay-微信支付 alipay-支付宝',
    payment_time TIMESTAMP COMMENT '支付时间（2025.12-2026.02）',
    cancel_reason VARCHAR(255) COMMENT '取消原因',
    completed_time TIMESTAMP COMMENT '完成时间（2025.12-2026.02）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 资讯分类表
CREATE TABLE IF NOT EXISTS news_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态 0禁用 1启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资讯分类表';

-- 资讯表
CREATE TABLE IF NOT EXISTS news (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '资讯ID',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    title VARCHAR(100) NOT NULL COMMENT '标题',
    subtitle VARCHAR(200) COMMENT '副标题',
    cover_image VARCHAR(255) COMMENT '封面图片',
    content LONGTEXT COMMENT '内容',
    author VARCHAR(50) COMMENT '作者',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态 0草稿 1发布',
    published_at TIMESTAMP COMMENT '发布时间（2025.11-2025.12）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资讯表';

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评价ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    room_id BIGINT NOT NULL COMMENT '房源ID',
    rating TINYINT NOT NULL COMMENT '评分 1-5星',
    content TEXT COMMENT '评价内容',
    images TEXT COMMENT '评价图片(json格式)',
    status TINYINT DEFAULT 0 COMMENT '状态 0待审核 1已通过 2未通过',
    reply_content TEXT COMMENT '回复内容',
    reply_time TIMESTAMP COMMENT '回复时间（2025.12-2026.02）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_order (order_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价表';

-- ============================================
-- 批量预订功能修复
-- ============================================
-- 修改订单表，允许联系人字段为空
ALTER TABLE orders 
MODIFY COLUMN contact_name VARCHAR(50) COMMENT '联系人姓名',
MODIFY COLUMN contact_phone VARCHAR(20) COMMENT '联系人电话';

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    room_id BIGINT NOT NULL COMMENT '房源ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_room (user_id, room_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- 购物车表
CREATE TABLE IF NOT EXISTS shopping_cart (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '购物车ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    room_id BIGINT NOT NULL COMMENT '房源ID',
    check_in_date DATE NOT NULL COMMENT '入住日期（2025.12-2026.02）',
    check_out_date DATE NOT NULL COMMENT '离店日期（2025.12-2026.02）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_room_date (user_id, room_id, check_in_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_desc VARCHAR(255) COMMENT '配置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================
-- 4. 插入初始数据（按表依赖顺序，调整日期/名称/民宿房源分配）
-- ============================================

-- 管理员账号（密码示例：admin123，实际需用BCrypt加密）
INSERT INTO admins (username, password, real_name, phone, email, role, status) VALUES 
('admin', '$2a$10$2a.0fQJzOjZQJzOjZQJzOeJzOjZQJzOjZQJzOjZQJzOjZQJzOjZQ.', '超级管理员', '13800138888', 'admin@xiaozhu.com', 'admin', 1),
('manager1', '$2a$10$2a.0fQJzOjZQJzOjZQJzOeJzOjZQJzOjZQJzOjZQJzOjZQJzOjZQ.', '张经理', '13800138801', 'manager1@xiaozhu.com', 'manager', 1),
('manager2', '$2a$10$2a.0fQJzOjZQJzOjZQJzOeJzOjZQJzOjZQJzOjZQJzOjZQJzOjZQ.', '李主管', '13800138802', 'manager2@xiaozhu.com', 'manager', 1),
('manager3', '$2a$10$2a.0fQJzOjZQJzOjZQJzOeJzOjZQJzOjZQJzOjZQJzOjZQJzOjZQ.', '王店长', '13800138803', 'manager3@xiaozhu.com', 'manager', 1),
('manager4', '$2a$10$2a.0fQJzOjZQJzOjZQJzOeJzOjZQJzOjZQJzOjZQJzOjZQJzOjZQ.', '赵运营', '13800138804', 'manager4@xiaozhu.com', 'manager', 0),
('manager5', '$2a$10$2a.0fQJzOjZQJzOjZQJzOeJzOjZQJzOjZQJzOjZQJzOjZQJzOjZQ.', '刘客服', '13800138805', 'manager5@xiaozhu.com', 'manager', 1);

-- 房源类型
INSERT INTO room_types (name, description, cover_image) VALUES 
('大床房', '配备一张大床，温馨舒适', 'https://example.com/roomtype1.jpg'),
('双床房', '配备两张单人床，适合朋友出行', 'https://example.com/roomtype2.jpg'),
('家庭套房', '宽敞的家庭套房，配备客厅', 'https://example.com/roomtype3.jpg'),
('海景房', '面朝大海，视野开阔', 'https://example.com/roomtype4.jpg'),
('商务大床房', '配备办公桌和高速网络，适合商务出行', 'https://example.com/roomtype5.jpg'),
('亲子主题房', '儿童主题装饰，配备儿童床', 'https://example.com/roomtype6.jpg'),
('日式榻榻米', '传统日式风格，榻榻米床铺', 'https://example.com/roomtype7.jpg');

-- 用户表
INSERT INTO users (openid, nickname, avatar_url, phone, email, gender, birthday, status) VALUES
('wx_openid_001', '张三', 'https://example.com/avatar1.jpg', '13800138001', 'zhangsan@example.com', 1, '1990-05-15', 1),
('wx_openid_002', '李四', 'https://example.com/avatar2.jpg', '13800138002', 'lisi@example.com', 2, '1992-08-22', 1),
('wx_openid_003', '王五', 'https://example.com/avatar3.jpg', '13800138003', 'wangwu@example.com', 1, '1988-03-10', 1),
('wx_openid_004', '赵六', 'https://example.com/avatar4.jpg', '13800138004', 'zhaoliu@example.com', 2, '1995-11-30', 1),
('wx_openid_005', '钱七', 'https://example.com/avatar5.jpg', '13800138005', 'qianqi@example.com', 1, '1993-07-18', 1),
('wx_openid_006', '孙八', 'https://example.com/avatar6.jpg', '13800138006', 'sunba@example.com', 1, '1991-02-28', 0),
('wx_openid_007', '周九', 'https://example.com/avatar7.jpg', '13800138007', 'zhoujiu@example.com', 2, '1994-09-05', 1),
('wx_openid_008', '吴十', 'https://example.com/avatar8.jpg', '13800138008', 'wushi@example.com', 1, '1996-12-12', 1);

-- 民宿1：西安曲江民宿
INSERT INTO rooms (homestay_id, room_type_id, name, description, cover_image, gallery, price, original_price, area, bed_type, people_num, facilities, address, longitude, latitude, stock, status) VALUES
(1, 1, '温馨大床房', '温馨舒适的大床房，采光良好，唐风设计', 'https://example.com/room1_cover.jpg', '["https://example.com/room1_1.jpg", "https://example.com/room1_2.jpg", "https://example.com/room1_3.jpg"]', 259.00, 288.00, 25, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv"]', '陕西省西安市雁塔区曲江池西路88号', 108.946465, 34.224518, 5, 1),
(1, 1, '简约大床房', '简约风格大床房，安静舒适，近景区', 'https://example.com/room2_cover.jpg', '["https://example.com/room2_1.jpg", "https://example.com/room2_2.jpg"]', 269.00, 299.00, 22, '1.5米大床', 2, '["wifi", "air_conditioner", "tv", "heater"]', '陕西省西安市雁塔区曲江池西路88号', 108.946465, 34.224518, 3, 1),
(1, 2, '舒适双床房', '两张单人床，适合朋友出行，配套茶具', 'https://example.com/room3_cover.jpg', '["https://example.com/room3_1.jpg", "https://example.com/room3_2.jpg", "https://example.com/room3_3.jpg"]', 359.00, 399.00, 28, '1.2米单人床×2', 2, '["wifi", "parking", "air_conditioner", "tv", "desk"]', '陕西省西安市雁塔区曲江池西路88号', 108.946465, 34.224518, 4, 1),
(1, 3, '豪华家庭套房', '两室一厅，适合家庭入住，唐风装修', 'https://example.com/room5_cover.jpg', '["https://example.com/room5_1.jpg", "https://example.com/room5_2.jpg", "https://example.com/room5_3.jpg", "https://example.com/room5_4.jpg"]', 539.00, 599.00, 65, '1.8米大床+1.2米单人床', 4, '["wifi", "parking", "air_conditioner", "tv", "kitchen", "washing_machine"]', '陕西省西安市雁塔区曲江池西路88号', 108.946465, 34.224518, 2, 1),
(1, 5, '商务尊享大床房', '配备办公区域，高速网络，近商圈', 'https://example.com/room7_cover.jpg', '["https://example.com/room7_1.jpg", "https://example.com/room7_2.jpg"]', 299.00, 335.00, 30, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv", "desk", "printer"]', '陕西省西安市雁塔区曲江池西路88号', 108.946465, 34.224518, 6, 1),
(1, 6, '童趣亲子房', '卡通主题装饰，儿童安全设施，近乐园', 'https://example.com/room8_cover.jpg', '["https://example.com/room8_1.jpg", "https://example.com/room8_2.jpg", "https://example.com/room8_3.jpg"]', 629.00, 699.00, 35, '1.8米大床+儿童床', 3, '["wifi", "parking", "air_conditioner", "tv", "toys", "baby_bed"]', '陕西省西安市雁塔区曲江池西路88号', 108.946465, 34.224518, 2, 1),
(1, 1, '新悦大床房', '新装修，设施齐全，智能控制', 'https://example.com/room12_cover.jpg', '["https://example.com/room12_1.jpg", "https://example.com/room12_2.jpg"]', 269.00, 299.00, 24, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv", "heater"]', '陕西省西安市雁塔区曲江池西路88号', 108.946465, 34.224518, 5, 1);

-- 民宿2：青岛崂山临海民宿
INSERT INTO rooms (homestay_id, room_type_id, name, description, cover_image, gallery, price, original_price, area, bed_type, people_num, facilities, address, longitude, latitude, stock, status) VALUES
(2, 4, '180°全海景房', '180度海景视野，阳台观海，崂山景观', 'https://example.com/room6_cover.jpg', '["https://example.com/room6_1.jpg", "https://example.com/room6_2.jpg", "https://example.com/room6_3.jpg"]', 719.00, 799.00, 45, '2米超大床', 2, '["wifi", "parking", "air_conditioner", "tv", "balcony", "bathtub"]', '山东省青岛市崂山区崂山路128号', 120.659618, 36.102229, 3, 1),
(2, 4, '侧海景大床房', '侧海景房，性价比高，步行到海滩', 'https://example.com/room10_cover.jpg', '["https://example.com/room10_1.jpg", "https://example.com/room10_2.jpg"]', 539.00, 599.00, 38, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv"]', '山东省青岛市崂山区崂山路128号', 120.659618, 36.102229, 2, 1),
(2, 1, '观海大床房', '观海视角大床房，温馨舒适', 'https://example.com/room1_cover.jpg', '["https://example.com/room1_1.jpg", "https://example.com/room1_2.jpg"]', 539.00, 599.00, 30, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv"]', '山东省青岛市崂山区崂山路128号', 120.659618, 36.102229, 5, 1),
(2, 2, '临海双床房', '临海双床房，适合朋友出行', 'https://example.com/room3_cover.jpg', '["https://example.com/room3_1.jpg", "https://example.com/room3_2.jpg"]', 539.00, 599.00, 32, '1.2米单人床×2', 2, '["wifi", "parking", "air_conditioner", "tv"]', '山东省青岛市崂山区崂山路128号', 120.659618, 36.102229, 4, 1),
(2, 3, '海景家庭套房', '海景家庭套房，两室一厅，观海露台', 'https://example.com/room5_cover.jpg', '["https://example.com/room5_1.jpg", "https://example.com/room5_2.jpg"]', 629.00, 699.00, 70, '1.8米大床+1.2米单人床', 4, '["wifi", "parking", "air_conditioner", "tv", "kitchen"]', '山东省青岛市崂山区崂山路128号', 120.659618, 36.102229, 2, 1),
(2, 7, '和风榻榻米房', '日式榻榻米，观海飘窗', 'https://example.com/room9_cover.jpg', '["https://example.com/room9_1.jpg", "https://example.com/room9_2.jpg"]', 359.00, 399.00, 28, '榻榻米', 3, '["wifi", "parking", "air_conditioner", "tv", "tea_set"]', '山东省青岛市崂山区崂山路128号', 120.659618, 36.102229, 4, 1),
(2, 6, '海景亲子房', '海景亲子房，儿童主题，观海视角', 'https://example.com/room8_cover.jpg', '["https://example.com/room8_1.jpg", "https://example.com/room8_2.jpg"]', 629.00, 699.00, 38, '1.8米大床+儿童床', 3, '["wifi", "parking", "air_conditioner", "tv", "toys"]', '山东省青岛市崂山区崂山路128号', 120.659618, 36.102229, 3, 1);

-- 民宿3：三亚亚龙湾海景民宿
INSERT INTO rooms (homestay_id, room_type_id, name, description, cover_image, gallery, price, original_price, area, bed_type, people_num, facilities, address, longitude, latitude, stock, status) VALUES
(3, 4, '一线海景大床房', '直面亚龙湾海滩，无遮挡海景', 'https://example.com/room6_cover.jpg', '["https://example.com/room6_1.jpg", "https://example.com/room6_2.jpg"]', 719.00, 799.00, 40, '2米超大床', 2, '["wifi", "parking", "air_conditioner", "tv", "balcony", "bathtub"]', '海南省三亚市亚龙湾国家旅游度假区龙海路66号', 109.514722, 18.287500, 4, 1),
(3, 4, '海景露台房', '超大观海露台，热带风情装修', 'https://example.com/room10_cover.jpg', '["https://example.com/room10_1.jpg", "https://example.com/room10_2.jpg"]', 629.00, 699.00, 45, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv", "outdoor_sofa"]', '海南省三亚市亚龙湾国家旅游度假区龙海路66号', 109.514722, 18.287500, 2, 1),
(3, 1, '椰林大床房', '椰林景观大床房，安静舒适', 'https://example.com/room1_cover.jpg', '["https://example.com/room1_1.jpg", "https://example.com/room1_2.jpg"]', 629.00, 699.00, 30, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv"]', '海南省三亚市亚龙湾国家旅游度假区龙海路66号', 109.514722, 18.287500, 5, 1),
(3, 2, '沙滩双床房', '近沙滩双床房，适合朋友出行', 'https://example.com/room3_cover.jpg', '["https://example.com/room3_1.jpg", "https://example.com/room3_2.jpg"]', 449.00, 499.00, 35, '1.2米单人床×2', 2, '["wifi", "parking", "air_conditioner", "tv", "beach_tools"]', '海南省三亚市亚龙湾国家旅游度假区龙海路66号', 109.514722, 18.287500, 4, 1),
(3, 3, '海景家庭套房', '三室一厅，超大观海窗，适合家庭', 'https://example.com/room5_cover.jpg', '["https://example.com/room5_1.jpg", "https://example.com/room5_2.jpg"]', 539.00, 599.00, 80, '1.8米大床×2+1.2米单人床', 6, '["wifi", "parking", "air_conditioner", "tv", "kitchen", "washing_machine"]', '海南省三亚市亚龙湾国家旅游度假区龙海路66号', 109.514722, 18.287500, 2, 1),
(3, 6, '童趣海景亲子房', '卡通主题，儿童泳池，海景视角', 'https://example.com/room8_cover.jpg', '["https://example.com/room8_1.jpg", "https://example.com/room8_2.jpg"]', 539.00, 599, 40, '1.8米大床+儿童床', 3, '["wifi", "parking", "air_conditioner", "tv", "toys", "baby_pool"]', '海南省三亚市亚龙湾国家旅游度假区龙海路66号', 109.514722, 18.287500, 3, 1),
(3, 7, '东南亚榻榻米房', '东南亚风格榻榻米，观海飘窗', 'https://example.com/room9_cover.jpg', '["https://example.com/room9_1.jpg", "https://example.com/room9_2.jpg"]', 359.00, 399.00, 30, '榻榻米', 3, '["wifi", "parking", "air_conditioner", "tv", "tea_set"]', '海南省三亚市亚龙湾国家旅游度假区龙海路66号', 109.514722, 18.287500, 4, 1);

-- 民宿4：成都青城山云境民宿
INSERT INTO rooms (homestay_id, room_type_id, name, description, cover_image, gallery, price, original_price, area, bed_type, people_num, facilities, address, longitude, latitude, stock, status) VALUES
(4, 1, '禅意大床房', '禅意风格大床房，青城山景观', 'https://example.com/room1_cover.jpg', '["https://example.com/room1_1.jpg", "https://example.com/room1_2.jpg"]', 359.00, 399.00, 28, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv", "tea_set"]', '四川省成都市都江堰市青城山镇青城山路99号', 103.585522, 30.946750, 5, 1),
(4, 1, '山景大床房', '山景视角，落地窗，安静舒适', 'https://example.com/room2_cover.jpg', '["https://example.com/room2_1.jpg", "https://example.com/room2_2.jpg"]', 323.00, 359.00, 25, '1.5米大床', 2, '["wifi", "air_conditioner", "tv", "heater"]', '四川省成都市都江堰市青城山镇青城山路99号', 103.585522, 30.946750, 3, 1),
(4, 2, '林间双床房', '林间双床房，负氧离子充沛', 'https://example.com/room3_cover.jpg', '["https://example.com/room3_1.jpg", "https://example.com/room3_2.jpg"]', 413.00, 459.00, 30, '1.2米单人床×2', 2, '["wifi", "parking", "air_conditioner", "tv"]', '四川省成都市都江堰市青城山镇青城山路99号', 103.585522, 30.946750, 4, 1),
(4, 3, '山居家庭套房', '两室一厅，山居风格，适合家庭', 'https://example.com/room5_cover.jpg', '["https://example.com/room5_1.jpg", "https://example.com/room5_2.jpg"]', 449.00, 499.00, 70, '1.8米大床+1.2米单人床', 4, '["wifi", "parking", "air_conditioner", "tv", "kitchen"]', '四川省成都市都江堰市青城山镇青城山路99号', 103.585522, 30.946750, 2, 1),
(4, 5, '商务山景房', '办公区域+山景，适合商务出行', 'https://example.com/room7_cover.jpg', '["https://example.com/room7_1.jpg", "https://example.com/room7_2.jpg"]', 377.00, 419.00, 32, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv", "desk"]', '四川省成都市都江堰市青城山镇青城山路99号', 103.585522, 30.946750, 6, 1),
(4, 7, '日式榻榻米房', '日式榻榻米，禅意茶台', 'https://example.com/room9_cover.jpg', '["https://example.com/room9_1.jpg", "https://example.com/room9_2.jpg"]', 359.00, 399.00, 28, '榻榻米', 3, '["wifi", "parking", "air_conditioner", "tv", "tea_set"]', '四川省成都市都江堰市青城山镇青城山路99号', 103.585522, 30.946750, 4, 1),
(4, 6, '亲子山居房', '儿童主题，山居景观，安全设施齐全', 'https://example.com/room8_cover.jpg', '["https://example.com/room8_1.jpg", "https://example.com/room8_2.jpg"]', 449.00, 499.00, 35, '1.8米大床+儿童床', 3, '["wifi", "parking", "air_conditioner", "tv", "toys"]', '四川省成都市都江堰市青城山镇青城山路99号', 103.585522, 30.946750, 2, 1);

-- 民宿5：丽江束河古镇民宿
INSERT INTO rooms (homestay_id, room_type_id, name, description, cover_image, gallery, price, original_price, area, bed_type, people_num, facilities, address, longitude, latitude, stock, status) VALUES
(5, 1, '纳西大床房', '纳西族风格大床房，古镇核心区', 'https://example.com/room1_cover.jpg', '["https://example.com/room1_1.jpg", "https://example.com/room1_2.jpg"]', 359.00, 399.00, 25, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv"]', '云南省丽江市古城区束河古镇仁里路58号', 100.239722, 26.866944, 5, 1),
(5, 1, '古镇大床房', '临古镇街道，纳西风格，安静舒适', 'https://example.com/room2_cover.jpg', '["https://example.com/room2_1.jpg", "https://example.com/room2_2.jpg"]', 323.00, 359.00, 22, '1.5米大床', 2, '["wifi", "air_conditioner", "tv", "heater"]', '云南省丽江市古城区束河古镇仁里路58号', 100.239722, 26.866944, 3, 1),
(5, 2, '纳西双床房', '纳西风格双床房，适合朋友出行', 'https://example.com/room3_cover.jpg', '["https://example.com/room3_1.jpg", "https://example.com/room3_2.jpg"]', 413.00, 459.00, 28, '1.2米单人床×2', 2, '["wifi", "parking", "air_conditioner", "tv", "desk"]', '云南省丽江市古城区束河古镇仁里路58号', 100.239722, 26.866944, 4, 1),
(5, 3, '古镇家庭套房', '纳西族风格家庭套房，两室一厅', 'https://example.com/room5_cover.jpg', '["https://example.com/room5_1.jpg", "https://example.com/room5_2.jpg"]', 449.00, 499.00, 65, '1.8米大床+1.2米单人床', 4, '["wifi", "parking", "air_conditioner", "tv", "kitchen"]', '云南省丽江市古城区束河古镇仁里路58号', 100.239722, 26.866944, 2, 1),
(5, 7, '纳西榻榻米房', '纳西+日式榻榻米，特色茶台', 'https://example.com/room9_cover.jpg', '["https://example.com/room9_1.jpg", "https://example.com/room9_2.jpg"]', 377.00, 419.00, 28, '榻榻米', 3, '["wifi", "parking", "air_conditioner", "tv", "tea_set"]', '云南省丽江市古城区束河古镇仁里路58号', 100.239722, 26.866944, 4, 1),
(5, 6, '童趣纳西亲子房', '卡通主题+纳西风格，儿童设施齐全', 'https://example.com/room8_cover.jpg', '["https://example.com/room8_1.jpg", "https://example.com/room8_2.jpg"]', 359.00, 399.00, 35, '1.8米大床+儿童床', 3, '["wifi", "parking", "air_conditioner", "tv", "toys"]', '云南省丽江市古城区束河古镇仁里路58号', 100.239722, 26.866944, 2, 1),
(5, 5, '商务纳西房', '办公区域+纳西风格，适合商务出行', 'https://example.com/room7_cover.jpg', '["https://example.com/room7_1.jpg", "https://example.com/room7_2.jpg"]', 449.00, 499.00, 30, '1.8米大床', 2, '["wifi", "parking", "air_conditioner", "tv", "desk"]', '云南省丽江市古城区束河古镇仁里路58号', 100.239722, 26.866944, 6, 1);

INSERT INTO room_status (room_id, date, price, stock, status)
SELECT 
    r.id,
    DATE_ADD('2025-12-01', INTERVAL n.n DAY) as date,
    r.price,
    r.stock,
    1
FROM rooms r
CROSS JOIN (
    SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
    SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION
    SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION
    SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION
    SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION
    SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION
    SELECT 30 UNION SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION
    SELECT 35 UNION SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION
    SELECT 40 UNION SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION
    SELECT 45 UNION SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION
    SELECT 50 UNION SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION
    SELECT 55 UNION SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION
    SELECT 60 UNION SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION
    SELECT 65 UNION SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION
    SELECT 70 UNION SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION
    SELECT 75 UNION SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION
    SELECT 80 UNION SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION
    SELECT 85 UNION SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89
) n
WHERE r.status = 1 AND DATE_ADD('2025-12-01', INTERVAL n.n DAY) < '2026-03-01';

-- 订单表
INSERT INTO orders (order_no, user_id, room_id, room_name, room_image, check_in_date, check_out_date, nights, price, total_amount, real_amount, contact_name, contact_phone, remark, status, payment_method, payment_time) VALUES
('ORD20251201001', 1, 1, '温馨大床房', 'https://example.com/room1_cover.jpg', '2025-12-05', '2025-12-07', 2, 588.00, 1176.00, 1176.00, '张三', '13800138001', '需要安静的房间', 1, 'wxpay', '2025-12-01 10:30:00'),
('ORD20251201002', 2, 3, '舒适双床房', 'https://example.com/room3_cover.jpg', '2025-12-10', '2025-12-12', 2, 688.00, 1376.00, 1376.00, '李四', '13800138002', '和朋友一起住', 2, 'alipay', '2025-12-01 11:15:00'),
('ORD20251201003', 3, 5, '豪华家庭套房', 'https://example.com/room5_cover.jpg', '2025-12-15', '2025-12-18', 3, 1288.00, 3864.00, 3864.00, '王五', '13800138003', '家庭旅行，需要婴儿床', 3, 'wxpay', '2025-12-01 14:20:00'),
('ORD20251201004', 4, 8, '180°全海景房', 'https://example.com/room6_cover.jpg', '2025-12-20', '2025-12-21', 1, 1888.00, 1888.00, 1888.00, '赵六', '13800138004', '蜜月旅行', 0, NULL, NULL),
('ORD20251201005', 5, 7, '商务尊享大床房', 'https://example.com/room7_cover.jpg', '2025-12-08', '2025-12-10', 2, 788.00, 1576.00, 1576.00, '钱七', '13800138005', '商务出差', 1, 'wxpay', '2025-12-01 16:45:00'),
('ORD20251201006', 1, 6, '童趣亲子房', 'https://example.com/room8_cover.jpg', '2025-12-25', '2025-12-28', 3, 988.00, 2964.00, 2964.00, '张三', '13800138001', '带孩子过圣诞', 1, 'alipay', '2025-12-01 18:30:00'),
('ORD20251201007', 2, 14, '和风榻榻米房', 'https://example.com/room9_cover.jpg', '2025-12-12', '2025-12-13', 1, 888.00, 888.00, 888.00, '李四', '13800138002', '体验日式风格', 4, NULL, NULL),
('ORD20251201008', 3, 9, '侧海景大床房', 'https://example.com/room10_cover.jpg', '2025-12-18', '2025-12-20', 2, 1588.00, 3176.00, 3176.00, '王五', '13800138003', '拍照打卡', 1, 'wxpay', '2025-12-01 20:15:00'),
('ORD20251201009', 4, 22, '海景家庭套房', 'https://example.com/room11_cover.jpg', '2025-12-22', '2025-12-24', 2, 988.00, 1976.00, 1976.00, '赵六', '13800138004', '父母来访', 2, 'alipay', '2025-12-01 21:30:00'),
('ORD20251201010', 5, 7, '商务尊享大床房', 'https://example.com/room12_cover.jpg', '2025-12-06', '2025-12-08', 2, 628.00, 1256.00, 1256.00, '钱七', '13800138005', '短途旅行', 3, 'wxpay', '2025-12-01 22:45:00'),
('ORD20251201011', 6, 2, '简约大床房', 'https://example.com/room2_cover.jpg', '2025-12-09', '2025-12-11', 2, 568.00, 1136.00, 1136.00, '孙八', '13800138006', '考试期间需要安静', 1, 'wxpay', '2025-12-02 09:20:00'),
('ORD20251201012', 7, 4, '舒适双床房', 'https://example.com/room4_cover.jpg', '2025-12-14', '2025-12-16', 2, 658.00, 1316.00, 1316.00, '周九', '13800138007', '和朋友旅游', 5, NULL, NULL),
('ORD20251201013', 8, 1, '温馨大床房', 'https://example.com/room1_cover.jpg', '2026-01-28', '2026-01-31', 3, 588.00, 1764.00, 1764.00, '吴十', '13800138008', '跨年旅行', 1, 'alipay', '2025-12-02 14:30:00'),
('ORD20251201014', 1, 8, '180°全海景房', 'https://example.com/room6_cover.jpg', '2026-02-01', '2026-02-03', 2, 1888.00, 3776.00, 3776.00, '张三', '13800138001', '春节假期', 0, NULL, NULL),
('ORD20251201015', 2, 7, '商务尊享大床房', 'https://example.com/room7_cover.jpg', '2025-12-13', '2025-12-15', 2, 788.00, 1576.00, 1576.00, '李四', '13800138002', '公司会议', 1, 'wxpay', '2025-12-02 16:50:00');

-- 更新订单状态相关字段
UPDATE orders SET completed_time = '2025-12-18 12:00:00' WHERE id IN (3, 10);
UPDATE orders SET cancel_reason = '行程有变' WHERE id = 7;
UPDATE orders SET cancel_reason = '价格太贵' WHERE id = 12;

-- 资讯分类
INSERT INTO news_categories (name) VALUES 
('景点推荐'),
('美食指南'),
('民宿攻略'),
('活动资讯');

-- 资讯表
INSERT INTO news (category_id, title, subtitle, cover_image, content, author, view_count, status, published_at) VALUES
(1, '西安城墙游玩攻略', '古都西安的标志性景点', 'https://example.com/news1.jpg', '<p>西安城墙是中国现存规模最大、保存最完整的古代城垣...</p>', '张小文', 1250, 1, '2025-11-25 10:00:00'),
(1, '兵马俑参观指南', '世界第八大奇迹', 'https://example.com/news2.jpg', '<p>秦始皇兵马俑博物馆是世界著名的考古遗址博物馆...</p>', '李历史', 890, 1, '2025-11-26 14:30:00'),
(2, '西安美食地图', '吃货必看的西安美食攻略', 'https://example.com/news3.jpg', '<p>西安作为历史文化名城，美食也是多种多样...</p>', '王美食', 1560, 1, '2025-11-27 09:15:00'),
(2, '回民街美食推荐', '品尝地道的西安小吃', 'https://example.com/news4.jpg', '<p>回民街是西安著名的美食文化街区...</p>', '赵小吃', 1120, 1, '2025-11-28 16:45:00'),
(3, '民宿选择技巧', '如何选择适合自己的民宿', 'https://example.com/news5.jpg', '<p>随着旅游方式的多样化，民宿成为越来越多人的选择...</p>', '刘旅行', 780, 1, '2025-11-29 11:20:00'),
(3, '民宿入住注意事项', '让你的住宿更安心', 'https://example.com/news6.jpg', '<p>入住民宿与酒店有所不同，需要注意以下几点...</p>', '陈安全', 650, 1, '2025-11-30 13:10:00'),
(4, '圣诞主题活动', '汐岸小筑圣诞特别活动', 'https://example.com/news7.jpg', '<p>为了迎接圣诞节的到来，汐岸小筑特别推出...</p>', '汐岸小筑', 320, 1, '2025-12-01 10:00:00'),
(4, '元旦跨年派对', '一起迎接新的一年', 'https://example.com/news8.jpg', '<p>2026年即将到来，汐岸小筑为您准备了一场...</p>', '汐岸小筑', 280, 1, '2025-12-01 15:30:00'),
(1, '大雁塔音乐喷泉', '亚洲最大的音乐喷泉', 'https://example.com/news9.jpg', '<p>大雁塔北广场的音乐喷泉是亚洲最大的音乐喷泉...</p>', '周旅游', 940, 1, '2025-12-02 09:45:00'),
(2, '陕西特色面食', '面食爱好者的天堂', 'https://example.com/news10.jpg', '<p>陕西面食种类繁多，各具特色...</p>', '孙面食', 710, 1, '2025-12-02 14:20:00');

-- 评价表
INSERT INTO reviews (user_id, order_id, room_id, rating, content, images, status, reply_content, reply_time) VALUES
(1, 1, 1, 5, '房间很干净，服务态度很好，下次还会再来！', '["https://example.com/review1_1.jpg"]', 1, '感谢您的评价，期待您的再次光临！', '2025-12-07 10:30:00'),
(2, 2, 3, 4, '房间不错，就是隔音稍微差了点', '[]', 1, '感谢您的反馈，我们会改进隔音措施。', '2025-12-12 09:15:00'),
(3, 3, 5, 5, '家庭套房很宽敞，孩子很喜欢，还有玩具，太贴心了！', '["https://example.com/review3_1.jpg", "https://example.com/review3_2.jpg"]', 1, '谢谢您的认可，希望小朋友玩得开心！', '2025-12-18 14:20:00'),
(5, 5, 7, 4, '商务出行很方便，网络很快，办公桌很实用', '[]', 1, '感谢您的评价，商务出行选择我们是正确的！', '2025-12-10 16:45:00'),
(1, 6, 8, 5, '孩子特别喜欢房间的主题装饰，玩得很开心', '["https://example.com/review6_1.jpg"]', 1, '很高兴小朋友喜欢，期待你们再次光临！', '2025-12-28 18:30:00'),
(2, 8, 9, 5, '海景太美了，拍照特别好看，强烈推荐！', '["https://example.com/review8_1.jpg", "https://example.com/review8_2.jpg", "https://example.com/review8_3.jpg"]', 1, '谢谢您的推荐，希望您拍到了美美的照片！', '2025-12-20 20:15:00'),
(3, 9, 22, 4, '房间很温馨，父母很满意，谢谢！', '[]', 1, '很高兴您的父母满意，欢迎再次带家人来玩！', '2025-12-24 21:30:00'),
(5, 10, 7, 5, '新装修的房间，设施都很新，很干净', '["https://example.com/review10_1.jpg"]', 1, '感谢您的认可，我们会继续保持！', '2025-12-08 22:45:00'),
(6, 11, 2, 3, '房间比较小，隔音一般，但价格还算合理', '[]', 0, NULL, NULL),
(7, 12, 4, 2, '房间设施有点旧，热水不够热', '[]', 2, '感谢您的反馈，我们会尽快更新设施并检查热水系统。', '2025-12-16 10:00:00');