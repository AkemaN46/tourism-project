package com.homestay.xiaozhu.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestay.xiaozhu.entity.Homestay;
import com.homestay.xiaozhu.entity.Review;
import com.homestay.xiaozhu.entity.Room;
import com.homestay.xiaozhu.entity.RoomStatus;
import com.homestay.xiaozhu.repository.HomestayRepository;
import com.homestay.xiaozhu.repository.ReviewRepository;
import com.homestay.xiaozhu.repository.RoomRepository;
import com.homestay.xiaozhu.repository.RoomStatusRepository;
import com.homestay.xiaozhu.security.RequireAdmin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

import javax.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/room")
public class RoomController extends BaseController {
    private final RoomRepository roomRepository;
    private final HomestayRepository homestayRepository;
    private final RoomStatusRepository roomStatusRepository;
    private final ReviewRepository reviewRepository;
    private final ObjectMapper objectMapper;

    public RoomController(RoomRepository roomRepository, HomestayRepository homestayRepository,
                          RoomStatusRepository roomStatusRepository, ReviewRepository reviewRepository,
                          ObjectMapper objectMapper) {
        this.roomRepository = roomRepository;
        this.homestayRepository = homestayRepository;
        this.roomStatusRepository = roomStatusRepository;
        this.reviewRepository = reviewRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/list")
    public Map<String, Object> list(@RequestParam(required = false) Long homestayId,
                                    @RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "10") int size,
                                    @RequestParam(required = false) String keyword,
                                    @RequestParam(required = false) String bedType,
                                    @RequestParam(required = false) Integer status,
                                    @RequestParam(required = false) String priceRange,
                                    @RequestParam(required = false) String scope,
                                    @RequestHeader(value = "Authorization", required = false) String authorization,
                                    @RequestHeader(value = "token", required = false) String token) {
        boolean admin = isAdmin(authorization, token);
        boolean globalScope = homestayId == null && "all".equals(scope);
        if (!admin && homestayId == null && !globalScope) return error(400, "请选择民宿后再查看房型");
        if (homestayId != null) {
            Homestay homestay = homestayRepository.findById(homestayId).orElse(null);
            if (homestay == null || (!admin && !Integer.valueOf(1).equals(homestay.getStatus())))
                return error(404, "民宿不存在或已下架");
        }
        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        Collection<Long> allowedHomestayIds = null;
        if (globalScope) {
            allowedHomestayIds = new ArrayList<>();
            for (Homestay homestay : homestayRepository.findAll()) {
                if (Integer.valueOf(1).equals(homestay.getStatus())) allowedHomestayIds.add(homestay.getId());
            }
            if (allowedHomestayIds.isEmpty()) {
                Map<String, Object> empty = new LinkedHashMap<>();
                empty.put("list", Collections.emptyList());
                empty.put("total", 0);
                empty.put("page", safePage);
                empty.put("size", safeSize);
                return success("查询成功", empty);
            }
        }
        // 不要使用 admin ? status : 1：当管理员未传 status 时，三元表达式会对 null
        // 自动拆箱并抛出 NullPointerException。管理员不传状态应查询全部状态。
        Integer effectiveStatus = Integer.valueOf(1);
        if (admin && !globalScope) {
            effectiveStatus = status;
        }
        Specification<Room> spec = buildSpec(homestayId, allowedHomestayIds, keyword, bedType,
                effectiveStatus, priceRange, !admin || globalScope);
        Page<Room> result = roomRepository.findAll(spec, PageRequest.of(safePage - 1, safeSize));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Room room : result.getContent()) rows.add(toMap(room, false));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", rows);
        data.put("total", result.getTotalElements());
        data.put("page", safePage);
        data.put("size", safeSize);
        if (homestayId != null) homestayRepository.findById(homestayId).ifPresent(h -> data.put("homestayName", h.getName()));
        return success("查询成功", data);
    }

    @GetMapping("/search")
    public Map<String, Object> search(@RequestParam String keyword,
                                      @RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "10") int size) {
        String value = keyword == null ? "" : keyword.trim();
        Specification<Room> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.equal(root.get("status"), 1));
            ps.add(cb.greaterThan(root.get("stock"), 0));
            ps.add(cb.like(root.get("name"), "%" + value + "%"));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        int safePage = Math.max(1, page), safeSize = Math.max(1, Math.min(size, 50));
        Page<Room> result = roomRepository.findAll(spec, PageRequest.of(safePage - 1, safeSize));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Room room : result.getContent()) {
            Homestay h = homestayRepository.findById(room.getHomestayId()).orElse(null);
            if (h != null && Integer.valueOf(1).equals(h.getStatus())) rows.add(toMap(room, false));
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", rows);
        data.put("total", rows.size());
        data.put("page", safePage);
        data.put("size", safeSize);
        return success("查询成功", data);
    }

    @GetMapping("/count/{homestayId}")
    @RequireAdmin
    public Map<String, Object> count(@PathVariable Long homestayId) {
        if (!homestayRepository.existsById(homestayId)) return error(404, "民宿不存在");
        return success("查询成功", roomRepository.countByHomestayId(homestayId));
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id,
                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                      @RequestHeader(value = "token", required = false) String token) {
        Room room = roomRepository.findById(id).orElse(null);
        Homestay homestay = room == null ? null : homestayRepository.findById(room.getHomestayId()).orElse(null);
        boolean admin = isAdmin(authorization, token);
        if (room == null || homestay == null || (!admin && (!Integer.valueOf(1).equals(room.getStatus())
                || !Integer.valueOf(1).equals(homestay.getStatus()) || room.getStock() == null || room.getStock() <= 0))) {
            return error(404, "房型不存在、已下架或暂无库存");
        }
        return success("查询成功", toMap(room, true));
    }

    @PostMapping("/create")
    @RequireAdmin
    public Map<String, Object> create(@RequestBody Room room) {
        String validation = validate(room);
        if (validation != null) return error(400, validation);
        room.setId(null);
        if (room.getRoomTypeId() == null) room.setRoomTypeId(1L);
        if (room.getStatus() == null) room.setStatus(1);
        return success("新增房型成功", roomRepository.save(room));
    }

    @PutMapping("/update/{id}")
    @RequireAdmin
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Room room) {
        Room existing = roomRepository.findById(id).orElse(null);
        if (existing == null) return error(404, "房型不存在");
        String validation = validate(room);
        if (validation != null) return error(400, validation);
        room.setId(id);
        room.setCreatedAt(existing.getCreatedAt());
        if (room.getRoomTypeId() == null) room.setRoomTypeId(existing.getRoomTypeId() == null ? 1L : existing.getRoomTypeId());
        return success("编辑房型成功", roomRepository.save(room));
    }

    @DeleteMapping("/delete/{id}")
    @RequireAdmin
    public Map<String, Object> delete(@PathVariable Long id) {
        if (!roomRepository.existsById(id)) return error(404, "房型不存在");
        roomRepository.deleteById(id);
        return success("删除房型成功", null);
    }

    @PutMapping("/toggleStatus/{id}")
    @RequireAdmin
    public Map<String, Object> toggle(@PathVariable Long id) {
        Room room = roomRepository.findById(id).orElse(null);
        if (room == null) return error(404, "房型不存在");
        room.setStatus(Integer.valueOf(1).equals(room.getStatus()) ? 0 : 1);
        roomRepository.save(room);
        return success("状态切换成功", room.getStatus());
    }

    @GetMapping("/calendar")
    public Map<String, Object> calendar(@RequestParam Long roomId, @RequestParam String startDate,
                                        @RequestParam String endDate) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            sdf.setLenient(false);
            Date start = sdf.parse(startDate), end = sdf.parse(endDate);
            if (start.after(end)) return error(400, "开始日期不能晚于结束日期");
            Room room = roomRepository.findById(roomId).orElse(null);
            if (room == null) return error(404, "房型不存在");
            List<RoomStatus> statuses = roomStatusRepository.findByRoomIdAndDateBetween(roomId, start, end);
            Map<String, RoomStatus> statusByDate = new HashMap<>();
            for (RoomStatus item : statuses) statusByDate.put(sdf.format(item.getDate()), item);
            List<Map<String, Object>> rows = new ArrayList<>();
            Calendar cursor = Calendar.getInstance(); cursor.setTime(start);
            while (!cursor.getTime().after(end)) {
                String key = sdf.format(cursor.getTime());
                RoomStatus override = statusByDate.get(key);
                Map<String, Object> day = new LinkedHashMap<>();
                day.put("date", key);
                day.put("price", override != null && override.getPrice() != null ? override.getPrice() : room.getPrice());
                day.put("stock", override != null && override.getStock() != null ? override.getStock() : room.getStock());
                day.put("status", override != null && override.getStatus() != null ? override.getStatus() : 1);
                rows.add(day); cursor.add(Calendar.DATE, 1);
            }
            return success("查询成功", rows);
        } catch (Exception e) { return error(400, "日期格式应为yyyy-MM-dd"); }
    }

    @GetMapping("/{id}/reviews")
    public Map<String, Object> reviews(@PathVariable Long id, @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "10") int size) {
        if (!roomRepository.existsById(id)) return error(404, "房型不存在");
        int safePage = Math.max(1, page), safeSize = Math.max(1, Math.min(size, 50));
        Page<Review> result = reviewRepository.findByRoomIdAndStatusOrderByCreatedAtDesc(
                id, 1, PageRequest.of(safePage - 1, safeSize));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", result.getContent());
        data.put("total", result.getTotalElements());
        data.put("page", safePage);
        data.put("size", safeSize);
        return success("获取成功", data);
    }

    private Specification<Room> buildSpec(Long homestayId, Collection<Long> allowedHomestayIds,
                                           String keyword, String bedType, Integer status,
                                           String priceRange, boolean requireStock) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (homestayId != null) ps.add(cb.equal(root.get("homestayId"), homestayId));
            if (allowedHomestayIds != null) ps.add(root.get("homestayId").in(allowedHomestayIds));
            if (keyword != null && !keyword.trim().isEmpty()) ps.add(cb.like(root.get("name"), "%" + keyword.trim() + "%"));
            if (bedType != null && !bedType.trim().isEmpty()) ps.add(cb.or(
                    cb.like(root.get("bedType"), "%" + bedType.trim() + "%"),
                    cb.like(root.get("name"), "%" + bedType.trim() + "%")));
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (requireStock) ps.add(cb.greaterThan(root.get("stock"), 0));
            addPricePredicate(ps, root, cb, priceRange);
            query.orderBy(cb.desc(root.get("updatedAt")));
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    private void addPricePredicate(List<Predicate> ps, javax.persistence.criteria.Root<Room> root,
                                   javax.persistence.criteria.CriteriaBuilder cb, String range) {
        if (range == null || range.trim().isEmpty()) return;
        try {
            String value = range.trim();
            if (value.endsWith("+")) ps.add(cb.greaterThanOrEqualTo(root.get("price"), new BigDecimal(value.substring(0, value.length() - 1))));
            else if (value.contains("-")) {
                String[] parts = value.split("-", 2);
                ps.add(cb.between(root.get("price"), new BigDecimal(parts[0]), new BigDecimal(parts[1])));
            }
        } catch (NumberFormatException ignored) { }
    }

    private String validate(Room room) {
        if (room.getHomestayId() == null || !homestayRepository.existsById(room.getHomestayId())) return "关联民宿不存在";
        if (room.getName() == null || room.getName().trim().length() < 2 || room.getName().trim().length() > 50) return "房型名称长度须为2-50个字符";
        if (room.getDescription() != null && room.getDescription().trim().length() > 500) return "房型描述不能超过500个字符";
        if (room.getPrice() == null || room.getPrice().compareTo(BigDecimal.ZERO) <= 0 || room.getPrice().compareTo(new BigDecimal("10000")) > 0 || room.getPrice().scale() > 2) return "销售价须大于0、不超过10000元且最多两位小数";
        if (room.getOriginalPrice() != null && room.getOriginalPrice().compareTo(room.getPrice()) < 0) return "原价不能低于销售价";
        if (room.getStock() == null || room.getStock() < 0 || room.getStock() > 999) return "库存须为0-999";
        return null;
    }

    private Map<String, Object> toMap(Room room, boolean includeGallery) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", room.getId()); map.put("homestayId", room.getHomestayId()); map.put("roomTypeId", room.getRoomTypeId());
        map.put("name", room.getName()); map.put("description", room.getDescription()); map.put("price", room.getPrice());
        map.put("originalPrice", room.getOriginalPrice()); map.put("area", room.getArea()); map.put("bedType", room.getBedType());
        map.put("peopleNum", room.getPeopleNum()); map.put("stock", room.getStock()); map.put("status", room.getStatus());
        map.put("coverImage", room.getCoverImage()); map.put("createdAt", room.getCreatedAt()); map.put("updatedAt", room.getUpdatedAt());
        Homestay h = homestayRepository.findById(room.getHomestayId()).orElse(null);
        if (h != null) { map.put("homestayName", h.getName()); map.put("homestayRating", h.getRating()); map.put("homestaySalesCount", h.getSalesCount()); }
        if (includeGallery) {
            List<String> gallery = new ArrayList<>();
            if (room.getGallery() != null && !room.getGallery().trim().isEmpty()) {
                try { gallery = objectMapper.readValue(room.getGallery(), new TypeReference<List<String>>() {}); }
                catch (Exception ignored) { gallery.add(room.getGallery()); }
            }
            map.put("gallery", gallery);
        } else map.put("gallery", room.getGallery());
        return map;
    }
}
