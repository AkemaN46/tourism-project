package com.homestay.xiaozhu.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Data
@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "homestay_id", nullable = false)
    private Long homestayId; // 关联民宿ID（核心字段）

    @Column(name = "room_type_id", nullable = false)
    private Long roomTypeId = 1L;

    @Column(name = "name", nullable = false)
    private String name; // 房型名称（如：海景大床房、亲子双床房）

    @Column(name = "description")
    private String description; // 房型描述

    @Column(name = "price", nullable = false)
    private BigDecimal price; // 销售价格

    @Column(name = "original_price")
    private BigDecimal originalPrice; // 原价

    @Column(name = "area")
    private Integer area; // 面积（㎡）

    @Column(name = "bed_type")
    private String bedType; // 床型（1.8米大床、1.2米双床）

    @Column(name = "people_num")
    private Integer peopleNum; // 可住人数

    @Column(name = "stock", nullable = false)
    private Integer stock = 0; // 库存（该房型的房间数量）

    @Column(name = "status")
    private Integer status = 1; // 房型状态：1-上架 0-下架

    @Column(name = "cover_image")
    private String coverImage; // 封面图片URL（对应数据库cover_image）

    @Column(name = "gallery", columnDefinition = "TEXT")
    private String gallery; // 图片集JSON字符串（对应数据库gallery，TEXT类型）

    @CreationTimestamp
    @Column(name = "created_at")
    private Date createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Date updatedAt;
}
