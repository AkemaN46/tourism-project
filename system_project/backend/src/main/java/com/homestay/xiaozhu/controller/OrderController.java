package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.dto.BatchOrderRequest;
import com.homestay.xiaozhu.dto.CreateOrderRequest;
import com.homestay.xiaozhu.entity.Order;
import com.homestay.xiaozhu.repository.OrderRepository;
import com.homestay.xiaozhu.security.AuthPrincipal;
import com.homestay.xiaozhu.security.RequireLogin;
import com.homestay.xiaozhu.service.OrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

import javax.persistence.criteria.Predicate;
import javax.validation.Valid;
import java.util.*;

@RestController
@RequestMapping("/order")
@RequireLogin
public class OrderController extends BaseController {
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public OrderController(OrderRepository orderRepository, OrderService orderService) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
    }

    @PostMapping("/create")
    public Map<String, Object> createOrder(@Valid @RequestBody CreateOrderRequest request,
                                           @RequestHeader(value = "Authorization", required = false) String authorization,
                                           @RequestHeader(value = "token", required = false) String token) {
        Long userId = getCurrentUserId(authorization, token);
        if (userId == null) {
            return error(403, "管理员不能代替用户创建订单");
        }
        return success("订单创建成功", orderService.create(userId, request, false));
    }

    @PostMapping("/batch-create")
    public Map<String, Object> batchCreateOrders(@Valid @RequestBody BatchOrderRequest request,
                                                  @RequestHeader(value = "Authorization", required = false) String authorization,
                                                  @RequestHeader(value = "token", required = false) String token) {
        Long userId = getCurrentUserId(authorization, token);
        if (userId == null) {
            return error(403, "管理员不能代替用户创建订单");
        }
        return success("批量订单创建成功", orderService.createBatch(userId, request));
    }

    @GetMapping("/list")
    public Map<String, Object> getOrderList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) String contactName,
            @RequestParam(required = false) Integer status,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "token", required = false) String token) {
        AuthPrincipal principal = getPrincipal(authorization, token);
        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(safePage - 1, safeSize);
        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (principal.isUser()) {
                predicates.add(cb.equal(root.get("userId"), principal.getId()));
            }
            if (orderNo != null && !orderNo.trim().isEmpty()) {
                predicates.add(cb.like(root.get("orderNo"), "%" + orderNo.trim() + "%"));
            }
            if (contactName != null && !contactName.trim().isEmpty()) {
                predicates.add(cb.like(root.get("contactName"), "%" + contactName.trim() + "%"));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Order> result = orderRepository.findAll(spec, pageable);
        Map<String, Object> data = new HashMap<>();
        data.put("list", result.getContent());
        data.put("total", result.getTotalElements());
        data.put("page", safePage);
        data.put("size", safeSize);
        return success("获取成功", data);
    }

    @GetMapping("/{id}")
    public Map<String, Object> getOrderDetail(@PathVariable Long id,
                                              @RequestHeader(value = "Authorization", required = false) String authorization,
                                              @RequestHeader(value = "token", required = false) String token) {
        AuthPrincipal principal = getPrincipal(authorization, token);
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return error(404, "订单不存在");
        if (principal.isUser() && !order.getUserId().equals(principal.getId())) {
            return error(403, "无权访问此订单");
        }
        return success("获取成功", order);
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateOrderStatus(@PathVariable Long id,
                                                  @RequestBody(required = false) Map<String, Object> body,
                                                  @RequestParam(required = false) Integer status,
                                                  @RequestHeader(value = "Authorization", required = false) String authorization,
                                                  @RequestHeader(value = "token", required = false) String token) {
        AuthPrincipal principal = getPrincipal(authorization, token);
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return error(404, "订单不存在");
        if (principal.isUser() && !order.getUserId().equals(principal.getId())) {
            return error(403, "无权操作此订单");
        }
        Object requestedStatus = status != null ? status : (body == null ? null : body.get("status"));
        if (requestedStatus == null) return error(400, "状态参数不能为空");
        int newStatus;
        try { newStatus = Integer.parseInt(requestedStatus.toString()); }
        catch (NumberFormatException e) { return error(400, "状态格式不正确"); }
        if (principal.isUser() && !(order.getStatus() == 0 && newStatus == 1)) {
            return error(403, "用户无权办理确认、入住或完成操作");
        }
        if (!canUpdateStatus(order.getStatus(), newStatus)) {
            return error(409, "不允许的订单状态流转");
        }
        order.setStatus(newStatus);
        if (newStatus == 1) order.setPaymentTime(new Date());
        if (newStatus == 3) order.setCompletedTime(new Date());
        if (newStatus == 4) order.setCancelReason("取消订单");
        orderRepository.save(order);
        return success("订单状态更新成功", order);
    }

    @PutMapping("/{id}/cancel")
    public Map<String, Object> cancelOrder(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> body,
                                           @RequestHeader(value = "Authorization", required = false) String authorization,
                                           @RequestHeader(value = "token", required = false) String token) {
        AuthPrincipal principal = getPrincipal(authorization, token);
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return error(404, "订单不存在");
        if (principal.isUser() && !order.getUserId().equals(principal.getId())) {
            return error(403, "无权操作此订单");
        }
        if (order.getStatus() != 0 && order.getStatus() != 1) {
            return error(409, "当前状态的订单不能取消");
        }
        order.setStatus(4);
        String reason = body == null ? null : body.get("reason");
        order.setCancelReason(reason == null || reason.trim().isEmpty() ? "用户取消" : reason.trim());
        orderRepository.save(order);
        return success("订单已取消", order);
    }

    private boolean canUpdateStatus(Integer current, Integer next) {
        Map<Integer, List<Integer>> transitions = new HashMap<>();
        transitions.put(0, Arrays.asList(1, 4));
        transitions.put(1, Arrays.asList(2, 4));
        transitions.put(2, Collections.singletonList(3));
        transitions.put(3, Collections.emptyList());
        transitions.put(4, Collections.emptyList());
        transitions.put(5, Collections.emptyList());
        return transitions.getOrDefault(current, Collections.emptyList()).contains(next);
    }
}
