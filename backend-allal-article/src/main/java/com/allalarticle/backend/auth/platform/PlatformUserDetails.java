package com.allalarticle.backend.auth.platform;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public record PlatformUserDetails(
        long id,
        String email,
        String passwordHash,
        String roleCode,
        String status
) implements UserDetails {

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_PLATFORM_" + roleCode.toUpperCase()));
    }

    @Override public String getPassword()  { return passwordHash; }
    @Override public String getUsername()  { return email; }
    @Override public boolean isEnabled()   { return "active".equals(status); }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return !"suspended".equals(status); }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
