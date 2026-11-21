package com.homestay.xiaozhu.entity;

import lombok.Data;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 民宿实体类（与数据库 homestay 表严格映射）
 */
@Data // Lombok注解，自动生成getter/setter/toString等，需引入lombok依赖
@Entity // 标记为JPA实体
@Table(name = "homestay") // 显式指定数据库表名，避免JPA默认复数化（homestays）
@DynamicInsert // 插入时只赋值非空字段，适配数据库默认值
@DynamicUpdate // 更新时只更新修改的字段
public class Homestay {

    /**
     * 民宿ID（主键，自增）
     */
    @Id // 标记主键
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 自增策略，匹配MySQL AUTO_INCREMENT
    private Long id;

    /**
     * 民宿名称（非空）
     */
    @Column(name = "name", nullable = false, length = 100) // 匹配数据库字段：非空、长度100
    private String name;

    /**
     * 联系电话
     */
    @Column(name = "phone", length = 20) // 匹配数据库字段：长度20
    private String phone;

    /**
     * 详细地址
     */
    @Column(name = "address", length = 255) // 匹配数据库字段：长度255
    private String address;

    /**
     * 民宿描述
     */
    @Column(name = "description", columnDefinition = "TEXT") // 匹配数据库TEXT类型
    private String description;

    /**
     * 外观图片URL（新增字段）
     */
    @Column(name = "cover_image") // 匹配数据库字段：cover_image
    private String coverImage;

    /**
     * 状态：1-上架，0-下架（默认1）
     */
    @Column(name = "status", columnDefinition = "TINYINT DEFAULT 1") // 匹配数据库TINYINT + 默认值1
    private Integer status = 1; // 实体默认值，与数据库一致

    /**
     * 评分（满分5.0）
     */
    @Column(name = "rating", columnDefinition = "DECIMAL(3,1) DEFAULT 0.0")
    private java.math.BigDecimal rating = new java.math.BigDecimal("0.0");

    /**
     * 销量
     */
    @Column(name = "sales_count", columnDefinition = "INT DEFAULT 0")
    private Integer salesCount = 0;

    /**
     * 创建时间
     */
    @Column(name = "created_at", updatable = false) // 匹配数据库字段，禁止更新
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 自动填充创建/更新时间（可选，也可依赖数据库默认值）
     */
    @PrePersist // 插入前执行
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate // 更新前执行
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}