package com.homestay.xiaozhu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestay.xiaozhu.entity.Order;
import com.homestay.xiaozhu.entity.Review;
import com.homestay.xiaozhu.repository.OrderRepository;
import com.homestay.xiaozhu.repository.ReviewRepository;
import com.homestay.xiaozhu.repository.RoomRepository;
import com.homestay.xiaozhu.repository.UserRepository;
import com.homestay.xiaozhu.security.RequireAdmin;
import com.homestay.xiaozhu.security.RequireUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.persistence.criteria.Predicate;
import java.util.*;

@RestController
@RequestMapping("/review")
public class ReviewController extends BaseController {
    private final ReviewRepository reviewRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    public ReviewController(ReviewRepository reviewRepository, RoomRepository roomRepository,
                            UserRepository userRepository, OrderRepository orderRepository, ObjectMapper objectMapper) {
        this.reviewRepository = reviewRepository; this.roomRepository = roomRepository;
        this.userRepository = userRepository; this.orderRepository = orderRepository; this.objectMapper = objectMapper;
    }

    @GetMapping("/list")
    @RequireAdmin
    public Map<String, Object> adminList(@RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "10") int size,
                                         @RequestParam(required = false) String roomName,
                                         @RequestParam(required = false) Integer status) {
        Set<Long> roomIds = null;
        if (roomName != null && !roomName.trim().isEmpty()) {
            roomIds = new HashSet<>();
            String keyword = roomName.trim().toLowerCase(Locale.ROOT);
            for (com.homestay.xiaozhu.entity.Room room : roomRepository.findAll()) {
                if (room.getName() != null && room.getName().toLowerCase(Locale.ROOT).contains(keyword)) roomIds.add(room.getId());
            }
        }
        Set<Long> finalRoomIds = roomIds;
        Specification<Review> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (finalRoomIds != null) ps.add(root.get("roomId").in(finalRoomIds));
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        return pageResult(reviewRepository.findAll(spec, pageRequest(page, size)), page, size);
    }

    @GetMapping("/user")
    @RequireUser
    public Map<String, Object> userList(@RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "10") int size,
                                        @RequestParam(required = false) Integer status,
                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                        @RequestHeader(value = "token", required = false) String token) {
        Long userId = getCurrentUserId(authorization, token);
        Specification<Review> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>(); ps.add(cb.equal(root.get("userId"), userId));
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        return pageResult(reviewRepository.findAll(spec, pageRequest(page, size)), page, size);
    }

    @PostMapping("/create")
    @RequireUser
    @Transactional
    public Map<String, Object> create(@RequestBody Map<String, Object> body,
                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                      @RequestHeader(value = "token", required = false) String token) {
        Long userId = getCurrentUserId(authorization, token), orderId = requiredLong(body, "orderId");
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || !userId.equals(order.getUserId())) return error(404, "订单不存在");
        if (!Integer.valueOf(3).equals(order.getStatus())) return error(409, "仅已完成订单可以评价");
        if (reviewRepository.findByOrderIdAndUserId(orderId, userId).isPresent()) return error(409, "该订单已评价");
        Review review = new Review(); review.setUserId(userId); review.setOrderId(orderId); review.setRoomId(order.getRoomId());
        applyContent(review, body); review.setStatus(0);
        Review saved = reviewRepository.save(review); order.setReviewed(true); orderRepository.save(order);
        return success("评价已提交，等待审核", view(saved));
    }

    @PutMapping("/{id}/update")
    @RequireUser
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                      @RequestHeader(value = "token", required = false) String token) {
        Review review = reviewRepository.findById(id).orElse(null);
        Long userId = getCurrentUserId(authorization, token);
        if (review == null || !userId.equals(review.getUserId())) return error(404, "评价不存在");
        if (!Integer.valueOf(2).equals(review.getStatus())) return error(409, "仅审核驳回的评价可以修改");
        applyContent(review, body); review.setStatus(0); review.setReplyContent(null); review.setReplyTime(null);
        return success("评价已重新提交", view(reviewRepository.save(review)));
    }

    @DeleteMapping("/{id}/delete")
    @RequireUser
    @Transactional
    public Map<String, Object> delete(@PathVariable Long id,
                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                      @RequestHeader(value = "token", required = false) String token) {
        Review review = reviewRepository.findById(id).orElse(null); Long userId = getCurrentUserId(authorization, token);
        if (review == null || !userId.equals(review.getUserId())) return error(404, "评价不存在");
        reviewRepository.delete(review);
        orderRepository.findById(review.getOrderId()).ifPresent(o -> { o.setReviewed(false); orderRepository.save(o); });
        return success("删除成功", null);
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review == null) return error(404, "评价不存在");
        return success("获取成功", view(review));
    }

    @GetMapping("/{id}/detail")
    @RequireAdmin
    public Map<String, Object> adminDetail(@PathVariable Long id) { return detail(id); }

    @PostMapping("/{id}/approve")
    @RequireAdmin
    public Map<String, Object> approve(@PathVariable Long id) {
        Review review = reviewRepository.findById(id).orElse(null); if (review == null) return error(404, "评价不存在");
        review.setStatus(1); review.setReplyContent(null); review.setReplyTime(new Date()); reviewRepository.save(review);
        return success("审核通过", null);
    }

    @PostMapping("/{id}/reject")
    @RequireAdmin
    public Map<String, Object> reject(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        Review review = reviewRepository.findById(id).orElse(null); if (review == null) return error(404, "评价不存在");
        String reason = body == null || body.get("reason") == null ? "内容不符合发布规范" : body.get("reason").toString().trim();
        if (reason.isEmpty()) return error(400, "请填写驳回原因");
        review.setStatus(2); review.setReplyContent(reason); review.setReplyTime(new Date()); reviewRepository.save(review);
        return success("已驳回", null);
    }

    private void applyContent(Review review, Map<String, Object> body) {
        String content = body.get("content") == null ? "" : body.get("content").toString().trim();
        if (content.length() < 1 || content.length() > 500) throw new IllegalArgumentException("评价内容须为1-500个字符");
        int rating = body.get("rating") == null ? 5 : Integer.parseInt(body.get("rating").toString());
        if (rating < 1 || rating > 5) throw new IllegalArgumentException("评分须为1-5分");
        review.setContent(content); review.setRating(rating);
        try { review.setImages(objectMapper.writeValueAsString(body.getOrDefault("images", Collections.emptyList()))); }
        catch (Exception e) { throw new IllegalArgumentException("评价图片格式不正确"); }
    }

    private Map<String, Object> pageResult(Page<Review> result, int page, int size) {
        List<Map<String, Object>> rows = new ArrayList<>(); for (Review review : result.getContent()) rows.add(view(review));
        Map<String, Object> data = new LinkedHashMap<>(); data.put("list", rows); data.put("total", result.getTotalElements());
        data.put("page", Math.max(1, page)); data.put("size", Math.max(1, Math.min(size, 50)));
        return success("获取成功", data);
    }

    private PageRequest pageRequest(int page, int size) { return PageRequest.of(Math.max(1, page) - 1, Math.max(1, Math.min(size, 50))); }

    private Map<String, Object> view(Review review) {
        Map<String, Object> map = new LinkedHashMap<>(); map.put("id", review.getId()); map.put("roomId", review.getRoomId());
        map.put("userId", review.getUserId()); map.put("orderId", review.getOrderId()); map.put("rating", review.getRating());
        map.put("content", review.getContent()); map.put("status", review.getStatus()); map.put("createdAt", review.getCreatedAt());
        map.put("updatedAt", review.getUpdatedAt()); map.put("replyContent", review.getReplyContent());
        if (review.getRoomId() != null) roomRepository.findById(review.getRoomId()).ifPresent(r -> map.put("roomName", r.getName()));
        if (review.getUserId() != null) userRepository.findById(review.getUserId()).ifPresent(u -> { map.put("userName", u.getNickname()); map.put("userAvatar", u.getAvatarUrl()); });
        try { map.put("images", review.getImages() == null ? Collections.emptyList() : objectMapper.readValue(review.getImages(), List.class)); }
        catch (Exception e) { map.put("images", Collections.emptyList()); }
        return map;
    }

    private Long requiredLong(Map<String, Object> body, String key) {
        if (body.get(key) == null) throw new IllegalArgumentException(key + "不能为空"); return Long.valueOf(body.get(key).toString());
    }
}
