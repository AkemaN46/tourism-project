package com.homestay.xiaozhu.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "reviews")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "content")
    private String content;

    @Column(name = "images")
    private String images;

    @Column(name = "status")
    private Integer status;

    @Column(name = "reply_content")
    private String replyContent;

    @Column(name = "reply_time")
    private Date replyTime;

    @CreationTimestamp
    @Column(name = "created_at")
    private Date createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Date updatedAt;
}