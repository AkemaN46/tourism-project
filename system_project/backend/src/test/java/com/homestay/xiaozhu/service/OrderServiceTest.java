package com.homestay.xiaozhu.service;

import com.homestay.xiaozhu.dto.CreateOrderRequest;
import com.homestay.xiaozhu.entity.Homestay;
import com.homestay.xiaozhu.entity.Order;
import com.homestay.xiaozhu.entity.Room;
import com.homestay.xiaozhu.exception.BusinessException;
import com.homestay.xiaozhu.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class OrderServiceTest {
    private OrderRepository orderRepository;
    private RoomRepository roomRepository;
    private RoomStatusRepository roomStatusRepository;
    private OrderService service;

    @BeforeEach
    public void setUp() {
        orderRepository = mock(OrderRepository.class);
        roomRepository = mock(RoomRepository.class);
        HomestayRepository homestayRepository = mock(HomestayRepository.class);
        roomStatusRepository = mock(RoomStatusRepository.class);
        ShoppingCartRepository cartRepository = mock(ShoppingCartRepository.class);

        Room room = new Room();
        room.setId(10L); room.setHomestayId(20L); room.setName("海景大床房");
        room.setPrice(new BigDecimal("299.00")); room.setStock(10); room.setStatus(1);
        Homestay homestay = new Homestay(); homestay.setId(20L); homestay.setStatus(1);
        when(roomRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(room));
        when(homestayRepository.findById(20L)).thenReturn(Optional.of(homestay));
        when(roomStatusRepository.findByRoomIdAndDate(eq(10L), any())).thenReturn(null);
        when(orderRepository.countActiveBookingsForDate(eq(10L), any())).thenReturn(0L);
        AtomicLong ids = new AtomicLong();
        when(orderRepository.saveAndFlush(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0); order.setId(ids.incrementAndGet()); return order;
        });
        service = new OrderService(orderRepository, roomRepository, homestayRepository, roomStatusRepository, cartRepository);
    }

    @Test
    public void serverCalculatesPriceAndGeneratesOrderFields() {
        CreateOrderRequest request = validRequest(2);
        Order order = service.create(7L, request, false);
        assertEquals(7L, order.getUserId());
        assertEquals(2, order.getNights());
        assertEquals(new BigDecimal("598.00"), order.getTotalAmount());
        assertTrue(order.getOrderNo().matches("ORD\\d{8}[A-F0-9]{20}"));
        assertEquals(0, order.getStatus());
    }

    @Test
    public void rejectsPastDateAndOverSixtyNights() {
        CreateOrderRequest past = validRequest(2);
        past.setCheckInDate(LocalDate.now().minusDays(1).toString());
        assertThrows(BusinessException.class, () -> service.create(7L, past, false));
        assertThrows(BusinessException.class, () -> service.create(7L, validRequest(61), false));
    }

    @Test
    public void rejectsInvalidContactBeforeCheckingInventory() {
        CreateOrderRequest request = validRequest(2);
        request.setContactName("张三123@");
        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.create(7L, request, false));
        assertEquals("联系人须为2至20个中文、英文字母或中间空格", exception.getMessage());
        verify(roomRepository, never()).findByIdForUpdate(anyLong());
    }

    @Test
    public void tenConcurrentOrdersReceiveUniqueOrderNumbers() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(10);
        Set<String> orderNumbers = ConcurrentHashMap.newKeySet();
        try {
            CompletableFuture<?>[] tasks = new CompletableFuture[10];
            for (int i = 0; i < tasks.length; i++) {
                tasks[i] = CompletableFuture.runAsync(() -> orderNumbers.add(service.create(7L, validRequest(1), true).getOrderNo()), pool);
            }
            CompletableFuture.allOf(tasks).get(10, TimeUnit.SECONDS);
        } finally {
            pool.shutdownNow();
        }
        assertEquals(10, orderNumbers.size());
        verify(orderRepository, times(10)).saveAndFlush(any(Order.class));
    }

    private CreateOrderRequest validRequest(int nights) {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setRoomId(10L);
        request.setCheckInDate(LocalDate.now().plusDays(1).toString());
        request.setCheckOutDate(LocalDate.now().plusDays(1 + nights).toString());
        request.setContactName("测试用户"); request.setContactPhone("13800138000"); request.setRemark("安静房间");
        return request;
    }
}
