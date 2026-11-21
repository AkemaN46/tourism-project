package com.homestay.xiaozhu.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class CreateOrderRequest {
    private Long cartId;

    @NotNull(message = "房型不能为空")
    private Long roomId;

    @NotBlank(message = "入住日期不能为空")
    private String checkInDate;

    @NotBlank(message = "离店日期不能为空")
    private String checkOutDate;

    @NotBlank(message = "联系人不能为空")
    private String contactName;

    @NotBlank(message = "手机号不能为空")
    private String contactPhone;

    @Size(max = 200, message = "订单备注不能超过200个字符")
    private String remark;
}
