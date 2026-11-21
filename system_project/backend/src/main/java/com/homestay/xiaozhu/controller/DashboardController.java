package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.repository.*;
import com.homestay.xiaozhu.entity.*;
import com.homestay.xiaozhu.security.RequireAdmin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/dashboard")
@RequireAdmin
public class DashboardController extends BaseController {

    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private HomestayRepository homestayRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping("/test")
    public Map<String, Object> test() {
        logger.info("DashboardController /test 接口被调用");
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "Dashboard接口正常");
        result.put("timestamp", new Date());
        return result;
    }

    /**
     * 获取统计数据
     */
    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats() {
        logger.info("调用 /dashboard/stats 接口");

        Map<String, Object> result = new HashMap<>();

        try {
            // 获取当前日期
            Date today = new Date();
            logger.info("获取今日日期: {}", today);

            // 获取昨日日期
            Calendar calendar = Calendar.getInstance();
            calendar.add(Calendar.DATE, -1);
            Date yesterday = calendar.getTime();

            // 今日收入
            BigDecimal todayIncome = getIncomeForDate(today);
            logger.info("今日收入: {}", todayIncome);

            // 昨日收入
            BigDecimal yesterdayIncome = getIncomeForDate(yesterday);
            logger.info("昨日收入: {}", yesterdayIncome);

            // 计算收入趋势
            BigDecimal incomeTrend = BigDecimal.ZERO;
            if (yesterdayIncome != null && yesterdayIncome.compareTo(BigDecimal.ZERO) > 0) {
                incomeTrend = todayIncome.subtract(yesterdayIncome)
                        .divide(yesterdayIncome, 4, BigDecimal.ROUND_HALF_UP)
                        .multiply(new BigDecimal("100"));
            }
            logger.info("收入趋势: {}%", incomeTrend);

            // 今日订单数
            Long todayOrders = orderRepository.countTodayOrders(today);
            logger.info("今日订单数: {}", todayOrders);

            // 昨日订单数
            Long yesterdayOrders = orderRepository.countTodayOrders(yesterday);
            logger.info("昨日订单数: {}", yesterdayOrders);

            // 计算订单趋势
            BigDecimal orderTrend = BigDecimal.ZERO;
            if (yesterdayOrders != null && yesterdayOrders > 0) {
                orderTrend = new BigDecimal(todayOrders - yesterdayOrders)
                        .divide(new BigDecimal(yesterdayOrders), 4, BigDecimal.ROUND_HALF_UP)
                        .multiply(new BigDecimal("100"));
            }
            logger.info("订单趋势: {}%", orderTrend);

            // 今日新增用户
            Long todayUsers = userRepository.countTodayUsers(today);
            logger.info("今日新增用户: {}", todayUsers);

            // 昨日新增用户
            Long yesterdayUsers = userRepository.countTodayUsers(yesterday);
            logger.info("昨日新增用户: {}", yesterdayUsers);

            // 计算用户趋势
            BigDecimal userTrend = BigDecimal.ZERO;
            if (yesterdayUsers != null && yesterdayUsers > 0) {
                userTrend = new BigDecimal(todayUsers - yesterdayUsers)
                        .divide(new BigDecimal(yesterdayUsers), 4, BigDecimal.ROUND_HALF_UP)
                        .multiply(new BigDecimal("100"));
            }
            logger.info("用户趋势: {}%", userTrend);

            // 计算入住率
            Long occupiedRooms = orderRepository.countOccupiedRooms();
            logger.info("已入住房间数: {}", occupiedRooms);

            Long totalRooms = roomRepository.count();
            logger.info("总房间数: {}", totalRooms);

            BigDecimal occupancyRate = BigDecimal.ZERO;
            if (totalRooms != null && totalRooms > 0) {
                occupancyRate = new BigDecimal(occupiedRooms)
                        .divide(new BigDecimal(totalRooms), 4, BigDecimal.ROUND_HALF_UP)
                        .multiply(new BigDecimal("100"));
            }
            logger.info("入住率: {}%", occupancyRate);

            Map<String, Object> stats = new HashMap<>();
            stats.put("todayIncome", todayIncome != null ? todayIncome : BigDecimal.ZERO);
            stats.put("todayOrders", todayOrders != null ? todayOrders : 0);
            stats.put("todayUsers", todayUsers != null ? todayUsers : 0);
            stats.put("occupancyRate", occupancyRate.setScale(2, BigDecimal.ROUND_HALF_UP));
            stats.put("incomeTrend", incomeTrend.setScale(2, BigDecimal.ROUND_HALF_UP));
            stats.put("orderTrend", orderTrend.setScale(2, BigDecimal.ROUND_HALF_UP));
            stats.put("userTrend", userTrend.setScale(2, BigDecimal.ROUND_HALF_UP));

            result.put("code", 200);
            result.put("msg", "success");
            result.put("data", stats);

            logger.info("/dashboard/stats 返回数据: {}", stats);

        } catch (Exception e) {
            logger.error("获取统计数据失败", e);
            result.put("code", 500);
            result.put("msg", "获取统计数据失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 获取收入趋势数据
     */
    @GetMapping("/income-trend")
    public Map<String, Object> getIncomeTrend(
            @RequestParam(defaultValue = "7day") String period) {
        logger.info("调用 /dashboard/income-trend 接口, period: {}", period);

        Map<String, Object> result = new HashMap<>();

        try {
            int days = period.equals("30day") ? 30 : 7;
            List<String> dates = new ArrayList<>();
            List<BigDecimal> values = new ArrayList<>();

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            Calendar calendar = Calendar.getInstance();

            // 获取最近几天数据
            for (int i = days - 1; i >= 0; i--) {
                calendar.setTime(new Date());
                calendar.add(Calendar.DATE, -i);
                Date date = calendar.getTime();

                // 格式化日期用于显示
                String dateStr = sdf.format(date);
                dates.add(dateStr.substring(5)); // 只显示月-日

                BigDecimal income = getIncomeForDate(date);
                values.add(income);

                logger.info("日期: {}, 收入: {}", dateStr, income);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("dates", dates);
            data.put("values", values);

            result.put("code", 200);
            result.put("msg", "success");
            result.put("data", data);

        } catch (Exception e) {
            logger.error("获取收入趋势数据失败", e);
            result.put("code", 500);
            result.put("msg", "获取收入趋势数据失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 获取房型分布数据
     */
    @GetMapping("/room-type-distribution")
    public Map<String, Object> getRoomTypeDistribution() {
        logger.info("调用 /dashboard/room-type-distribution 接口");

        Map<String, Object> result = new HashMap<>();

        try {
            List<Object[]> distribution = roomRepository.findRoomTypeDistribution();
            logger.info("房型分布查询结果: {}", distribution.size());

            List<Map<String, Object>> chartData = new ArrayList<>();

            for (Object[] row : distribution) {
                Map<String, Object> item = new HashMap<>();
                item.put("name", row[0] != null ? row[0].toString() : "未知类型");
                item.put("value", row[1] != null ? ((Number) row[1]).longValue() : 0);
                chartData.add(item);
                logger.info("房型: {}, 数量: {}", item.get("name"), item.get("value"));
            }

            result.put("code", 200);
            result.put("msg", "success");
            result.put("data", chartData);

        } catch (Exception e) {
            logger.error("获取房型分布数据失败", e);
            result.put("code", 500);
            result.put("msg", "获取房型分布数据失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 获取最新订单（用于Dashboard）
     */
    @GetMapping("/latest-orders")
    public Map<String, Object> getLatestOrders() {
        logger.info("调用 /dashboard/latest-orders 接口");

        Map<String, Object> result = new HashMap<>();

        try {
            // 使用分页查询获取最新订单
            Pageable pageable = PageRequest.of(0, 5);
            Page<Order> ordersPage = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
            List<Order> orders = ordersPage.getContent();
            logger.info("获取到最新订单数: {}", orders.size());

            result.put("code", 200);
            result.put("msg", "success");
            result.put("data", orders);

        } catch (Exception e) {
            logger.error("获取最新订单失败", e);
            result.put("code", 500);
            result.put("msg", "获取最新订单失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 获取待处理事项
     */
    @GetMapping("/pending-tasks")
    public Map<String, Object> getPendingTasks() {
        logger.info("调用 /dashboard/pending-tasks 接口");

        Map<String, Object> result = new HashMap<>();

        try {
            List<Map<String, Object>> tasks = new ArrayList<>();

            // 1. 获取待支付订单
            Pageable pageable = PageRequest.of(0, 3);
            Page<Order> pendingOrders = orderRepository.findByStatusOrderByCreatedAtDesc(0, pageable);
            logger.info("待支付订单数: {}", pendingOrders.getContent().size());

            for (Order order : pendingOrders.getContent()) {
                Map<String, Object> task = new HashMap<>();
                task.put("type", "订单");
                task.put("content", "订单 " + order.getOrderNo() + " 待支付");
                task.put("time", order.getCreatedAt());
                task.put("actionUrl", "/order/list");
                tasks.add(task);
            }

            // 2. 获取待审核评价
            Page<Review> pendingReviews = reviewRepository.findByStatus(0, pageable);
            logger.info("待审核评价数: {}", pendingReviews.getContent().size());

            for (Review review : pendingReviews.getContent()) {
                Map<String, Object> task = new HashMap<>();
                task.put("type", "评价");
                task.put("content", "有新的评价待审核");
                task.put("time", review.getCreatedAt());
                task.put("actionUrl", "/review/list");
                tasks.add(task);
            }

            // 3. 如果没有任务，添加提示
            if (tasks.isEmpty()) {
                Map<String, Object> task = new HashMap<>();
                task.put("type", "提示");
                task.put("content", "暂无待处理事项");
                task.put("time", new Date());
                task.put("actionUrl", null);
                tasks.add(task);
            }

            logger.info("待处理事项总数: {}", tasks.size());

            result.put("code", 200);
            result.put("msg", "success");
            result.put("data", tasks);

        } catch (Exception e) {
            logger.error("获取待处理事项失败", e);
            result.put("code", 500);
            result.put("msg", "获取待处理事项失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 辅助方法：获取指定日期的收入
     */
    private BigDecimal getIncomeForDate(Date date) {
        try {
            BigDecimal income = orderRepository.findTodayIncome(date);
            return income != null ? income : BigDecimal.ZERO;
        } catch (Exception e) {
            logger.error("获取日期收入失败: {}", date, e);
            return BigDecimal.ZERO;
        }
    }

}
