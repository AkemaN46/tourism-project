package com.homestay.xiaozhu.security;

import com.homestay.xiaozhu.entity.Admin;
import com.homestay.xiaozhu.entity.User;
import com.homestay.xiaozhu.repository.AdminRepository;
import com.homestay.xiaozhu.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AuthServiceTest {
    @Test
    public void acceptsSignedTokenAndRejectsForgedLegacyToken() throws Exception {
        AdminRepository admins = mock(AdminRepository.class);
        UserRepository users = mock(UserRepository.class);
        User user = new User(); user.setId(8L); user.setStatus(1);
        when(users.findById(8L)).thenReturn(Optional.of(user));
        AuthService service = new AuthService(admins, users);
        setField(service, "secret", "unit-test-secret-with-sufficient-length");
        setField(service, "userExpirationMs", 60000L);
        setField(service, "adminExpirationMs", 60000L);

        String token = service.issueUserToken(8L);
        AuthPrincipal principal = service.authenticate("Bearer " + token, null);
        assertNotNull(principal);
        assertEquals(8L, principal.getId());
        assertTrue(principal.isUser());
        assertNull(service.authenticate(null, "user_token_8_forged"));
    }

    private void setField(Object target, String name, Object value) throws Exception {
        java.lang.reflect.Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
