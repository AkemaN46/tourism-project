package com.homestay.xiaozhu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.homestay.xiaozhu.entity.Homestay;
import com.homestay.xiaozhu.entity.Room;
import com.homestay.xiaozhu.repository.HomestayRepository;
import com.homestay.xiaozhu.repository.ReviewRepository;
import com.homestay.xiaozhu.repository.RoomRepository;
import com.homestay.xiaozhu.repository.RoomStatusRepository;
import com.homestay.xiaozhu.security.AuthPrincipal;
import com.homestay.xiaozhu.security.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class RoomControllerTest {
    @Test
    public void adminCanListRoomsWithoutStatusFilter() {
        RoomRepository roomRepository = mock(RoomRepository.class);
        HomestayRepository homestayRepository = mock(HomestayRepository.class);
        RoomStatusRepository roomStatusRepository = mock(RoomStatusRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        AuthService authService = mock(AuthService.class);
        RoomController controller = new RoomController(
                roomRepository, homestayRepository, roomStatusRepository, reviewRepository, new ObjectMapper());
        controller.authService = authService;

        Homestay homestay = new Homestay();
        homestay.setId(1L);
        homestay.setStatus(1);
        when(authService.authenticate(any(), any())).thenReturn(new AuthPrincipal(1L, "ADMIN"));
        when(homestayRepository.findById(1L)).thenReturn(Optional.of(homestay));
        when(roomRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<Room>(Collections.emptyList()));

        Map<String, Object> response = controller.list(
                1L, 1, 10, null, null, null, null, null, "Bearer admin", null);
        assertEquals(200, response.get("code"));
    }

    @Test
    @SuppressWarnings("unchecked")
    public void publicGlobalScopeReturnsAvailableRoomsWithHomestayName() {
        RoomRepository roomRepository = mock(RoomRepository.class);
        HomestayRepository homestayRepository = mock(HomestayRepository.class);
        RoomStatusRepository roomStatusRepository = mock(RoomStatusRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        AuthService authService = mock(AuthService.class);
        RoomController controller = new RoomController(
                roomRepository, homestayRepository, roomStatusRepository, reviewRepository, new ObjectMapper());
        controller.authService = authService;

        Homestay homestay = new Homestay();
        homestay.setId(1L);
        homestay.setName("测试民宿");
        homestay.setStatus(1);
        Room room = validRoom(3);
        room.setId(10L);

        when(homestayRepository.findAll()).thenReturn(Collections.singletonList(homestay));
        when(homestayRepository.findById(1L)).thenReturn(Optional.of(homestay));
        when(roomRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(room)));

        Map<String, Object> response = controller.list(
                null, 1, 50, null, null, null, null, "all", null, null);
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        List<Map<String, Object>> rooms = (List<Map<String, Object>>) data.get("list");

        assertEquals(200, response.get("code"));
        assertEquals(1, rooms.size());
        assertEquals("测试民宿", rooms.get(0).get("homestayName"));
        assertEquals(50, data.get("size"));
    }

    @Test
    public void invalidGlobalScopeStillRequiresHomestayForPublicRequest() {
        RoomRepository roomRepository = mock(RoomRepository.class);
        HomestayRepository homestayRepository = mock(HomestayRepository.class);
        RoomStatusRepository roomStatusRepository = mock(RoomStatusRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        AuthService authService = mock(AuthService.class);
        RoomController controller = new RoomController(
                roomRepository, homestayRepository, roomStatusRepository, reviewRepository, new ObjectMapper());
        controller.authService = authService;

        Map<String, Object> response = controller.list(
                null, 1, 50, null, null, null, null, "unexpected", null, null);

        assertEquals(400, response.get("code"));
        assertEquals("请选择民宿后再查看房型", response.get("msg"));
    }

    @Test
    public void inventoryAllows999AndRejects1000() {
        RoomRepository roomRepository = mock(RoomRepository.class);
        HomestayRepository homestayRepository = mock(HomestayRepository.class);
        RoomStatusRepository roomStatusRepository = mock(RoomStatusRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        RoomController controller = new RoomController(
                roomRepository, homestayRepository, roomStatusRepository, reviewRepository, new ObjectMapper());

        when(homestayRepository.existsById(1L)).thenReturn(true);
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> allowed = controller.create(validRoom(999));
        Map<String, Object> rejected = controller.create(validRoom(1000));

        assertEquals(200, allowed.get("code"));
        assertEquals(400, rejected.get("code"));
        assertEquals("库存须为0-999", rejected.get("msg"));
    }

    private Room validRoom(int stock) {
        Room room = new Room();
        room.setHomestayId(1L);
        room.setName("库存测试房型");
        room.setPrice(new BigDecimal("100.00"));
        room.setStock(stock);
        return room;
    }
}
