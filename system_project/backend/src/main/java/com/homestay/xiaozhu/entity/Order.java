package com.homestay.xiaozhu.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import javax.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no")
    private String orderNo;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "room_name")
    private String roomName;

    @Column(name = "room_image")
    private String roomImage;

    @Column(name = "check_in_date")
    private Date checkInDate;

    @Column(name = "check_out_date")
    private Date checkOutDate;

    @Column(name = "nights")
    private Integer nights;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "real_amount")
    private BigDecimal realAmount;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "remark")
    private String remark;

    @Column(name = "status")
    private Integer status;

    @Column(name = "reviewed")
    private Boolean reviewed = false; // 是否已评价

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_time")
    private Date paymentTime;

    @Column(name = "cancel_reason")
    private String cancelReason;

    @Column(name = "completed_time")
    private Date completedTime;

    @CreationTimestamp
    @Column(name = "created_at")
    private Date createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Date updatedAt;
}