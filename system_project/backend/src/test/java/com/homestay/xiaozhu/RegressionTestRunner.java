package com.homestay.xiaozhu;

import com.homestay.xiaozhu.controller.OrderControllerTest;
import com.homestay.xiaozhu.controller.RoomControllerTest;
import com.homestay.xiaozhu.security.AuthServiceTest;
import com.homestay.xiaozhu.service.OrderServiceTest;

/** Lightweight local runner used when the Maven Surefire provider is unavailable offline. */
public class RegressionTestRunner {
    public static void main(String[] args) throws Exception {
        OrderServiceTest orders = new OrderServiceTest();
        orders.setUp(); orders.serverCalculatesPriceAndGeneratesOrderFields();
        orders.setUp(); orders.rejectsPastDateAndOverSixtyNights();
        orders.setUp(); orders.rejectsInvalidContactBeforeCheckingInventory();
        orders.setUp(); orders.tenConcurrentOrdersReceiveUniqueOrderNumbers();
        new AuthServiceTest().acceptsSignedTokenAndRejectsForgedLegacyToken();
        new OrderControllerTest().adminCanConfirmAndCheckInUsingJsonBody();
        new RoomControllerTest().adminCanListRoomsWithoutStatusFilter();
        System.out.println("V1.1 backend regression tests passed: 7/7");
    }
}
