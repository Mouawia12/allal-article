package com.allalarticle.backend.config;

import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class TenantConnectionProviderTest {

    @Test
    void getConnection_rejectsInvalidTenantIdentifierBeforeBorrowingConnection() {
        DataSource dataSource = mock(DataSource.class);
        TenantConnectionProvider provider = new TenantConnectionProvider(dataSource);

        assertThatThrownBy(() -> provider.getConnection("tenant_bad"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("Invalid tenant identifier");

        verifyNoInteractions(dataSource);
    }

    @Test
    void getConnection_closesConnectionWhenSearchPathFails() throws Exception {
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        TenantConnectionProvider provider = new TenantConnectionProvider(dataSource);

        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        doThrow(new SQLException("search path failed")).when(statement).execute(anyString());

        assertThatThrownBy(() -> provider.getConnection("tenant_abcdef123456"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("search path failed");

        verify(connection).close();
    }

    @Test
    void releaseConnection_closesConnectionWhenSearchPathResetFails() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        TenantConnectionProvider provider = new TenantConnectionProvider(mock(DataSource.class));

        when(connection.createStatement()).thenReturn(statement);
        doThrow(new SQLException("reset failed")).when(statement).execute("SET search_path TO public");

        assertThatThrownBy(() -> provider.releaseConnection("tenant_abcdef123456", connection))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("reset failed");

        verify(connection).close();
    }
}
