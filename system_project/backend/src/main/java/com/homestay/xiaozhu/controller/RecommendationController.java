package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.entity.Favorite;
import com.homestay.xiaozhu.entity.Homestay;
import com.homestay.xiaozhu.entity.Order;
import com.homestay.xiaozhu.entity.Room;
import com.homestay.xiaozhu.repository.FavoriteRepository;
import com.homestay.xiaozhu.repository.HomestayRepository;
import com.homestay.xiaozhu.repository.OrderRepository;
import com.homestay.xiaozhu.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 个性化推荐控制器
 *
 * 说明：
 * - 推荐目标：房源（rooms）
 * - 行为数据来源：订单（已支付 / 已入住 / 已完成）+ 收藏
 * - 内容特征：价格区间、床型、民宿位置等
 * - 混合策略：协同（基于全局热门+用户偏好） + 内容（与历史房源相似度）
 *
 * Score(u, i) = α * Sim_collab(u, i) + (1 - α) * Sim_content(u, i)
 */
@RestController
@RequestMapping("/recommend")
public class RecommendationController extends BaseController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private HomestayRepository homestayRepository;

    /**
     * 为当前登录用户推荐房源列表
     *
     * @param authorization Authorization 请求头（可选，Bearer 或普通 token）
     * @param tokenHeader   兼容旧接口的 token 请求头（可选）
     * @param size          推荐条数，默认 8，最大 20
     */
    @GetMapping("/rooms")
    public Map<String, Object> recommendRooms(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "token", required = false) String tokenHeader,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) Double alpha
    ) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 1. 参数与用户解析
            int limit = Math.max(1, Math.min(size, 20));
            double weightAlpha = alpha == null ? 0.6 : Math.max(0.0, Math.min(alpha, 1.0));

            Long userId = getCurrentUserId(authorization, tokenHeader);

            // 仅推荐上架民宿下有库存的上架房型
            List<Room> allActiveRooms = roomRepository.findByStatus(1).stream()
                    .filter(room -> room.getStock() != null && room.getStock() > 0)
                    .filter(room -> homestayRepository.findById(room.getHomestayId())
                            .map(h -> Integer.valueOf(1).equals(h.getStatus())).orElse(false))
                    .collect(Collectors.toList());
            if (allActiveRooms == null || allActiveRooms.isEmpty()) {
                result.put("code", 200);
                result.put("msg", "暂无在架房源");
                Map<String, Object> data = new HashMap<>();
                data.put("list", Collections.emptyList());
                data.put("total", 0);
                result.put("data", data);
                return result;
            }

            // 2. 统计全局热门度（协同基础：所有用户的行为）
            Map<Long, Long> orderCountByRoom = new HashMap<>();
            for (Object[] row : orderRepository.countCompletedOrdersByRoom()) {
                if (row[0] != null && row[1] != null) {
                    orderCountByRoom.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
                }
            }

            Map<Long, Long> favoriteCountByRoom = new HashMap<>();
            for (Object[] row : favoriteRepository.countFavoritesByRoom()) {
                if (row[0] != null && row[1] != null) {
                    favoriteCountByRoom.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
                }
            }

            Map<Long, Double> globalPopularity = new HashMap<>();
            for (Room room : allActiveRooms) {
                Long roomId = room.getId();
                long orderCnt = orderCountByRoom.getOrDefault(roomId, 0L);
                long favCnt = favoriteCountByRoom.getOrDefault(roomId, 0L);
                // 订单权重略高于收藏
                double score = orderCnt * 1.0 + favCnt * 0.7;
                globalPopularity.put(roomId, score);
            }

            double maxPop = globalPopularity.values().stream().mapToDouble(Double::doubleValue).max().orElse(1.0);
            if (maxPop <= 0) {
                maxPop = 1.0;
            }

            // 3. 如果用户未登录，直接按热门度推荐
            if (userId == null) {
                List<Map<String, Object>> popularList = allActiveRooms.stream()
                        .sorted((a, b) -> Double.compare(
                                globalPopularity.getOrDefault(b.getId(), 0.0),
                                globalPopularity.getOrDefault(a.getId(), 0.0)))
                        .limit(limit)
                        .map(room -> buildRoomView(room))
                        .collect(Collectors.toList());

                result.put("code", 200);
                result.put("msg", "未登录用户，返回热门房源");
                Map<String, Object> data = new HashMap<>();
                data.put("list", popularList);
                data.put("total", popularList.size());
                result.put("data", data);
                return result;
            }

            // 4. 构建当前用户的行为画像
            List<Order> historyOrders = orderRepository.findHistoryOrdersByUserId(userId);
            List<Favorite> favoriteList = favoriteRepository.findByUserId(userId);

            Map<Long, Double> userInteractionWeight = new HashMap<>();
            if (historyOrders != null) {
                for (Order order : historyOrders) {
                    if (order.getRoomId() != null) {
                        userInteractionWeight.merge(order.getRoomId(), 1.0, Double::sum);
                    }
                }
            }
            if (favoriteList != null) {
                for (Favorite favorite : favoriteList) {
                    if (favorite.getRoomId() != null) {
                        // 收藏权重略低于下单
                        userInteractionWeight.merge(favorite.getRoomId(), 0.7, Double::sum);
                    }
                }
            }

            // 用户如果几乎没有行为，则退化为热门推荐
            if (userInteractionWeight.isEmpty()) {
                List<Map<String, Object>> popularList = allActiveRooms.stream()
                        .sorted((a, b) -> Double.compare(
                                globalPopularity.getOrDefault(b.getId(), 0.0),
                                globalPopularity.getOrDefault(a.getId(), 0.0)))
                        .limit(limit)
                        .map(room -> buildRoomView(room))
                        .collect(Collectors.toList());

                result.put("code", 200);
                result.put("msg", "用户行为较少，返回热门房源");
                Map<String, Object> data = new HashMap<>();
                data.put("list", popularList);
                data.put("total", popularList.size());
                result.put("data", data);
                return result;
            }

            // 5. 统计用户偏好的民宿和床型（用于协同部分的个性化偏置）
            Map<Long, Double> homestayPreference = new HashMap<>();
            Map<String, Double> bedTypePreference = new HashMap<>();

            Map<Long, Room> roomMap = allActiveRooms.stream()
                    .collect(Collectors.toMap(Room::getId, r -> r));

            for (Map.Entry<Long, Double> entry : userInteractionWeight.entrySet()) {
                Long roomId = entry.getKey();
                double weight = entry.getValue();
                Room room = roomMap.get(roomId);
                if (room == null) {
                    continue;
                }
                if (room.getHomestayId() != null) {
                    homestayPreference.merge(room.getHomestayId(), weight, Double::sum);
                }
                if (room.getBedType() != null && !room.getBedType().isEmpty()) {
                    bedTypePreference.merge(room.getBedType(), weight, Double::sum);
                }
            }

            Long topHomestayId = homestayPreference.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);

            String topBedType = bedTypePreference.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);

            // 6. 为每个候选房源计算内容相似度 + 协同得分
            Set<Long> interactedRoomIds = userInteractionWeight.keySet();
            Map<Long, Double> finalScoreMap = new HashMap<>();

            for (Room candidate : allActiveRooms) {
                Long roomId = candidate.getId();
                // 已下单或已收藏过的房源不再推荐
                if (interactedRoomIds.contains(roomId)) {
                    continue;
                }

                // 6.1 基于内容的相似度：与用户历史房源在价格 / 床型 / 民宿上的匹配程度
                double contentScore = 0.0;
                double totalWeight = 0.0;

                for (Map.Entry<Long, Double> entry : userInteractionWeight.entrySet()) {
                    Long historyRoomId = entry.getKey();
                    double interactionW = entry.getValue();
                    Room historyRoom = roomMap.get(historyRoomId);
                    if (historyRoom == null) {
                        continue;
                    }
                    double sim = calculateRoomSimilarity(historyRoom, candidate);
                    if (sim > 0) {
                        contentScore += sim * interactionW;
                        totalWeight += interactionW;
                    }
                }

                if (totalWeight > 0) {
                    contentScore = contentScore / totalWeight;
                }

                // 6.2 协同得分：全局热门度 + 与用户偏好的民宿 / 床型的一致性
                double popScore = globalPopularity.getOrDefault(roomId, 0.0) / maxPop;
                double collabScore = popScore;

                if (topHomestayId != null && topHomestayId.equals(candidate.getHomestayId())) {
                    collabScore += 0.2; // 喜欢的民宿加权
                }
                if (topBedType != null && candidate.getBedType() != null
                        && candidate.getBedType().contains(topBedType)) {
                    collabScore += 0.2; // 喜欢的床型加权
                }

                // 6.3 综合得分
                double finalScore = weightAlpha * collabScore + (1.0 - weightAlpha) * contentScore;
                finalScoreMap.put(roomId, finalScore);
            }

            // 7. 根据综合得分排序并截取前 N 条
            List<Map<String, Object>> recommendedList = allActiveRooms.stream()
                    .filter(r -> finalScoreMap.containsKey(r.getId()))
                    .sorted((a, b) -> Double.compare(
                            finalScoreMap.getOrDefault(b.getId(), 0.0),
                            finalScoreMap.getOrDefault(a.getId(), 0.0)))
                    .limit(limit)
                    .map(this::buildRoomView)
                    .collect(Collectors.toList());

            result.put("code", 200);
            result.put("msg", "获取推荐成功");
            Map<String, Object> data = new HashMap<>();
            data.put("list", recommendedList);
            data.put("total", recommendedList.size());
            result.put("data", data);
            return result;

        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "获取推荐失败：" + e.getMessage());
            return result;
        }
    }

    /**
     * 计算两个房源之间的相似度（0 ~ 1）
     * - 床型完全相同：+0.4
     * - 床型包含关系：+0.2
     * - 同一民宿：+0.2
     * - 价格越接近，相似度越高，最高 +0.4
     */
    private double calculateRoomSimilarity(Room a, Room b) {
        double score = 0.0;

        // 床型相似度
        String bedA = a.getBedType();
        String bedB = b.getBedType();
        if (bedA != null && bedB != null && !bedA.isEmpty() && !bedB.isEmpty()) {
            if (bedA.equals(bedB)) {
                score += 0.4;
            } else if (bedA.contains(bedB) || bedB.contains(bedA)) {
                score += 0.2;
            }
        }

        // 同一民宿位置
        if (a.getHomestayId() != null && a.getHomestayId().equals(b.getHomestayId())) {
            score += 0.2;
        }

        // 价格相似度
        BigDecimal priceA = a.getPrice();
        BigDecimal priceB = b.getPrice();
        if (priceA != null && priceB != null
                && priceA.compareTo(BigDecimal.ZERO) > 0
                && priceB.compareTo(BigDecimal.ZERO) > 0) {
            double pa = priceA.doubleValue();
            double pb = priceB.doubleValue();
            double diffRatio = Math.abs(pa - pb) / Math.max(pa, pb);
            double priceSim = Math.max(0.0, 1.0 - diffRatio); // 越接近越接近 1
            score += 0.4 * priceSim;
        }

        // 归一化到 [0,1] 范围内（上面各项权重总和不超过 1）
        return Math.max(0.0, Math.min(score, 1.0));
    }

    /**
     * 将房源实体转换为前端友好的展示结构
     * 与 RoomController 中的返回结构保持一致风格
     */
    private Map<String, Object> buildRoomView(Room room) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", room.getId());
        map.put("name", room.getName());
        map.put("description", room.getDescription());
        map.put("price", room.getPrice());
        map.put("originalPrice", room.getOriginalPrice());
        map.put("bedType", room.getBedType());
        map.put("area", room.getArea());
        map.put("peopleNum", room.getPeopleNum());
        map.put("stock", room.getStock());
        map.put("status", room.getStatus());
        map.put("homestayId", room.getHomestayId());
        map.put("createdAt", room.getCreatedAt());
        map.put("updatedAt", room.getUpdatedAt());

        map.put("coverImage", room.getCoverImage());

        // 简单返回图集原始字符串（小程序可按需解析）
        map.put("gallery", room.getGallery());

        // 附加民宿评分与销量信息（如果存在）
        if (room.getHomestayId() != null) {
            Optional<Homestay> homestayOpt = homestayRepository.findById(room.getHomestayId());
            homestayOpt.ifPresent(homestay -> {
                map.put("homestayName", homestay.getName());
                map.put("homestayRating", homestay.getRating());
                map.put("homestaySalesCount", homestay.getSalesCount());
                map.put("homestayAddress", homestay.getAddress());
            });
        }

        return map;
    }
}
