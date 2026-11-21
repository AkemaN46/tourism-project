package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.entity.Favorite;
import com.homestay.xiaozhu.entity.Room;
import com.homestay.xiaozhu.repository.FavoriteRepository;
import com.homestay.xiaozhu.repository.HomestayRepository;
import com.homestay.xiaozhu.repository.RoomRepository;
import com.homestay.xiaozhu.security.RequireUser;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/favorite")
@RequireUser
public class FavoriteController extends BaseController {
    private final FavoriteRepository favoriteRepository;
    private final RoomRepository roomRepository;
    private final HomestayRepository homestayRepository;

    public FavoriteController(FavoriteRepository favoriteRepository, RoomRepository roomRepository,
                              HomestayRepository homestayRepository) {
        this.favoriteRepository = favoriteRepository;
        this.roomRepository = roomRepository;
        this.homestayRepository = homestayRepository;
    }

    @PostMapping("/add")
    public Map<String, Object> add(@RequestBody Map<String, Object> body,
                                   @RequestHeader(value = "Authorization", required = false) String authorization,
                                   @RequestHeader(value = "token", required = false) String token) {
        Long userId = getCurrentUserId(authorization, token), roomId = Long.valueOf(body.get("roomId").toString());
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null || !Integer.valueOf(1).equals(room.getStatus()) || room.getStock() == null || room.getStock() <= 0
                || homestayRepository.findById(room.getHomestayId()).filter(h -> Integer.valueOf(1).equals(h.getStatus())).isEmpty())
            return error(404, "房型不存在、已下架或暂无库存");
        if (favoriteRepository.existsByUserIdAndRoomId(userId, roomId)) return success("已收藏", true);
        Favorite item = new Favorite(); item.setUserId(userId); item.setRoomId(roomId);
        return success("收藏成功", favoriteRepository.save(item));
    }

    @PostMapping("/remove")
    @Transactional
    public Map<String, Object> remove(@RequestBody Map<String, Object> body,
                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                      @RequestHeader(value = "token", required = false) String token) {
        favoriteRepository.deleteByUserIdAndRoomId(getCurrentUserId(authorization, token), Long.valueOf(body.get("roomId").toString()));
        return success("取消收藏成功", null);
    }

    @GetMapping("/list")
    public Map<String, Object> list(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @RequestHeader(value = "token", required = false) String token) {
        return success("获取成功", favoriteRepository.findFavoritesByUserId(getCurrentUserId(authorization, token)));
    }

    @GetMapping("/check")
    public Map<String, Object> check(@RequestParam Long roomId,
                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                     @RequestHeader(value = "token", required = false) String token) {
        return success("查询成功", favoriteRepository.existsByUserIdAndRoomId(getCurrentUserId(authorization, token), roomId));
    }
}
