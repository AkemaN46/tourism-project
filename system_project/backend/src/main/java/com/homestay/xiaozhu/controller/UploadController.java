package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.security.RequireLogin;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
@RequireLogin
public class UploadController extends BaseController {

    private static final long MAX_SIZE = 5L * 1024 * 1024;
    private static final Set<String> EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    @Value("${app.upload-dir:./uploads/images}")
    private String uploadDir;

    /**
     * 房型图片上传接口（已兼容中文路径、Windows转义）
     */
    @PostMapping("/image")
    public Map<String, Object> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return error(400, "请选择要上传的图片");
        }
        String originalFilename = file.getOriginalFilename();
        int dot = originalFilename == null ? -1 : originalFilename.lastIndexOf('.');
        if (dot < 0 || dot == originalFilename.length() - 1) {
            return error(400, "图片文件缺少有效后缀名");
        }
        String extension = originalFilename.substring(dot + 1).toLowerCase(Locale.ROOT);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!EXTENSIONS.contains(extension) || !MIME_TYPES.contains(contentType)) {
            return error(400, "仅支持 JPG、PNG、WEBP 图片，且文件类型与后缀必须一致");
        }
        if (file.getSize() > MAX_SIZE) {
            return error(400, "图片大小不能超过5MB");
        }
        try {
            Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(root);
            String fileName = UUID.randomUUID() + "." + extension;
            Path destination = root.resolve(fileName).normalize();
            if (!destination.startsWith(root)) {
                return error(400, "非法文件路径");
            }
            file.transferTo(destination.toFile());
            String imageUrl = "/images/" + fileName;
            Map<String, String> data = new HashMap<>();
            data.put("url", imageUrl);
            data.put("imageUrl", imageUrl);
            return success("上传成功", data);
        } catch (Exception e) {
            return error(500, "上传失败，请检查服务器上传目录配置");
        }
    }
}
