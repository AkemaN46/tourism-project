package com.homestay.xiaozhu.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.List;

@Data
public class BatchOrderRequest {
    @Valid
    @NotEmpty(message = "订单数据不能为空")
    @Size(max = 10, message = "单次最多结算10个房型")
    private List<CreateOrderRequest> orders;
}
