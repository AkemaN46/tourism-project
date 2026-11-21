package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.entity.Order;
import com.homestay.xiaozhu.repository.OrderRepository;
import com.homestay.xiaozhu.security.AuthPrincipal;
import com.homestay.xiaozhu.security.AuthService;
import com.homestay.xiaozhu.service.OrderService;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class OrderControllerTest {
    @Test
    public void adminCanConfirmAndCheckInUsingJsonBody() {
        OrderRepository repository = mock(OrderRepository.class);
        OrderService service = mock(OrderService.class);
        AuthService authService = mock(AuthService.class);
        OrderController controller = new OrderController(repository, service);
        controller.authService = authService;

        Order order = new Order();
        order.setId(9L);
        order.setUserId(7L);
        order.setStatus(0);
        when(repository.findById(9L)).thenReturn(Optional.of(order));
        when(authService.authenticate(any(), any())).thenReturn(new AuthPrincipal(1L, "ADMIN"));

        Map<String, Object> confirmed = controller.updateOrderStatus(
                9L, Collections.singletonMap("status", 1), null, "Bearer admin", null);
        assertEquals(200, confirmed.get("code"));
        assertEquals(1, order.getStatus());

        Map<String, Object> checkedIn = controller.updateOrderStatus(
                9L, Collections.singletonMap("status", 2), null, "Bearer admin", null);
        assertEquals(200, checkedIn.get("code"));
        assertEquals(2, order.getStatus());
        verify(repository, times(2)).save(order);
    }
}
