package com.homestay.xiaozhu.service;

import com.homestay.xiaozhu.dto.BatchOrderRequest;
import com.homestay.xiaozhu.dto.CreateOrderRequest;
import com.homestay.xiaozhu.entity.Homestay;
import com.homestay.xiaozhu.entity.Order;
import com.homestay.xiaozhu.entity.Room;
import com.homestay.xiaozhu.entity.RoomStatus;
import com.homestay.xiaozhu.exception.BusinessException;
import com.homestay.xiaozhu.repository.HomestayRepository;
import com.homestay.xiaozhu.repository.OrderRepository;
import com.homestay.xiaozhu.repository.RoomRepository;
import com.homestay.xiaozhu.repository.RoomStatusRepository;
import com.homestay.xiaozhu.repository.ShoppingCartRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class OrderService {
    private static final int MAX_NIGHTS = 60;
    private static final Pattern CONTACT_PATTERN = Pattern.compile("^[\\u4e00-\\u9fa5A-Za-z]+(?: [\\u4e00-\\u9fa5A-Za-z]+)*$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");

    private final OrderRepository orderRepository;
    private final RoomRepository roomRepository;
    private final HomestayRepository homestayRepository;
    private final RoomStatusRepository roomStatusRepository;
    private final ShoppingCartRepository shoppingCartRepository;

    public OrderService(OrderRepository orderRepository,
                        RoomRepository roomRepository,
                        HomestayRepository homestayRepository,
                        RoomStatusRepository roomStatusRepository,
                        ShoppingCartRepository shoppingCartRepository) {
        this.orderRepository = orderRepository;
        this.roomRepository = roomRepository;
        this.homestayRepository = homestayRepository;
        this.roomStatusRepository = roomStatusRepository;
        this.shoppingCartRepository = shoppingCartRepository;
    }

    @Transactional
    public Order create(Long userId, CreateOrderRequest request, boolean paid) {
        String contactName = request.getContactName() == null ? "" : request.getContactName().trim();
        String contactPhone = request.getContactPhone() == null ? "" : request.getContactPhone().trim();
        String remark = request.getRemark() == null ? "" : request.getRemark().trim();
        if (contactName.length() < 2 || contactName.length() > 20 || !CONTACT_PATTERN.matcher(contactName).matches()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "联系人须为2至20个中文、英文字母或中间空格");
        }
        if (!PHONE_PATTERN.matcher(contactPhone).matches()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "请输入正确的中国大陆11位手机号");
        }
        if (remark.length() > 200) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "订单备注不能超过200个字符");
        }
        BookingQuote quote = quote(request.getRoomId(), request.getCheckInDate(), request.getCheckOutDate());

        Room room = quote.room;
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setRoomId(room.getId());
        order.setRoomName(room.getName());
        order.setRoomImage(room.getCoverImage());
        order.setCheckInDate(Date.valueOf(quote.checkIn));
        order.setCheckOutDate(Date.valueOf(quote.checkOut));
        order.setNights(quote.nights);
        order.setPrice(room.getPrice());
        order.setTotalAmount(quote.totalAmount);
        order.setRealAmount(quote.totalAmount);
        order.setContactName(contactName);
        order.setContactPhone(contactPhone);
        order.setRemark(remark);
        order.setStatus(paid ? 1 : 0);
        if (paid) {
            order.setPaymentMethod("wxpay-模拟支付");
            order.setPaymentTime(new java.util.Date());
        }
        return orderRepository.saveAndFlush(order);
    }

    @Transactional
    public List<Order> createBatch(Long userId, BatchOrderRequest request) {
        List<Order> saved = new ArrayList<>();
        for (CreateOrderRequest item : request.getOrders()) {
            saved.add(create(userId, item, true));
        }
        for (CreateOrderRequest item : request.getOrders()) {
            if (item.getCartId() != null) {
                shoppingCartRepository.deleteByIdAndUserId(item.getCartId(), userId);
            }
        }
        return saved;
    }

    @Transactional
    public BookingQuote quote(Long roomId, String checkInText, String checkOutText) {
        LocalDate checkIn;
        LocalDate checkOut;
        try {
            checkIn = LocalDate.parse(checkInText);
            checkOut = LocalDate.parse(checkOutText);
        } catch (DateTimeParseException | NullPointerException e) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "日期格式应为 yyyy-MM-dd");
        }
        LocalDate today = LocalDate.now();
        if (checkIn.isBefore(today)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "入住日期不能早于今天");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "离店日期必须晚于入住日期");
        }
        if (checkIn.isAfter(today.plusDays(365))) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "入住日期不能超过未来365天");
        }
        long nightsValue = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nightsValue > MAX_NIGHTS) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "单笔订单最长可预订60晚");
        }

        Room room = roomRepository.findByIdForUpdate(roomId).orElseThrow(
                () -> new BusinessException(HttpStatus.NOT_FOUND, "房型不存在"));
        Homestay homestay = homestayRepository.findById(room.getHomestayId()).orElseThrow(
                () -> new BusinessException(HttpStatus.NOT_FOUND, "所属民宿不存在"));
        if (!Integer.valueOf(1).equals(room.getStatus()) || !Integer.valueOf(1).equals(homestay.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "房型或所属民宿已下架");
        }
        if (room.getStock() == null || room.getStock() <= 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "房型库存不足");
        }

        BigDecimal total = BigDecimal.ZERO;
        for (LocalDate date = checkIn; date.isBefore(checkOut); date = date.plusDays(1)) {
            RoomStatus daily = roomStatusRepository.findByRoomIdAndDate(roomId, Date.valueOf(date));
            int availableStock = room.getStock();
            BigDecimal dailyPrice = room.getPrice();
            if (daily != null) {
                if (Integer.valueOf(0).equals(daily.getStatus())) {
                    throw new BusinessException(HttpStatus.CONFLICT, date + " 不可预订");
                }
                if (daily.getStock() != null) {
                    availableStock = daily.getStock();
                }
                if (daily.getPrice() != null) {
                    dailyPrice = daily.getPrice();
                }
            }
            long booked = orderRepository.countActiveBookingsForDate(roomId, Date.valueOf(date));
            if (availableStock <= booked) {
                throw new BusinessException(HttpStatus.CONFLICT, "所选日期库存不足，请重新选择入住日期");
            }
            total = total.add(dailyPrice);
        }
        return new BookingQuote(room, checkIn, checkOut, (int) nightsValue, total);
    }

    private String generateOrderNo() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String random = UUID.randomUUID().toString().replace("-", "").substring(0, 20).toUpperCase(Locale.ROOT);
        return "ORD" + date + random;
    }

    public static class BookingQuote {
        private final Room room;
        private final LocalDate checkIn;
        private final LocalDate checkOut;
        private final int nights;
        private final BigDecimal totalAmount;

        public BookingQuote(Room room, LocalDate checkIn, LocalDate checkOut, int nights, BigDecimal totalAmount) {
            this.room = room;
            this.checkIn = checkIn;
            this.checkOut = checkOut;
            this.nights = nights;
            this.totalAmount = totalAmount;
        }

        public Room getRoom() { return room; }
        public LocalDate getCheckIn() { return checkIn; }
        public LocalDate getCheckOut() { return checkOut; }
        public int getNights() { return nights; }
        public BigDecimal getTotalAmount() { return totalAmount; }
    }
}
