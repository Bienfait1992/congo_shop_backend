// services/socketService.js
export const sendOrderToDelivery = (deliveryManId, data) => {
  const io = getIO();
  const socketId = deliverySockets.get(deliveryManId);

  if (socketId) {
    io.to(socketId).emit("new_order", data);
  }
};