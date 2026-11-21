package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.entity.Homestay;
import com.homestay.xiaozhu.repository.HomestayRepository;
import com.homestay.xiaozhu.repository.RoomRepository;
import com.homestay.xiaozhu.security.RequireAdmin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.persistence.criteria.Predicate;
import java.util.*;

@RestController
@RequestMapping("/homestay")
public class HomestayController extends BaseController {
    private final HomestayRepository homestayRepository;
    private final RoomRepository roomRepository;

    public HomestayController(HomestayRepository homestayRepository, RoomRepository roomRepository) {
        this.homestayRepository = homestayRepository;
        this.roomRepository = roomRepository;
    }

    @GetMapping("/list")
    public Map<String, Object> list(@RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "10") int size,
                                    @RequestParam(required = false) String keyword,
                                    @RequestParam(required = false) Integer status,
                                    @RequestHeader(value = "Authorization", required = false) String authorization,
                                    @RequestHeader(value = "token", required = false) String token) {
        boolean admin = isAdmin(authorization, token);
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(1, Math.min(size, 50));
        Specification<Homestay> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!admin) {
                predicates.add(cb.equal(root.get("status"), 1));
            } else if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.trim().isEmpty()) {
                String value = "%" + keyword.trim() + "%";
                predicates.add(cb.or(cb.like(root.get("name"), value), cb.like(root.get("address"), value)));
            }
            query.orderBy(cb.desc(root.get("updatedAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Homestay> result = homestayRepository.findAll(spec, PageRequest.of(safePage - 1, safeSize));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Homestay item : result.getContent()) rows.add(toMap(item));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", rows);
        data.put("total", result.getTotalElements());
        data.put("page", safePage);
        data.put("size", safeSize);
        return success("查询成功", data);
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id,
                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                      @RequestHeader(value = "token", required = false) String token) {
        Homestay item = homestayRepository.findById(id).orElse(null);
        if (item == null || (!isAdmin(authorization, token) && !Integer.valueOf(1).equals(item.getStatus()))) {
            return error(404, "民宿不存在或已下架");
        }
        return success("查询成功", toMap(item));
    }

    @PostMapping("/create")
    @RequireAdmin
    public Map<String, Object> create(@RequestBody Homestay item) {
        String validation = validate(item);
        if (validation != null) return error(400, validation);
        item.setId(null);
        if (item.getStatus() == null) item.setStatus(1);
        return success("新增成功", homestayRepository.save(item));
    }

    @PutMapping("/update/{id}")
    @RequireAdmin
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Homestay item) {
        Homestay existing = homestayRepository.findById(id).orElse(null);
        if (existing == null) return error(404, "民宿不存在");
        String validation = validate(item);
        if (validation != null) return error(400, validation);
        existing.setName(item.getName().trim());
        existing.setPhone(trim(item.getPhone()));
        existing.setAddress(item.getAddress().trim());
        existing.setDescription(trim(item.getDescription()));
        existing.setCoverImage(trim(item.getCoverImage()));
        if (item.getStatus() != null) existing.setStatus(item.getStatus());
        return success("编辑成功", homestayRepository.save(existing));
    }

    @DeleteMapping("/delete/{id}")
    @RequireAdmin
    @Transactional
    public Map<String, Object> delete(@PathVariable Long id) {
        if (!homestayRepository.existsById(id)) return error(404, "民宿不存在");
        roomRepository.deleteByHomestayId(id);
        homestayRepository.deleteById(id);
        return success("删除成功", null);
    }

    @PutMapping("/toggleStatus/{id}")
    @RequireAdmin
    public Map<String, Object> toggleStatus(@PathVariable Long id) {
        Homestay item = homestayRepository.findById(id).orElse(null);
        if (item == null) return error(404, "民宿不存在");
        item.setStatus(Integer.valueOf(1).equals(item.getStatus()) ? 0 : 1);
        homestayRepository.save(item);
        return success("状态切换成功", item.getStatus());
    }

    private String validate(Homestay item) {
        if (item.getName() == null || item.getName().trim().length() < 2 || item.getName().trim().length() > 50)
            return "民宿名称长度须为2-50个字符";
        if (item.getAddress() == null || item.getAddress().trim().length() < 5 || item.getAddress().trim().length() > 120)
            return "民宿地址长度须为5-120个字符";
        if (item.getDescription() != null && item.getDescription().trim().length() > 500)
            return "民宿描述不能超过500个字符";
        return null;
    }

    private Map<String, Object> toMap(Homestay item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getId());
        map.put("name", item.getName());
        map.put("phone", item.getPhone());
        map.put("address", item.getAddress());
        map.put("description", item.getDescription());
        map.put("coverImage", item.getCoverImage());
        map.put("status", item.getStatus());
        map.put("rating", item.getRating());
        map.put("salesCount", item.getSalesCount());
        map.put("minPrice", roomRepository.findMinPriceByHomestayId(item.getId()));
        map.put("createdAt", item.getCreatedAt());
        map.put("updatedAt", item.getUpdatedAt());
        return map;
    }

    private String trim(String value) { return value == null ? null : value.trim(); }
}
