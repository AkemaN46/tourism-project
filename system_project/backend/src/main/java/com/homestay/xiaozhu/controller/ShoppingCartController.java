package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.entity.ShoppingCart;
import com.homestay.xiaozhu.repository.ShoppingCartRepository;
import com.homestay.xiaozhu.security.RequireUser;
import com.homestay.xiaozhu.service.OrderService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cart")
@RequireUser
public class ShoppingCartController extends BaseController {
    private final ShoppingCartRepository repository;
    private final OrderService orderService;

    public ShoppingCartController(ShoppingCartRepository repository, OrderService orderService) {
        this.repository = repository;
        this.orderService = orderService;
    }

    @PostMapping("/add")
    public Map<String, Object> add(@RequestBody Map<String, Object> body,
                                   @RequestHeader(value = "Authorization", required = false) String authorization,
                                   @RequestHeader(value = "token", required = false) String token) {
        Long userId = getCurrentUserId(authorization, token);
        Long roomId = requiredLong(body, "roomId");
        String checkIn = requiredText(body, "checkInDate"), checkOut = requiredText(body, "checkOutDate");
        orderService.quote(roomId, checkIn, checkOut);
        Date checkInDate = Date.valueOf(checkIn);
        ShoppingCart existing = repository.findByUserIdAndRoomIdAndCheckInDate(userId, roomId, checkInDate);
        if (existing != null) return error(409, "该日期的房型已在购物车中");
        ShoppingCart item = new ShoppingCart();
        item.setUserId(userId); item.setRoomId(roomId);
        item.setCheckInDate(checkInDate); item.setCheckOutDate(Date.valueOf(checkOut));
        return success("添加成功", repository.save(item));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                      @RequestHeader(value = "token", required = false) String token) {
        Long userId = getCurrentUserId(authorization, token);
        ShoppingCart item = repository.findByIdAndUserId(id, userId);
        if (item == null) return error(404, "购物车项不存在");
        String checkIn = requiredText(body, "checkInDate"), checkOut = requiredText(body, "checkOutDate");
        orderService.quote(item.getRoomId(), checkIn, checkOut);
        item.setCheckInDate(Date.valueOf(checkIn)); item.setCheckOutDate(Date.valueOf(checkOut));
        return success("日期已更新", repository.save(item));
    }

    @PostMapping("/remove")
    @Transactional
    public Map<String, Object> remove(@RequestBody Map<String, Object> body,
                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                      @RequestHeader(value = "token", required = false) String token) {
        Long userId = getCurrentUserId(authorization, token), id = requiredLong(body, "id");
        if (repository.findByIdAndUserId(id, userId) == null) return error(404, "购物车项不存在");
        repository.deleteByIdAndUserId(id, userId);
        return success("删除成功", null);
    }

    @GetMapping("/list")
    public Map<String, Object> list(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @RequestHeader(value = "token", required = false) String token) {
        List<Map<String, Object>> rows = repository.findCartItemsByUserId(getCurrentUserId(authorization, token));
        return success("获取成功", rows);
    }

    @PostMapping("/clear")
    @Transactional
    public Map<String, Object> clear(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @RequestHeader(value = "token", required = false) String token) {
        repository.deleteByUserId(getCurrentUserId(authorization, token));
        return success("购物车已清空", null);
    }

    private Long requiredLong(Map<String, Object> body, String name) {
        if (body.get(name) == null) throw new IllegalArgumentException(name + "不能为空");
        return Long.valueOf(body.get(name).toString());
    }

    private String requiredText(Map<String, Object> body, String name) {
        if (body.get(name) == null || body.get(name).toString().trim().isEmpty()) throw new IllegalArgumentException(name + "不能为空");
        return body.get(name).toString().trim();
    }
}
