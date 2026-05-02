package com.allalarticle.backend.email;

import java.util.ArrayList;
import java.util.List;

public class EmailNotificationSettings {

    private boolean enabled = false;
    private List<Long> recipientUserIds = new ArrayList<>();
    private List<String> extraEmails = new ArrayList<>();
    private Events events = new Events();
    private int bulkAttachThresholdRows = 10;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public List<Long> getRecipientUserIds() { return recipientUserIds; }
    public void setRecipientUserIds(List<Long> recipientUserIds) {
        this.recipientUserIds = recipientUserIds != null ? recipientUserIds : new ArrayList<>();
    }

    public List<String> getExtraEmails() { return extraEmails; }
    public void setExtraEmails(List<String> extraEmails) {
        this.extraEmails = extraEmails != null ? extraEmails : new ArrayList<>();
    }

    public Events getEvents() { return events; }
    public void setEvents(Events events) { this.events = events != null ? events : new Events(); }

    public int getBulkAttachThresholdRows() { return bulkAttachThresholdRows; }
    public void setBulkAttachThresholdRows(int v) { this.bulkAttachThresholdRows = Math.max(1, v); }

    public static class Events {
        private boolean productCreated = true;
        private boolean productPriceChanged = true;
        private boolean productLowStock = true;
        private boolean bulkImportCompleted = true;

        public boolean isProductCreated() { return productCreated; }
        public void setProductCreated(boolean v) { this.productCreated = v; }
        public boolean isProductPriceChanged() { return productPriceChanged; }
        public void setProductPriceChanged(boolean v) { this.productPriceChanged = v; }
        public boolean isProductLowStock() { return productLowStock; }
        public void setProductLowStock(boolean v) { this.productLowStock = v; }
        public boolean isBulkImportCompleted() { return bulkImportCompleted; }
        public void setBulkImportCompleted(boolean v) { this.bulkImportCompleted = v; }
    }
}
